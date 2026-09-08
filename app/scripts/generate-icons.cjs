// Genera le icone PWA (192x192, 512x512) come PNG grezzi, senza dipendenze
// esterne: un quadrato blu brand con una "carta" bianca stilizzata al centro.
// Rieseguire con `node scripts/generate-icons.cjs` se si cambia il logo.
const fs = require('fs')
const path = require('path')
const zlib = require('zlib')

function crc32(buf) {
  let c
  const table = crc32.table || (crc32.table = (() => {
    const t = new Uint32Array(256)
    for (let n = 0; n < 256; n++) {
      c = n
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
      t[n] = c >>> 0
    }
    return t
  })())
  c = 0xffffffff
  for (let i = 0; i < buf.length; i++) c = table[(c ^ buf[i]) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

function chunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii')
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length, 0)
  const crcBuf = Buffer.alloc(4)
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0)
  return Buffer.concat([len, typeBuf, data, crcBuf])
}

function encodePNG(width, height, rgbPixels) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(width, 0)
  ihdr.writeUInt32BE(height, 4)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 2 // color type: RGB
  ihdr[10] = 0
  ihdr[11] = 0
  ihdr[12] = 0

  const stride = width * 3
  const raw = Buffer.alloc((stride + 1) * height)
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0 // filter: none
    rgbPixels.copy(raw, y * (stride + 1) + 1, y * stride, y * stride + stride)
  }
  const idat = zlib.deflateSync(raw, { level: 9 })

  return Buffer.concat([
    sig,
    chunk('IHDR', ihdr),
    chunk('IDAT', idat),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

function drawIcon(size) {
  const px = Buffer.alloc(size * size * 3)
  const bg = [37, 99, 235] // brand-600
  const fg = [255, 255, 255]
  const accent = [147, 197, 253] // brand-300-ish stripe

  const cardW = size * 0.62
  const cardH = size * 0.42
  const cardX = (size - cardW) / 2
  const cardY = (size - cardH) / 2
  const radius = size * 0.06
  const stripeY = cardY + cardH * 0.32
  const stripeH = cardH * 0.16

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let color = bg
      const inCardX = x >= cardX && x <= cardX + cardW
      const inCardY = y >= cardY && y <= cardY + cardH
      if (inCardX && inCardY) {
        // rounded corners: skip corner pixels outside the radius
        const nearLeft = x < cardX + radius
        const nearRight = x > cardX + cardW - radius
        const nearTop = y < cardY + radius
        const nearBottom = y > cardY + cardH - radius
        let corner = false
        let dx = 0
        let dy = 0
        if (nearLeft && nearTop) { dx = x - (cardX + radius); dy = y - (cardY + radius); corner = true }
        else if (nearRight && nearTop) { dx = x - (cardX + cardW - radius); dy = y - (cardY + radius); corner = true }
        else if (nearLeft && nearBottom) { dx = x - (cardX + radius); dy = y - (cardY + cardH - radius); corner = true }
        else if (nearRight && nearBottom) { dx = x - (cardX + cardW - radius); dy = y - (cardY + cardH - radius); corner = true }
        if (corner && dx * dx + dy * dy > radius * radius) {
          color = bg
        } else if (y >= stripeY && y <= stripeY + stripeH) {
          color = accent
        } else {
          color = fg
        }
      }
      const i = (y * size + x) * 3
      px[i] = color[0]
      px[i + 1] = color[1]
      px[i + 2] = color[2]
    }
  }
  return px
}

const outDir = path.join(__dirname, '..', 'public', 'icons')
fs.mkdirSync(outDir, { recursive: true })
for (const size of [192, 512]) {
  const png = encodePNG(size, size, drawIcon(size))
  fs.writeFileSync(path.join(outDir, `icon-${size}.png`), png)
  console.log(`wrote icon-${size}.png (${png.length} bytes)`)
}
