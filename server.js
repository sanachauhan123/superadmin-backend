import dotenv from "dotenv";
dotenv.config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const http = require("http");
const { Server } = require("socket.io");
import admin from "firebase-admin";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


// Load JSON safely
const serviceAccount = JSON.parse(
  fs.readFileSync(path.join(__dirname, "firebaseAdmin.json"), "utf8")
);


admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

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

// Create HTTP server for Socket.IO
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" },
});

// Track connections
io.on("connection", (socket) => {
  console.log("Waiter connected:", socket.id);

  socket.on("disconnect", () => {
    console.log("Waiter disconnected:", socket.id);
  });
});

app.post("/sendNotification", async (req, res) => {
  const { token, title, body, data } = req.body;

  if (!token) {
    return res.status(400).json({ error: "FCM token required" });
  }

  const message = {
    token,
    notification: {
      title,
      body,
    },
    data: data || {},
  };

  try {
    const response = await admin.messaging().send(message);
    res.json({ success: true, response });
  } catch (error) {
    console.error("FCM Error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

let tokens = []; // use DB in production

app.post("/saveToken", (req, res) => {
  const { fcmtoken } = req.body;

  if (!fcmtoken) {
   res.status(400).json({ error: "FCM token missing" });
  }

  // Remove old record if same device sends again
  tokens = tokens.filter(t => t.fcmtoken !== fcmtoken);

  tokens.push({
    fcmtoken,

  });

  console.log("📱 Registered devices:", tokens);
  res.json({ success: true });
});

app.get("/getDeviceToken", (req, res) => {
  if (tokens.length === 0) {
    return res.status(404).json({ error: "No device registered" });
  }

  // Send the latest registered token
  const latestDevice = tokens[tokens.length - 1];

  res.json({ token: latestDevice.fcmtoken });
});


// // Routes
// // REST route to trigger notification
// app.post("/api/notify", (req, res) => {
//   const { table, message } = req.body;
//   io.emit("kitchen-notif", { table, message }); // send to all connected clients
//   res.json({ success: true });
// });

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

server.listen(PORT, () => {
  console.log('✅ Server running on port 5000');
});
