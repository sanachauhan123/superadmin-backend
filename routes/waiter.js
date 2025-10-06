const express = require('express');
const router = express.Router();
const Waiter = require('../models/Waiter');
const bcrypt = require('bcrypt');
const { verifyRestaurant } = require('../middleware/auth');
const jwt = require('jsonwebtoken');


// Create a new restaurant (signup)
router.post('/', async (req, res) => {
  console.log("Incoming request body:", req.body);

  try {
    const { name, email, password } = req.body;

    const existingRestaurant = await Waiter.findOne({ email });
    if (existingRestaurant) {
    return res.status(400).json({ error: 'Email already in use' });
    }

    if (!name || !email || !password) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const restaurantId = `res-${Date.now()}`;

    // ✅ Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // ✅ Save restaurant with hashed password
    const restaurant = new Waiter({
      name,
      email,
      password: hashedPassword,
      restaurantId
    });

    await restaurant.save();

    // ✅ Hide password before sending response
    const responseRestaurant = restaurant.toObject();
    delete responseRestaurant.password;

    res.status(201).json({ success: true, data: responseRestaurant });
  } catch (err) {
    console.error("Error:", err);
    res.status(500).json({ success: false, error: err.message });

  }
});

// List all restaurants
router.get('/', async (req, res) => {
  const restaurants = await Waiter.find({});
  res.json({ success: true, data: restaurants });
});


// Update restaurant
router.put('/:id', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const updateData = { name, email };

    // If password is sent, hash it
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      updateData.password = hashedPassword;
    }

    const restaurant = await Waiter.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password'); // Exclude password from response

    if (!restaurant) return res.status(404).json({ error: 'Restaurant not found' });

    res.json({ success: true, data: restaurant });
  } catch (err) {
    console.error("Update error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Delete restaurant
router.delete('/:id', async (req, res) => {
  try {
    const restaurant = await Waiter.findByIdAndDelete(req.params.id);
    if (!restaurant) return res.status(404).json({ error: 'Restaurant not found' });

    res.json({ success: true, message: 'Restaurant deleted successfully' });
  } catch (err) {
    console.error("Delete error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/restaurant/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const restaurant = await Waiter.findOne({ email });

    if (!restaurant) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, restaurant.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign({ restaurantId: restaurant.restaurantId }, process.env.JWT_SECRET, {
      expiresIn: '7d',
    });

    res.json({
      token,
      restaurant: {
        id: restaurant._id,
        restaurantId: restaurant.restaurantId,
        name: restaurant.name,
        email: restaurant.email,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
