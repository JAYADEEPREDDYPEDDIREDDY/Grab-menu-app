const mongoose = require('mongoose');

const restaurantSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    address: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
      required: true,
    },
    subscriptionPlan: {
      type: String,
      enum: ['Free', 'Pro'],
      default: 'Free',
      required: true,
    },
    adminUsername: {
      type: String,
      required: true,
      trim: true,
    },
    logoUrl: {
      type: String,
      trim: true,
      default: '',
    },
    paymentQrUrl: {
      type: String,
      trim: true,
      default: '',
    },
    upiId: {
      type: String,
      trim: true,
      default: '',
    },
    gstRate: {
      type: Number,
      default: 5,
      min: 0,
    },
    serviceChargeRate: {
      type: Number,
      default: 0,
      min: 0,
    },
    dashboardTheme: {
      type: String,
      enum: ['amber', 'emerald', 'ocean', 'rose'],
      default: 'amber',
      required: true,
    },
    subscriptionExpiresAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Restaurant', restaurantSchema);
