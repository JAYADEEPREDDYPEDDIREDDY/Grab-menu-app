const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  tableId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Table',
    required: true,
  },
  items: [{
    menuItemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MenuItem',
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    priceAtTimeOfOrder: {
      type: Number,
      required: true
    }
  }],
  totalPrice: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    enum: ['Pending', 'Preparing', 'Ready', 'Completed'],
    default: 'Pending',
  }
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);
