const express = require('express');
const Bill = require('../models/Bill');
const Order = require('../models/Order');
const Table = require('../models/Table');
const TableSession = require('../models/TableSession');
const Restaurant = require('../models/Restaurant');
const auth = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/auth.middleware');

const router = express.Router();

const roundCurrency = (value) => Number(Number(value || 0).toFixed(2));

const populateBill = (query) =>
  query
    .populate('tableIds')
    .populate({
      path: 'orderIds',
      populate: [{ path: 'tableId' }, { path: 'items.menuItemId' }],
    })
    .populate('sessionId');

const getPaymentLabel = (status) => {
  if (status === 'AWAITING_APPROVAL') return 'Awaiting Approval';
  if (status === 'PAID') return 'Paid';
  return 'Pending Payment';
};

const isRenderableBill = (bill) =>
  Array.isArray(bill?.tableIds) &&
  bill.tableIds.length > 0 &&
  Array.isArray(bill?.orderIds) &&
  bill.orderIds.length > 0 &&
  Array.isArray(bill?.lineItems) &&
  bill.lineItems.length > 0 &&
  Number(bill.totalAmount || 0) > 0;

const emitBillUpdate = async (req, billId) => {
  const io = req.app.get('io');
  const bill = await populateBill(Bill.findById(billId));
  if (bill) {
    io.emit('billUpdate', {
      ...bill.toObject(),
      paymentStatusLabel: getPaymentLabel(bill.paymentStatus),
    });
  }
};

const emitSessionUpdate = async (req, sessionId) => {
  if (!sessionId) return;
  const io = req.app.get('io');
  const session = await TableSession.findById(sessionId).populate('tableId');
  if (session) {
    io.emit('sessionUpdate', session);
  }
};

const getBilledOrderIds = async (restaurantId, excludedBillId = null) => {
  const query = { restaurantId };
  if (excludedBillId) {
    query._id = { $ne: excludedBillId };
  }

  const bills = await Bill.find(query).select('orderIds');
  return new Set(
    bills.flatMap((bill) => (bill.orderIds || []).map((orderId) => String(orderId)))
  );
};

const aggregateLineItems = (orders) => {
  const itemMap = new Map();

  orders.forEach((order) => {
    order.items.forEach((item) => {
      const menuItemId = item.menuItemId?._id || item.menuItemId;
      const key = String(menuItemId || item.menuItemId?.name || 'item');
      const current = itemMap.get(key) || {
        menuItemId: menuItemId || null,
        name: item.menuItemId?.name || 'Menu Item',
        quantity: 0,
        unitPrice: roundCurrency(item.priceAtTimeOfOrder || 0),
        totalPrice: 0,
        orderIds: [],
      };

      current.quantity += Number(item.quantity || 0);
      current.totalPrice = roundCurrency(
        current.totalPrice + Number(item.quantity || 0) * Number(item.priceAtTimeOfOrder || 0)
      );

      if (!current.orderIds.some((orderId) => String(orderId) === String(order._id))) {
        current.orderIds.push(order._id);
      }

      itemMap.set(key, current);
    });
  });

  return Array.from(itemMap.values()).sort((left, right) => left.name.localeCompare(right.name));
};

const calculateTotals = (subtotal, gstRate, serviceChargeRate) => {
  const gstAmount = roundCurrency((subtotal * gstRate) / 100);
  const serviceChargeAmount = roundCurrency((subtotal * serviceChargeRate) / 100);
  const totalAmount = roundCurrency(subtotal + gstAmount + serviceChargeAmount);

  return {
    gstAmount,
    serviceChargeAmount,
    totalAmount,
  };
};

const getRestaurantBillingDefaults = async (restaurantId) => {
  const restaurant = await Restaurant.findById(restaurantId).select(
    'gstRate serviceChargeRate name paymentQrUrl upiId'
  );

  return {
    restaurant,
    gstRate: Math.max(0, Number(restaurant?.gstRate) || 0),
    serviceChargeRate: Math.max(0, Number(restaurant?.serviceChargeRate) || 0),
  };
};

const getOrdersForTables = async ({ restaurantId, tableIds, excludedBillId = null }) => {
  const billedOrderIds = await getBilledOrderIds(restaurantId, excludedBillId);

  const orders = await Order.find({
    restaurantId,
    tableId: { $in: tableIds },
    status: { $in: ['Ready', 'Completed'] },
  })
    .populate('tableId')
    .populate('items.menuItemId')
    .sort({ createdAt: 1 });

  return orders.filter((order) => !billedOrderIds.has(String(order._id)));
};

const buildBillPayload = ({
  restaurantId,
  sessionId = null,
  tableIds,
  orders,
  gstRate,
  serviceChargeRate,
  paymentMethod = '',
  paymentStatus = 'PENDING',
  combinedTables = false,
  notes = '',
}) => {
  const lineItems = aggregateLineItems(orders);
  const subtotal = roundCurrency(
    lineItems.reduce((sum, lineItem) => sum + Number(lineItem.totalPrice || 0), 0)
  );
  const totals = calculateTotals(subtotal, gstRate, serviceChargeRate);

  return {
    restaurantId,
    sessionId,
    tableIds,
    orderIds: orders.map((order) => order._id),
    lineItems,
    subtotal,
    gstRate,
    gstAmount: totals.gstAmount,
    serviceChargeRate,
    serviceChargeAmount: totals.serviceChargeAmount,
    totalAmount: totals.totalAmount,
    paymentMethod,
    paymentStatus,
    combinedTables,
    notes,
  };
};

const releaseBillTables = async (req, bill) => {
  const sessions = await TableSession.find({
    restaurantId: bill.restaurantId,
    tableId: { $in: bill.tableIds },
    isActive: true,
  });

  for (const session of sessions) {
    session.status = 'COMPLETED';
    session.isActive = false;
    session.isLocked = false;
    session.cartItems = [];
    session.paymentRequest = {
      method: session.paymentRequest?.method || null,
      status: 'paid',
      requestedAt: session.paymentRequest?.requestedAt || null,
      completedAt: new Date(),
    };
    session.lastActivityAt = new Date();
    await session.save();
    await emitSessionUpdate(req, session._id);
  }
};

router.get('/overview', auth, requireRole('RESTAURANT_ADMIN'), async (req, res) => {
  try {
    const restaurantId = req.user.restaurantId;
    const { restaurant, gstRate, serviceChargeRate } = await getRestaurantBillingDefaults(
      restaurantId
    );

    const [tables, bills] = await Promise.all([
      Table.find({ restaurantId }).sort({ tableNumber: 1 }),
      populateBill(Bill.find({ restaurantId }).sort({ createdAt: -1 })),
    ]);

    const staleBillIds = bills
      .filter((bill) => !isRenderableBill(bill))
      .map((bill) => bill._id);

    if (staleBillIds.length) {
      await Bill.deleteMany({ _id: { $in: staleBillIds } });
    }

    const validBills = bills.filter((bill) => isRenderableBill(bill));

    const activeBills = validBills
      .filter((bill) => bill.paymentStatus !== 'PAID')
      .map((bill) => ({
        ...bill.toObject(),
        paymentStatusLabel: getPaymentLabel(bill.paymentStatus),
      }));

    const awaitingApproval = activeBills.filter(
      (bill) => bill.paymentStatus === 'AWAITING_APPROVAL'
    );

    const history = validBills
      .filter((bill) => bill.paymentStatus === 'PAID')
      .map((bill) => ({
        ...bill.toObject(),
        paymentStatusLabel: getPaymentLabel(bill.paymentStatus),
      }));

    const activeBillTableIds = new Set(
      activeBills.flatMap((bill) => (bill.tableIds || []).map((table) => String(table._id || table)))
    );

    const tableSummaries = await Promise.all(
      tables.map(async (table) => {
        const billableOrders = await getOrdersForTables({
          restaurantId,
          tableIds: [table._id],
        });

        return {
          _id: table._id,
          tableNumber: table.tableNumber,
          capacity: table.capacity,
          billableOrderCount: billableOrders.length,
          billableAmount: roundCurrency(
            billableOrders.reduce((sum, order) => sum + Number(order.totalPrice || 0), 0)
          ),
          hasActiveBill: activeBillTableIds.has(String(table._id)),
        };
      })
    );

    res.json({
      config: {
        gstRate,
        serviceChargeRate,
        restaurantName: restaurant?.name || '',
      },
      tables: tableSummaries,
      activeBills,
      awaitingApproval,
      history,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to load billing overview' });
  }
});

router.get('/history', auth, requireRole('RESTAURANT_ADMIN'), async (req, res) => {
  try {
    const { range = 'all' } = req.query;
    const now = new Date();
    let startDate = null;

    if (range === 'today') {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    } else if (range === 'weekly') {
      startDate = new Date(now);
      startDate.setDate(now.getDate() - 7);
    } else if (range === 'monthly') {
      startDate = new Date(now);
      startDate.setMonth(now.getMonth() - 1);
    }

    const query = {
      restaurantId: req.user.restaurantId,
      paymentStatus: 'PAID',
    };

    if (startDate) {
      query.paidAt = { $gte: startDate };
    }

    const history = await populateBill(Bill.find(query).sort({ paidAt: -1, createdAt: -1 }));
    res.json(
      history.map((bill) => ({
        ...bill.toObject(),
        paymentStatusLabel: getPaymentLabel(bill.paymentStatus),
      }))
    );
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to load billing history' });
  }
});

router.post('/generate', auth, requireRole('RESTAURANT_ADMIN'), async (req, res) => {
  try {
    const restaurantId = req.user.restaurantId;
    const { tableIds = [], gstRate, serviceChargeRate, paymentMethod = '', notes = '' } = req.body;

    if (!Array.isArray(tableIds) || tableIds.length !== 1) {
      return res.status(400).json({ message: 'Select exactly one table to generate a bill.' });
    }

    const orders = await getOrdersForTables({ restaurantId, tableIds });
    if (!orders.length) {
      return res.status(400).json({ message: 'No ready/completed orders found for this table.' });
    }

    const defaults = await getRestaurantBillingDefaults(restaurantId);
    const payload = buildBillPayload({
      restaurantId,
      tableIds,
      orders,
      gstRate: gstRate !== undefined ? Math.max(0, Number(gstRate) || 0) : defaults.gstRate,
      serviceChargeRate:
        serviceChargeRate !== undefined
          ? Math.max(0, Number(serviceChargeRate) || 0)
          : defaults.serviceChargeRate,
      paymentMethod,
      paymentStatus: paymentMethod === 'CASH' ? 'AWAITING_APPROVAL' : 'PENDING',
      notes,
    });

    const bill = await Bill.create(payload);
    await emitBillUpdate(req, bill._id);
    const populatedBill = await populateBill(Bill.findById(bill._id));
    res.status(201).json(populatedBill);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to generate bill' });
  }
});

router.post('/combine', auth, requireRole('RESTAURANT_ADMIN'), async (req, res) => {
  try {
    const restaurantId = req.user.restaurantId;
    const { tableIds = [], gstRate, serviceChargeRate, paymentMethod = '', notes = '' } = req.body;

    if (!Array.isArray(tableIds) || tableIds.length < 2) {
      return res.status(400).json({ message: 'Select at least two tables to combine.' });
    }

    const orders = await getOrdersForTables({ restaurantId, tableIds });
    if (!orders.length) {
      return res.status(400).json({ message: 'No ready/completed orders found for these tables.' });
    }

    const defaults = await getRestaurantBillingDefaults(restaurantId);
    const payload = buildBillPayload({
      restaurantId,
      tableIds,
      orders,
      gstRate: gstRate !== undefined ? Math.max(0, Number(gstRate) || 0) : defaults.gstRate,
      serviceChargeRate:
        serviceChargeRate !== undefined
          ? Math.max(0, Number(serviceChargeRate) || 0)
          : defaults.serviceChargeRate,
      paymentMethod,
      paymentStatus: paymentMethod === 'CASH' ? 'AWAITING_APPROVAL' : 'PENDING',
      combinedTables: true,
      notes,
    });

    const bill = await Bill.create(payload);
    await emitBillUpdate(req, bill._id);
    const populatedBill = await populateBill(Bill.findById(bill._id));
    res.status(201).json(populatedBill);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to combine tables into a bill' });
  }
});

router.patch('/mark-paid/:billId', auth, requireRole('RESTAURANT_ADMIN'), async (req, res) => {
  try {
    const bill = await Bill.findOne({
      _id: req.params.billId,
      restaurantId: req.user.restaurantId,
    });

    if (!bill) {
      return res.status(404).json({ message: 'Bill not found.' });
    }

    bill.paymentStatus = 'PAID';
    bill.paidAt = new Date();
    if (bill.paymentMethod === 'CASH') {
      bill.approvedAt = new Date();
    }
    await bill.save();
    await releaseBillTables(req, bill);
    await emitBillUpdate(req, bill._id);
    const populatedBill = await populateBill(Bill.findById(bill._id));
    res.json(populatedBill);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to mark bill as paid' });
  }
});

router.post('/:billId/feedback', async (req, res) => {
  try {
    const { sessionId, sessionToken, rating, comment = '', customerName = '' } = req.body;
    const numericRating = Number(rating);

    if (!sessionId || !sessionToken) {
      return res.status(400).json({ message: 'Session details are required to submit feedback.' });
    }

    if (!Number.isInteger(numericRating) || numericRating < 1 || numericRating > 5) {
      return res.status(400).json({ message: 'Please choose a rating between 1 and 5.' });
    }

    const bill = await Bill.findById(req.params.billId);
    if (!bill) {
      return res.status(404).json({ message: 'Bill not found.' });
    }

    if (!bill.sessionId) {
      return res.status(400).json({ message: 'This bill does not support customer feedback.' });
    }

    const resolvedSessionId = sessionId || String(bill.sessionId);
    if (String(bill.sessionId) !== String(resolvedSessionId)) {
      return res.status(403).json({ message: 'This feedback does not match the bill session.' });
    }

    const session = await TableSession.findById(resolvedSessionId);
    if (!session) {
      return res.status(404).json({ message: 'Table session not found.' });
    }

    if (session.sessionToken !== sessionToken) {
      return res.status(403).json({ message: 'Session token mismatch.' });
    }

    if (String(session.restaurantId) !== String(bill.restaurantId)) {
      return res.status(403).json({ message: 'You cannot submit feedback for another restaurant.' });
    }

    const trimmedComment = String(comment || '').trim().slice(0, 500);
    const trimmedCustomerName = String(customerName || '').trim().slice(0, 80);

    bill.feedback = {
      rating: numericRating,
      comment: trimmedComment,
      customerName: trimmedCustomerName,
      submittedAt: new Date(),
    };
    await bill.save();

    if (trimmedCustomerName && !session.customerName) {
      session.customerName = trimmedCustomerName;
      await session.save();
    }

    await emitBillUpdate(req, bill._id);
    const populatedBill = await populateBill(Bill.findById(bill._id));
    return res.json(populatedBill);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Failed to submit feedback' });
  }
});

module.exports = router;
