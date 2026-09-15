import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

function crc32(buf) {
  let table = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      if (c & 1) c = 0xedb88320 ^ (c >>> 1);
      else c = c >>> 1;
    }
    table[n] = c;
  }
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = table[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function makeChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const body = Buffer.concat([typeBuf, data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([len, body, crc]);
}

function createPng(width, height, isMaskable = false) {
  const rowSize = width * 4 + 1;
  const rawData = Buffer.alloc(rowSize * height);
  const cx = width / 2;
  const cy = height / 2;
  const radius = width * (isMaskable ? 0.36 : 0.44);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowSize;
    rawData[rowOffset] = 0; // Filter: None

    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + 1 + x * 4;
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Base background: Deep black/zinc with subtle radial gradient
      const bgGrad = Math.max(0, 1 - dist / (width * 0.7));
      let r = Math.round(10 + bgGrad * 12);
      let g = Math.round(10 + bgGrad * 15);
      let b = Math.round(14 + bgGrad * 24);
      let a = 255;

      // Outer glow circle
      if (dist <= radius) {
        // Inner glowing AI orb / shield
        const innerRatio = dist / radius;
        const pulse = 1 - innerRatio;
        r = Math.min(255, Math.round(r + pulse * 60 + (dx / width) * 40));
        g = Math.min(255, Math.round(g + pulse * 100 + 40));
        b = Math.min(255, Math.round(b + pulse * 230 + 120));
      }

      // Center geometric "Pulse AI" waveform icon symbol
      const ndx = (x - cx) / (width * 0.32);
      const ndy = (y - cy) / (height * 0.32);
      
      // Draw smooth pulse waveform & diamond core
      const inDiamond = (Math.abs(ndx) + Math.abs(ndy)) <= 0.42;
      const inInnerDiamond = (Math.abs(ndx) + Math.abs(ndy)) <= 0.22;
      
      // Pulse waveform curve: y = 0.35 * sin(x * 6) * exp(-x^2)
      const waveY = Math.sin(ndx * 5.5) * 0.35 * Math.exp(-ndx * ndx * 2.2);
      const distToWave = Math.abs(ndy - waveY);
      const inWave = Math.abs(ndx) <= 0.85 && distToWave < 0.055;

      if (inInnerDiamond) {
        r = 255;
        g = 255;
        b = 255;
      } else if (inDiamond || inWave) {
        const glow = inDiamond ? 1.0 : (1.0 - distToWave / 0.055);
        r = Math.min(255, Math.round(200 + glow * 55));
        g = Math.min(255, Math.round(220 + glow * 35));
        b = 255;
      }

      rawData[pxOffset] = r;
      rawData[pxOffset + 1] = g;
      rawData[pxOffset + 2] = b;
      rawData[pxOffset + 3] = a;
    }
  }

  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;  // bit depth
  ihdr[9] = 6;  // color type RGBA
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace

  const compressedData = zlib.deflateSync(rawData);
  const idatChunk = makeChunk('IDAT', compressedData);
  const ihdrChunk = makeChunk('IHDR', ihdr);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

const publicDir = path.resolve('public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Generate 192x192 PNG
fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), createPng(192, 192, false));
// Generate 512x512 PNG
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), createPng(512, 512, false));
// Generate 512x512 Maskable PNG
fs.writeFileSync(path.join(publicDir, 'pwa-maskable-512x512.png'), createPng(512, 512, true));
// Generate 180x180 Apple Touch Icon PNG
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), createPng(180, 180, false));

// Generate vector SVG icon
const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="none">
  <rect width="512" height="512" rx="128" fill="#0A0A0C"/>
  <circle cx="256" cy="256" r="180" fill="url(#orb_gradient)" fill-opacity="0.25" filter="blur(20px)"/>
  <circle cx="256" cy="256" r="140" stroke="url(#border_glow)" stroke-width="3" stroke-dasharray="6 4" opacity="0.6"/>
  <path d="M120 256 H180 L210 180 L245 320 L275 220 L300 280 L330 256 H392" stroke="url(#pulse_gradient)" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/>
  <polygon points="256,196 286,256 256,316 226,256" fill="white" opacity="0.95"/>
  <circle cx="256" cy="256" r="14" fill="#38BDF8"/>
  <defs>
    <radialGradient id="orb_gradient" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#38BDF8"/>
      <stop offset="60%" stop-color="#3B82F6"/>
      <stop offset="100%" stop-color="#0A0A0C" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="border_glow" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#60A5FA"/>
      <stop offset="50%" stop-color="#A855F7"/>
      <stop offset="100%" stop-color="#38BDF8"/>
    </linearGradient>
    <linearGradient id="pulse_gradient" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#38BDF8"/>
      <stop offset="50%" stop-color="#FFFFFF"/>
      <stop offset="100%" stop-color="#818CF8"/>
    </linearGradient>
  </defs>
</svg>`;

fs.writeFileSync(path.join(publicDir, 'icon.svg'), svgContent, 'utf-8');
fs.writeFileSync(path.join(publicDir, 'favicon.svg'), svgContent, 'utf-8');

// Generate static manifest.json fallback
const manifestContent = {
  id: "/",
  name: "Pulse AI",
  short_name: "Pulse AI",
  description: "Pulse AI — Intelligent AI Assistant & Collaboration Workspace.",
  start_url: "/",
  scope: "/",
  display: "standalone",
  orientation: "portrait-primary",
  theme_color: "#0A0A0C",
  background_color: "#0A0A0C",
  categories: ["productivity", "utilities", "developer tools"],
  icons: [
    {
      src: "/pwa-192x192.png",
      sizes: "192x192",
      type: "image/png",
      purpose: "any"
    },
    {
      src: "/pwa-512x512.png",
      sizes: "512x512",
      type: "image/png",
      purpose: "any"
    },
    {
      src: "/pwa-maskable-512x512.png",
      sizes: "512x512",
      type: "image/png",
      purpose: "maskable"
    },
    {
      src: "/icon.svg",
      sizes: "any",
      type: "image/svg+xml",
      purpose: "any"
    }
  ]
};

fs.writeFileSync(path.join(publicDir, 'manifest.json'), JSON.stringify(manifestContent, null, 2), 'utf-8');
console.log('PWA icons and manifest created in public/');
