import sharp from 'sharp';

const BG = '#0c0d12';
const GREEN = '#4caf50';
const WHITE = '#f5f5f7';

// ── ÍCONE 1024x1024 ──────────────────────────────────────────
const iconSvg = `
<svg width="1024" height="1024" xmlns="http://www.w3.org/2000/svg">
  <!-- fundo -->
  <rect width="1024" height="1024" fill="${BG}"/>

  <!-- círculo verde centralizado -->
  <circle cx="512" cy="512" r="340" fill="${GREEN}" opacity="0.12"/>
  <circle cx="512" cy="512" r="260" fill="${GREEN}" opacity="0.18"/>

  <!-- seta de tendência de alta (gráfico simples) -->
  <polyline
    points="280,680 420,520 560,600 740,340"
    fill="none"
    stroke="${GREEN}"
    stroke-width="52"
    stroke-linecap="round"
    stroke-linejoin="round"
  />
  <!-- ponta da seta -->
  <polyline
    points="640,300 740,340 700,440"
    fill="none"
    stroke="${GREEN}"
    stroke-width="52"
    stroke-linecap="round"
    stroke-linejoin="round"
  />
</svg>`;

// ── SPLASH 1284x2778 (iPhone 14 Pro Max) ────────────────────
const splashSvg = `
<svg width="1284" height="2778" xmlns="http://www.w3.org/2000/svg">
  <!-- fundo -->
  <rect width="1284" height="2778" fill="${BG}"/>

  <!-- círculos decorativos sutis -->
  <circle cx="642" cy="1389" r="500" fill="${GREEN}" opacity="0.05"/>
  <circle cx="642" cy="1389" r="320" fill="${GREEN}" opacity="0.06"/>

  <!-- ícone mini centralizado -->
  <g transform="translate(392, 1139)">
    <polyline
      points="0,300 140,140 280,220 460,0"
      fill="none"
      stroke="${GREEN}"
      stroke-width="44"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
    <polyline
      points="360,-40 460,0 420,100"
      fill="none"
      stroke="${GREEN}"
      stroke-width="44"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
  </g>

  <!-- nome do app -->
  <text
    x="642" y="1620"
    text-anchor="middle"
    font-family="system-ui, -apple-system, sans-serif"
    font-size="72"
    font-weight="700"
    fill="${WHITE}"
    letter-spacing="-2"
  >Finanças</text>

  <!-- tagline -->
  <text
    x="642" y="1700"
    text-anchor="middle"
    font-family="system-ui, -apple-system, sans-serif"
    font-size="36"
    fill="#83899c"
    letter-spacing="1"
  >Controle seus gastos</text>
</svg>`;

await sharp(Buffer.from(iconSvg)).png().toFile('assets/icon.png');
console.log('✓ icon.png gerado');

await sharp(Buffer.from(splashSvg)).png().toFile('assets/splash-icon.png');
console.log('✓ splash-icon.png gerado');

// favicon 48x48
await sharp(Buffer.from(iconSvg)).resize(48, 48).png().toFile('assets/favicon.png');
console.log('✓ favicon.png gerado');
