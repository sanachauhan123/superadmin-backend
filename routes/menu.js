const express = require('express');
const router = express.Router();
const Menu = require('../models/Menu');
const { verifyRestaurant } = require('../middleware/auth');

router.get('/', verifyRestaurant, async (req, res) => {
  try {
    const { available } = req.query; // e.g. /api/menu?available=true
    const filter = { restaurantId: req.restaurantId };

    // If query includes available=true, only return available items
    if (available === 'true') {
      filter.available = true;
    }

    const items = await Menu.find(filter);
    res.json({ data: items });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add new menu item
router.post('/', verifyRestaurant, async (req, res) => {
  try {
    const { name, price, category, description, image, available } = req.body;
    const newItem = new Menu({
      name,
      price,
      category,
      description,
      image,
      available,
      restaurantId: req.restaurantId
    });
    await newItem.save();
    res.status(201).json({ message: 'Menu item created' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update menu item
router.put('/:id', verifyRestaurant, async (req, res) => {
  try {
    const { name, price, category, description, image, available } = req.body;
    await Menu.findOneAndUpdate(
      { _id: req.params.id, restaurantId: req.restaurantId },
      { name, price, category, description, image, available }
    );
    res.json({ message: 'Menu item updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete menu item
router.delete('/:id', verifyRestaurant, async (req, res) => {
  try {
    await Menu.findOneAndDelete({ _id: req.params.id, restaurantId: req.restaurantId });
    res.json({ message: 'Menu item deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
