const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { vectorizeImage } = require('./vectorizeImage');

const app = express();

// Allow CORS
app.use(cors());

// Set up multer
const upload = multer({ storage: multer.memoryStorage() });

// POST /vectorize
app.post('/vectorize', upload.single('image'), async (req, res) => {
  console.log('Received image data:', req.file);

  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  try {
    const vectorizedImageBuffer = await vectorizeImage(req.file.buffer);

    // ✨ Updated output directory to /tmp/icons
    const outputDir = path.join('/tmp', 'icons');

    // Create /tmp/icons if it doesn't exist
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const outputFile = path.join(outputDir, `icon_${Date.now()}.svg`);
    fs.writeFileSync(outputFile, vectorizedImageBuffer);

    const protocol = req.headers['x-forwarded-proto'] || req.protocol;
    const host = req.headers.host;
    const iconUri = `${protocol}://${host}/icons/${path.basename(outputFile)}`;

    console.log('Generated icon URI:', iconUri);

    res.json({ message: 'Image received and vectorized!', iconUri: iconUri });
  } catch (err) {
    console.error('Error processing the image:', err);
    res.status(500).json({ error: 'Failed to vectorize the image' });
  }
});

// Serve icons
app.use('/icons', express.static(path.join('/tmp', 'icons')));

// DELETE /clear-icons
app.delete('/clear-icons', (req, res) => {
  const iconsDir = path.join('/tmp', 'icons');

  if (!fs.existsSync(iconsDir)) {
    return res.status(400).json({ error: 'Icons directory does not exist' });
  }

  fs.readdir(iconsDir, (err, files) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to read icons directory' });
    }

    if (files.length === 0) {
      return res.status(200).json({ message: 'No icons to delete' });
    }

    files.forEach((file) => {
      const filePath = path.join(iconsDir, file);
      fs.unlink(filePath, (unlinkErr) => {
        if (unlinkErr) {
          console.error(`Error deleting file ${file}:`, unlinkErr);
        }
      });
    });

    res.status(200).json({ message: 'Icons deleted successfully' });
  });
});

// Test route
app.get("/test", (req, res) => {
  res.send(`Vectorizer server working!`);
});

// 👇 Export app for Vercel
module.exports = app;
