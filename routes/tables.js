const express = require('express');
const router = express.Router();
const Table = require('../models/Table');
const { verifyRestaurant } = require('../middleware/auth');

// GET all tables
router.get('/',verifyRestaurant, async (req, res) => {
  try {
    //const tables = await Table.find({ restaurantId: req.restaurantId });
    const tables = await Table.find({});
    res.json({ data: tables });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// CREATE
router.post('/', verifyRestaurant, async (req, res) => {
  console.log('req.restaurantId =>', req.restaurantId); // ✅ Add this

  try {
    const { number, capacity, status } = req.body;

    const newTable = new Table({
      number,
      capacity,
      status,
      restaurantId: req.restaurantId, // This must not be undefined
    });

    await newTable.save();
    res.status(201).json({ message: 'Table created successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// UPDATE
router.put('/:id', verifyRestaurant, async (req, res) => {
  try {
    const { number, capacity, status } = req.body;
    const updated = await Table.findOneAndUpdate(
      { _id: req.params.id, restaurantId: req.restaurantId },
      { number, capacity, status },
      { new: true }
    );
    if (!updated) return res.status(404).json({ error: 'Table not found' });
    res.json({ message: 'Table updated successfully', data: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


router.put("/reset",verifyRestaurant, async (req, res) => {
  try {
    // Example: set all statuses to "Available" and reset capacities
    await Table.updateMany({}, { status: "Available" });

    res.json({ success: true, message: "All tables reset successfully" });
  } catch (err) {
    console.error("Error resetting tables:", err);
    res.status(500).json({ success: false, message: "Server error resetting tables" });
  }
});

// DELETE
router.delete('/:id', verifyRestaurant, async (req, res) => {
  try {
    const deleted = await Table.findOneAndDelete({ _id: req.params.id, restaurantId: req.restaurantId });
    if (!deleted) return res.status(404).json({ error: 'Table not found' });
    res.json({ message: 'Table deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
