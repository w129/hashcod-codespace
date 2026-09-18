const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');
const OUT_DIR = path.join(ROOT, 'exports');
const OUT_FILE = path.join(OUT_DIR, 'Hashcod-tools-pricing-and-code-differences.pdf');

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

const TOOL_GROUPS = [
  ['Core operations', [
    ['Generator Engine', 'Genera lotes de codes criptograficos con metadatos, salida y checks.', 'production', ['all']],
    ['Database Vault', 'Guarda, busca y reutiliza codes copiados en la plataforma.', 'vault', ['tokens', 'hashes', 'symmetric']],
    ['QR Vault', 'Convierte codes en QR verificables, paquetes y payloads transportables.', 'transport', ['tokens', 'ids', 'mac']],
    ['Export Suite', 'Descarga TXT, JSON, CSV, YAML, ISO, ZIP, OCG.PACK, PNG y reportes.', 'export', ['all']],
    ['Code GUI / CMD', 'Editor y consola especializada para estudiar y transformar un code generado.', 'analysis', ['all']],
  ]],
  ['Document, identity and evidence', [
    ['Certificates', 'Certificados con ID, hash, QR, titular, estado y notas.', 'certificate', ['signatures', 'hashes']],
    ['Evidence Vault', 'Expediente digital con SHA-256, timestamp, firma y QR de verificacion.', 'evidence', ['hashes', 'signatures']],
    ['Ivory DID', 'Documentacion DID, identidad, formularios y clausulas verificables.', 'identity', ['ids', 'tokens']],
    ['Sequence - A', 'Notas encadenadas con indices y formulas sobre codes guardados.', 'document', ['hashes', 'ids']],
    ['Ticket Forge', 'Tickets descargables en YAML, PNG y JPG con parametros y code asociado.', 'ticket', ['tokens', 'mac']],
    ['TicketGuard', 'Tickets verificables con QR, estado, firma e historial.', 'ticket', ['tokens', 'signatures']],
  ]],
  ['Labs and advanced crypto', [
    ['BASEMAT', 'Herramientas matematicas: entropia, colisiones, Shamir, Merkle, lattice y primos.', 'lab', ['pqc', 'hashes']],
    ['LWE Lattice Lab', 'Laboratorio post-cuantico con b = A*s + e mod q.', 'lab', ['pqc']],
    ['Pivot Kernel Crypto Lab', 'Analisis visual y estadistico de patrones, picos, bandas y riesgo.', 'analysis', ['all']],
    ['Graph Lab', 'Graficadora matematica con simbolos, texto, PDF y PNG.', 'lab', ['basemat']],
    ['Derivatives Lab', 'Deriva hasta miles de variantes desde codes guardados usando dominios y salt.', 'derivation', ['kdf', 'mac', 'hashes']],
    ['Container Port', 'Organiza codes en cajas de 10 y contenedores de 100 cajas con IH HMAC-SHA3.', 'container', ['all']],
    ['Crypto AI', 'Chat de IA para revisar, explicar y mejorar codes segun proveedor API.', 'ai', ['all']],
  ]],
  ['Security suite', [
    ['Hashcod Token Inspector', 'Analiza JWT, API keys, licencias, QR payloads, seriales y sesiones.', 'security', ['tokens']],
    ['Hashcod License Shield', 'Crea y verifica licencias firmadas por usuario, dispositivo y expiracion.', 'security', ['signatures', 'tokens']],
    ['Hashcod Secure Tab', 'Reemplaza secretos de codigo por referencias a vault.', 'security', ['tokens', 'vault']],
    ['Hashcod Secret Scanner', 'Detecta API keys, JWT, private keys, passwords, .env y DB URLs.', 'security', ['tokens']],
    ['Hashcod QR Verifier', 'Valida QR con digest, estado, timestamp e historial.', 'security', ['ids', 'hashes']],
    ['Hashcod Code Fingerprint', 'Huella digital de proyectos por archivos, hashes y cambios.', 'security', ['hashes']],
    ['Hashcod Crypto Benchmark Lab', 'Compara SHA, AES, ChaCha20, CSPRNG, UUID, JWT y datos repetitivos.', 'security', ['all']],
    ['Hashcod Password Entropy Lab', 'Mide entropia y patrones de contrasenas sin guardarlas.', 'security', ['passwords']],
    ['Hashcod File Integrity Monitor', 'Snapshots de archivos y alertas por cambios SHA-256.', 'security', ['hashes']],
    ['Hashcod API Trust Score', 'Evalua HTTPS, CORS, headers, URLs y rate-limit visible.', 'security', ['api']],
    ['Hashcod Report Verifier', 'Verifica reportes por ID, digest, QR y autenticidad.', 'security', ['signatures', 'hashes']],
    ['Hashcod Developer Vault', 'Guarda secretos cifrados localmente con AES-GCM y passphrase.', 'security', ['vault', 'symmetric']],
    ['Hashcod Risk Engine', 'Motor comun de risk score, entropia, patrones, cloud score y veredicto.', 'security', ['all']],
  ]],
  ['Platform systems', [
    ['Zero Trust Access', 'Gate previo con clave, WebCrypto, manifiesto firmado, threat score y audit chain.', 'access', ['tokens', 'mac']],
    ['HNS', 'Hash Name System para nombres hns:// y referencias a codes.', 'network', ['ids', 'tokens']],
    ['HNS Browser', 'Browser CLI/GUI para abrir hns://, resolver routes y enviar al Phone OS.', 'network', ['tokens', 'ids']],
    ['HOS', 'Hash Operative System para control y rutas hacia phone gateway.', 'network', ['tokens']],
    ['HCP', 'Hash Command Prompting para comandos y patrones ocultos de control.', 'network', ['tokens']],
    ['Phone OS Link', 'Sincroniza PC y telefono para notificaciones, SMS y browser de codes.', 'network', ['tokens', 'qr']],
    ['Hashcod Law / Anti-fraud', 'Capa de validacion, auditoria y controles antifraude para descargas y generacion.', 'governance', ['all']],
    ['License Factory 400', 'Crea 400 plantillas de licencias Hashcod para uso comercial.', 'license', ['signatures', 'tokens']],
    ['Launch Center', 'Checklist comercial, seguridad, legal, produccion y salida al mercado.', 'business', ['all']],
  ]],
  ['Editors and utilities', [
    ['Text Lab', 'Editor de texto, exportacion, estadisticas y preparacion de payloads.', 'utility', ['text', 'tokens']],
    ['Drive Lab', 'Disco virtual para archivos y manifiestos.', 'utility', ['container', 'hashes']],
    ['P - ANDORA', 'Hojas y tablas para organizar formulas, celdas y codes.', 'utility', ['ids']],
    ['Desk', 'Escritorio interno para slots, notas y modulos.', 'utility', ['all']],
    ['OSDG - REST', 'Herramienta REST y cifrado para flujos externos.', 'utility', ['api', 'tokens']],
    ['Markdown Desk', 'Editor Markdown con preview y exportacion.', 'utility', ['document']],
    ['OCG Units', 'Unidades internas y billetes digitales privados.', 'utility', ['ids', 'tokens']],
    ['Format Forge', 'Crea formatos nuevos, validadores, regex, specs y muestras.', 'utility', ['all']],
    ['Token Vault Pro', 'Vault especializado para tokens y artefactos de acceso.', 'utility', ['tokens']],
    ['API Key Manager', 'Gestiona API keys y webhooks internos.', 'utility', ['api', 'tokens']],
    ['Tokenization Studio', 'Estudio para convertir datos y archivos en artefactos tokenizados.', 'utility', ['tokens', 'files']],
    ['Universal File Viewer', 'Visualizador de archivos: texto, imagen, audio, video, PDF, JSON y hex.', 'utility', ['files', 'hashes']],
    ['Cryptographic IDE', 'IDE adaptado a criptografia con consola, plantillas y analisis.', 'utility', ['all']],
    ['Code Library', 'Biblioteca de los 10,000 codes, uso, aplicacion y diferencias.', 'utility', ['all']],
    ['User Lounge', 'Sala de estar con juegos pixelados y retencion de usuario.', 'utility', ['none']],
  ]],
];

const PRICE_RULES = {
  production: [149, 899, 0.18],
  vault: [79, 499, 0.08],
  transport: [69, 399, 0.06],
  export: [49, 299, 0.04],
  analysis: [129, 799, 0.16],
  certificate: [119, 699, 1.8],
  evidence: [169, 999, 2.25],
  identity: [109, 599, 1.4],
  document: [49, 249, 0.07],
  ticket: [99, 649, 0.12],
  lab: [159, 999, 0.14],
  derivation: [139, 849, 0.1],
  container: [189, 1200, 0.09],
  ai: [199, 1299, 0.25],
  security: [179, 1200, 0.2],
  access: [149, 950, 0.05],
  network: [159, 999, 0.08],
  governance: [249, 1800, 0.15],
  license: [199, 1400, 0.18],
  business: [149, 900, 0.03],
  utility: [59, 349, 0.06],
};

const CATEGORY_CODE_VALUE = {
  all: 8.8,
  symmetric: 2.7,
  hashes: 2.1,
  mac: 3.1,
  kdf: 3.4,
  passwords: 1.9,
  tokens: 3.6,
  ids: 1.4,
  pqc: 8.7,
  signatures: 7.9,
  vault: 4.3,
  qr: 2.5,
  api: 4.2,
  files: 2.2,
  text: 1.1,
  basemat: 5.8,
  container: 4.9,
  document: 1.8,
  none: 0,
};

const toolRows = () => {
  let index = 0;
  return TOOL_GROUPS.flatMap(([group, tools]) => tools.map(([name, purpose, kind, related]) => {
    index += 1;
    const [monthly, setup, perAction] = PRICE_RULES[kind] || PRICE_RULES.utility;
    const codeEquivalent = related.reduce((sum, key) => sum + (CATEGORY_CODE_VALUE[key] || CATEGORY_CODE_VALUE.all), 0) / Math.max(1, related.length);
    const weighted = Math.round((monthly + setup / 6 + codeEquivalent * 28) * (1 + (index % 9) / 100));
    return {
      index,
      group,
      name,
      kind,
      purpose,
      related: related.join(', '),
      monthly,
      setup,
      perAction,
      codeEquivalent: Number(codeEquivalent.toFixed(2)),
      suggested: weighted,
      difference: codeEquivalent === 0
        ? 'Herramienta de experiencia; no reemplaza un code criptografico.'
        : 'La herramienta opera, verifica o monetiza muchos codes; el code es una unidad criptografica individual.',
    };
  }));
};

const catalogSummary = () => {
  const catalog = loadCatalog();
  const total = catalog.reduce((sum, category) => sum + (category.types || []).length, 0);
  return catalog.map(category => ({
    category: ascii(category.label || category.id),
    id: category.id,
    count: (category.types || []).length,
    difference: 'Code price = valor de material criptografico individual. Tool price = software, flujo, automatizacion, verificacion y soporte.',
  })).concat([{ category: 'TOTAL', id: 'all', count: total, difference: '10,000 codes disponibles para ser usados por las herramientas.' }]);
};

const money = (amount) => `${Number(amount).toLocaleString('en-US', { minimumFractionDigits: amount % 1 ? 2 : 0, maximumFractionDigits: 2 })} USD`;
const pdfEscape = (text) => ascii(text).replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
const line = (x, y, text, size = 8, font = 'F2') => `BT /${font} ${size} Tf ${x} ${y} Td (${pdfEscape(text)}) Tj ET\n`;

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
    'q', '0 0 0 RG 0 0 0 rg', '1 J', `${stroke.toFixed(2)} w`,
    `${left.toFixed(2)} ${bottom.toFixed(2)} m`,
    `${left.toFixed(2)} ${(top - radius).toFixed(2)} l`,
    `${left.toFixed(2)} ${top.toFixed(2)} ${(left + radius).toFixed(2)} ${top.toFixed(2)} ${(left + radius).toFixed(2)} ${top.toFixed(2)} c`,
    `${(right - radius).toFixed(2)} ${top.toFixed(2)} l`,
    `${right.toFixed(2)} ${top.toFixed(2)} ${right.toFixed(2)} ${(top - radius).toFixed(2)} ${right.toFixed(2)} ${(top - radius).toFixed(2)} c`,
    `${right.toFixed(2)} ${bottom.toFixed(2)} l`, 'S',
    `${(x + s * 0.5).toFixed(2)} ${triTop.toFixed(2)} m`,
    `${(x + s * 0.25).toFixed(2)} ${(y + s * 0.02).toFixed(2)} l`,
    `${(x + s * 0.75).toFixed(2)} ${(y + s * 0.02).toFixed(2)} l`,
    'h f', 'Q', '',
  ].join('\n');
};

const header = (pageNo, totalPages) => {
  let s = drawHashcodLogo(34, 556, 28);
  s += line(72, 564, 'Hashcod', 18, 'F1');
  s += line(162, 568, 'Tools Pricing + Code Difference Catalog', 11, 'F2');
  s += line(724, 568, `Page ${pageNo}/${totalPages}`, 8, 'F2');
  s += '0.75 w 34 552 m 808 552 l S\n';
  return s;
};

const chunk = (value, max) => {
  const text = ascii(value);
  return text.length > max ? `${text.slice(0, max - 1)}...` : text;
};

const introPage = (toolCount, codeCount, totalPages) => {
  let s = header(1, totalPages);
  s += line(34, 526, 'Pricing algorithm for Hashcod tools', 20, 'F1');
  s += line(34, 500, 'Formula: suggested_tool_price = monthly + setup/6 + related_code_value x 28 + small rarity modifier.', 9, 'F2');
  s += line(34, 482, 'Tool prices are software/service prices. Code prices are per cryptographic unit or per 10-code pack.', 9, 'F2');
  s += line(34, 464, 'The difference column explains whether a tool creates, verifies, transports, stores, analyzes or monetizes codes.', 9, 'F2');
  s += line(34, 438, `Tools priced: ${toolCount}. Cryptographic codes referenced: ${codeCount.toLocaleString('en-US')}. Currency: USD.`, 11, 'F1');
  s += line(34, 406, 'Recommended commercial packaging', 14, 'F1');
  s += line(54, 382, 'Starter service: utility/export/database tools for small code workflows.', 9, 'F2');
  s += line(54, 364, 'Professional service: certificates, evidence, security suite and analysis labs.', 9, 'F2');
  s += line(54, 346, 'Enterprise service: Zero Trust, Law engine, Phone OS, API, HNS/HOS/HCP and container flows.', 9, 'F2');
  s += line(34, 306, 'Important: prices are suggested Hashcod service prices, not financial advice or legal valuation.', 9, 'F2');
  return s;
};

const toolsPage = (items, pageNo, totalPages) => {
  let s = header(pageNo, totalPages);
  s += line(34, 536, '#', 8, 'F1');
  s += line(58, 536, 'TOOL', 8, 'F1');
  s += line(236, 536, 'GROUP', 8, 'F1');
  s += line(348, 536, 'MONTH', 8, 'F1');
  s += line(414, 536, 'SETUP', 8, 'F1');
  s += line(480, 536, 'ACTION', 8, 'F1');
  s += line(548, 536, 'SUGGESTED', 8, 'F1');
  s += line(640, 536, 'DIFFERENCE VS CODE', 8, 'F1');
  s += '0.5 w 34 526 m 808 526 l S\n';
  let y = 512;
  for (const row of items) {
    s += line(34, y, String(row.index).padStart(2, '0'), 7, 'F2');
    s += line(58, y, chunk(row.name, 31), 7, 'F2');
    s += line(236, y, chunk(row.group, 20), 7, 'F2');
    s += line(348, y, money(row.monthly), 7, 'F2');
    s += line(414, y, money(row.setup), 7, 'F2');
    s += line(480, y, money(row.perAction), 7, 'F2');
    s += line(548, y, money(row.suggested), 7, 'F2');
    s += line(640, y, chunk(row.difference, 33), 7, 'F2');
    y -= 12;
  }
  return s;
};

const detailPage = (items, pageNo, totalPages) => {
  let s = header(pageNo, totalPages);
  s += line(34, 536, 'TOOL', 8, 'F1');
  s += line(236, 536, 'RELATED CODES', 8, 'F1');
  s += line(360, 536, 'CODE VALUE', 8, 'F1');
  s += line(454, 536, 'WHAT THE TOOL ADDS ABOVE THE CODE', 8, 'F1');
  s += '0.5 w 34 526 m 808 526 l S\n';
  let y = 512;
  for (const row of items) {
    s += line(34, y, chunk(row.name, 33), 7, 'F2');
    s += line(236, y, chunk(row.related, 20), 7, 'F2');
    s += line(360, y, `${row.codeEquivalent}x`, 7, 'F2');
    s += line(454, y, chunk(row.purpose, 58), 7, 'F2');
    y -= 12;
  }
  return s;
};

const summaryPage = (items, pageNo, totalPages) => {
  let s = header(pageNo, totalPages);
  s += line(34, 526, 'Difference with the 10,000 cryptographic codes', 18, 'F1');
  s += line(34, 500, 'A cryptographic code is the generated material: key, token, digest, signature packet, KDF output or Hashcod profile.', 9, 'F2');
  s += line(34, 482, 'A tool is the operational layer: it creates, signs, verifies, stores, transports, visualizes, audits or sells those codes.', 9, 'F2');
  s += line(34, 452, 'CATALOG AREA', 8, 'F1');
  s += line(270, 452, 'COUNT', 8, 'F1');
  s += line(330, 452, 'COMMERCIAL DIFFERENCE', 8, 'F1');
  s += '0.5 w 34 442 m 808 442 l S\n';
  let y = 426;
  for (const row of items) {
    s += line(34, y, chunk(row.category, 38), 7.5, 'F2');
    s += line(270, y, String(row.count), 7.5, 'F2');
    s += line(330, y, chunk(row.difference, 76), 7.5, 'F2');
    y -= 13;
    if (y < 44) break;
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
    contentIds.push(add(`<< /Length ${Buffer.byteLength(page, 'utf8')} >>\nstream\n${page}endstream`));
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

const paginate = (items, perPage, maker, startPage, totalPages) => {
  const pages = [];
  for (let i = 0; i < Math.ceil(items.length / perPage); i += 1) {
    pages.push(maker(items.slice(i * perPage, (i + 1) * perPage), startPage + i, totalPages));
  }
  return pages;
};

const main = () => {
  const tools = toolRows();
  const summary = catalogSummary();
  const toolPages = Math.ceil(tools.length / 39);
  const detailPages = Math.ceil(tools.length / 39);
  const totalPages = 1 + toolPages + detailPages + 1;
  const pages = [
    introPage(tools.length, summary.find(row => row.category === 'TOTAL')?.count || 10000, totalPages),
    ...paginate(tools, 39, toolsPage, 2, totalPages),
    ...paginate(tools, 39, detailPage, 2 + toolPages, totalPages),
    summaryPage(summary, totalPages, totalPages),
  ];
  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(OUT_FILE, buildPdf(pages));
  console.log(`Wrote ${OUT_FILE}`);
  console.log(`Tools: ${tools.length}`);
};

main();
