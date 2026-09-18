const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');
const OUT_DIR = path.join(ROOT, 'exports');
const OUT_FILE = path.join(OUT_DIR, 'Hashcod-10000-code-pricing.pdf');

const FAMILY_BASE = {
  'PQC-KEM': 34,
  'PQC-SIG': 36,
  'HASH-SIG': 31,
  HPKE: 29,
  ZK: 42,
  MPC: 44,
  FHE: 58,
  THRESH: 38,
  VDF: 33,
  VRF: 35,
  'AEAD-LW': 24,
  XOF: 19,
  KDF: 18,
  MAC: 17,
  PAKE: 30,
  ACCUM: 32,
  IBE: 37,
  ABE: 41,
  RING: 34,
  BLIND: 35,
};

const CATEGORY_BASE = {
  symmetric: 10,
  hashes: 8,
  mac: 12,
  kdf: 14,
  passwords: 10,
  asymmetric: 28,
  signatures: 30,
  tokens: 12,
  ids: 7,
  pqc: 46,
  advanced_codes_100: 25,
  advanced_codes_200: 32,
  neo_crypto_200: 52,
  apex_crypto_300: 58,
  hashcod_advanced_8282: 26,
};

const ascii = (value) => String(value ?? '')
  .normalize('NFKD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/[^\x20-\x7E]/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();

const loadCatalog = () => {
  const context = { window: {}, console };
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(path.join(ROOT, 'data', 'icons.js'), 'utf8'), context);
  vm.runInContext(fs.readFileSync(path.join(ROOT, 'data', 'catalog.js'), 'utf8'), context);
  return context.window.OCG_CATALOG || [];
};

const entropyBits = (entropy = '') => {
  const match = String(entropy).match(/(\d+(?:\.\d+)?)\s*bits/i);
  return match ? Number(match[1]) : 128;
};

const familyFromType = (type) => {
  const label = `${type.originalLabel || type.label || ''} ${type.id || ''} ${type.engine || ''}`;
  const hc = label.match(/\bHC-([A-Z0-9-]+)-/);
  if (hc) return hc[1];
  if (/AES|ChaCha|Salsa|Serpent|Twofish|SM4|GOST|Kuznyechik|Magma|Blowfish/i.test(label)) return 'SYMMETRIC';
  if (/SHA|BLAKE|Keccak|RIPEMD|Whirlpool|Hash/i.test(label)) return 'HASH';
  if (/JWT|Token|License|QR|TOTP|UUID|ULID|Nonce/i.test(label)) return 'TOKEN';
  if (/RSA|ECDSA|EdDSA|Dilithium|Kyber|Falcon|SPHINCS|ML-/i.test(label)) return 'ASYMMETRIC';
  return 'GENERAL';
};

const levelPremium = (type) => {
  const text = `${type.label || ''} ${type.originalLabel || ''} ${type.entropy || ''} ${type.space || ''}`;
  if (/L5|512|896|832/i.test(text)) return 1.95;
  if (/L3|384|800|768/i.test(text)) return 1.55;
  if (/256|704|640/i.test(text)) return 1.25;
  if (/192/i.test(text)) return 1.12;
  if (/128|L1/i.test(text)) return 1.0;
  return 1.08;
};

const standardPremium = (type) => {
  const text = `${type.std || ''} ${type.engine || ''} ${type.about || ''}`;
  if (/deprecated|broken|legacy interop only/i.test(text)) return 0.62;
  if (/NIST|FIPS|RFC|ISO|SP 800|IETF|W3C|IEEE/i.test(text)) return 1.22;
  if (/post-quantum|zero-knowledge|homomorphic|threshold|identity-based|attribute-based/i.test(text)) return 1.38;
  if (/Hashcod/i.test(text)) return 1.16;
  return 1.0;
};

const rarityPremium = (index, categoryId) => {
  if (categoryId === 'hashcod_advanced_8282') return 1 + ((index % 37) / 100);
  if (/neo|apex|advanced/i.test(categoryId)) return 1.28 + ((index % 19) / 100);
  return 1 + ((index % 11) / 100);
};

const complexityUnits = (type) => {
  const text = `${type.engine || ''} ${type.about || ''} ${type.std || ''}`;
  let score = 1;
  if (/HMAC|signature|firma|signed|binding/i.test(text)) score += 0.35;
  if (/nonce|salt|payload|route|checksum/i.test(text)) score += 0.3;
  if (/SHA-512|SHA3|SHA-3|BLAKE3/i.test(text)) score += 0.2;
  if (/post-quantum|zero-knowledge|homomorphic|multipartita|threshold/i.test(text)) score += 0.8;
  return score;
};

const priceFor = (row) => {
  const family = familyFromType(row.type);
  const catBase = CATEGORY_BASE[row.category.id] || 14;
  const familyBase = FAMILY_BASE[family] || catBase;
  const bits = entropyBits(row.type.entropy);
  const entropyFactor = Math.max(0.85, Math.min(2.4, Math.log2(Math.max(bits, 64)) / 8));
  const tenPack = familyBase
    * levelPremium(row.type)
    * standardPremium(row.type)
    * rarityPremium(row.globalIndex, row.category.id)
    * complexityUnits(row.type)
    * entropyFactor;
  const roundedTen = Math.max(1, Math.round(tenPack));
  return {
    family,
    per10: roundedTen,
    each: Number((roundedTen / 10).toFixed(2)),
  };
};

const rowsFromCatalog = (catalog) => {
  let n = 0;
  return catalog.flatMap((category) => (category.types || []).map((type) => {
    n += 1;
    const price = priceFor({ category, type, globalIndex: n });
    return {
      index: n,
      category: ascii(category.label || category.id),
      name: ascii(type.label || type.id),
      family: price.family,
      entropy: ascii(type.entropy || '-'),
      standard: ascii(type.std || '-'),
      per10: price.per10,
      each: price.each,
    };
  }));
};

const money = (amount) => `${Number(amount).toLocaleString('en-US', { minimumFractionDigits: amount % 1 ? 2 : 0, maximumFractionDigits: 2 })} USD`;

const pdfEscape = (text) => ascii(text).replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');

const line = (x, y, text, size = 8, font = 'F2') =>
  `BT /${font} ${size} Tf ${x} ${y} Td (${pdfEscape(text)}) Tj ET\n`;

const drawHashcodLogo = (x, y, size = 28) => {
  const s = size;
  const stroke = Math.max(1.6, s * 0.095);
  const left = x + s * 0.04;
  const right = x + s * 0.96;
  const top = y + s * 0.88;
  const bottom = y + s * 0.34;
  const radius = s * 0.12;
  const triTop = y + s * 0.5;
  return [
    'q',
    '0 0 0 RG 0 0 0 rg',
    '1 J',
    `${stroke.toFixed(2)} w`,
    `${left.toFixed(2)} ${bottom.toFixed(2)} m`,
    `${left.toFixed(2)} ${(top - radius).toFixed(2)} l`,
    `${left.toFixed(2)} ${top.toFixed(2)} ${(left + radius).toFixed(2)} ${top.toFixed(2)} ${(left + radius).toFixed(2)} ${top.toFixed(2)} c`,
    `${(right - radius).toFixed(2)} ${top.toFixed(2)} l`,
    `${right.toFixed(2)} ${top.toFixed(2)} ${right.toFixed(2)} ${(top - radius).toFixed(2)} ${right.toFixed(2)} ${(top - radius).toFixed(2)} c`,
    `${right.toFixed(2)} ${bottom.toFixed(2)} l`,
    'S',
    `${(x + s * 0.5).toFixed(2)} ${triTop.toFixed(2)} m`,
    `${(x + s * 0.25).toFixed(2)} ${(y + s * 0.02).toFixed(2)} l`,
    `${(x + s * 0.75).toFixed(2)} ${(y + s * 0.02).toFixed(2)} l`,
    'h f',
    'Q',
    '',
  ].join('\n');
};

const drawHeader = (pageNo, totalPages) => {
  let s = '';
  s += drawHashcodLogo(34, 556, 28);
  s += line(72, 564, 'Hashcod', 18, 'F1');
  s += line(162, 568, 'Cryptographic Code Pricing Catalog', 11, 'F2');
  s += line(724, 568, `Page ${pageNo}/${totalPages}`, 8, 'F2');
  s += '0.75 w 34 552 m 808 552 l S\n';
  return s;
};

const makeIntroPage = (totalRows, totalPages) => {
  let s = drawHeader(1, totalPages);
  s += line(34, 526, 'Pricing algorithm detected and applied', 20, 'F1');
  s += line(34, 500, 'Formula: price_10 = base_family x security_level x standard_premium x rarity x complexity x entropy_factor.', 9, 'F2');
  s += line(34, 482, 'Base family: symmetric/hash/token families are lower; PQC, ZK, MPC, FHE, ABE and advanced Hashcod profiles are higher.', 9, 'F2');
  s += line(34, 464, 'Security level: 128/192/256-bit, L1/L3/L5 and 640-896-bit metadata raise or lower the pack price.', 9, 'F2');
  s += line(34, 446, 'Standard premium: NIST/FIPS/RFC/ISO and signed/verified profiles get higher confidence value; deprecated legacy items are discounted.', 9, 'F2');
  s += line(34, 428, 'Rarity and complexity: uncommon families, HMAC binding, salt/nonce, routes, signatures and post-quantum functions increase price.', 9, 'F2');
  s += line(34, 400, `Total priced codes: ${totalRows.toLocaleString('en-US')}. Currency: USD. Unit: price per single code and per pack of 10 codes.`, 10, 'F1');
  s += line(34, 374, 'This catalog is a product-pricing model for Hashcod services. It is not a market quote, legal valuation, or financial advice.', 9, 'F2');
  s += line(34, 338, 'Columns', 13, 'F1');
  s += line(54, 316, 'IDX: global code number in the 10,000-code catalog.', 9, 'F2');
  s += line(54, 298, 'CODE: Hashcod variant or primitive name.', 9, 'F2');
  s += line(54, 280, 'FAMILY: detected cryptographic pricing family.', 9, 'F2');
  s += line(54, 262, 'ENTROPY/STANDARD: metadata used by the pricing algorithm.', 9, 'F2');
  s += line(54, 244, '1 CODE / 10 CODES: suggested service price.', 9, 'F2');
  return s;
};

const chunkText = (value, max) => {
  const text = ascii(value);
  return text.length > max ? `${text.slice(0, max - 1)}...` : text;
};

const makeRowsPage = (items, pageNo, totalPages) => {
  let s = drawHeader(pageNo, totalPages);
  s += line(34, 536, 'IDX', 8, 'F1');
  s += line(72, 536, 'CODE', 8, 'F1');
  s += line(372, 536, 'FAMILY', 8, 'F1');
  s += line(474, 536, 'ENTROPY', 8, 'F1');
  s += line(552, 536, 'STANDARD', 8, 'F1');
  s += line(666, 536, '1 CODE', 8, 'F1');
  s += line(736, 536, '10 CODES', 8, 'F1');
  s += '0.5 w 34 526 m 808 526 l S\n';
  let y = 512;
  for (const row of items) {
    s += line(34, y, String(row.index).padStart(5, '0'), 7.4, 'F2');
    s += line(72, y, chunkText(row.name, 58), 7.4, 'F2');
    s += line(372, y, chunkText(row.family, 18), 7.4, 'F2');
    s += line(474, y, chunkText(row.entropy, 12), 7.4, 'F2');
    s += line(552, y, chunkText(row.standard, 18), 7.4, 'F2');
    s += line(666, y, money(row.each), 7.4, 'F2');
    s += line(736, y, money(row.per10), 7.4, 'F2');
    y -= 12;
  }
  return s;
};

const buildPdf = (pages) => {
  const objects = [];
  const add = (body) => {
    objects.push(body);
    return objects.length;
  };
  const font1 = add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>');
  const font2 = add('<< /Type /Font /Subtype /Type1 /BaseFont /Courier >>');
  const pageIds = [];
  const contentIds = [];
  for (const page of pages) {
    const stream = `<< /Length ${Buffer.byteLength(page, 'utf8')} >>\nstream\n${page}endstream`;
    contentIds.push(add(stream));
  }
  const pagesIdPlaceholder = 'PAGES_ID';
  for (const contentId of contentIds) {
    pageIds.push(add(`<< /Type /Page /Parent ${pagesIdPlaceholder} 0 R /MediaBox [0 0 842 595] /Resources << /Font << /F1 ${font1} 0 R /F2 ${font2} 0 R >> >> /Contents ${contentId} 0 R >>`));
  }
  const pagesId = add(`<< /Type /Pages /Count ${pageIds.length} /Kids [${pageIds.map(id => `${id} 0 R`).join(' ')}] >>`);
  const catalogId = add(`<< /Type /Catalog /Pages ${pagesId} 0 R >>`);

  const chunks = ['%PDF-1.4\n'];
  const offsets = [0];
  objects.forEach((body, index) => {
    offsets.push(Buffer.byteLength(chunks.join(''), 'utf8'));
    chunks.push(`${index + 1} 0 obj\n${String(body).replaceAll(pagesIdPlaceholder, String(pagesId))}\nendobj\n`);
  });
  const xrefOffset = Buffer.byteLength(chunks.join(''), 'utf8');
  chunks.push(`xref\n0 ${objects.length + 1}\n`);
  chunks.push('0000000000 65535 f \n');
  for (let i = 1; i < offsets.length; i += 1) chunks.push(`${String(offsets[i]).padStart(10, '0')} 00000 n \n`);
  chunks.push(`trailer\n<< /Size ${objects.length + 1} /Root ${catalogId} 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`);
  return Buffer.from(chunks.join(''), 'utf8');
};

const main = () => {
  const rows = rowsFromCatalog(loadCatalog());
  const perPage = 39;
  const rowPages = Math.ceil(rows.length / perPage);
  const totalPages = rowPages + 1;
  const pages = [makeIntroPage(rows.length, totalPages)];
  for (let i = 0; i < rowPages; i += 1) {
    pages.push(makeRowsPage(rows.slice(i * perPage, (i + 1) * perPage), i + 2, totalPages));
  }
  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(OUT_FILE, buildPdf(pages));
  console.log(`Wrote ${OUT_FILE}`);
  console.log(`Rows: ${rows.length}`);
};

main();
