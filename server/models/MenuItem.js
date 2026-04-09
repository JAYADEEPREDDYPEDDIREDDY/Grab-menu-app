const mongoose = require('mongoose');

const menuItemSchema = new mongoose.Schema({
  restaurantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restaurant',
    default: null,
    index: true,
  },
  name: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  description: {
    type: String,
  },
  image: {
    type: String, // URL to image or static path
    default: '',
  },
  category: {
    type: String,
    required: true,
  },
  isVeg: {
    type: Boolean,
    default: null,
  },
  isPopular: {
    type: Boolean,
    default: false,
  }
}, { timestamps: true });

module.exports = mongoose.model('MenuItem', menuItemSchema);
