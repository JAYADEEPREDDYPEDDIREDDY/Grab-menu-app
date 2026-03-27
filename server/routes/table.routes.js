const express = require('express');
const router = express.Router();
const Table = require('../models/Table');
const auth = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/auth.middleware');

const buildQrCodeData = ({ domainUrl, tableNumber, restaurantId }) =>
  `${(domainUrl || 'http://localhost:5173').replace(/\/$/, '')}/menu?table=${tableNumber}&restaurant=${restaurantId}`;

const normalizeTableQr = async (table, domainUrl) => {
  if (!table) {
    return table;
  }

  const expectedQrCodeData = buildQrCodeData({
    domainUrl,
    tableNumber: table.tableNumber,
    restaurantId: table.restaurantId,
  });

  if (table.qrCodeData !== expectedQrCodeData) {
    table.qrCodeData = expectedQrCodeData;
    await table.save();
  }

  return table;
};

// @route   GET /api/tables
// @desc    Get all tables
router.get('/', auth, requireRole('RESTAURANT_ADMIN'), async (req, res) => {
  try {
    const domainUrl = req.query.domainUrl;
    const tables = await Table.find({ restaurantId: req.user.restaurantId }).sort({ tableNumber: 1 });
    const normalizedTables = await Promise.all(
      tables.map((table) => normalizeTableQr(table, domainUrl))
    );
    res.json(normalizedTables);
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
      const tableNumber = parseInt(req.params.id);
      const filter = { tableNumber };
      if (req.query.restaurantId) {
        filter.restaurantId = req.query.restaurantId;
      }
      table = await Table.findOne(filter);
    }
    
    if (!table) return res.status(404).json({ message: 'Table not found' });
    await normalizeTableQr(table, req.query.domainUrl);
    res.json(table);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   POST /api/tables
// @desc    Add a new table (generates QR content logically)
router.post('/', auth, requireRole('RESTAURANT_ADMIN'), async (req, res) => {
  try {
    const { tableNumber, domainUrl } = req.body;
    const parsedTableNumber = Number.parseInt(tableNumber, 10);
    if (!Number.isInteger(parsedTableNumber) || parsedTableNumber < 1) {
      return res.status(400).json({ message: 'Table number must be a positive integer' });
    }

    let table = await Table.findOne({
      restaurantId: req.user.restaurantId,
      tableNumber: parsedTableNumber,
    });
    if (table) return res.status(400).json({ message: 'Table already exists' });

    // The frontend domain might be passed in, else default
    const qrCodeData = buildQrCodeData({
      domainUrl,
      tableNumber: parsedTableNumber,
      restaurantId: req.user.restaurantId,
    });
    
    table = new Table({
      restaurantId: req.user.restaurantId,
      tableNumber: parsedTableNumber,
      qrCodeData,
    });
    await table.save();
    
    res.status(201).json(table);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   DELETE /api/tables/:id
// @desc    Delete a table
router.delete('/:id', auth, requireRole('RESTAURANT_ADMIN'), async (req, res) => {
  try {
    const deletedTable = await Table.findOneAndDelete({
      _id: req.params.id,
      restaurantId: req.user.restaurantId,
    });
    if (!deletedTable) {
      return res.status(404).json({ message: 'Table not found' });
    }
    res.json({ message: 'Table removed' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
