const sharp = require('sharp');
const path = require('path');

async function generateIcon(size) {
  const radius = Math.round(size * 0.15);
  const fontSize = Math.round(size * 0.42);
  const svg = `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
    <rect width="${size}" height="${size}" rx="${radius}" ry="${radius}" fill="#F59E0B"/>
    <text x="50%" y="54%" font-family="Arial, Helvetica, sans-serif" font-weight="bold"
          font-size="${fontSize}px" fill="white" text-anchor="middle" dominant-baseline="middle">PT</text>
  </svg>`;

  await sharp(Buffer.from(svg))
    .png()
    .toFile(path.join(__dirname, '..', 'public', `icon-${size}.png`));

  console.log(`Generated icon-${size}.png`);
}

Promise.all([generateIcon(192), generateIcon(512)]).catch(console.error);
