const express = require('express');
const router = express.Router();
const Table = require('../models/Table');
const { verifyRestaurant } = require('../middleware/auth');

// GET all tables
router.get('/',verifyRestaurant, async (req, res) => {
  try {
    //console.log('req.query.restaurantId:', req.query.restaurantId);
   // const tables = await Table.find({ restaurantId: req.restaurantId });
    const tables = await Table.find({});
    res.json({ success: true, data: tables });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET a specific table by ID
router.get('/:id', verifyRestaurant, async (req, res) => {
  try {
    const table = await Table.find({
      _id: req.params.id,
      restaurantId: req.restaurantId,
    });
    console.log(table)

    if (!table) return res.status(404).json({ error: 'Table not found' });

    res.json({ success: true, data: table });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// CREATE
router.post('/', verifyRestaurant, async (req, res) => {
  console.log('req.restaurantId =>', req.restaurantId); // ✅ Add this

  try {
    const { number, capacity } = req.body;

    const newTable = new Table({
      number,
      capacity,
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
    const { number, capacity } = req.body;
    const updated = await Table.findOneAndUpdate(
      { _id: req.params.id, restaurantId: req.restaurantId },
      { number, capacity },
      { new: true }
    );
    if (!updated) return res.status(404).json({ error: 'Table not found' });
    res.json({ message: 'Table updated successfully', data: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
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
