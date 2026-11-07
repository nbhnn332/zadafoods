const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

function makeCrcTable() {
  let c;
  const table = [];
  for (let n = 0; n < 256; n++) {
    c = n;
    for (let k = 0; k < 8; k++) {
      c = ((c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1));
    }
    table[n] = c;
  }
  return table;
}
const crcTable = makeCrcTable();
function crc32(buf) {
  let crc = 0 ^ (-1);
  for (let i = 0; i < buf.length; i++) {
    crc = (crc >>> 8) ^ crcTable[(crc ^ buf[i]) & 0xFF];
  }
  return (crc ^ (-1)) >>> 0;
}

function makeChunk(type, data) {
  const len = data.length;
  const buf = Buffer.alloc(12 + len);
  buf.writeUInt32BE(len, 0);
  buf.write(type, 4, 4, 'ascii');
  data.copy(buf, 8);
  const typeAndData = buf.slice(4, 8 + len);
  const crc = crc32(typeAndData);
  buf.writeUInt32BE(crc, 8 + len);
  return buf;
}

function encodePng(width, height, rgbaBuffer) {
  const header = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // bit depth
  ihdrData[9] = 6; // color type RGBA
  ihdrData[10] = 0;
  ihdrData[11] = 0;
  ihdrData[12] = 0;
  const ihdrChunk = makeChunk('IHDR', ihdrData);

  const scanlineSize = 1 + width * 4;
  const rawData = Buffer.alloc(height * scanlineSize);
  for (let y = 0; y < height; y++) {
    const rawOffset = y * scanlineSize;
    rawData[rawOffset] = 0; // Filter None
    rgbaBuffer.copy(rawData, rawOffset + 1, y * width * 4, (y + 1) * width * 4);
  }

  const compressed = zlib.deflateSync(rawData, { level: 9 });
  const idatChunk = makeChunk('IDAT', compressed);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([header, ihdrChunk, idatChunk, iendChunk]);
}

function decodePng(buffer) {
  let pos = 8;
  const idatChunks = [];
  let width = 0, height = 0;
  while (pos < buffer.length) {
    const len = buffer.readUInt32BE(pos);
    const type = buffer.toString('ascii', pos + 4, pos + 8);
    if (type === 'IHDR') {
      width = buffer.readUInt32BE(pos + 8);
      height = buffer.readUInt32BE(pos + 12);
    } else if (type === 'IDAT') {
      idatChunks.push(buffer.slice(pos + 8, pos + 8 + len));
    }
    pos += 12 + len;
  }
  const raw = zlib.inflateSync(Buffer.concat(idatChunks));
  const uncompressed = Buffer.alloc(width * height * 4);

  let rawPos = 0;
  for (let y = 0; y < height; y++) {
    const filter = raw[rawPos++];
    const prevRowOffset = (y - 1) * width * 4;
    const currRowOffset = y * width * 4;

    for (let x = 0; x < width * 4; x++) {
      const val = raw[rawPos++];
      let prevVal = x >= 4 ? uncompressed[currRowOffset + x - 4] : 0;
      let upVal = y > 0 ? uncompressed[prevRowOffset + x] : 0;
      let upLeftVal = (y > 0 && x >= 4) ? uncompressed[prevRowOffset + x - 4] : 0;

      let res = 0;
      if (filter === 0) res = val;
      else if (filter === 1) res = (val + prevVal) & 0xff;
      else if (filter === 2) res = (val + upVal) & 0xff;
      else if (filter === 3) res = (val + Math.floor((prevVal + upVal) / 2)) & 0xff;
      else if (filter === 4) {
        const p = prevVal + upVal - upLeftVal;
        const pa = Math.abs(p - prevVal);
        const pb = Math.abs(p - upVal);
        const pc = Math.abs(p - upLeftVal);
        let pr;
        if (pa <= pb && pa <= pc) pr = prevVal;
        else if (pb <= pc) pr = upVal;
        else pr = upLeftVal;
        res = (val + pr) & 0xff;
      }
      uncompressed[currRowOffset + x] = res;
    }
  }
  return { width, height, rgba: uncompressed };
}

function process() {
  const src = fs.readFileSync(path.join('public', 'assets', 'brand-emblem-original.png'));
  const { width, height, rgba } = decodePng(src);
  console.log(`Original decoded: ${width}x${height}`);

  // Find tight bounding box of visible emblem
  let minX = width, maxX = 0, minY = height, maxY = 0;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const a = rgba[(y * width + x) * 4 + 3];
      if (a > 10) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  console.log(`Bounding box: minX=${minX}, maxX=${maxX}, minY=${minY}, maxY=${maxY}`);
  const cropW = maxX - minX + 1;
  const cropH = maxY - minY + 1;
  console.log(`Visible dimensions: ${cropW} x ${cropH}`);

  // Create a perfectly centered square version with 5% elegant breathing room
  const maxDim = Math.max(cropW, cropH);
  const padding = Math.round(maxDim * 0.05); // 5% padding
  const targetDim = maxDim + padding * 2;
  const targetBuffer = Buffer.alloc(targetDim * targetDim * 4, 0); // Transparent black

  const offsetX = Math.round((targetDim - cropW) / 2);
  const offsetY = Math.round((targetDim - cropH) / 2);

  for (let y = 0; y < cropH; y++) {
    const srcY = minY + y;
    for (let x = 0; x < cropW; x++) {
      const srcX = minX + x;
      const srcIdx = (srcY * width + srcX) * 4;
      const destIdx = ((offsetY + y) * targetDim + (offsetX + x)) * 4;
      rgba.copy(targetBuffer, destIdx, srcIdx, srcIdx + 4);
    }
  }

  const croppedPng = encodePng(targetDim, targetDim, targetBuffer);
  fs.writeFileSync(path.join('public', 'assets', 'brand-emblem.png'), croppedPng);
  fs.writeFileSync(path.join('public', 'assets', 'favicon.png'), croppedPng);
  fs.writeFileSync(path.join('public', 'favicon.ico'), croppedPng);
  console.log(`Saved brand-emblem.png (${targetDim}x${targetDim}, ${croppedPng.length} bytes)`);

  // Base64 encode for embedding inside SVG
  const emblemBase64 = `data:image/png;base64,${croppedPng.toString('base64')}`;

  // Generate public/assets/logo.svg with the official emblem and Playfair Display typography
  const logoSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 250 68" fill="none">
  <!-- Official ZaDa Golden Dome Emblem -->
  <g transform="translate(2, 4)">
    <image href="${emblemBase64}" x="0" y="0" width="60" height="60" preserveAspectRatio="xMidYMid meet" />
  </g>
  <!-- Brand Typography -->
  <g transform="translate(70, 0)">
    <!-- "ZaDa" Display Serif -->
    <text x="0" y="41" font-family="'Playfair Display', Georgia, 'Times New Roman', serif" font-size="36" font-weight="700" fill="#041914" letter-spacing="-0.5">ZaDa</text>
    <!-- "FOODS" Spaced Sans -->
    <text x="2" y="57" font-family="'Plus Jakarta Sans', system-ui, -apple-system, sans-serif" font-size="11.5" font-weight="700" fill="#A67732" letter-spacing="4.5">FOODS</text>
  </g>
</svg>
`;
  fs.writeFileSync(path.join('public', 'assets', 'logo.svg'), logoSvg);
  console.log('Saved public/assets/logo.svg');

  // Also generate a white/light variant for dark backgrounds like footer / admin dark sidebar
  const logoWhiteSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 250 68" fill="none">
  <!-- Official ZaDa Golden Dome Emblem -->
  <g transform="translate(2, 4)">
    <image href="${emblemBase64}" x="0" y="0" width="60" height="60" preserveAspectRatio="xMidYMid meet" />
  </g>
  <!-- Brand Typography for Dark Backgrounds -->
  <g transform="translate(70, 0)">
    <!-- "ZaDa" Serif Display in Warm Ivory -->
    <text x="0" y="41" font-family="'Playfair Display', Georgia, 'Times New Roman', serif" font-size="36" font-weight="700" fill="#FAF7F2" letter-spacing="-0.5">ZaDa</text>
    <!-- "FOODS" Spaced Sans-serif in Warm Gold -->
    <text x="2" y="57" font-family="'Plus Jakarta Sans', system-ui, -apple-system, sans-serif" font-size="11.5" font-weight="700" fill="#A67732" letter-spacing="4.5">FOODS</text>
  </g>
</svg>
`;
  fs.writeFileSync(path.join('public', 'assets', 'logo-white.svg'), logoWhiteSvg);
  console.log('Saved public/assets/logo-white.svg');
}

process();
