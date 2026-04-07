const express = require('express');
const Category = require('../models/Category');
const MenuItem = require('../models/MenuItem');
const auth = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/auth.middleware');

const router = express.Router();

const normalizeCategoryName = (value = '') =>
  value
    .trim()
    .split(/[\s-]+/)
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1).toLowerCase())
    .join(' ');

router.get('/', auth, requireRole('RESTAURANT_ADMIN'), async (req, res) => {
  try {
    const categories = await Category.find({ restaurantId: req.user.restaurantId }).sort({ name: 1 });
    return res.json(categories);
  } catch (error) {
    console.error(error.message);
    return res.status(500).json({ message: 'Failed to load categories' });
  }
});

router.post('/', auth, requireRole('RESTAURANT_ADMIN'), async (req, res) => {
  try {
    const normalizedName = normalizeCategoryName(req.body.name || '');
    if (!normalizedName) {
      return res.status(400).json({ message: 'Category name is required' });
    }

    const existing = await Category.findOne({
      restaurantId: req.user.restaurantId,
      name: normalizedName,
    });

    if (existing) {
      return res.status(400).json({ message: 'Category already exists' });
    }

    const category = await Category.create({
      restaurantId: req.user.restaurantId,
      name: normalizedName,
    });

    return res.status(201).json(category);
  } catch (error) {
    console.error(error.message);
    if (error?.code === 11000) {
      return res.status(400).json({ message: 'Category already exists' });
    }
    return res.status(500).json({ message: 'Failed to create category' });
  }
});

router.patch('/:id', auth, requireRole('RESTAURANT_ADMIN'), async (req, res) => {
  try {
    const normalizedName = normalizeCategoryName(req.body.name || '');
    if (!normalizedName) {
      return res.status(400).json({ message: 'Category name is required' });
    }

    const category = await Category.findOne({
      _id: req.params.id,
      restaurantId: req.user.restaurantId,
    });

    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    const duplicate = await Category.findOne({
      _id: { $ne: category._id },
      restaurantId: req.user.restaurantId,
      name: normalizedName,
    });

    if (duplicate) {
      return res.status(400).json({ message: 'Another category already uses this name' });
    }

    const previousName = category.name;
    category.name = normalizedName;
    await category.save();

    if (previousName !== normalizedName) {
      await MenuItem.updateMany(
        { restaurantId: req.user.restaurantId, category: previousName },
        { $set: { category: normalizedName } }
      );
    }

    return res.json(category);
  } catch (error) {
    console.error(error.message);
    if (error?.code === 11000) {
      return res.status(400).json({ message: 'Another category already uses this name' });
    }
    return res.status(500).json({ message: 'Failed to update category' });
  }
});

router.delete('/:id', auth, requireRole('RESTAURANT_ADMIN'), async (req, res) => {
  try {
    const category = await Category.findOne({
      _id: req.params.id,
      restaurantId: req.user.restaurantId,
    });

    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    const itemCount = await MenuItem.countDocuments({
      restaurantId: req.user.restaurantId,
      category: category.name,
    });

    if (itemCount > 0) {
      return res.status(400).json({
        message: 'Move or update menu items in this category before deleting it.',
      });
    }

    await category.deleteOne();
    return res.json({ message: 'Category removed' });
  } catch (error) {
    console.error(error.message);
    return res.status(500).json({ message: 'Failed to delete category' });
  }
});

module.exports = { router, normalizeCategoryName };
