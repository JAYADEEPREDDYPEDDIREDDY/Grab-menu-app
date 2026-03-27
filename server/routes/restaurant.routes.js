const express = require('express');
const bcrypt = require('bcryptjs');
const Admin = require('../models/Admin');
const Restaurant = require('../models/Restaurant');
const auth = require('../middleware/auth.middleware');

const router = express.Router();
const { requireRole } = require('../middleware/auth.middleware');
const allowedThemes = ['amber', 'emerald', 'ocean', 'rose'];

const generateAdminUsername = async (restaurantName) => {
  const base = restaurantName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '')
    .slice(0, 10) || 'restaurant';

  let username = `${base}admin`;
  let suffix = 1;

  while (await Admin.findOne({ username })) {
    username = `${base}${suffix}`;
    suffix += 1;
  }

  return username;
};

const generatePassword = () => {
  const random = Math.random().toString(36).slice(-6).toUpperCase();
  return `Lumina!${random}`;
};

router.get('/', auth, requireRole('SUPER_ADMIN'), async (req, res) => {
  try {
    const restaurants = await Restaurant.find().sort({ createdAt: -1 });
    return res.json(restaurants);
  } catch (error) {
    console.error(error.message);
    return res.status(500).json({ message: 'Server Error' });
  }
});

router.get('/current', auth, requireRole('RESTAURANT_ADMIN'), async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.user.restaurantId);
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }

    return res.json(restaurant);
  } catch (error) {
    console.error(error.message);
    return res.status(500).json({ message: 'Server Error' });
  }
});

router.post('/', auth, requireRole('SUPER_ADMIN'), async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      address,
      subscriptionPlan = 'Free',
      logoUrl = '',
      dashboardTheme = 'amber',
    } = req.body;

    if (!name || !email || !phone || !address) {
      return res.status(400).json({ message: 'All restaurant fields are required' });
    }

    if (!allowedThemes.includes(dashboardTheme)) {
      return res.status(400).json({ message: 'Invalid dashboard theme' });
    }

    const existingRestaurant = await Restaurant.findOne({ email: email.toLowerCase() });
    if (existingRestaurant) {
      return res.status(400).json({ message: 'Restaurant with this email already exists' });
    }

    const adminUsername = await generateAdminUsername(name);
    const generatedPassword = generatePassword();
    const passwordHash = await bcrypt.hash(generatedPassword, 10);

    const restaurant = await Restaurant.create({
      name,
      email,
      phone,
      address,
      subscriptionPlan,
      status: 'active',
      adminUsername,
      logoUrl,
      dashboardTheme,
    });

    await Admin.create({
      username: adminUsername,
      email,
      passwordHash,
      role: 'RESTAURANT_ADMIN',
      restaurantId: restaurant._id,
      isActive: true,
    });

    return res.status(201).json({
      restaurant,
      credentials: {
        username: adminUsername,
        password: generatedPassword,
      },
    });
  } catch (error) {
    console.error(error.message);
    return res.status(500).json({ message: 'Server Error' });
  }
});

router.patch('/current/profile', auth, requireRole('RESTAURANT_ADMIN'), async (req, res) => {
  try {
    const { name, phone, address, logoUrl, dashboardTheme } = req.body;
    const updates = {};

    if (typeof name === 'string' && name.trim()) {
      updates.name = name.trim();
    }

    if (typeof phone === 'string' && phone.trim()) {
      updates.phone = phone.trim();
    }

    if (typeof address === 'string' && address.trim()) {
      updates.address = address.trim();
    }

    if (typeof logoUrl === 'string') {
      updates.logoUrl = logoUrl.trim();
    }

    if (dashboardTheme !== undefined) {
      if (!allowedThemes.includes(dashboardTheme)) {
        return res.status(400).json({ message: 'Invalid dashboard theme' });
      }
      updates.dashboardTheme = dashboardTheme;
    }

    const restaurant = await Restaurant.findByIdAndUpdate(req.user.restaurantId, updates, {
      new: true,
    });

    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }

    return res.json(restaurant);
  } catch (error) {
    console.error(error.message);
    return res.status(500).json({ message: 'Server Error' });
  }
});

router.patch('/:id/status', auth, requireRole('SUPER_ADMIN'), async (req, res) => {
  try {
    const { status } = req.body;
    if (!['active', 'inactive'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status value' });
    }

    const restaurant = await Restaurant.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }

    await Admin.updateMany(
      { restaurantId: restaurant._id, role: 'RESTAURANT_ADMIN' },
      { isActive: status === 'active' }
    );

    return res.json(restaurant);
  } catch (error) {
    console.error(error.message);
    return res.status(500).json({ message: 'Server Error' });
  }
});

router.patch('/:id/plan', auth, requireRole('SUPER_ADMIN'), async (req, res) => {
  try {
    const { subscriptionPlan } = req.body;
    if (!['Free', 'Pro'].includes(subscriptionPlan)) {
      return res.status(400).json({ message: 'Invalid subscription plan' });
    }

    const restaurant = await Restaurant.findByIdAndUpdate(
      req.params.id,
      { subscriptionPlan },
      { new: true }
    );

    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }

    return res.json(restaurant);
  } catch (error) {
    console.error(error.message);
    return res.status(500).json({ message: 'Server Error' });
  }
});

module.exports = router;
