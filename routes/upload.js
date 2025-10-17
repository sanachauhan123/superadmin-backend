const express = require('express');
const router = express.Router();
const multer = require('multer');
const ftp = require('basic-ftp');
const path = require('path');
const { verifyRestaurant } = require('../middleware/auth');

// Store file in memory temporarily
const storage = multer.memoryStorage();
const upload = multer({ storage });

router.post('/', verifyRestaurant, upload.single('image'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  const client = new ftp.Client();
  client.ftp.verbose = true;

  try {
    await client.access({
      host: 'stridedge.tech', // e.g., stridedge.tech
      user: 'stridedgetech',
      password: '0zp$.{uFa1nB',
      secure: true, // or false if plain FTP
    });

    // Change to your uploads folder on cPanel
    await client.ensureDir('/public_html/uploads');

    // Upload file from buffer
    const filename = `${Date.now()}-${req.file.originalname}`;
    await client.uploadFrom(Buffer.from(req.file.buffer), filename);

    client.close();

    // URL to access file
    const imageUrl = `https://your-domain.com/uploads/${filename}`;
    res.json({ success: true, imageUrl });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Upload to cPanel failed' });
  }
});

module.exports = router;
