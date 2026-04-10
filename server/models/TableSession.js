const mongoose = require('mongoose');

const sessionCartItemSchema = new mongoose.Schema(
  {
    menuItemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MenuItem',
      default: null,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
  },
  { _id: false }
);

const paymentRequestSchema = new mongoose.Schema(
  {
    method: {
      type: String,
      enum: ['Cash', 'UPI', 'QR', null],
      default: null,
    },
    status: {
      type: String,
      enum: ['none', 'pending', 'awaiting_approval', 'paid'],
      default: 'none',
    },
    requestedAt: {
      type: Date,
      default: null,
    },
    completedAt: {
      type: Date,
      default: null,
    },
  },
  { _id: false }
);

const tableSessionSchema = new mongoose.Schema(
  {
    restaurantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Restaurant',
      required: true,
      index: true,
    },
    tableId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Table',
      required: true,
      index: true,
    },
    sessionToken: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    persons: {
      type: Number,
      required: true,
      min: 1,
    },
    customerName: {
      type: String,
      trim: true,
      default: '',
    },
    customerPhone: {
      type: String,
      trim: true,
      default: '',
    },
    customerEmail: {
      type: String,
      trim: true,
      default: '',
    },
    cartItems: [sessionCartItemSchema],
    orders: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
      },
    ],
    status: {
      type: String,
      enum: ['ACTIVE', 'BILLING', 'COMPLETED'],
      default: 'ACTIVE',
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    isLocked: {
      type: Boolean,
      default: true,
      index: true,
    },
    paymentRequest: {
      type: paymentRequestSchema,
      default: () => ({}),
    },
    lastActivityAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

tableSessionSchema.index(
  { tableId: 1, isActive: 1 },
  {
    unique: true,
    partialFilterExpression: { isActive: true },
  }
);

module.exports = mongoose.model('TableSession', tableSessionSchema);
