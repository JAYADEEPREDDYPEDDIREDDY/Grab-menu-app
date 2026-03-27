const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const Restaurant = require('../models/Restaurant');
const auth = require('../middleware/auth.middleware');

const router = express.Router();

const sanitizeAdmin = (admin) => ({
  id: admin.id,
  username: admin.username,
  email: admin.email || '',
  role: admin.role,
  restaurantId: admin.restaurantId || null,
});

const signAuthToken = (admin) =>
  new Promise((resolve, reject) => {
    const payload = {
      user: {
        id: admin.id,
        role: admin.role,
        restaurantId: admin.restaurantId || null,
      },
    };

    jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1d' }, (error, token) => {
      if (error) {
        reject(error);
      } else {
        resolve(token);
      }
    });
  });

const ensureDemoRestaurantAdmin = async ({ username, password }) => {
  let admin = await Admin.findOne({ username, role: 'RESTAURANT_ADMIN' });

  if (!admin) {
    if (username !== 'admin' || password !== 'admin123') {
      return null;
    }

    let restaurant = await Restaurant.findOne({ email: 'admin@lumina.local' });
    if (!restaurant) {
      restaurant = await Restaurant.create({
        name: 'Lumina Demo',
        email: 'admin@lumina.local',
        phone: '+1 555-0100',
        address: 'Demo Restaurant Address',
        status: 'active',
        subscriptionPlan: 'Pro',
        adminUsername: 'admin',
      });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    admin = await Admin.create({
      username,
      email: restaurant.email,
      passwordHash,
      role: 'RESTAURANT_ADMIN',
      restaurantId: restaurant._id,
    });
  }

  return admin;
};

const ensureSuperAdminAccount = async ({ username, password }) => {
  const superAdminUsername = process.env.SUPER_ADMIN_USERNAME || 'superadmin';
  const superAdminPassword = process.env.SUPER_ADMIN_PASSWORD || 'superadmin123';
  const superAdminEmail = process.env.SUPER_ADMIN_EMAIL || 'superadmin@lumina.local';

  let admin = await Admin.findOne({ username: superAdminUsername, role: 'SUPER_ADMIN' });

  if (!admin) {
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(superAdminPassword, salt);
    admin = await Admin.create({
      username: superAdminUsername,
      email: superAdminEmail,
      passwordHash,
      role: 'SUPER_ADMIN',
    });
  }

  if (username !== superAdminUsername || password !== superAdminPassword) {
    return null;
  }

  return admin;
};

const handleLogin = async ({ username, password, expectedRole }) => {
  if (expectedRole === 'SUPER_ADMIN') {
    const seededSuperAdmin = await ensureSuperAdminAccount({ username, password });
    if (!seededSuperAdmin) {
      return null;
    }
  } else {
    await ensureDemoRestaurantAdmin({ username, password });
  }

  const admin = await Admin.findOne({ username, role: expectedRole });
  if (!admin) {
    return null;
  }

  if (!admin.isActive) {
    throw new Error('This admin account is inactive');
  }

  const isMatch = await bcrypt.compare(password, admin.passwordHash);
  if (!isMatch) {
    return null;
  }

  if (admin.role === 'RESTAURANT_ADMIN' && admin.restaurantId) {
    const restaurant = await Restaurant.findById(admin.restaurantId);
    if (!restaurant || restaurant.status !== 'active') {
      throw new Error('This restaurant account is inactive');
    }
  }

  return admin;
};

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const admin = await handleLogin({
      username,
      password,
      expectedRole: 'RESTAURANT_ADMIN',
    });

    if (!admin) {
      return res.status(400).json({ message: 'Invalid Credentials' });
    }

    const token = await signAuthToken(admin);
    return res.json({ token, user: sanitizeAdmin(admin) });
  } catch (error) {
    console.error(error.message);
    return res.status(400).json({ message: error.message || 'Login failed' });
  }
});

router.post('/super/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const admin = await handleLogin({
      username,
      password,
      expectedRole: 'SUPER_ADMIN',
    });

    if (!admin) {
      return res.status(400).json({ message: 'Invalid Credentials' });
    }

    const token = await signAuthToken(admin);
    return res.json({ token, user: sanitizeAdmin(admin) });
  } catch (error) {
    console.error(error.message);
    return res.status(400).json({ message: error.message || 'Login failed' });
  }
});

router.get('/me', auth, async (req, res) => {
  try {
    const admin = await Admin.findById(req.user.id).select('-passwordHash');
    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
    }

    return res.json(sanitizeAdmin(admin));
  } catch (error) {
    console.error(error.message);
    return res.status(500).json({ message: 'Server Error' });
  }
});

module.exports = router;
