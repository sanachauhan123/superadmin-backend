const mongoose = require('mongoose');

const waiterSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, unique: true },
  password: { type: String, required: true },
  restaurantId: { type: String, required: true },
  restaurant: { type: String, required: true }, 
  image: { type: String, default: "" }, 
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Waiter', waiterSchema);
