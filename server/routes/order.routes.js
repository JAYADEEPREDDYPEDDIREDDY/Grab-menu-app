const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Table = require('../models/Table');
const auth = require('../middleware/auth.middleware');

// @route   GET /api/orders
// @desc    Get all orders (for admin)
router.get('/', auth, async (req, res) => {
  try {
    const orders = await Order.find().populate('tableId').populate('items.menuItemId').sort({ createdAt: -1 });
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

    if (typeof resolvedTableId === 'string' && !resolvedTableId.match(/^[0-9a-fA-F]{24}$/)) {
      const parsedTableNumber = Number.parseInt(resolvedTableId, 10);
      if (!Number.isInteger(parsedTableNumber)) {
        return res.status(400).json({ message: 'Invalid table reference' });
      }

      const table = await Table.findOne({ tableNumber: parsedTableNumber });
      if (!table) {
        return res.status(404).json({ message: 'Table not found' });
      }
      resolvedTableId = table._id;
    }

    payload.tableId = resolvedTableId;

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
router.put('/:id/status', auth, async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findByIdAndUpdate(req.params.id, { status }, { new: true }).populate('tableId').populate('items.menuItemId');
    
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
