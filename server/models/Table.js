const mongoose = require('mongoose');

const tableSchema = new mongoose.Schema({
  tableNumber: {
    type: Number,
    required: true,
    unique: true,
  },
  qrCodeData: {
    type: String, // E.g., URL for the QR code to point to
    required: true,
  }
}, { timestamps: true });

module.exports = mongoose.model('Table', tableSchema);
