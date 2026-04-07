require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const mongoose = require('mongoose');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);

const allowedOrigins = [

  'https://grab-menu.netlify.app' ,
  'http://localhost:5173',
  'http://localhost:5174/',
  'http://127.0.0.1:5173',
  'http://localhost:4173',
  'http://127.0.0.1:4173',
];

const corsOptions = {
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true,
};

// Enable CORS for frontend
app.use(cors(corsOptions));
app.use(express.json({ limit: '5mb' }));

// Set up Socket.io
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    credentials: true,
  },
});

app.set('io', io); // make io accessible in routes

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
.then(() => console.log('MongoDB connected to', process.env.MONGO_URI))
.catch(err => console.error('MongoDB connection error:', err));

// Websocket logic
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);
  
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Setup Mount Routes
app.use('/api/admin', require('./routes/admin.routes'));
app.use('/api/restaurants', require('./routes/restaurant.routes'));
app.use('/api/categories', require('./routes/category.routes').router);
app.use('/api/menu', require('./routes/menu.routes'));
app.use('/api/orders', require('./routes/order.routes'));
app.use('/api/tables', require('./routes/table.routes'));
app.use('/api/billing', require('./routes/billing.routes'));
app.use('/api/session', require('./routes/session.routes'));
app.use('/api/payment', require('./routes/payment.routes'));

// Basic health check route
app.get('/', (req, res) => {
  res.send('GrabMenu API is running');
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
