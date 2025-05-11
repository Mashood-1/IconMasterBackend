// server/vectorizeImage.js

const Potrace = require('potrace');
const sharp = require('sharp');
const { load } = require('cheerio'); // Load Cheerio to parse HTML/XML

async function vectorizeImage(imageBuffer) {
  try {
    // Preprocess the image
    const processedImage = await sharp(imageBuffer)
      .resize(256, 256)
      .png()
      .toBuffer();

    // Trace and vectorize the image
    const svgData = await new Promise((resolve, reject) => {
      Potrace.trace(processedImage, { threshold: 128 }, (err, svg) => {
        if (err) reject(err);
        else resolve(svg);
      });
    });

    // Use Cheerio to extract pure <svg> content
    const $ = load(svgData, { xmlMode: true });
    const pureSvg = $('svg').toString(); // Only <svg>...</svg> content

    // Return the cleaned SVG as a Buffer
    return Buffer.from(pureSvg);
  } catch (err) {
    console.error('Error vectorizing the image:', err);
    throw new Error('Image vectorization failed');
  }
}

module.exports = { vectorizeImage };
