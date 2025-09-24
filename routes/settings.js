const express = require('express');
const router = express.Router();
const Setting = require('../models/RestaurantSetting');
const { verifyRestaurant } = require('../middleware/auth');

// Get settings for the logged-in restaurant
router.get('/', verifyRestaurant, async (req, res) => {
  try {
    const settings = await Setting.findOne({ restaurantId: req.restaurantId });

    res.json({ data: settings });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create or Update settings
router.post('/', verifyRestaurant, async (req, res) => {
  try {
    const data = req.body;

    const existing = await Setting.findOne({ restaurantId: req.restaurantId });

    if (existing) {
      await Setting.updateOne({ restaurantId: req.restaurantId }, data);
    } else {
      const newSetting = new Setting({
        ...data,
        restaurantId: req.restaurantId,
      });
      await newSetting.save();
    }

    res.json({ message: 'Settings saved successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
