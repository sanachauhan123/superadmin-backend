// upload.js
// This file is now deprecated because images are uploaded directly to cPanel.
// You can leave this route empty or remove it completely.

const express = require('express');
const router = express.Router();

// Optional placeholder route
router.get('/', (req, res) => {
  res.json({ message: 'Image uploads are handled directly via cPanel now.' });
});

module.exports = router;
