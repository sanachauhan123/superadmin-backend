const express = require('express');
const router = express.Router();
const Category = require('../models/Category');
const { verifyRestaurant } = require('../middleware/auth');

// ✅ Get all categories for logged-in restaurant
router.get('/', verifyRestaurant, async (req, res) => {
  try {
    const categories = await Category.find({ restaurantId: req.restaurantId });
    res.json({ success: true, data: categories });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Create category
router.post('/', verifyRestaurant, async (req, res) => {
  try {
    const { name } = req.body;
    const category = new Category({
      name,
      restaurantId: req.restaurantId
    });
    await category.save();
    res.status(201).json({ success: true, data: category });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Update category
router.put('/:id', verifyRestaurant, async (req, res) => {
  try {
    const { name } = req.body;
    const category = await Category.findOneAndUpdate(
      { _id: req.params.id, restaurantId: req.restaurantId },
      { name },
      { new: true }
    );
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }
    res.json({ success: true, data: category });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Delete category
router.delete('/:id', verifyRestaurant, async (req, res) => {
  try {
    const category = await Category.findOneAndDelete({
      _id: req.params.id,
      restaurantId: req.restaurantId,
    });
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }
    res.json({ success: true, message: 'Category deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
