import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

// CRC32 table
const crcTable = new Uint32Array(256);
for (let i = 0; i < 256; i++) {
  let c = i;
  for (let k = 0; k < 8; k++) {
    c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
  }
  crcTable[i] = c;
}

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function makeChunk(type, data) {
  const len = data.length;
  const buf = Buffer.alloc(4 + 4 + len + 4);
  buf.writeUInt32BE(len, 0);
  buf.write(type, 4, 4, 'ascii');
  data.copy(buf, 8);
  const typeAndData = buf.subarray(4, 8 + len);
  const crc = crc32(typeAndData);
  buf.writeUInt32BE(crc, 8 + len);
  return buf;
}

function generatePng(width, height, isMaskable = false) {
  // Create RGBA raw image buffer with filter byte 0 at the start of each row
  const rowSize = 1 + width * 4;
  const rawData = Buffer.alloc(height * rowSize);

  const centerX = width / 2;
  const centerY = height / 2;
  const cornerRadius = isMaskable ? 0 : width * 0.22;
  const safePadding = isMaskable ? width * 0.12 : width * 0.05;

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowSize;
    rawData[rowOffset] = 0; // No filter

    for (let x = 0; x < width; x++) {
      const pixelOffset = rowOffset + 1 + x * 4;

      // Base background: RAVINI Red gradient (#DC2626 to #991B1B)
      const gradT = (x + y) / (width + height);
      let r = Math.round(220 * (1 - gradT) + 153 * gradT);
      let g = Math.round(38 * (1 - gradT) + 27 * gradT);
      let b = Math.round(38 * (1 - gradT) + 27 * gradT);
      let a = 255;

      // Check rounded rect boundaries if not maskable
      if (!isMaskable) {
        const dx = Math.max(0, Math.abs(x - centerX) - (width / 2 - cornerRadius));
        const dy = Math.max(0, Math.abs(y - centerY) - (height / 2 - cornerRadius));
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > cornerRadius) {
          a = 0; // Transparent outside corner radius
        }
      }

      if (a > 0) {
        // Gold/Yellow Accent Ring
        const ringDistX = Math.abs(x - centerX);
        const ringDistY = Math.abs(y - centerY);
        const ringBound = width * 0.44;
        if (Math.abs(Math.max(ringDistX, ringDistY) - ringBound) < (width * 0.012)) {
          // Yellow gold (#FACC15)
          r = 250;
          g = 204;
          b = 21;
        }

        // Draw Stylized 'R' Monogram (Center)
        // Scaled coordinates normalized to 0..1 in center box
        const nx = (x - (centerX - width * 0.25)) / (width * 0.5);
        const ny = (y - (centerY - height * 0.28)) / (height * 0.56);

        if (nx >= 0 && nx <= 1 && ny >= 0 && ny <= 1) {
          // Left vertical stem: nx between 0 and 0.22
          const inLeftStem = nx >= 0.02 && nx <= 0.24 && ny >= 0.05 && ny <= 0.95;
          // Top horizontal bar:
          const inTopBar = nx >= 0.24 && nx <= 0.65 && ny >= 0.05 && ny <= 0.22;
          // Middle horizontal bar:
          const inMidBar = nx >= 0.24 && nx <= 0.65 && ny >= 0.42 && ny <= 0.58;
          // Right curve of loop:
          const loopCenterX = 0.62;
          const loopCenterY = 0.32;
          const loopDx = (nx - loopCenterX) / 0.35;
          const loopDy = (ny - loopCenterY) / 0.24;
          const loopDist = loopDx * loopDx + loopDy * loopDy;
          const inLoop = loopDist <= 1.0 && loopDist >= 0.35 && nx >= 0.45;
          // Diagonal leg of R:
          const legSlope = (ny - 0.5) - (nx - 0.22) * 0.9;
          const inLeg = Math.abs(legSlope) < 0.14 && nx >= 0.24 && nx <= 0.88 && ny >= 0.5 && ny <= 0.95;

          if (inLeftStem || inTopBar || inMidBar || inLoop || inLeg) {
            // Pure White for R
            r = 255;
            g = 255;
            b = 255;
          }
        }

        // Yellow Sparkle Accent at upper right (nx ~ 0.78, ny ~ 0.12)
        const sparkX = centerX + width * 0.26;
        const sparkY = centerY - height * 0.26;
        const sparkDist = Math.sqrt((x - sparkX) ** 2 + (y - sparkY) ** 2);
        const sparkRadius = width * 0.07;
        if (sparkDist <= sparkRadius) {
          // Yellow glow (#FBBF24)
          r = 251;
          g = 191;
          b = 36;
          // Center white highlight
          if (sparkDist <= sparkRadius * 0.45) {
            r = 255;
            g = 255;
            b = 255;
          }
        }
      }

      rawData[pixelOffset] = r;
      rawData[pixelOffset + 1] = g;
      rawData[pixelOffset + 2] = b;
      rawData[pixelOffset + 3] = a;
    }
  }

  // PNG Signature
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  // IHDR
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // 8 bits
  ihdrData[9] = 6; // RGBA
  ihdrData[10] = 0; // compression
  ihdrData[11] = 0; // filter
  ihdrData[12] = 0; // interlace
  const ihdrChunk = makeChunk('IHDR', ihdrData);

  // IDAT (deflated rawData)
  const compressed = zlib.deflateSync(rawData, { level: 9 });
  const idatChunk = makeChunk('IDAT', compressed);

  // IEND
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

const publicDir = path.resolve(process.cwd(), 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

console.log('Generating PNG icons for PWA...');
fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), generatePng(192, 192, false));
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), generatePng(512, 512, false));
fs.writeFileSync(path.join(publicDir, 'pwa-maskable-512x512.png'), generatePng(512, 512, true));
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), generatePng(180, 180, false));
fs.writeFileSync(path.join(publicDir, 'favicon.ico'), generatePng(64, 64, false));
console.log('Successfully generated all PWA icons in /public!');
