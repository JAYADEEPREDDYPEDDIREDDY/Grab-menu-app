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

const emitBillUpdate = async (req, billId) => {
  const io = req.app.get('io');
  const bill = await populateBill(Bill.findById(billId));
  if (bill) {
    io.emit('billUpdate', bill);
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
  return { gstAmount, serviceChargeAmount, totalAmount };
};

const resolveTable = async ({ tableId, restaurantId }) => {
  let table = null;
  let resolvedRestaurantId = restaurantId;

  if (typeof tableId === 'string' && !tableId.match(/^[0-9a-fA-F]{24}$/)) {
    const tableNumber = Number.parseInt(tableId, 10);
    if (!Number.isInteger(tableNumber) || tableNumber < 1) {
      throw new Error('Invalid table reference');
    }

    const query = { tableNumber };
    if (resolvedRestaurantId) {
      query.restaurantId = resolvedRestaurantId;
    }
    table = await Table.findOne(query);
  } else {
    table = await Table.findById(tableId);
  }

  if (!table) {
    throw new Error('Table not found');
  }

  return {
    table,
    restaurantId: table.restaurantId,
  };
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

const buildCustomerBill = async ({
  session,
  table,
  restaurantId,
  paymentMethod,
  existingBill = null,
}) => {
  const { gstRate = 0, serviceChargeRate = 0 } =
    (await Restaurant.findById(restaurantId).select('gstRate serviceChargeRate')) || {};

  const billedOrderIds = await getBilledOrderIds(restaurantId, existingBill?._id || null);
  const orders = await Order.find({
    _id: { $in: session.orders || [] },
    restaurantId,
    tableId: table._id,
    status: { $in: ['Ready', 'Completed'] },
  })
    .populate('tableId')
    .populate('items.menuItemId')
    .sort({ createdAt: 1 });

  const eligibleOrders = orders.filter((order) => !billedOrderIds.has(String(order._id)));
  if (!eligibleOrders.length && !existingBill) {
    throw new Error(`No completed items are ready to bill for Table ${table.tableNumber} yet.`);
  }

  const paymentStatus = paymentMethod === 'CASH' ? 'AWAITING_APPROVAL' : 'PENDING';

  if (existingBill) {
    existingBill.paymentMethod = paymentMethod;
    existingBill.paymentStatus = paymentStatus;
    await existingBill.save();
    return existingBill;
  }

  const lineItems = aggregateLineItems(eligibleOrders);
  const subtotal = roundCurrency(
    lineItems.reduce((sum, lineItem) => sum + Number(lineItem.totalPrice || 0), 0)
  );
  const totals = calculateTotals(subtotal, Number(gstRate) || 0, Number(serviceChargeRate) || 0);

  return Bill.create({
    restaurantId,
    sessionId: session._id,
    tableIds: [table._id],
    orderIds: eligibleOrders.map((order) => order._id),
    lineItems,
    subtotal,
    gstRate: Number(gstRate) || 0,
    gstAmount: totals.gstAmount,
    serviceChargeRate: Number(serviceChargeRate) || 0,
    serviceChargeAmount: totals.serviceChargeAmount,
    totalAmount: totals.totalAmount,
    paymentMethod,
    paymentStatus,
    combinedTables: false,
  });
};

router.post('/select-method', async (req, res) => {
  try {
    const { tableId, restaurantId, sessionId, sessionToken, paymentMethod } = req.body;

    if (!['QR', 'UPI', 'CASH'].includes(paymentMethod)) {
      return res.status(400).json({ message: 'Select a valid payment method.' });
    }

    const { table, restaurantId: resolvedRestaurantId } = await resolveTable({
      tableId,
      restaurantId,
    });

    const session = await TableSession.findOne({
      _id: sessionId,
      restaurantId: resolvedRestaurantId,
      tableId: table._id,
      isActive: true,
    });

    if (!session) {
      return res.status(404).json({ message: 'Active session not found.' });
    }

    if (session.sessionToken !== sessionToken) {
      return res.status(403).json({ message: 'Session token mismatch.' });
    }

    let existingBill = await Bill.findOne({
      restaurantId: resolvedRestaurantId,
      sessionId: session._id,
      paymentStatus: { $in: ['PENDING', 'AWAITING_APPROVAL'] },
    }).sort({ createdAt: -1 });

    const bill = await buildCustomerBill({
      session,
      table,
      restaurantId: resolvedRestaurantId,
      paymentMethod,
      existingBill,
    });

    session.status = 'BILLING';
    session.isLocked = true;
    session.paymentRequest = {
      method: paymentMethod === 'CASH' ? 'Cash' : paymentMethod,
      status: paymentMethod === 'CASH' ? 'awaiting_approval' : 'pending',
      requestedAt: new Date(),
      completedAt: null,
    };
    session.lastActivityAt = new Date();
    await session.save();

    await emitSessionUpdate(req, session._id);
    await emitBillUpdate(req, bill._id);

    if (paymentMethod === 'CASH') {
      req.app.get('io').emit('paymentRequest', {
        restaurantId: resolvedRestaurantId,
        billId: bill._id,
        sessionId: session._id,
        tableNumber: table.tableNumber,
        paymentMethod,
      });
    }

    const populatedBill = await populateBill(Bill.findById(bill._id));
    res.status(existingBill ? 200 : 201).json(populatedBill);
  } catch (error) {
    console.error(error);
    const message =
      error.message === 'Table not found' ||
      error.message === 'Invalid table reference' ||
      error.message.startsWith('No completed items')
        ? error.message
        : 'Failed to select payment method';
    res.status(message === 'Table not found' ? 404 : 400).json({ message });
  }
});

router.patch('/approve-cash/:billId', auth, requireRole('RESTAURANT_ADMIN'), async (req, res) => {
  try {
    const bill = await Bill.findOne({
      _id: req.params.billId,
      restaurantId: req.user.restaurantId,
    });

    if (!bill) {
      return res.status(404).json({ message: 'Bill not found.' });
    }

    if (bill.paymentMethod !== 'CASH') {
      return res.status(400).json({ message: 'Only cash bills need approval.' });
    }

    bill.paymentStatus = 'PAID';
    bill.approvedAt = new Date();
    bill.paidAt = new Date();
    await bill.save();

    const sessions = await TableSession.find({
      restaurantId: req.user.restaurantId,
      tableId: { $in: bill.tableIds },
      isActive: true,
    });

    for (const session of sessions) {
      session.status = 'COMPLETED';
      session.isActive = false;
      session.isLocked = false;
      session.cartItems = [];
      session.paymentRequest = {
        method: 'Cash',
        status: 'paid',
        requestedAt: session.paymentRequest?.requestedAt || null,
        completedAt: new Date(),
      };
      session.lastActivityAt = new Date();
      await session.save();
      await emitSessionUpdate(req, session._id);
    }

    await emitBillUpdate(req, bill._id);
    const populatedBill = await populateBill(Bill.findById(bill._id));
    res.json(populatedBill);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to approve cash payment' });
  }
});

module.exports = router;
