const express = require('express');
const router = express.Router();
const User = require('../models/User'); // mongoose model
const jwt = require('jsonwebtoken');

router.post('/', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const restaurantId = decoded.restaurantId;

    const { name, contact } = req.body;

    // Find user within the same restaurant
    let user = await User.findOne({ contact, restaurantId });

    if (user) {
      user.name = name;
      await user.save();
    } else {
      user = new User({ name, contact, restaurantId });
      await user.save();
    }

    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Search users for autocomplete
router.get('/search', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Unauthorized' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const restaurantId = decoded.restaurantId;

    const query = req.query.q || '';
    const users = await User.find({
      restaurantId, // only this restaurant
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { contact: { $regex: query, $options: 'i' } }
      ]
    }).limit(20);

    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all users for the logged-in restaurant
router.get('/', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Unauthorized' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const restaurantId = decoded.restaurantId;

    const users = await User.find({ restaurantId });
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
