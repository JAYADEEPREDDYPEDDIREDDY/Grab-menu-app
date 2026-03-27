const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Table = require('../models/Table');
const MenuItem = require('../models/MenuItem');
const auth = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/auth.middleware');

// @route   GET /api/orders
// @desc    Get all orders (for admin)
router.get('/', auth, requireRole('RESTAURANT_ADMIN'), async (req, res) => {
  try {
    const orders = await Order.find({ restaurantId: req.user.restaurantId })
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

    const requestedItems = Array.isArray(payload.items) ? payload.items : [];
    if (!requestedItems.length) {
      return res.status(400).json({ message: 'Order items are required' });
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

    const normalizedItems = requestedItems.map((item) => {
      const menuItem = menuItemMap.get(String(item.menuItemId));
      return {
        menuItemId: menuItem._id,
        quantity: item.quantity,
        priceAtTimeOfOrder: menuItem.price,
      };
    });

    const totalPrice = normalizedItems.reduce(
      (sum, item) => sum + item.quantity * item.priceAtTimeOfOrder,
      0
    );

    payload.tableId = resolvedTableId;
    payload.restaurantId = restaurantId;
    payload.items = normalizedItems;
    payload.totalPrice = totalPrice;

    const newOrder = new Order(payload);
    const order = await newOrder.save();
    const populatedOrder = await Order.findById(order._id).populate('tableId').populate('items.menuItemId');
    
    // Emit via socket io to admin
    const io = req.app.get('io');
    io.emit('newOrder', populatedOrder);

    res.json(populatedOrder);
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
      { status },
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

// @route   GET /api/orders/:id
// @desc    Get a specific order (for customer tracking)
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
