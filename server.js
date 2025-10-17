require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log('MongoDB connected');
}).catch(err => {
  console.error('MongoDB connection error:', err);
});

// Routes
const restaurantRoutes = require('./routes/restaurant');
app.use('/api/restaurants', restaurantRoutes);

const waiterRoutes = require('./routes/waiter');
app.use('/api/waiters', waiterRoutes);

const adminRoutes = require('./routes/admin');
app.use('/api/admin', adminRoutes);

const tableRoutes = require('./routes/tables');
app.use('/api/tables', tableRoutes);

const menuRoutes = require('./routes/menu');
app.use('/api/menu', menuRoutes);

// // Serve uploaded images statically
// app.use('/uploads', express.static(path.join(__dirname, 'uploads')));



const categoryRoutes = require('./routes/categories');
app.use('/api/categories', categoryRoutes);

const uploadRoutes = require('./routes/upload');
app.use('/api/upload', uploadRoutes);

const orderRoutes = require('./routes/orders');
app.use('/api/orders', orderRoutes);

const postOrderRoutes = require('./routes/pastorders');
app.use('/api/pastorders', postOrderRoutes);

const completeOrderRoutes = require('./routes/completeorders');
app.use('/api/completeorders', completeOrderRoutes);

const billingRoutes = require('./routes/billing');
app.use('/api/billing', billingRoutes);

const settingRoutes = require('./routes/settings');
app.use('/api/settings', settingRoutes);

const dashboardRoutes = require('./routes/dashboard');
app.use('/api/dashboard', dashboardRoutes);

const userRoutes = require('./routes/user');
app.use('/api/user', userRoutes);

const PORT = process.env.PORT;

app.listen(PORT, () => {
  console.log('✅ Server running on port 5000');
});
