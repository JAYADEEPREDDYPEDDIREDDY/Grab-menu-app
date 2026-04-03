const express = require('express');
const Table = require('../models/Table');
const TableSession = require('../models/TableSession');
const Restaurant = require('../models/Restaurant');
const Bill = require('../models/Bill');
const auth = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/auth.middleware');

const router = express.Router();

const emitSessionUpdate = async (req, sessionId) => {
  const io = req.app.get('io');
  const session = await TableSession.findById(sessionId).populate('tableId');
  if (session) {
    io.emit('sessionUpdate', session);
  }
};

const resolveTable = async ({ tableId, restaurantId }) => {
  let table = null;
  let resolvedRestaurantId = restaurantId;

  if (typeof tableId === 'string' && !tableId.match(/^[0-9a-fA-F]{24}$/)) {
    const tableNumber = Number.parseInt(tableId, 10);
    if (!Number.isInteger(tableNumber) || tableNumber < 1) {
      throw new Error('Invalid table reference');
    }

    const query = { tableNumber };
    if (resolvedRestaurantId) {
      query.restaurantId = resolvedRestaurantId;
    }
    table = await Table.findOne(query);
  } else {
    table = await Table.findById(tableId);
  }

  if (!table) {
    throw new Error('Table not found');
  }

  resolvedRestaurantId = table.restaurantId;

  return {
    table,
    resolvedRestaurantId,
  };
};

const buildRestaurantPayload = async (restaurantId) => {
  if (!restaurantId) {
    return null;
  }

  const restaurant = await Restaurant.findById(restaurantId).select(
    'name paymentQrUrl upiId gstRate serviceChargeRate'
  );

  if (!restaurant) {
    return null;
  }

  return {
    name: restaurant.name,
    paymentQrUrl: restaurant.paymentQrUrl || '',
    upiId: restaurant.upiId || '',
    gstRate: Number(restaurant.gstRate || 0),
    serviceChargeRate: Number(restaurant.serviceChargeRate || 0),
  };
};

const buildCustomerSessionPayload = async (session) => ({
  session,
  restaurant: await buildRestaurantPayload(session.restaurantId),
});

const normalizeActiveSession = async (req, session, options = {}) => {
  const { notify = false } = options;

  if (!session || !session.isActive) {
    return session;
  }

  if (session.status === 'ACTIVE') {
    return session;
  }

  if (session.status === 'BILLING') {
    const pendingBill = await Bill.findOne({
      restaurantId: session.restaurantId,
      tableIds: session.tableId,
      paymentStatus: { $in: ['PENDING', 'AWAITING_APPROVAL'] },
    }).sort({ createdAt: -1 });

    if (pendingBill) {
      return session;
    }
  }

  session.status = 'ACTIVE';
  session.isLocked = true;
  session.lastActivityAt = new Date();
  await session.save();
  if (notify) {
    await emitSessionUpdate(req, session._id);
  }
  return session;
};

router.post('/start', async (req, res) => {
  try {
    const { tableId, restaurantId, persons, sessionToken } = req.body;
    if (!tableId || !sessionToken) {
      return res.status(400).json({ message: 'Table and session token are required.' });
    }

    const { table, resolvedRestaurantId } = await resolveTable({ tableId, restaurantId });

    let session = await TableSession.findOne({
      tableId: table._id,
      sessionToken,
      isActive: true,
    }).populate('tableId');

    if (session) {
      session = await normalizeActiveSession(req, session);
    }

    if (session) {
      return res.json(await buildCustomerSessionPayload(session));
    }

    let activeSession = await TableSession.findOne({
      tableId: table._id,
      isActive: true,
    }).populate('tableId');

    activeSession = await normalizeActiveSession(req, activeSession);

    if (activeSession) {
      return res.status(423).json({
        message: 'This table is currently active. You cannot place a new order.',
        session: activeSession,
      });
    }

    const parsedPersons = Math.max(1, Number(persons) || 0);
    if (!parsedPersons) {
      return res.status(400).json({ message: 'Please enter the number of persons at the table.' });
    }

    session = await TableSession.create({
      restaurantId: resolvedRestaurantId,
      tableId: table._id,
      sessionToken,
      persons: parsedPersons,
      status: 'ACTIVE',
      isActive: true,
      isLocked: true,
      lastActivityAt: new Date(),
    });

    const populatedSession = await TableSession.findById(session._id).populate('tableId');
    await emitSessionUpdate(req, session._id);
    return res.status(201).json(await buildCustomerSessionPayload(populatedSession));
  } catch (error) {
    console.error(error);
    const statusCode = error.message === 'Table not found' ? 404 : 400;
    return res.status(statusCode).json({ message: error.message || 'Failed to start session' });
  }
});

router.get('/table/:tableId', async (req, res) => {
  try {
    const { tableId } = req.params;
    const { restaurantId, sessionToken } = req.query;
    const { table } = await resolveTable({ tableId, restaurantId });
    const restaurantPayload = await buildRestaurantPayload(table.restaurantId);

    let activeSession = await TableSession.findOne({
      tableId: table._id,
      isActive: true,
    }).populate('tableId');

    activeSession = await normalizeActiveSession(req, activeSession);

    if (!activeSession) {
      return res.json({ session: null, locked: false, restaurant: restaurantPayload });
    }

    const sameSession = sessionToken && activeSession.sessionToken === sessionToken;
    if (!sameSession) {
      return res.status(423).json({
        locked: true,
        message: 'This table is currently active. You cannot place a new order.',
        restaurant: restaurantPayload,
      });
    }

    return res.json(await buildCustomerSessionPayload(activeSession));
  } catch (error) {
    console.error(error);
    return res.status(400).json({ message: error.message || 'Failed to load session' });
  }
});

router.patch('/:sessionId/cart', async (req, res) => {
  try {
    const { sessionToken, cartItems = [], customerName = '' } = req.body;
    const session = await TableSession.findById(req.params.sessionId).populate('tableId');

    if (!session || !session.isActive) {
      return res.status(404).json({ message: 'Session not found.' });
    }

    if (session.sessionToken !== sessionToken) {
      return res.status(403).json({ message: 'Session token mismatch.' });
    }

    session.cartItems = Array.isArray(cartItems)
      ? cartItems
          .filter((item) => item && item.name && Number(item.quantity) > 0)
          .map((item) => ({
            menuItemId: item.menuItemId || item._id || null,
            name: item.name,
            price: Number(item.price || 0),
            quantity: Number(item.quantity || 0),
          }))
      : [];
    session.customerName = typeof customerName === 'string' ? customerName.trim() : session.customerName;
    session.lastActivityAt = new Date();
    await session.save();
    await emitSessionUpdate(req, session._id);

    return res.json({ session });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Failed to sync session cart' });
  }
});

router.get('/overview', auth, requireRole('RESTAURANT_ADMIN'), async (req, res) => {
  try {
    const sessions = await TableSession.find({
      restaurantId: req.user.restaurantId,
      isActive: true,
    })
      .populate('tableId')
      .sort({ updatedAt: -1 });

    const recoveredSessions = [];
    for (const session of sessions) {
      const recovered = await normalizeActiveSession(req, session);
      if (recovered) {
        recoveredSessions.push(recovered);
      }
    }

    const counts = {
      active: recoveredSessions.filter((session) => session.status === 'ACTIVE').length,
      locked: recoveredSessions.filter((session) => session.isLocked).length,
      billing: recoveredSessions.filter((session) => session.status === 'BILLING').length,
    };

    return res.json({ counts, sessions: recoveredSessions });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Failed to load session overview' });
  }
});

router.patch('/:sessionId/complete', auth, requireRole('RESTAURANT_ADMIN'), async (req, res) => {
  try {
    const session = await TableSession.findOne({
      _id: req.params.sessionId,
      restaurantId: req.user.restaurantId,
    });

    if (!session) {
      return res.status(404).json({ message: 'Session not found.' });
    }

    session.status = 'COMPLETED';
    session.isActive = false;
    session.isLocked = false;
    session.cartItems = [];
    session.lastActivityAt = new Date();
    await session.save();
    await emitSessionUpdate(req, session._id);

    return res.json({ session });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Failed to complete session' });
  }
});

router.patch('/:sessionId/release', auth, requireRole('RESTAURANT_ADMIN'), async (req, res) => {
  try {
    const session = await TableSession.findById(req.params.sessionId).populate('tableId');

    if (!session) {
      return res.json({ message: 'Table session is already cleared.' });
    }

    if (String(session.restaurantId) !== String(req.user.restaurantId)) {
      return res.status(403).json({ message: 'You cannot release another restaurant session.' });
    }

    if (!session.isActive || session.status === 'COMPLETED') {
      return res.json({
        message: `Table ${session.tableId?.tableNumber || ''} is already released.`.trim(),
        session,
      });
    }

    session.status = 'COMPLETED';
    session.isActive = false;
    session.isLocked = false;
    session.cartItems = [];
    session.lastActivityAt = new Date();
    await session.save();
    await emitSessionUpdate(req, session._id);

    return res.json({
      message: `Table ${session.tableId?.tableNumber || ''} released successfully.`.trim(),
      session,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Failed to release table' });
  }
});

module.exports = router;
