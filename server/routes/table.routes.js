const express = require('express');
const router = express.Router();
const Table = require('../models/Table');
const auth = require('../middleware/auth.middleware');

// @route   GET /api/tables
// @desc    Get all tables
router.get('/', auth, async (req, res) => {
  try {
    const tables = await Table.find().sort({ tableNumber: 1 });
    res.json(tables);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   GET /api/tables/:id
// @desc    Get single table info (can be public for customer to verify table validity)
router.get('/:id', async (req, res) => {
  try {
    // try by id
    let table = null;
    if (req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
        table = await Table.findById(req.params.id);
    }
    // try by number
    if (!table && !isNaN(parseInt(req.params.id))) {
      table = await Table.findOne({ tableNumber: parseInt(req.params.id) });
    }
    
    if (!table) return res.status(404).json({ message: 'Table not found' });
    res.json(table);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   POST /api/tables
// @desc    Add a new table (generates QR content logically)
router.post('/', auth, async (req, res) => {
  try {
    const { tableNumber, domainUrl } = req.body;
    const parsedTableNumber = Number.parseInt(tableNumber, 10);
    if (!Number.isInteger(parsedTableNumber) || parsedTableNumber < 1) {
      return res.status(400).json({ message: 'Table number must be a positive integer' });
    }

    let table = await Table.findOne({ tableNumber: parsedTableNumber });
    if (table) return res.status(400).json({ message: 'Table already exists' });

    // The frontend domain might be passed in, else default
    const baseUrl = (domainUrl || 'http://localhost:5173').replace(/\/$/, '');
    const qrCodeData = `${baseUrl}/menu?table=${parsedTableNumber}`;
    
    table = new Table({ tableNumber: parsedTableNumber, qrCodeData });
    await table.save();
    
    res.status(201).json(table);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   DELETE /api/tables/:id
// @desc    Delete a table
router.delete('/:id', auth, async (req, res) => {
  try {
    await Table.findByIdAndDelete(req.params.id);
    res.json({ message: 'Table removed' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
