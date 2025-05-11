// server/vectorizer.js

const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { vectorizeImage } = require('./vectorizeImage');

// Create an Express app
const app = express();
const port = process.env.PORT || 3001; // Vercel gives dynamic ports, so use process.env.PORT

// Allow CORS so that Expo app can connect
app.use(cors());

// Set up multer for file uploads (storage in memory)
const upload = multer({ storage: multer.memoryStorage() });

// Handle POST request to /vectorize
app.post('/vectorize', upload.single('image'), async (req, res) => {
  console.log('Received image data:', req.file);

  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  try {
    const vectorizedImageBuffer = await vectorizeImage(req.file.buffer);

    const outputDir = path.join(__dirname, 'icons');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir);
    }

    const outputFile = path.join(outputDir, `icon_${Date.now()}.svg`);
    fs.writeFileSync(outputFile, vectorizedImageBuffer);

    // Dynamically generate URL
    const protocol = req.protocol;
    const host = req.get('host');
    const iconUri = `${protocol}://${host}/icons/${path.basename(outputFile)}`;

    console.log('Generated icon URI:', iconUri);

    res.json({ message: 'Image received and vectorized!', iconUri: iconUri });
  } catch (err) {
    console.error('Error processing the image:', err);
    res.status(500).json({ error: 'Failed to vectorize the image' });
  }
});

// Serve the generated icons
app.use('/icons', express.static(path.join(__dirname, 'icons')));

// Handle DELETE request to clear all icons
app.delete('/clear-icons', (req, res) => {
  const iconsDir = path.join(__dirname, 'icons');

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

app.get("/test", () => {
  console.log(`Vectorizer server running on port ${port}`);
})

// Start the server
app.listen(port, () => {
  console.log(`Vectorizer server running on port ${port}`);
});
