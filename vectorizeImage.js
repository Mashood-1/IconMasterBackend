// server/vectorizeImage.js

const Potrace = require('potrace');
const sharp = require('sharp');
const { load } = require('cheerio');

async function vectorizeImage(imageBuffer) {
  try {
    // 🔧 Preprocess: Resize to higher resolution and grayscale
    const processedImage = await sharp(imageBuffer)
      .resize(512, 512)       // Higher resolution for more detail
      .grayscale()            // Improves Potrace output quality
      .png()
      .toBuffer();

    // 🎨 Vectorize with enhanced Potrace options
    const svgData = await new Promise((resolve, reject) => {
      Potrace.trace(processedImage, {
        threshold: 128,                      // Brightness threshold
        turdSize: 2,                         // Remove small artifacts
        optCurve: true,                      // Smooth curves
        optTolerance: 0.2,                   // Curve approximation tightness
        turnPolicy: Potrace.TURNPOLICY_MAJORITY, // Better edge handling
      }, (err, svg) => {
        if (err) reject(err);
        else resolve(svg);
      });
    });

    // 🧼 Use Cheerio to extract and clean up the SVG
    const $ = load(svgData, { xmlMode: true });
    const $svg = $('svg');

    // 🧭 Add scalable properties
    $svg.attr('viewBox', '0 0 512 512');
    $svg.attr('xmlns', 'http://www.w3.org/2000/svg');

    const cleanSvg = $.xml('svg'); // Return only the cleaned <svg>...</svg> content

    return Buffer.from(cleanSvg);
  } catch (err) {
    console.error('Error vectorizing the image:', err);
    throw new Error('Image vectorization failed');
  }
}

module.exports = { vectorizeImage };
