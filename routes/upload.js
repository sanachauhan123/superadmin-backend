const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const SftpClient = require('ssh2-sftp-client');
const { verifyRestaurant } = require('../middleware/auth');

// Local temp upload folder in Render
const tempUploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(tempUploadDir)) fs.mkdirSync(tempUploadDir, { recursive: true });

// Multer config: upload to temp folder first
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, tempUploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${file.fieldname}${ext}`);
  },
});
const upload = multer({ storage });

// POST /api/upload
router.post('/', verifyRestaurant, upload.single('image'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  const sftp = new SftpClient();
  const localFile = path.join(tempUploadDir, req.file.filename);
  const remoteFile = path.join(process.env.CPANEL_UPLOAD_PATH, req.file.filename);

  try {
    await sftp.connect({
      host: process.env.CPANEL_HOST,
      port: process.env.CPANEL_PORT,
      username: process.env.CPANEL_USER,
      password: process.env.CPANEL_PASS,
    });

    await sftp.put(localFile, remoteFile); // upload to cPanel
    await sftp.end();

    // Delete temp file from Render
    fs.unlinkSync(localFile);

    const imageUrl = `https://stridedge.tech/uploads/${req.file.filename}`;
    res.json({ success: true, imageUrl });

  } catch (err) {
    console.error('SFTP upload error:', err);
    res.status(500).json({ error: 'Failed to upload to cPanel' });
  }
});

module.exports = router;
