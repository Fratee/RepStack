import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0f172a" />
      <stop offset="50%" stop-color="#020617" />
      <stop offset="100%" stop-color="#090d16" />
    </linearGradient>
    <linearGradient id="accent" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#10b981" />
      <stop offset="50%" stop-color="#06b6d4" />
      <stop offset="100%" stop-color="#3b82f6" />
    </linearGradient>
    <linearGradient id="glow" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#34d399" stop-opacity="0.8" />
      <stop offset="100%" stop-color="#06b6d4" stop-opacity="0.2" />
    </linearGradient>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="12" stdDeviation="16" flood-color="#06b6d4" flood-opacity="0.35"/>
    </filter>
  </defs>

  <!-- Background rounded rect -->
  <rect width="512" height="512" rx="112" fill="url(#bg)"/>
  
  <!-- Subtle border -->
  <rect width="508" height="508" x="2" y="2" rx="110" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="4"/>

  <!-- Glowing outer circle representing timer -->
  <circle cx="256" cy="256" r="176" fill="none" stroke="#1e293b" stroke-width="20" stroke-linecap="round"/>
  <!-- Active timer arc -->
  <circle cx="256" cy="256" r="176" fill="none" stroke="url(#accent)" stroke-width="20" 
    stroke-dasharray="1105" stroke-dashoffset="320" stroke-linecap="round" filter="url(#shadow)"/>

  <!-- Dumbbell Icon centered -->
  <g transform="translate(136, 176)" fill="url(#accent)">
    <!-- Left Weight -->
    <rect x="0" y="40" width="22" height="80" rx="8" />
    <rect x="26" y="25" width="26" height="110" rx="8" />
    
    <!-- Central Bar -->
    <rect x="52" y="70" width="136" height="20" rx="6" fill="#e2e8f0" />
    <!-- Bar grips -->
    <rect x="95" y="66" width="50" height="28" rx="4" fill="url(#accent)" opacity="0.9" />

    <!-- Right Weight -->
    <rect x="188" y="25" width="26" height="110" rx="8" />
    <rect x="218" y="40" width="22" height="80" rx="8" />
  </g>

  <!-- Small lightning/stopwatch tick badge at top -->
  <circle cx="256" cy="80" r="18" fill="#10b981" />
  <circle cx="256" cy="80" r="9" fill="#020617" />
</svg>`;

const publicDir = path.resolve('public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

fs.writeFileSync(path.join(publicDir, 'icon.svg'), svg);

const sizes = [
  { file: 'icon-192.png', size: 192 },
  { file: 'icon-512.png', size: 512 },
  { file: 'icon-maskable-192.png', size: 192 },
  { file: 'icon-maskable-512.png', size: 512 },
  { file: 'apple-touch-icon.png', size: 180 },
  { file: 'favicon.png', size: 64 },
  { file: 'badge-72.png', size: 72 },
];

async function run() {
  const svgBuffer = Buffer.from(svg);
  for (const { file, size } of sizes) {
    await sharp(svgBuffer)
      .resize(size, size)
      .png()
      .toFile(path.join(publicDir, file));
    console.log(`Generated ${file} (${size}x${size})`);
  }
}

run().catch(console.error);

