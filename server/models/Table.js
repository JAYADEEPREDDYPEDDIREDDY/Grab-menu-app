const mongoose = require('mongoose');

const tableSchema = new mongoose.Schema({
  restaurantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restaurant',
    required: true,
    index: true,
  },
  tableNumber: {
    type: Number,
    required: true,
  },
  capacity: {
    type: Number,
    required: true,
    min: 1,
    default: 4,
  },
  qrCodeData: {
    type: String,
    required: true,
  },
}, { timestamps: true });

tableSchema.index({ restaurantId: 1, tableNumber: 1 }, { unique: true });

module.exports = mongoose.model('Table', tableSchema);
