const express = require('express');
const router = express.Router();
const MenuItem = require('../models/MenuItem');
const auth = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/auth.middleware');

const knownCategories = [
  'starter',
  'starters',
  'main course',
  'main',
  'mains',
  'drinks',
  'drink',
  'dessert',
  'desserts',
  'snack',
  'snacks',
  'beverages',
];

const normalizeCategory = (value = '') => {
  const normalized = value.trim().toLowerCase();

  if (!normalized) {
    return 'Main Course';
  }

  if (['starter', 'starters'].includes(normalized)) return 'Starter';
  if (['main', 'mains', 'main course'].includes(normalized)) return 'Main Course';
  if (['drink', 'drinks', 'beverages'].includes(normalized)) return 'Drinks';
  if (['dessert', 'desserts'].includes(normalized)) return 'Dessert';
  if (['snack', 'snacks'].includes(normalized)) return 'Snack';

  return value
    .trim()
    .split(/[\s-]+/)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' ');
};

const buildPreviewItem = ({
  name,
  price,
  category,
  description = '',
  isVeg = true,
  isPopular = false,
}) => {
  if (!name || !Number.isFinite(price)) {
    return null;
  }

  return {
    name: name.trim(),
    price: Number(price.toFixed(2)),
    category: normalizeCategory(category),
    description: description.trim(),
    isVeg,
    isPopular,
    image: '',
  };
};

const parseJsonSource = (sourceText) => {
  const parsed = JSON.parse(sourceText);
  if (!Array.isArray(parsed)) {
    return [];
  }

  return parsed
    .map((item) =>
      buildPreviewItem({
        name: item.name,
        price: Number(item.price),
        category: item.category,
        description: item.description || '',
        isVeg: item.isVeg ?? true,
        isPopular: item.isPopular ?? false,
      })
    )
    .filter(Boolean);
};

const parseCsvSource = (sourceText) => {
  const lines = sourceText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (!lines.length) {
    return [];
  }

  const [header, ...rows] = lines;
  const headers = header.split(',').map((column) => column.trim().toLowerCase());

  if (!headers.includes('name') || !headers.includes('price')) {
    return [];
  }

  return rows
    .map((row) => {
      const values = row.split(',').map((value) => value.trim());
      const record = headers.reduce((accumulator, key, index) => {
        accumulator[key] = values[index] || '';
        return accumulator;
      }, {});

      return buildPreviewItem({
        name: record.name,
        price: Number(record.price),
        category: record.category,
        description: record.description || '',
        isVeg: record.isveg ? record.isveg.toLowerCase() !== 'false' : true,
        isPopular: record.ispopular ? record.ispopular.toLowerCase() === 'true' : false,
      });
    })
    .filter(Boolean);
};

const parseTextSource = (sourceText) =>
  sourceText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const delimiter = line.includes('|') ? '|' : line.includes(' - ') ? ' - ' : ',';
      const segments = line.split(delimiter).map((segment) => segment.trim()).filter(Boolean);
      const priceIndex = segments.findIndex((segment) => /(\$|₹)?\s*\d+(\.\d{1,2})?/.test(segment));

      if (priceIndex === -1) {
        return null;
      }

      const rawPrice = segments[priceIndex].match(/\d+(\.\d{1,2})?/);
      const price = rawPrice ? Number(rawPrice[0]) : NaN;
      const category =
        segments.find((segment, index) => index !== priceIndex && knownCategories.includes(segment.toLowerCase())) ||
        'Main Course';

      const description = segments
        .filter(
          (segment, index) =>
            index !== 0 &&
            index !== priceIndex &&
            segment.toLowerCase() !== category.toLowerCase()
        )
        .join(' ');

      return buildPreviewItem({
        name: segments[0],
        price,
        category,
        description,
        isVeg: !/chicken|mutton|fish|beef|prawn|egg/i.test(line),
        isPopular: /popular|chef special|signature/i.test(line),
      });
    })
    .filter(Boolean);

const parseMenuSource = (sourceText = '') => {
  const trimmed = sourceText.trim();

  if (!trimmed) {
    return [];
  }

  if (trimmed.startsWith('[')) {
    return parseJsonSource(trimmed);
  }

  const firstLine = trimmed.split(/\r?\n/)[0] || '';
  if (firstLine.toLowerCase().includes('name') && firstLine.toLowerCase().includes('price')) {
    return parseCsvSource(trimmed);
  }

  return parseTextSource(trimmed);
};

// @route   GET /api/menu
// @desc    Get all menu items
router.get('/', async (req, res) => {
  try {
    const filter = {};
    if (req.query.restaurantId) {
      filter.restaurantId = req.query.restaurantId;
    }

    const menuItems = await MenuItem.find(filter).sort({ category: 1, name: 1 });
    res.json(menuItems);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   POST /api/menu
// @desc    Add a new menu item
router.post('/', auth, requireRole('RESTAURANT_ADMIN'), async (req, res) => {
  try {
    const newItem = new MenuItem({
      ...req.body,
      restaurantId: req.user.restaurantId,
    });
    const item = await newItem.save();
    res.json(item);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server Error' });
  }
});

router.post('/import/preview', auth, requireRole('RESTAURANT_ADMIN'), async (req, res) => {
  try {
    const { sourceText } = req.body;
    const previewItems = parseMenuSource(sourceText);

    if (!previewItems.length) {
      return res.status(400).json({
        message:
          'Could not parse menu items. Use JSON, CSV, or lines like "Chicken 65 | 15 | Starter | Crispy chicken".',
      });
    }

    return res.json({ items: previewItems });
  } catch (err) {
    console.error(err.message);
    return res.status(400).json({ message: 'Failed to parse uploaded menu data' });
  }
});

router.post('/import/commit', auth, requireRole('RESTAURANT_ADMIN'), async (req, res) => {
  try {
    const { items } = req.body;

    if (!Array.isArray(items) || !items.length) {
      return res.status(400).json({ message: 'No menu items provided for import' });
    }

    const sanitizedItems = items
      .map((item) =>
        buildPreviewItem({
          name: item.name,
          price: Number(item.price),
          category: item.category,
          description: item.description || '',
          isVeg: item.isVeg ?? true,
          isPopular: item.isPopular ?? false,
        })
      )
      .filter(Boolean)
      .map((item) => ({
        ...item,
        restaurantId: req.user.restaurantId,
      }));

    if (!sanitizedItems.length) {
      return res.status(400).json({ message: 'No valid items found for import' });
    }

    const createdItems = await MenuItem.insertMany(sanitizedItems);
    return res.status(201).json({ items: createdItems, importedCount: createdItems.length });
  } catch (err) {
    console.error(err.message);
    return res.status(500).json({ message: 'Failed to import menu items' });
  }
});

// @route   PUT /api/menu/:id
// @desc    Update a menu item
router.put('/:id', auth, requireRole('RESTAURANT_ADMIN'), async (req, res) => {
  try {
    const updatedItem = await MenuItem.findOneAndUpdate(
      { _id: req.params.id, restaurantId: req.user.restaurantId },
      { $set: req.body },
      { new: true }
    );
    if (!updatedItem) {
      return res.status(404).json({ message: 'Menu item not found' });
    }
    res.json(updatedItem);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   DELETE /api/menu/:id
// @desc    Delete a menu item
router.delete('/:id', auth, requireRole('RESTAURANT_ADMIN'), async (req, res) => {
  try {
    const removedItem = await MenuItem.findOneAndDelete({
      _id: req.params.id,
      restaurantId: req.user.restaurantId,
    });
    if (!removedItem) {
      return res.status(404).json({ message: 'Menu item not found' });
    }
    res.json({ message: 'Menu item removed' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server Error' });
  }
});

module.exports = router;
