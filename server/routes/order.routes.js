const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Bill = require('../models/Bill');
const Table = require('../models/Table');
const MenuItem = require('../models/MenuItem');
const TableSession = require('../models/TableSession');
const auth = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/auth.middleware');

const phonePattern = /^\+?[0-9]{7,15}$/;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const normalizeCustomerContact = (payload = {}) => ({
  customerName: String(payload.customerName || '').trim(),
  customerPhone: String(payload.customerPhone || '').trim(),
  customerEmail: String(payload.customerEmail || '').trim().toLowerCase(),
});

const validateCustomerContact = ({ customerPhone, customerEmail }) => {
  if (!customerPhone) {
    return 'Mobile number is required.';
  }

  if (!phonePattern.test(customerPhone)) {
    return 'Enter a valid mobile number.';
  }

  if (customerEmail && !emailPattern.test(customerEmail)) {
    return 'Enter a valid email address.';
  }

  return '';
};

const buildNormalizedOrderItems = ({ requestedItems = [], menuItemMap }) =>
  requestedItems.map((item) => {
    const menuItem = menuItemMap.get(String(item.menuItemId));
    return {
      menuItemId: menuItem._id,
      quantity: Math.max(1, Number(item.quantity) || 1),
      priceAtTimeOfOrder: menuItem.price,
    };
  });

const calculateOrderTotal = (items = []) =>
  items.reduce((sum, item) => sum + Number(item.quantity || 0) * Number(item.priceAtTimeOfOrder || 0), 0);

// @route   GET /api/orders
// @desc    Get all orders (for admin)
router.get('/', auth, requireRole('RESTAURANT_ADMIN'), async (req, res) => {
  try {
    const orders = await Order.find({
      restaurantId: req.user.restaurantId,
      isArchivedFromLiveBoard: { $ne: true },
    })
      .populate('tableId')
      .populate('items.menuItemId')
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   POST /api/orders
// @desc    Create a new order (from customer)
router.post('/', async (req, res) => {
  try {
    const payload = { ...req.body };
    let resolvedTableId = payload.tableId;
    let restaurantId = payload.restaurantId;
    let table = null;

    if (typeof resolvedTableId === 'string' && !resolvedTableId.match(/^[0-9a-fA-F]{24}$/)) {
      const parsedTableNumber = Number.parseInt(resolvedTableId, 10);
      if (!Number.isInteger(parsedTableNumber)) {
        return res.status(400).json({ message: 'Invalid table reference' });
      }

      const tableQuery = { tableNumber: parsedTableNumber };
      if (restaurantId) {
        tableQuery.restaurantId = restaurantId;
      }

      table = await Table.findOne(tableQuery);
      if (!table) {
        return res.status(404).json({ message: 'Table not found' });
      }
      resolvedTableId = table._id;
      restaurantId = table.restaurantId;
    } else {
      table = await Table.findById(resolvedTableId);
      if (!table) {
        return res.status(404).json({ message: 'Table not found' });
      }
      restaurantId = table.restaurantId;
    }

    if (!restaurantId) {
      return res.status(400).json({ message: 'Restaurant reference is required' });
    }

    const sessionId = payload.sessionId;
    const sessionToken = payload.sessionToken;

    const session = await TableSession.findOne({
      _id: sessionId,
      tableId: resolvedTableId,
      restaurantId,
      isActive: true,
    });

    if (!session) {
      return res.status(403).json({ message: 'No active table session found.' });
    }

    if (session.sessionToken !== sessionToken) {
      return res.status(403).json({ message: 'Session token mismatch.' });
    }

    if (session.status === 'COMPLETED') {
      return res.status(400).json({ message: 'This table session has already been completed.' });
    }

    if (session.status === 'BILLING') {
      return res.status(400).json({ message: 'This table session is locked for billing.' });
    }

    if (session.status !== 'ACTIVE') {
      return res.status(400).json({ message: 'This table session is not active.' });
    }

    const requestedItems = Array.isArray(payload.items) ? payload.items : [];
    if (!requestedItems.length) {
      return res.status(400).json({ message: 'Order items are required' });
    }

    const customerContact = normalizeCustomerContact(payload);
    const customerContactError = validateCustomerContact(customerContact);
    if (customerContactError) {
      return res.status(400).json({ message: customerContactError });
    }

    const menuItemIds = requestedItems.map((item) => item.menuItemId);
    const menuItems = await MenuItem.find({
      _id: { $in: menuItemIds },
      restaurantId,
    });
    const menuItemMap = new Map(menuItems.map((item) => [String(item._id), item]));

    if (menuItemIds.some((itemId) => !menuItemMap.has(String(itemId)))) {
      return res.status(400).json({ message: 'One or more menu items are invalid for this restaurant' });
    }

    const normalizedItems = buildNormalizedOrderItems({ requestedItems, menuItemMap });
    const totalPrice = calculateOrderTotal(normalizedItems);

    payload.tableId = resolvedTableId;
    payload.restaurantId = restaurantId;
    payload.customerName = customerContact.customerName;
    payload.customerPhone = customerContact.customerPhone;
    payload.customerEmail = customerContact.customerEmail;
    payload.items = normalizedItems;
    payload.totalPrice = totalPrice;

    const newOrder = new Order(payload);
    const order = await newOrder.save();
    const populatedOrder = await Order.findById(order._id).populate('tableId').populate('items.menuItemId');

    session.orders.push(order._id);
    session.cartItems = [];
    session.customerName = customerContact.customerName;
    session.customerPhone = customerContact.customerPhone;
    session.customerEmail = customerContact.customerEmail;
    session.lastActivityAt = new Date();
    await session.save();
    const populatedSession = await TableSession.findById(session._id).populate('tableId');
    
    // Emit via socket io to admin
    const io = req.app.get('io');
    io.emit('newOrder', populatedOrder);
    io.emit('orderStatusUpdate', populatedOrder);
    io.emit('sessionUpdate', populatedSession);

    res.json({ order: populatedOrder, session: populatedSession });
  } catch (err) {
    console.error(err.message);
    if (err.name === 'ValidationError' || err.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid order payload' });
    }
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   PUT /api/orders/:id/status
// @desc    Update order status
router.put('/:id/status', auth, requireRole('RESTAURANT_ADMIN'), async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findOneAndUpdate(
      { _id: req.params.id, restaurantId: req.user.restaurantId },
      { status, isArchivedFromLiveBoard: false },
      { new: true }
    )
      .populate('tableId')
      .populate('items.menuItemId');
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    // Emit status update to customer (room is the order id or table id)
    const io = req.app.get('io');
    io.emit('orderStatusUpdate', order);

    res.json(order);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server Error' });
  }
});

router.patch('/:id', auth, requireRole('RESTAURANT_ADMIN'), async (req, res) => {
  try {
    const order = await Order.findOne({
      _id: req.params.id,
      restaurantId: req.user.restaurantId,
    });

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const linkedBill = await Bill.findOne({
      restaurantId: req.user.restaurantId,
      orderIds: order._id,
    }).select('_id');

    if (linkedBill) {
      return res.status(400).json({ message: 'This order is already linked to a bill and cannot be edited.' });
    }

    const customerContact = normalizeCustomerContact(req.body);
    const customerContactError = validateCustomerContact(customerContact);
    if (customerContactError) {
      return res.status(400).json({ message: customerContactError });
    }

    const requestedItems = Array.isArray(req.body.items) ? req.body.items : [];
    if (!requestedItems.length) {
      return res.status(400).json({ message: 'Add at least one item to update the order.' });
    }

    const menuItemIds = requestedItems.map((item) => item.menuItemId);
    const menuItems = await MenuItem.find({
      _id: { $in: menuItemIds },
      restaurantId: req.user.restaurantId,
    });
    const menuItemMap = new Map(menuItems.map((item) => [String(item._id), item]));

    if (menuItemIds.some((itemId) => !menuItemMap.has(String(itemId)))) {
      return res.status(400).json({ message: 'One or more selected menu items are invalid.' });
    }

    const normalizedItems = buildNormalizedOrderItems({ requestedItems, menuItemMap });

    order.customerName = customerContact.customerName;
    order.customerPhone = customerContact.customerPhone;
    order.customerEmail = customerContact.customerEmail;
    order.items = normalizedItems;
    order.totalPrice = calculateOrderTotal(normalizedItems);
    await order.save();

    await TableSession.findOneAndUpdate(
      {
        restaurantId: req.user.restaurantId,
        tableId: order.tableId,
        isActive: true,
        orders: order._id,
      },
      {
        $set: {
          customerName: customerContact.customerName,
          customerPhone: customerContact.customerPhone,
          customerEmail: customerContact.customerEmail,
          lastActivityAt: new Date(),
        },
      }
    );

    const populatedOrder = await Order.findById(order._id)
      .populate('tableId')
      .populate('items.menuItemId');

    const io = req.app.get('io');
    io.emit('orderStatusUpdate', populatedOrder);

    return res.json(populatedOrder);
  } catch (err) {
    console.error(err.message);
    if (err.name === 'ValidationError' || err.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid order payload' });
    }
    return res.status(500).json({ message: 'Server Error' });
  }
});

router.patch('/clear-live-completed', auth, requireRole('RESTAURANT_ADMIN'), async (req, res) => {
  try {
    const result = await Order.updateMany(
      {
        restaurantId: req.user.restaurantId,
        status: { $in: ['Ready', 'Completed'] },
        isArchivedFromLiveBoard: { $ne: true },
      },
      {
        $set: { isArchivedFromLiveBoard: true },
      }
    );

    const io = req.app.get('io');
    io.emit('ordersCleared', {
      restaurantId: req.user.restaurantId,
      statuses: ['Ready', 'Completed'],
    });

    res.json({
      message: 'Ready and completed orders cleared from live board.',
      modifiedCount: result.modifiedCount || 0,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   GET /api/orders/:id
// @desc    Get a specific order (for customer tracking)
router.get('/session/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { sessionToken } = req.query;

    const session = await TableSession.findById(sessionId);
    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    if (!sessionToken || session.sessionToken !== sessionToken) {
      return res.status(403).json({ message: 'Session token mismatch.' });
    }

    const orders = await Order.find({
      _id: { $in: session.orders || [] },
    })
      .populate('tableId')
      .populate('items.menuItemId')
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server Error' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate('tableId').populate('items.menuItemId');
    if (!order) return res.status(404).json({ message: 'Order not found' });
    res.json(order);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
