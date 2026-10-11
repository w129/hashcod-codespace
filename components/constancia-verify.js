/* Verification page helper: hashes the asset file the visitor drops, in the browser (nothing is uploaded),
   and compares its SHA-512 with the registered digest or with any file of the Merkle manifest. Needs sha512-stream.js. */
(function () {
  'use strict';
  var zone = document.getElementById('cv-drop'), input = document.getElementById('cv-file'), asset = document.getElementById('cv-asset');
  if (!zone || !input || !asset) return;
  var result = document.getElementById('cv-result');
  var digest = asset.getAttribute('data-digest') || '', files = [];
  try { files = JSON.parse(asset.getAttribute('data-files') || '[]'); } catch (e) { files = []; }

  function say(text, ok) { result.textContent = text; result.className = ok === true ? 'ok' : ok === false ? 'bad' : ''; }

  function hashFile(file) {
    var hasher = window.HashcodSha512.create(), offset = 0, chunk = 4 * 1024 * 1024;
    return new Promise(function (resolve, reject) {
      (function next() {
        if (offset >= file.size) return resolve(hasher.hex());
        file.slice(offset, offset + chunk).arrayBuffer().then(function (buffer) {
          hasher.update(new Uint8Array(buffer)); offset += chunk;
          say('Calculando SHA-512… ' + Math.min(100, Math.round(offset * 100 / Math.max(1, file.size))) + ' %');
          setTimeout(next, 0);
        }, reject);
      })();
    });
  }

  function choose(file) {
    if (!file) return;
    if (!window.HashcodSha512) { say('No se pudo cargar el calculador de hash.', false); return; }
    hashFile(file).then(function (hex) {
      if (hex === digest) say('Coincide: el archivo es exactamente el registrado (' + hex.slice(0, 16) + '…).', true);
      else if (files.indexOf(hex) !== -1) say('Coincide con uno de los archivos del manifiesto Merkle (' + hex.slice(0, 16) + '…).', true);
      else say('NO coincide con el activo registrado (' + hex.slice(0, 16) + '…).', false);
    }, function () { say('No se pudo leer el archivo.', false); });
  }

  input.addEventListener('change', function () { choose(input.files && input.files[0]); });
  zone.addEventListener('click', function (e) { if (e.target !== input) input.click(); });
  zone.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); input.click(); } });
  zone.addEventListener('dragover', function (e) { e.preventDefault(); zone.classList.add('over'); });
  zone.addEventListener('dragleave', function () { zone.classList.remove('over'); });
  zone.addEventListener('drop', function (e) { e.preventDefault(); zone.classList.remove('over'); choose(e.dataTransfer.files && e.dataTransfer.files[0]); });
})();
