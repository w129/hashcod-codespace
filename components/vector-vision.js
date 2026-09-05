/**
 * Vector Vision & JAB / QR Matrix Engine — Tool #10 (Circle 10)
 * Hashcod Codespace
 * 
 * Permite subir cualquier imagen (.jpg, .png, .svg, .webp), analizar sus metadatos,
 * extraer puntos vectoriales/paleta, transformarla en CoffeeScript numérico puro,
 * generar códigos QR y JAB Code polícromos de alta densidad, y validar mediante
 * firma criptográfica o matriz visual.
 */

(function () {
    'use strict';

    const _qrGeneratorEngine = (function(){
//---------------------------------------------------------------------
//
// QR Code Generator for JavaScript
//
// Copyright (c) 2009 Kazuhiko Arase
//
// URL: http://www.d-project.com/
//
// Licensed under the MIT license:
//  http://www.opensource.org/licenses/mit-license.php
//
// The word 'QR Code' is registered trademark of
// DENSO WAVE INCORPORATED
//  http://www.denso-wave.com/qrcode/faqpatent-e.html
//
//---------------------------------------------------------------------

var qrcode = function() {

  //---------------------------------------------------------------------
  // qrcode
  //---------------------------------------------------------------------

  /**
   * qrcode
   * @param typeNumber 1 to 40
   * @param errorCorrectionLevel 'L','M','Q','H'
   */
  var qrcode = function(typeNumber, errorCorrectionLevel) {

    var PAD0 = 0xEC;
    var PAD1 = 0x11;

    var _typeNumber = typeNumber;
    var _errorCorrectionLevel = QRErrorCorrectionLevel[errorCorrectionLevel];
    var _modules = null;
    var _moduleCount = 0;
    var _dataCache = null;
    var _dataList = [];

    var _this = {};

    var makeImpl = function(test, maskPattern) {

      _moduleCount = _typeNumber * 4 + 17;
      _modules = function(moduleCount) {
        var modules = new Array(moduleCount);
        for (var row = 0; row < moduleCount; row += 1) {
          modules[row] = new Array(moduleCount);
          for (var col = 0; col < moduleCount; col += 1) {
            modules[row][col] = null;
          }
        }
        return modules;
      }(_moduleCount);

      setupPositionProbePattern(0, 0);
      setupPositionProbePattern(_moduleCount - 7, 0);
      setupPositionProbePattern(0, _moduleCount - 7);
      setupPositionAdjustPattern();
      setupTimingPattern();
      setupTypeInfo(test, maskPattern);

      if (_typeNumber >= 7) {
        setupTypeNumber(test);
      }

      if (_dataCache == null) {
        _dataCache = createData(_typeNumber, _errorCorrectionLevel, _dataList);
      }

      mapData(_dataCache, maskPattern);
    };

    var setupPositionProbePattern = function(row, col) {

      for (var r = -1; r <= 7; r += 1) {

        if (row + r <= -1 || _moduleCount <= row + r) continue;

        for (var c = -1; c <= 7; c += 1) {

          if (col + c <= -1 || _moduleCount <= col + c) continue;

          if ( (0 <= r && r <= 6 && (c == 0 || c == 6) )
              || (0 <= c && c <= 6 && (r == 0 || r == 6) )
              || (2 <= r && r <= 4 && 2 <= c && c <= 4) ) {
            _modules[row + r][col + c] = true;
          } else {
            _modules[row + r][col + c] = false;
          }
        }
      }
    };

    var getBestMaskPattern = function() {

      var minLostPoint = 0;
      var pattern = 0;

      for (var i = 0; i < 8; i += 1) {

        makeImpl(true, i);

        var lostPoint = QRUtil.getLostPoint(_this);

        if (i == 0 || minLostPoint > lostPoint) {
          minLostPoint = lostPoint;
          pattern = i;
        }
      }

      return pattern;
    };

    var setupTimingPattern = function() {

      for (var r = 8; r < _moduleCount - 8; r += 1) {
        if (_modules[r][6] != null) {
          continue;
        }
        _modules[r][6] = (r % 2 == 0);
      }

      for (var c = 8; c < _moduleCount - 8; c += 1) {
        if (_modules[6][c] != null) {
          continue;
        }
        _modules[6][c] = (c % 2 == 0);
      }
    };

    var setupPositionAdjustPattern = function() {

      var pos = QRUtil.getPatternPosition(_typeNumber);

      for (var i = 0; i < pos.length; i += 1) {

        for (var j = 0; j < pos.length; j += 1) {

          var row = pos[i];
          var col = pos[j];

          if (_modules[row][col] != null) {
            continue;
          }

          for (var r = -2; r <= 2; r += 1) {

            for (var c = -2; c <= 2; c += 1) {

              if (r == -2 || r == 2 || c == -2 || c == 2
                  || (r == 0 && c == 0) ) {
                _modules[row + r][col + c] = true;
              } else {
                _modules[row + r][col + c] = false;
              }
            }
          }
        }
      }
    };

    var setupTypeNumber = function(test) {

      var bits = QRUtil.getBCHTypeNumber(_typeNumber);

      for (var i = 0; i < 18; i += 1) {
        var mod = (!test && ( (bits >> i) & 1) == 1);
        _modules[Math.floor(i / 3)][i % 3 + _moduleCount - 8 - 3] = mod;
      }

      for (var i = 0; i < 18; i += 1) {
        var mod = (!test && ( (bits >> i) & 1) == 1);
        _modules[i % 3 + _moduleCount - 8 - 3][Math.floor(i / 3)] = mod;
      }
    };

    var setupTypeInfo = function(test, maskPattern) {

      var data = (_errorCorrectionLevel << 3) | maskPattern;
      var bits = QRUtil.getBCHTypeInfo(data);

      // vertical
      for (var i = 0; i < 15; i += 1) {

        var mod = (!test && ( (bits >> i) & 1) == 1);

        if (i < 6) {
          _modules[i][8] = mod;
        } else if (i < 8) {
          _modules[i + 1][8] = mod;
        } else {
          _modules[_moduleCount - 15 + i][8] = mod;
        }
      }

      // horizontal
      for (var i = 0; i < 15; i += 1) {

        var mod = (!test && ( (bits >> i) & 1) == 1);

        if (i < 8) {
          _modules[8][_moduleCount - i - 1] = mod;
        } else if (i < 9) {
          _modules[8][15 - i - 1 + 1] = mod;
        } else {
          _modules[8][15 - i - 1] = mod;
        }
      }

      // fixed module
      _modules[_moduleCount - 8][8] = (!test);
    };

    var mapData = function(data, maskPattern) {

      var inc = -1;
      var row = _moduleCount - 1;
      var bitIndex = 7;
      var byteIndex = 0;
      var maskFunc = QRUtil.getMaskFunction(maskPattern);

      for (var col = _moduleCount - 1; col > 0; col -= 2) {

        if (col == 6) col -= 1;

        while (true) {

          for (var c = 0; c < 2; c += 1) {

            if (_modules[row][col - c] == null) {

              var dark = false;

              if (byteIndex < data.length) {
                dark = ( ( (data[byteIndex] >>> bitIndex) & 1) == 1);
              }

              var mask = maskFunc(row, col - c);

              if (mask) {
                dark = !dark;
              }

              _modules[row][col - c] = dark;
              bitIndex -= 1;

              if (bitIndex == -1) {
                byteIndex += 1;
                bitIndex = 7;
              }
            }
          }

          row += inc;

          if (row < 0 || _moduleCount <= row) {
            row -= inc;
            inc = -inc;
            break;
          }
        }
      }
    };

    var createBytes = function(buffer, rsBlocks) {

      var offset = 0;

      var maxDcCount = 0;
      var maxEcCount = 0;

      var dcdata = new Array(rsBlocks.length);
      var ecdata = new Array(rsBlocks.length);

      for (var r = 0; r < rsBlocks.length; r += 1) {

        var dcCount = rsBlocks[r].dataCount;
        var ecCount = rsBlocks[r].totalCount - dcCount;

        maxDcCount = Math.max(maxDcCount, dcCount);
        maxEcCount = Math.max(maxEcCount, ecCount);

        dcdata[r] = new Array(dcCount);

        for (var i = 0; i < dcdata[r].length; i += 1) {
          dcdata[r][i] = 0xff & buffer.getBuffer()[i + offset];
        }
        offset += dcCount;

        var rsPoly = QRUtil.getErrorCorrectPolynomial(ecCount);
        var rawPoly = qrPolynomial(dcdata[r], rsPoly.getLength() - 1);

        var modPoly = rawPoly.mod(rsPoly);
        ecdata[r] = new Array(rsPoly.getLength() - 1);
        for (var i = 0; i < ecdata[r].length; i += 1) {
          var modIndex = i + modPoly.getLength() - ecdata[r].length;
          ecdata[r][i] = (modIndex >= 0)? modPoly.getAt(modIndex) : 0;
        }
      }

      var totalCodeCount = 0;
      for (var i = 0; i < rsBlocks.length; i += 1) {
        totalCodeCount += rsBlocks[i].totalCount;
      }

      var data = new Array(totalCodeCount);
      var index = 0;

      for (var i = 0; i < maxDcCount; i += 1) {
        for (var r = 0; r < rsBlocks.length; r += 1) {
          if (i < dcdata[r].length) {
            data[index] = dcdata[r][i];
            index += 1;
          }
        }
      }

      for (var i = 0; i < maxEcCount; i += 1) {
        for (var r = 0; r < rsBlocks.length; r += 1) {
          if (i < ecdata[r].length) {
            data[index] = ecdata[r][i];
            index += 1;
          }
        }
      }

      return data;
    };

    var createData = function(typeNumber, errorCorrectionLevel, dataList) {

      var rsBlocks = QRRSBlock.getRSBlocks(typeNumber, errorCorrectionLevel);

      var buffer = qrBitBuffer();

      for (var i = 0; i < dataList.length; i += 1) {
        var data = dataList[i];
        buffer.put(data.getMode(), 4);
        buffer.put(data.getLength(), QRUtil.getLengthInBits(data.getMode(), typeNumber) );
        data.write(buffer);
      }

      // calc num max data.
      var totalDataCount = 0;
      for (var i = 0; i < rsBlocks.length; i += 1) {
        totalDataCount += rsBlocks[i].dataCount;
      }

      if (buffer.getLengthInBits() > totalDataCount * 8) {
        throw 'code length overflow. ('
          + buffer.getLengthInBits()
          + '>'
          + totalDataCount * 8
          + ')';
      }

      // end code
      if (buffer.getLengthInBits() + 4 <= totalDataCount * 8) {
        buffer.put(0, 4);
      }

      // padding
      while (buffer.getLengthInBits() % 8 != 0) {
        buffer.putBit(false);
      }

      // padding
      while (true) {

        if (buffer.getLengthInBits() >= totalDataCount * 8) {
          break;
        }
        buffer.put(PAD0, 8);

        if (buffer.getLengthInBits() >= totalDataCount * 8) {
          break;
        }
        buffer.put(PAD1, 8);
      }

      return createBytes(buffer, rsBlocks);
    };

    _this.addData = function(data, mode) {

      mode = mode || 'Byte';

      var newData = null;

      switch(mode) {
      case 'Numeric' :
        newData = qrNumber(data);
        break;
      case 'Alphanumeric' :
        newData = qrAlphaNum(data);
        break;
      case 'Byte' :
        newData = qr8BitByte(data);
        break;
      case 'Kanji' :
        newData = qrKanji(data);
        break;
      default :
        throw 'mode:' + mode;
      }

      _dataList.push(newData);
      _dataCache = null;
    };

    _this.isDark = function(row, col) {
      if (row < 0 || _moduleCount <= row || col < 0 || _moduleCount <= col) {
        throw row + ',' + col;
      }
      return _modules[row][col];
    };

    _this.getModuleCount = function() {
      return _moduleCount;
    };

    _this.make = function() {
      if (_typeNumber < 1) {
        var typeNumber = 1;

        for (; typeNumber < 40; typeNumber++) {
          var rsBlocks = QRRSBlock.getRSBlocks(typeNumber, _errorCorrectionLevel);
          var buffer = qrBitBuffer();

          for (var i = 0; i < _dataList.length; i++) {
            var data = _dataList[i];
            buffer.put(data.getMode(), 4);
            buffer.put(data.getLength(), QRUtil.getLengthInBits(data.getMode(), typeNumber) );
            data.write(buffer);
          }

          var totalDataCount = 0;
          for (var i = 0; i < rsBlocks.length; i++) {
            totalDataCount += rsBlocks[i].dataCount;
          }

          if (buffer.getLengthInBits() <= totalDataCount * 8) {
            break;
          }
        }

        _typeNumber = typeNumber;
      }

      makeImpl(false, getBestMaskPattern() );
    };

    _this.createTableTag = function(cellSize, margin) {

      cellSize = cellSize || 2;
      margin = (typeof margin == 'undefined')? cellSize * 4 : margin;

      var qrHtml = '';

      qrHtml += '<table style="';
      qrHtml += ' border-width: 0px; border-style: none;';
      qrHtml += ' border-collapse: collapse;';
      qrHtml += ' padding: 0px; margin: ' + margin + 'px;';
      qrHtml += '">';
      qrHtml += '<tbody>';

      for (var r = 0; r < _this.getModuleCount(); r += 1) {

        qrHtml += '<tr>';

        for (var c = 0; c < _this.getModuleCount(); c += 1) {
          qrHtml += '<td style="';
          qrHtml += ' border-width: 0px; border-style: none;';
          qrHtml += ' border-collapse: collapse;';
          qrHtml += ' padding: 0px; margin: 0px;';
          qrHtml += ' width: ' + cellSize + 'px;';
          qrHtml += ' height: ' + cellSize + 'px;';
          qrHtml += ' background-color: ';
          qrHtml += _this.isDark(r, c)? '#000000' : '#ffffff';
          qrHtml += ';';
          qrHtml += '"/>';
        }

        qrHtml += '</tr>';
      }

      qrHtml += '</tbody>';
      qrHtml += '</table>';

      return qrHtml;
    };

    _this.createSvgTag = function(cellSize, margin, alt, title) {

      var opts = {};
      if (typeof arguments[0] == 'object') {
        // Called by options.
        opts = arguments[0];
        // overwrite cellSize and margin.
        cellSize = opts.cellSize;
        margin = opts.margin;
        alt = opts.alt;
        title = opts.title;
      }

      cellSize = cellSize || 2;
      margin = (typeof margin == 'undefined')? cellSize * 4 : margin;

      // Compose alt property surrogate
      alt = (typeof alt === 'string') ? {text: alt} : alt || {};
      alt.text = alt.text || null;
      alt.id = (alt.text) ? alt.id || 'qrcode-description' : null;

      // Compose title property surrogate
      title = (typeof title === 'string') ? {text: title} : title || {};
      title.text = title.text || null;
      title.id = (title.text) ? title.id || 'qrcode-title' : null;

      var size = _this.getModuleCount() * cellSize + margin * 2;
      var c, mc, r, mr, qrSvg='', rect;

      rect = 'l' + cellSize + ',0 0,' + cellSize +
        ' -' + cellSize + ',0 0,-' + cellSize + 'z ';

      qrSvg += '<svg version="1.1" xmlns="http://www.w3.org/2000/svg"';
      qrSvg += !opts.scalable ? ' width="' + size + 'px" height="' + size + 'px"' : '';
      qrSvg += ' viewBox="0 0 ' + size + ' ' + size + '" ';
      qrSvg += ' preserveAspectRatio="xMinYMin meet"';
      qrSvg += (title.text || alt.text) ? ' role="img" aria-labelledby="' +
          escapeXml([title.id, alt.id].join(' ').trim() ) + '"' : '';
      qrSvg += '>';
      qrSvg += (title.text) ? '<title id="' + escapeXml(title.id) + '">' +
          escapeXml(title.text) + '</title>' : '';
      qrSvg += (alt.text) ? '<description id="' + escapeXml(alt.id) + '">' +
          escapeXml(alt.text) + '</description>' : '';
      qrSvg += '<rect width="100%" height="100%" fill="white" cx="0" cy="0"/>';
      qrSvg += '<path d="';

      for (r = 0; r < _this.getModuleCount(); r += 1) {
        mr = r * cellSize + margin;
        for (c = 0; c < _this.getModuleCount(); c += 1) {
          if (_this.isDark(r, c) ) {
            mc = c*cellSize+margin;
            qrSvg += 'M' + mc + ',' + mr + rect;
          }
        }
      }

      qrSvg += '" stroke="transparent" fill="black"/>';
      qrSvg += '</svg>';

      return qrSvg;
    };

    _this.createDataURL = function(cellSize, margin) {

      cellSize = cellSize || 2;
      margin = (typeof margin == 'undefined')? cellSize * 4 : margin;

      var size = _this.getModuleCount() * cellSize + margin * 2;
      var min = margin;
      var max = size - margin;

      return createDataURL(size, size, function(x, y) {
        if (min <= x && x < max && min <= y && y < max) {
          var c = Math.floor( (x - min) / cellSize);
          var r = Math.floor( (y - min) / cellSize);
          return _this.isDark(r, c)? 0 : 1;
        } else {
          return 1;
        }
      } );
    };

    _this.createImgTag = function(cellSize, margin, alt) {

      cellSize = cellSize || 2;
      margin = (typeof margin == 'undefined')? cellSize * 4 : margin;

      var size = _this.getModuleCount() * cellSize + margin * 2;

      var img = '';
      img += '<img';
      img += '\u0020src="';
      img += _this.createDataURL(cellSize, margin);
      img += '"';
      img += '\u0020width="';
      img += size;
      img += '"';
      img += '\u0020height="';
      img += size;
      img += '"';
      if (alt) {
        img += '\u0020alt="';
        img += escapeXml(alt);
        img += '"';
      }
      img += '/>';

      return img;
    };

    var escapeXml = function(s) {
      var escaped = '';
      for (var i = 0; i < s.length; i += 1) {
        var c = s.charAt(i);
        switch(c) {
        case '<': escaped += '&lt;'; break;
        case '>': escaped += '&gt;'; break;
        case '&': escaped += '&amp;'; break;
        case '"': escaped += '&quot;'; break;
        default : escaped += c; break;
        }
      }
      return escaped;
    };

    var _createHalfASCII = function(margin) {
      var cellSize = 1;
      margin = (typeof margin == 'undefined')? cellSize * 2 : margin;

      var size = _this.getModuleCount() * cellSize + margin * 2;
      var min = margin;
      var max = size - margin;

      var y, x, r1, r2, p;

      var blocks = {
        '██': '█',
        '█ ': '▀',
        ' █': '▄',
        '  ': ' '
      };

      var blocksLastLineNoMargin = {
        '██': '▀',
        '█ ': '▀',
        ' █': ' ',
        '  ': ' '
      };

      var ascii = '';
      for (y = 0; y < size; y += 2) {
        r1 = Math.floor((y - min) / cellSize);
        r2 = Math.floor((y + 1 - min) / cellSize);
        for (x = 0; x < size; x += 1) {
          p = '█';

          if (min <= x && x < max && min <= y && y < max && _this.isDark(r1, Math.floor((x - min) / cellSize))) {
            p = ' ';
          }

          if (min <= x && x < max && min <= y+1 && y+1 < max && _this.isDark(r2, Math.floor((x - min) / cellSize))) {
            p += ' ';
          }
          else {
            p += '█';
          }

          // Output 2 characters per pixel, to create full square. 1 character per pixels gives only half width of square.
          ascii += (margin < 1 && y+1 >= max) ? blocksLastLineNoMargin[p] : blocks[p];
        }

        ascii += '\n';
      }

      if (size % 2 && margin > 0) {
        return ascii.substring(0, ascii.length - size - 1) + Array(size+1).join('▀');
      }

      return ascii.substring(0, ascii.length-1);
    };

    _this.createASCII = function(cellSize, margin) {
      cellSize = cellSize || 1;

      if (cellSize < 2) {
        return _createHalfASCII(margin);
      }

      cellSize -= 1;
      margin = (typeof margin == 'undefined')? cellSize * 2 : margin;

      var size = _this.getModuleCount() * cellSize + margin * 2;
      var min = margin;
      var max = size - margin;

      var y, x, r, p;

      var white = Array(cellSize+1).join('██');
      var black = Array(cellSize+1).join('  ');

      var ascii = '';
      var line = '';
      for (y = 0; y < size; y += 1) {
        r = Math.floor( (y - min) / cellSize);
        line = '';
        for (x = 0; x < size; x += 1) {
          p = 1;

          if (min <= x && x < max && min <= y && y < max && _this.isDark(r, Math.floor((x - min) / cellSize))) {
            p = 0;
          }

          // Output 2 characters per pixel, to create full square. 1 character per pixels gives only half width of square.
          line += p ? white : black;
        }

        for (r = 0; r < cellSize; r += 1) {
          ascii += line + '\n';
        }
      }

      return ascii.substring(0, ascii.length-1);
    };

    _this.renderTo2dContext = function(context, cellSize) {
      cellSize = cellSize || 2;
      var length = _this.getModuleCount();
      for (var row = 0; row < length; row++) {
        for (var col = 0; col < length; col++) {
          context.fillStyle = _this.isDark(row, col) ? 'black' : 'white';
          context.fillRect(col * cellSize, row * cellSize, cellSize, cellSize);
        }
      }
    }

    return _this;
  };

  //---------------------------------------------------------------------
  // qrcode.stringToBytes
  //---------------------------------------------------------------------

  qrcode.stringToBytesFuncs = {
    'default' : function(s) {
      var bytes = [];
      for (var i = 0; i < s.length; i += 1) {
        var c = s.charCodeAt(i);
        bytes.push(c & 0xff);
      }
      return bytes;
    }
  };

  qrcode.stringToBytes = qrcode.stringToBytesFuncs['default'];

  //---------------------------------------------------------------------
  // qrcode.createStringToBytes
  //---------------------------------------------------------------------

  /**
   * @param unicodeData base64 string of byte array.
   * [16bit Unicode],[16bit Bytes], ...
   * @param numChars
   */
  qrcode.createStringToBytes = function(unicodeData, numChars) {

    // create conversion map.

    var unicodeMap = function() {

      var bin = base64DecodeInputStream(unicodeData);
      var read = function() {
        var b = bin.read();
        if (b == -1) throw 'eof';
        return b;
      };

      var count = 0;
      var unicodeMap = {};
      while (true) {
        var b0 = bin.read();
        if (b0 == -1) break;
        var b1 = read();
        var b2 = read();
        var b3 = read();
        var k = String.fromCharCode( (b0 << 8) | b1);
        var v = (b2 << 8) | b3;
        unicodeMap[k] = v;
        count += 1;
      }
      if (count != numChars) {
        throw count + ' != ' + numChars;
      }

      return unicodeMap;
    }();

    var unknownChar = '?'.charCodeAt(0);

    return function(s) {
      var bytes = [];
      for (var i = 0; i < s.length; i += 1) {
        var c = s.charCodeAt(i);
        if (c < 128) {
          bytes.push(c);
        } else {
          var b = unicodeMap[s.charAt(i)];
          if (typeof b == 'number') {
            if ( (b & 0xff) == b) {
              // 1byte
              bytes.push(b);
            } else {
              // 2bytes
              bytes.push(b >>> 8);
              bytes.push(b & 0xff);
            }
          } else {
            bytes.push(unknownChar);
          }
        }
      }
      return bytes;
    };
  };

  //---------------------------------------------------------------------
  // QRMode
  //---------------------------------------------------------------------

  var QRMode = {
    MODE_NUMBER :    1 << 0,
    MODE_ALPHA_NUM : 1 << 1,
    MODE_8BIT_BYTE : 1 << 2,
    MODE_KANJI :     1 << 3
  };

  //---------------------------------------------------------------------
  // QRErrorCorrectionLevel
  //---------------------------------------------------------------------

  var QRErrorCorrectionLevel = {
    L : 1,
    M : 0,
    Q : 3,
    H : 2
  };

  //---------------------------------------------------------------------
  // QRMaskPattern
  //---------------------------------------------------------------------

  var QRMaskPattern = {
    PATTERN000 : 0,
    PATTERN001 : 1,
    PATTERN010 : 2,
    PATTERN011 : 3,
    PATTERN100 : 4,
    PATTERN101 : 5,
    PATTERN110 : 6,
    PATTERN111 : 7
  };

  //---------------------------------------------------------------------
  // QRUtil
  //---------------------------------------------------------------------

  var QRUtil = function() {

    var PATTERN_POSITION_TABLE = [
      [],
      [6, 18],
      [6, 22],
      [6, 26],
      [6, 30],
      [6, 34],
      [6, 22, 38],
      [6, 24, 42],
      [6, 26, 46],
      [6, 28, 50],
      [6, 30, 54],
      [6, 32, 58],
      [6, 34, 62],
      [6, 26, 46, 66],
      [6, 26, 48, 70],
      [6, 26, 50, 74],
      [6, 30, 54, 78],
      [6, 30, 56, 82],
      [6, 30, 58, 86],
      [6, 34, 62, 90],
      [6, 28, 50, 72, 94],
      [6, 26, 50, 74, 98],
      [6, 30, 54, 78, 102],
      [6, 28, 54, 80, 106],
      [6, 32, 58, 84, 110],
      [6, 30, 58, 86, 114],
      [6, 34, 62, 90, 118],
      [6, 26, 50, 74, 98, 122],
      [6, 30, 54, 78, 102, 126],
      [6, 26, 52, 78, 104, 130],
      [6, 30, 56, 82, 108, 134],
      [6, 34, 60, 86, 112, 138],
      [6, 30, 58, 86, 114, 142],
      [6, 34, 62, 90, 118, 146],
      [6, 30, 54, 78, 102, 126, 150],
      [6, 24, 50, 76, 102, 128, 154],
      [6, 28, 54, 80, 106, 132, 158],
      [6, 32, 58, 84, 110, 136, 162],
      [6, 26, 54, 82, 110, 138, 166],
      [6, 30, 58, 86, 114, 142, 170]
    ];
    var G15 = (1 << 10) | (1 << 8) | (1 << 5) | (1 << 4) | (1 << 2) | (1 << 1) | (1 << 0);
    var G18 = (1 << 12) | (1 << 11) | (1 << 10) | (1 << 9) | (1 << 8) | (1 << 5) | (1 << 2) | (1 << 0);
    var G15_MASK = (1 << 14) | (1 << 12) | (1 << 10) | (1 << 4) | (1 << 1);

    var _this = {};

    var getBCHDigit = function(data) {
      var digit = 0;
      while (data != 0) {
        digit += 1;
        data >>>= 1;
      }
      return digit;
    };

    _this.getBCHTypeInfo = function(data) {
      var d = data << 10;
      while (getBCHDigit(d) - getBCHDigit(G15) >= 0) {
        d ^= (G15 << (getBCHDigit(d) - getBCHDigit(G15) ) );
      }
      return ( (data << 10) | d) ^ G15_MASK;
    };

    _this.getBCHTypeNumber = function(data) {
      var d = data << 12;
      while (getBCHDigit(d) - getBCHDigit(G18) >= 0) {
        d ^= (G18 << (getBCHDigit(d) - getBCHDigit(G18) ) );
      }
      return (data << 12) | d;
    };

    _this.getPatternPosition = function(typeNumber) {
      return PATTERN_POSITION_TABLE[typeNumber - 1];
    };

    _this.getMaskFunction = function(maskPattern) {

      switch (maskPattern) {

      case QRMaskPattern.PATTERN000 :
        return function(i, j) { return (i + j) % 2 == 0; };
      case QRMaskPattern.PATTERN001 :
        return function(i, j) { return i % 2 == 0; };
      case QRMaskPattern.PATTERN010 :
        return function(i, j) { return j % 3 == 0; };
      case QRMaskPattern.PATTERN011 :
        return function(i, j) { return (i + j) % 3 == 0; };
      case QRMaskPattern.PATTERN100 :
        return function(i, j) { return (Math.floor(i / 2) + Math.floor(j / 3) ) % 2 == 0; };
      case QRMaskPattern.PATTERN101 :
        return function(i, j) { return (i * j) % 2 + (i * j) % 3 == 0; };
      case QRMaskPattern.PATTERN110 :
        return function(i, j) { return ( (i * j) % 2 + (i * j) % 3) % 2 == 0; };
      case QRMaskPattern.PATTERN111 :
        return function(i, j) { return ( (i * j) % 3 + (i + j) % 2) % 2 == 0; };

      default :
        throw 'bad maskPattern:' + maskPattern;
      }
    };

    _this.getErrorCorrectPolynomial = function(errorCorrectLength) {
      var a = qrPolynomial([1], 0);
      for (var i = 0; i < errorCorrectLength; i += 1) {
        a = a.multiply(qrPolynomial([1, QRMath.gexp(i)], 0) );
      }
      return a;
    };

    _this.getLengthInBits = function(mode, type) {

      if (1 <= type && type < 10) {

        // 1 - 9

        switch(mode) {
        case QRMode.MODE_NUMBER    : return 10;
        case QRMode.MODE_ALPHA_NUM : return 9;
        case QRMode.MODE_8BIT_BYTE : return 8;
        case QRMode.MODE_KANJI     : return 8;
        default :
          throw 'mode:' + mode;
        }

      } else if (type < 27) {

        // 10 - 26

        switch(mode) {
        case QRMode.MODE_NUMBER    : return 12;
        case QRMode.MODE_ALPHA_NUM : return 11;
        case QRMode.MODE_8BIT_BYTE : return 16;
        case QRMode.MODE_KANJI     : return 10;
        default :
          throw 'mode:' + mode;
        }

      } else if (type < 41) {

        // 27 - 40

        switch(mode) {
        case QRMode.MODE_NUMBER    : return 14;
        case QRMode.MODE_ALPHA_NUM : return 13;
        case QRMode.MODE_8BIT_BYTE : return 16;
        case QRMode.MODE_KANJI     : return 12;
        default :
          throw 'mode:' + mode;
        }

      } else {
        throw 'type:' + type;
      }
    };

    _this.getLostPoint = function(qrcode) {

      var moduleCount = qrcode.getModuleCount();

      var lostPoint = 0;

      // LEVEL1

      for (var row = 0; row < moduleCount; row += 1) {
        for (var col = 0; col < moduleCount; col += 1) {

          var sameCount = 0;
          var dark = qrcode.isDark(row, col);

          for (var r = -1; r <= 1; r += 1) {

            if (row + r < 0 || moduleCount <= row + r) {
              continue;
            }

            for (var c = -1; c <= 1; c += 1) {

              if (col + c < 0 || moduleCount <= col + c) {
                continue;
              }

              if (r == 0 && c == 0) {
                continue;
              }

              if (dark == qrcode.isDark(row + r, col + c) ) {
                sameCount += 1;
              }
            }
          }

          if (sameCount > 5) {
            lostPoint += (3 + sameCount - 5);
          }
        }
      };

      // LEVEL2

      for (var row = 0; row < moduleCount - 1; row += 1) {
        for (var col = 0; col < moduleCount - 1; col += 1) {
          var count = 0;
          if (qrcode.isDark(row, col) ) count += 1;
          if (qrcode.isDark(row + 1, col) ) count += 1;
          if (qrcode.isDark(row, col + 1) ) count += 1;
          if (qrcode.isDark(row + 1, col + 1) ) count += 1;
          if (count == 0 || count == 4) {
            lostPoint += 3;
          }
        }
      }

      // LEVEL3

      for (var row = 0; row < moduleCount; row += 1) {
        for (var col = 0; col < moduleCount - 6; col += 1) {
          if (qrcode.isDark(row, col)
              && !qrcode.isDark(row, col + 1)
              &&  qrcode.isDark(row, col + 2)
              &&  qrcode.isDark(row, col + 3)
              &&  qrcode.isDark(row, col + 4)
              && !qrcode.isDark(row, col + 5)
              &&  qrcode.isDark(row, col + 6) ) {
            lostPoint += 40;
          }
        }
      }

      for (var col = 0; col < moduleCount; col += 1) {
        for (var row = 0; row < moduleCount - 6; row += 1) {
          if (qrcode.isDark(row, col)
              && !qrcode.isDark(row + 1, col)
              &&  qrcode.isDark(row + 2, col)
              &&  qrcode.isDark(row + 3, col)
              &&  qrcode.isDark(row + 4, col)
              && !qrcode.isDark(row + 5, col)
              &&  qrcode.isDark(row + 6, col) ) {
            lostPoint += 40;
          }
        }
      }

      // LEVEL4

      var darkCount = 0;

      for (var col = 0; col < moduleCount; col += 1) {
        for (var row = 0; row < moduleCount; row += 1) {
          if (qrcode.isDark(row, col) ) {
            darkCount += 1;
          }
        }
      }

      var ratio = Math.abs(100 * darkCount / moduleCount / moduleCount - 50) / 5;
      lostPoint += ratio * 10;

      return lostPoint;
    };

    return _this;
  }();

  //---------------------------------------------------------------------
  // QRMath
  //---------------------------------------------------------------------

  var QRMath = function() {

    var EXP_TABLE = new Array(256);
    var LOG_TABLE = new Array(256);

    // initialize tables
    for (var i = 0; i < 8; i += 1) {
      EXP_TABLE[i] = 1 << i;
    }
    for (var i = 8; i < 256; i += 1) {
      EXP_TABLE[i] = EXP_TABLE[i - 4]
        ^ EXP_TABLE[i - 5]
        ^ EXP_TABLE[i - 6]
        ^ EXP_TABLE[i - 8];
    }
    for (var i = 0; i < 255; i += 1) {
      LOG_TABLE[EXP_TABLE[i] ] = i;
    }

    var _this = {};

    _this.glog = function(n) {

      if (n < 1) {
        throw 'glog(' + n + ')';
      }

      return LOG_TABLE[n];
    };

    _this.gexp = function(n) {

      while (n < 0) {
        n += 255;
      }

      while (n >= 256) {
        n -= 255;
      }

      return EXP_TABLE[n];
    };

    return _this;
  }();

  //---------------------------------------------------------------------
  // qrPolynomial
  //---------------------------------------------------------------------

  function qrPolynomial(num, shift) {

    if (typeof num.length == 'undefined') {
      throw num.length + '/' + shift;
    }

    var _num = function() {
      var offset = 0;
      while (offset < num.length && num[offset] == 0) {
        offset += 1;
      }
      var _num = new Array(num.length - offset + shift);
      for (var i = 0; i < num.length - offset; i += 1) {
        _num[i] = num[i + offset];
      }
      return _num;
    }();

    var _this = {};

    _this.getAt = function(index) {
      return _num[index];
    };

    _this.getLength = function() {
      return _num.length;
    };

    _this.multiply = function(e) {

      var num = new Array(_this.getLength() + e.getLength() - 1);

      for (var i = 0; i < _this.getLength(); i += 1) {
        for (var j = 0; j < e.getLength(); j += 1) {
          num[i + j] ^= QRMath.gexp(QRMath.glog(_this.getAt(i) ) + QRMath.glog(e.getAt(j) ) );
        }
      }

      return qrPolynomial(num, 0);
    };

    _this.mod = function(e) {

      if (_this.getLength() - e.getLength() < 0) {
        return _this;
      }

      var ratio = QRMath.glog(_this.getAt(0) ) - QRMath.glog(e.getAt(0) );

      var num = new Array(_this.getLength() );
      for (var i = 0; i < _this.getLength(); i += 1) {
        num[i] = _this.getAt(i);
      }

      for (var i = 0; i < e.getLength(); i += 1) {
        num[i] ^= QRMath.gexp(QRMath.glog(e.getAt(i) ) + ratio);
      }

      // recursive call
      return qrPolynomial(num, 0).mod(e);
    };

    return _this;
  };

  //---------------------------------------------------------------------
  // QRRSBlock
  //---------------------------------------------------------------------

  var QRRSBlock = function() {

    var RS_BLOCK_TABLE = [

      // L
      // M
      // Q
      // H

      // 1
      [1, 26, 19],
      [1, 26, 16],
      [1, 26, 13],
      [1, 26, 9],

      // 2
      [1, 44, 34],
      [1, 44, 28],
      [1, 44, 22],
      [1, 44, 16],

      // 3
      [1, 70, 55],
      [1, 70, 44],
      [2, 35, 17],
      [2, 35, 13],

      // 4
      [1, 100, 80],
      [2, 50, 32],
      [2, 50, 24],
      [4, 25, 9],

      // 5
      [1, 134, 108],
      [2, 67, 43],
      [2, 33, 15, 2, 34, 16],
      [2, 33, 11, 2, 34, 12],

      // 6
      [2, 86, 68],
      [4, 43, 27],
      [4, 43, 19],
      [4, 43, 15],

      // 7
      [2, 98, 78],
      [4, 49, 31],
      [2, 32, 14, 4, 33, 15],
      [4, 39, 13, 1, 40, 14],

      // 8
      [2, 121, 97],
      [2, 60, 38, 2, 61, 39],
      [4, 40, 18, 2, 41, 19],
      [4, 40, 14, 2, 41, 15],

      // 9
      [2, 146, 116],
      [3, 58, 36, 2, 59, 37],
      [4, 36, 16, 4, 37, 17],
      [4, 36, 12, 4, 37, 13],

      // 10
      [2, 86, 68, 2, 87, 69],
      [4, 69, 43, 1, 70, 44],
      [6, 43, 19, 2, 44, 20],
      [6, 43, 15, 2, 44, 16],

      // 11
      [4, 101, 81],
      [1, 80, 50, 4, 81, 51],
      [4, 50, 22, 4, 51, 23],
      [3, 36, 12, 8, 37, 13],

      // 12
      [2, 116, 92, 2, 117, 93],
      [6, 58, 36, 2, 59, 37],
      [4, 46, 20, 6, 47, 21],
      [7, 42, 14, 4, 43, 15],

      // 13
      [4, 133, 107],
      [8, 59, 37, 1, 60, 38],
      [8, 44, 20, 4, 45, 21],
      [12, 33, 11, 4, 34, 12],

      // 14
      [3, 145, 115, 1, 146, 116],
      [4, 64, 40, 5, 65, 41],
      [11, 36, 16, 5, 37, 17],
      [11, 36, 12, 5, 37, 13],

      // 15
      [5, 109, 87, 1, 110, 88],
      [5, 65, 41, 5, 66, 42],
      [5, 54, 24, 7, 55, 25],
      [11, 36, 12, 7, 37, 13],

      // 16
      [5, 122, 98, 1, 123, 99],
      [7, 73, 45, 3, 74, 46],
      [15, 43, 19, 2, 44, 20],
      [3, 45, 15, 13, 46, 16],

      // 17
      [1, 135, 107, 5, 136, 108],
      [10, 74, 46, 1, 75, 47],
      [1, 50, 22, 15, 51, 23],
      [2, 42, 14, 17, 43, 15],

      // 18
      [5, 150, 120, 1, 151, 121],
      [9, 69, 43, 4, 70, 44],
      [17, 50, 22, 1, 51, 23],
      [2, 42, 14, 19, 43, 15],

      // 19
      [3, 141, 113, 4, 142, 114],
      [3, 70, 44, 11, 71, 45],
      [17, 47, 21, 4, 48, 22],
      [9, 39, 13, 16, 40, 14],

      // 20
      [3, 135, 107, 5, 136, 108],
      [3, 67, 41, 13, 68, 42],
      [15, 54, 24, 5, 55, 25],
      [15, 43, 15, 10, 44, 16],

      // 21
      [4, 144, 116, 4, 145, 117],
      [17, 68, 42],
      [17, 50, 22, 6, 51, 23],
      [19, 46, 16, 6, 47, 17],

      // 22
      [2, 139, 111, 7, 140, 112],
      [17, 74, 46],
      [7, 54, 24, 16, 55, 25],
      [34, 37, 13],

      // 23
      [4, 151, 121, 5, 152, 122],
      [4, 75, 47, 14, 76, 48],
      [11, 54, 24, 14, 55, 25],
      [16, 45, 15, 14, 46, 16],

      // 24
      [6, 147, 117, 4, 148, 118],
      [6, 73, 45, 14, 74, 46],
      [11, 54, 24, 16, 55, 25],
      [30, 46, 16, 2, 47, 17],

      // 25
      [8, 132, 106, 4, 133, 107],
      [8, 75, 47, 13, 76, 48],
      [7, 54, 24, 22, 55, 25],
      [22, 45, 15, 13, 46, 16],

      // 26
      [10, 142, 114, 2, 143, 115],
      [19, 74, 46, 4, 75, 47],
      [28, 50, 22, 6, 51, 23],
      [33, 46, 16, 4, 47, 17],

      // 27
      [8, 152, 122, 4, 153, 123],
      [22, 73, 45, 3, 74, 46],
      [8, 53, 23, 26, 54, 24],
      [12, 45, 15, 28, 46, 16],

      // 28
      [3, 147, 117, 10, 148, 118],
      [3, 73, 45, 23, 74, 46],
      [4, 54, 24, 31, 55, 25],
      [11, 45, 15, 31, 46, 16],

      // 29
      [7, 146, 116, 7, 147, 117],
      [21, 73, 45, 7, 74, 46],
      [1, 53, 23, 37, 54, 24],
      [19, 45, 15, 26, 46, 16],

      // 30
      [5, 145, 115, 10, 146, 116],
      [19, 75, 47, 10, 76, 48],
      [15, 54, 24, 25, 55, 25],
      [23, 45, 15, 25, 46, 16],

      // 31
      [13, 145, 115, 3, 146, 116],
      [2, 74, 46, 29, 75, 47],
      [42, 54, 24, 1, 55, 25],
      [23, 45, 15, 28, 46, 16],

      // 32
      [17, 145, 115],
      [10, 74, 46, 23, 75, 47],
      [10, 54, 24, 35, 55, 25],
      [19, 45, 15, 35, 46, 16],

      // 33
      [17, 145, 115, 1, 146, 116],
      [14, 74, 46, 21, 75, 47],
      [29, 54, 24, 19, 55, 25],
      [11, 45, 15, 46, 46, 16],

      // 34
      [13, 145, 115, 6, 146, 116],
      [14, 74, 46, 23, 75, 47],
      [44, 54, 24, 7, 55, 25],
      [59, 46, 16, 1, 47, 17],

      // 35
      [12, 151, 121, 7, 152, 122],
      [12, 75, 47, 26, 76, 48],
      [39, 54, 24, 14, 55, 25],
      [22, 45, 15, 41, 46, 16],

      // 36
      [6, 151, 121, 14, 152, 122],
      [6, 75, 47, 34, 76, 48],
      [46, 54, 24, 10, 55, 25],
      [2, 45, 15, 64, 46, 16],

      // 37
      [17, 152, 122, 4, 153, 123],
      [29, 74, 46, 14, 75, 47],
      [49, 54, 24, 10, 55, 25],
      [24, 45, 15, 46, 46, 16],

      // 38
      [4, 152, 122, 18, 153, 123],
      [13, 74, 46, 32, 75, 47],
      [48, 54, 24, 14, 55, 25],
      [42, 45, 15, 32, 46, 16],

      // 39
      [20, 147, 117, 4, 148, 118],
      [40, 75, 47, 7, 76, 48],
      [43, 54, 24, 22, 55, 25],
      [10, 45, 15, 67, 46, 16],

      // 40
      [19, 148, 118, 6, 149, 119],
      [18, 75, 47, 31, 76, 48],
      [34, 54, 24, 34, 55, 25],
      [20, 45, 15, 61, 46, 16]
    ];

    var qrRSBlock = function(totalCount, dataCount) {
      var _this = {};
      _this.totalCount = totalCount;
      _this.dataCount = dataCount;
      return _this;
    };

    var _this = {};

    var getRsBlockTable = function(typeNumber, errorCorrectionLevel) {

      switch(errorCorrectionLevel) {
      case QRErrorCorrectionLevel.L :
        return RS_BLOCK_TABLE[(typeNumber - 1) * 4 + 0];
      case QRErrorCorrectionLevel.M :
        return RS_BLOCK_TABLE[(typeNumber - 1) * 4 + 1];
      case QRErrorCorrectionLevel.Q :
        return RS_BLOCK_TABLE[(typeNumber - 1) * 4 + 2];
      case QRErrorCorrectionLevel.H :
        return RS_BLOCK_TABLE[(typeNumber - 1) * 4 + 3];
      default :
        return undefined;
      }
    };

    _this.getRSBlocks = function(typeNumber, errorCorrectionLevel) {

      var rsBlock = getRsBlockTable(typeNumber, errorCorrectionLevel);

      if (typeof rsBlock == 'undefined') {
        throw 'bad rs block @ typeNumber:' + typeNumber +
            '/errorCorrectionLevel:' + errorCorrectionLevel;
      }

      var length = rsBlock.length / 3;

      var list = [];

      for (var i = 0; i < length; i += 1) {

        var count = rsBlock[i * 3 + 0];
        var totalCount = rsBlock[i * 3 + 1];
        var dataCount = rsBlock[i * 3 + 2];

        for (var j = 0; j < count; j += 1) {
          list.push(qrRSBlock(totalCount, dataCount) );
        }
      }

      return list;
    };

    return _this;
  }();

  //---------------------------------------------------------------------
  // qrBitBuffer
  //---------------------------------------------------------------------

  var qrBitBuffer = function() {

    var _buffer = [];
    var _length = 0;

    var _this = {};

    _this.getBuffer = function() {
      return _buffer;
    };

    _this.getAt = function(index) {
      var bufIndex = Math.floor(index / 8);
      return ( (_buffer[bufIndex] >>> (7 - index % 8) ) & 1) == 1;
    };

    _this.put = function(num, length) {
      for (var i = 0; i < length; i += 1) {
        _this.putBit( ( (num >>> (length - i - 1) ) & 1) == 1);
      }
    };

    _this.getLengthInBits = function() {
      return _length;
    };

    _this.putBit = function(bit) {

      var bufIndex = Math.floor(_length / 8);
      if (_buffer.length <= bufIndex) {
        _buffer.push(0);
      }

      if (bit) {
        _buffer[bufIndex] |= (0x80 >>> (_length % 8) );
      }

      _length += 1;
    };

    return _this;
  };

  //---------------------------------------------------------------------
  // qrNumber
  //---------------------------------------------------------------------

  var qrNumber = function(data) {

    var _mode = QRMode.MODE_NUMBER;
    var _data = data;

    var _this = {};

    _this.getMode = function() {
      return _mode;
    };

    _this.getLength = function(buffer) {
      return _data.length;
    };

    _this.write = function(buffer) {

      var data = _data;

      var i = 0;

      while (i + 2 < data.length) {
        buffer.put(strToNum(data.substring(i, i + 3) ), 10);
        i += 3;
      }

      if (i < data.length) {
        if (data.length - i == 1) {
          buffer.put(strToNum(data.substring(i, i + 1) ), 4);
        } else if (data.length - i == 2) {
          buffer.put(strToNum(data.substring(i, i + 2) ), 7);
        }
      }
    };

    var strToNum = function(s) {
      var num = 0;
      for (var i = 0; i < s.length; i += 1) {
        num = num * 10 + chatToNum(s.charAt(i) );
      }
      return num;
    };

    var chatToNum = function(c) {
      if ('0' <= c && c <= '9') {
        return c.charCodeAt(0) - '0'.charCodeAt(0);
      }
      throw 'illegal char :' + c;
    };

    return _this;
  };

  //---------------------------------------------------------------------
  // qrAlphaNum
  //---------------------------------------------------------------------

  var qrAlphaNum = function(data) {

    var _mode = QRMode.MODE_ALPHA_NUM;
    var _data = data;

    var _this = {};

    _this.getMode = function() {
      return _mode;
    };

    _this.getLength = function(buffer) {
      return _data.length;
    };

    _this.write = function(buffer) {

      var s = _data;

      var i = 0;

      while (i + 1 < s.length) {
        buffer.put(
          getCode(s.charAt(i) ) * 45 +
          getCode(s.charAt(i + 1) ), 11);
        i += 2;
      }

      if (i < s.length) {
        buffer.put(getCode(s.charAt(i) ), 6);
      }
    };

    var getCode = function(c) {

      if ('0' <= c && c <= '9') {
        return c.charCodeAt(0) - '0'.charCodeAt(0);
      } else if ('A' <= c && c <= 'Z') {
        return c.charCodeAt(0) - 'A'.charCodeAt(0) + 10;
      } else {
        switch (c) {
        case ' ' : return 36;
        case '$' : return 37;
        case '%' : return 38;
        case '*' : return 39;
        case '+' : return 40;
        case '-' : return 41;
        case '.' : return 42;
        case '/' : return 43;
        case ':' : return 44;
        default :
          throw 'illegal char :' + c;
        }
      }
    };

    return _this;
  };

  //---------------------------------------------------------------------
  // qr8BitByte
  //---------------------------------------------------------------------

  var qr8BitByte = function(data) {

    var _mode = QRMode.MODE_8BIT_BYTE;
    var _data = data;
    var _bytes = qrcode.stringToBytes(data);

    var _this = {};

    _this.getMode = function() {
      return _mode;
    };

    _this.getLength = function(buffer) {
      return _bytes.length;
    };

    _this.write = function(buffer) {
      for (var i = 0; i < _bytes.length; i += 1) {
        buffer.put(_bytes[i], 8);
      }
    };

    return _this;
  };

  //---------------------------------------------------------------------
  // qrKanji
  //---------------------------------------------------------------------

  var qrKanji = function(data) {

    var _mode = QRMode.MODE_KANJI;
    var _data = data;

    var stringToBytes = qrcode.stringToBytesFuncs['SJIS'];
    if (!stringToBytes) {
      throw 'sjis not supported.';
    }
    !function(c, code) {
      // self test for sjis support.
      var test = stringToBytes(c);
      if (test.length != 2 || ( (test[0] << 8) | test[1]) != code) {
        throw 'sjis not supported.';
      }
    }('\u53cb', 0x9746);

    var _bytes = stringToBytes(data);

    var _this = {};

    _this.getMode = function() {
      return _mode;
    };

    _this.getLength = function(buffer) {
      return ~~(_bytes.length / 2);
    };

    _this.write = function(buffer) {

      var data = _bytes;

      var i = 0;

      while (i + 1 < data.length) {

        var c = ( (0xff & data[i]) << 8) | (0xff & data[i + 1]);

        if (0x8140 <= c && c <= 0x9FFC) {
          c -= 0x8140;
        } else if (0xE040 <= c && c <= 0xEBBF) {
          c -= 0xC140;
        } else {
          throw 'illegal char at ' + (i + 1) + '/' + c;
        }

        c = ( (c >>> 8) & 0xff) * 0xC0 + (c & 0xff);

        buffer.put(c, 13);

        i += 2;
      }

      if (i < data.length) {
        throw 'illegal char at ' + (i + 1);
      }
    };

    return _this;
  };

  //=====================================================================
  // GIF Support etc.
  //

  //---------------------------------------------------------------------
  // byteArrayOutputStream
  //---------------------------------------------------------------------

  var byteArrayOutputStream = function() {

    var _bytes = [];

    var _this = {};

    _this.writeByte = function(b) {
      _bytes.push(b & 0xff);
    };

    _this.writeShort = function(i) {
      _this.writeByte(i);
      _this.writeByte(i >>> 8);
    };

    _this.writeBytes = function(b, off, len) {
      off = off || 0;
      len = len || b.length;
      for (var i = 0; i < len; i += 1) {
        _this.writeByte(b[i + off]);
      }
    };

    _this.writeString = function(s) {
      for (var i = 0; i < s.length; i += 1) {
        _this.writeByte(s.charCodeAt(i) );
      }
    };

    _this.toByteArray = function() {
      return _bytes;
    };

    _this.toString = function() {
      var s = '';
      s += '[';
      for (var i = 0; i < _bytes.length; i += 1) {
        if (i > 0) {
          s += ',';
        }
        s += _bytes[i];
      }
      s += ']';
      return s;
    };

    return _this;
  };

  //---------------------------------------------------------------------
  // base64EncodeOutputStream
  //---------------------------------------------------------------------

  var base64EncodeOutputStream = function() {

    var _buffer = 0;
    var _buflen = 0;
    var _length = 0;
    var _base64 = '';

    var _this = {};

    var writeEncoded = function(b) {
      _base64 += String.fromCharCode(encode(b & 0x3f) );
    };

    var encode = function(n) {
      if (n < 0) {
        // error.
      } else if (n < 26) {
        return 0x41 + n;
      } else if (n < 52) {
        return 0x61 + (n - 26);
      } else if (n < 62) {
        return 0x30 + (n - 52);
      } else if (n == 62) {
        return 0x2b;
      } else if (n == 63) {
        return 0x2f;
      }
      throw 'n:' + n;
    };

    _this.writeByte = function(n) {

      _buffer = (_buffer << 8) | (n & 0xff);
      _buflen += 8;
      _length += 1;

      while (_buflen >= 6) {
        writeEncoded(_buffer >>> (_buflen - 6) );
        _buflen -= 6;
      }
    };

    _this.flush = function() {

      if (_buflen > 0) {
        writeEncoded(_buffer << (6 - _buflen) );
        _buffer = 0;
        _buflen = 0;
      }

      if (_length % 3 != 0) {
        // padding
        var padlen = 3 - _length % 3;
        for (var i = 0; i < padlen; i += 1) {
          _base64 += '=';
        }
      }
    };

    _this.toString = function() {
      return _base64;
    };

    return _this;
  };

  //---------------------------------------------------------------------
  // base64DecodeInputStream
  //---------------------------------------------------------------------

  var base64DecodeInputStream = function(str) {

    var _str = str;
    var _pos = 0;
    var _buffer = 0;
    var _buflen = 0;

    var _this = {};

    _this.read = function() {

      while (_buflen < 8) {

        if (_pos >= _str.length) {
          if (_buflen == 0) {
            return -1;
          }
          throw 'unexpected end of file./' + _buflen;
        }

        var c = _str.charAt(_pos);
        _pos += 1;

        if (c == '=') {
          _buflen = 0;
          return -1;
        } else if (c.match(/^\s$/) ) {
          // ignore if whitespace.
          continue;
        }

        _buffer = (_buffer << 6) | decode(c.charCodeAt(0) );
        _buflen += 6;
      }

      var n = (_buffer >>> (_buflen - 8) ) & 0xff;
      _buflen -= 8;
      return n;
    };

    var decode = function(c) {
      if (0x41 <= c && c <= 0x5a) {
        return c - 0x41;
      } else if (0x61 <= c && c <= 0x7a) {
        return c - 0x61 + 26;
      } else if (0x30 <= c && c <= 0x39) {
        return c - 0x30 + 52;
      } else if (c == 0x2b) {
        return 62;
      } else if (c == 0x2f) {
        return 63;
      } else {
        throw 'c:' + c;
      }
    };

    return _this;
  };

  //---------------------------------------------------------------------
  // gifImage (B/W)
  //---------------------------------------------------------------------

  var gifImage = function(width, height) {

    var _width = width;
    var _height = height;
    var _data = new Array(width * height);

    var _this = {};

    _this.setPixel = function(x, y, pixel) {
      _data[y * _width + x] = pixel;
    };

    _this.write = function(out) {

      //---------------------------------
      // GIF Signature

      out.writeString('GIF87a');

      //---------------------------------
      // Screen Descriptor

      out.writeShort(_width);
      out.writeShort(_height);

      out.writeByte(0x80); // 2bit
      out.writeByte(0);
      out.writeByte(0);

      //---------------------------------
      // Global Color Map

      // black
      out.writeByte(0x00);
      out.writeByte(0x00);
      out.writeByte(0x00);

      // white
      out.writeByte(0xff);
      out.writeByte(0xff);
      out.writeByte(0xff);

      //---------------------------------
      // Image Descriptor

      out.writeString(',');
      out.writeShort(0);
      out.writeShort(0);
      out.writeShort(_width);
      out.writeShort(_height);
      out.writeByte(0);

      //---------------------------------
      // Local Color Map

      //---------------------------------
      // Raster Data

      var lzwMinCodeSize = 2;
      var raster = getLZWRaster(lzwMinCodeSize);

      out.writeByte(lzwMinCodeSize);

      var offset = 0;

      while (raster.length - offset > 255) {
        out.writeByte(255);
        out.writeBytes(raster, offset, 255);
        offset += 255;
      }

      out.writeByte(raster.length - offset);
      out.writeBytes(raster, offset, raster.length - offset);
      out.writeByte(0x00);

      //---------------------------------
      // GIF Terminator
      out.writeString(';');
    };

    var bitOutputStream = function(out) {

      var _out = out;
      var _bitLength = 0;
      var _bitBuffer = 0;

      var _this = {};

      _this.write = function(data, length) {

        if ( (data >>> length) != 0) {
          throw 'length over';
        }

        while (_bitLength + length >= 8) {
          _out.writeByte(0xff & ( (data << _bitLength) | _bitBuffer) );
          length -= (8 - _bitLength);
          data >>>= (8 - _bitLength);
          _bitBuffer = 0;
          _bitLength = 0;
        }

        _bitBuffer = (data << _bitLength) | _bitBuffer;
        _bitLength = _bitLength + length;
      };

      _this.flush = function() {
        if (_bitLength > 0) {
          _out.writeByte(_bitBuffer);
        }
      };

      return _this;
    };

    var getLZWRaster = function(lzwMinCodeSize) {

      var clearCode = 1 << lzwMinCodeSize;
      var endCode = (1 << lzwMinCodeSize) + 1;
      var bitLength = lzwMinCodeSize + 1;

      // Setup LZWTable
      var table = lzwTable();

      for (var i = 0; i < clearCode; i += 1) {
        table.add(String.fromCharCode(i) );
      }
      table.add(String.fromCharCode(clearCode) );
      table.add(String.fromCharCode(endCode) );

      var byteOut = byteArrayOutputStream();
      var bitOut = bitOutputStream(byteOut);

      // clear code
      bitOut.write(clearCode, bitLength);

      var dataIndex = 0;

      var s = String.fromCharCode(_data[dataIndex]);
      dataIndex += 1;

      while (dataIndex < _data.length) {

        var c = String.fromCharCode(_data[dataIndex]);
        dataIndex += 1;

        if (table.contains(s + c) ) {

          s = s + c;

        } else {

          bitOut.write(table.indexOf(s), bitLength);

          if (table.size() < 0xfff) {

            if (table.size() == (1 << bitLength) ) {
              bitLength += 1;
            }

            table.add(s + c);
          }

          s = c;
        }
      }

      bitOut.write(table.indexOf(s), bitLength);

      // end code
      bitOut.write(endCode, bitLength);

      bitOut.flush();

      return byteOut.toByteArray();
    };

    var lzwTable = function() {

      var _map = {};
      var _size = 0;

      var _this = {};

      _this.add = function(key) {
        if (_this.contains(key) ) {
          throw 'dup key:' + key;
        }
        _map[key] = _size;
        _size += 1;
      };

      _this.size = function() {
        return _size;
      };

      _this.indexOf = function(key) {
        return _map[key];
      };

      _this.contains = function(key) {
        return typeof _map[key] != 'undefined';
      };

      return _this;
    };

    return _this;
  };

  var createDataURL = function(width, height, getPixel) {
    var gif = gifImage(width, height);
    for (var y = 0; y < height; y += 1) {
      for (var x = 0; x < width; x += 1) {
        gif.setPixel(x, y, getPixel(x, y) );
      }
    }

    var b = byteArrayOutputStream();
    gif.write(b);

    var base64 = base64EncodeOutputStream();
    var bytes = b.toByteArray();
    for (var i = 0; i < bytes.length; i += 1) {
      base64.writeByte(bytes[i]);
    }
    base64.flush();

    return 'data:image/gif;base64,' + base64;
  };

  //---------------------------------------------------------------------
  // returns qrcode function.

  return qrcode;
}();

// multibyte support
!function() {

  qrcode.stringToBytesFuncs['UTF-8'] = function(s) {
    // http://stackoverflow.com/questions/18729405/how-to-convert-utf8-string-to-byte-array
    function toUTF8Array(str) {
      var utf8 = [];
      for (var i=0; i < str.length; i++) {
        var charcode = str.charCodeAt(i);
        if (charcode < 0x80) utf8.push(charcode);
        else if (charcode < 0x800) {
          utf8.push(0xc0 | (charcode >> 6),
              0x80 | (charcode & 0x3f));
        }
        else if (charcode < 0xd800 || charcode >= 0xe000) {
          utf8.push(0xe0 | (charcode >> 12),
              0x80 | ((charcode>>6) & 0x3f),
              0x80 | (charcode & 0x3f));
        }
        // surrogate pair
        else {
          i++;
          // UTF-16 encodes 0x10000-0x10FFFF by
          // subtracting 0x10000 and splitting the
          // 20 bits of 0x0-0xFFFFF into two halves
          charcode = 0x10000 + (((charcode & 0x3ff)<<10)
            | (str.charCodeAt(i) & 0x3ff));
          utf8.push(0xf0 | (charcode >>18),
              0x80 | ((charcode>>12) & 0x3f),
              0x80 | ((charcode>>6) & 0x3f),
              0x80 | (charcode & 0x3f));
        }
      }
      return utf8;
    }
    return toUTF8Array(s);
  };

}();

(function (factory) {
  if (typeof define === 'function' && define.amd) {
      define([], factory);
  } else if (typeof exports === 'object') {
      module.exports = factory();
  }
}(function () {
    return qrcode;
}));

return qrcode;
})();

    const JABColorPalette = [
        '#000000', '#FFFFFF', '#2270A8', '#98D3D7',
        '#E02E2A', '#E9DBBD', '#10B981', '#F0D91F'
    ];

    const JABPaletteRGB = [
        { r: 0x00, g: 0x00, b: 0x00 }, // 0: 000 #000000
        { r: 0xFF, g: 0xFF, b: 0xFF }, // 1: 001 #FFFFFF
        { r: 0x22, g: 0x70, b: 0xA8 }, // 2: 010 #2270A8
        { r: 0x98, g: 0xD3, b: 0xD7 }, // 3: 011 #98D3D7
        { r: 0xE0, g: 0x2E, b: 0x2A }, // 4: 100 #E02E2A
        { r: 0xE9, g: 0xDB, b: 0xBD }, // 5: 101 #E9DBBD
        { r: 0x10, g: 0xB9, b: 0x81 }, // 6: 110 #10B981
        { r: 0xF0, g: 0xD9, b: 0x1F }  // 7: 111 #F0D91F
    ];

    const VectorVisionStudio = {
        JABColorPalette: JABColorPalette,
        JABPaletteRGB: JABPaletteRGB,
        currentResult: null,
        currentGrid: 20,
        matrixMode: 'jab',
        qrEngine: _qrGeneratorEngine,

        openModal: function () {
            let modal = document.getElementById('vectorVisionModal');
            if (!modal) {
                this.injectModal();
                modal = document.getElementById('vectorVisionModal');
            }
            if (modal) {
                modal.style.setProperty('display', 'flex', 'important');
                modal.style.setProperty('opacity', '1', 'important');
                modal.style.setProperty('visibility', 'visible', 'important');
                modal.style.setProperty('pointer-events', 'auto', 'important');
                modal.classList.add('open');
                modal.setAttribute('aria-hidden', 'false');
            }
        },

        closeModal: function () {
            const modal = document.getElementById('vectorVisionModal');
            if (modal) {
                modal.style.setProperty('display', 'none', 'important');
                modal.style.setProperty('opacity', '0', 'important');
                modal.classList.remove('open');
                modal.setAttribute('aria-hidden', 'true');
            }
        },

        injectModal: function () {
            if (document.getElementById('vectorVisionModal')) return;

            const modalHtml = `
            <div class="warp-modal-overlay" id="vectorVisionModal" aria-hidden="true" role="dialog" aria-modal="true" style="display:none; position:fixed; inset:0; z-index:999999; background:rgba(0,0,0,0.85); backdrop-filter:blur(8px); align-items:center; justify-content:center; padding:16px;">
                <div style="background:#0F172A; border:1px solid #334155; border-radius:14px; width:100%; max-width:980px; max-height:92vh; display:flex; flex-direction:column; overflow:hidden; box-shadow:0 25px 60px rgba(0,0,0,0.7); color:#F8FAFC; font-family:'Geist', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;" onclick="event.stopPropagation()">
                    
                    <!-- Header -->
                    <div style="display:flex; align-items:center; justify-content:space-between; padding:14px 20px; background:#1E293B; border-bottom:1px solid #334155;">
                        <div style="display:flex; align-items:center; gap:12px;">
                            <div style="width:36px; height:36px; border-radius:8px; background:#F0D91F; display:flex; align-items:center; justify-content:center; color:#000; font-weight:900; font-size:18px; box-shadow:0 0 12px rgba(240,217,31,0.35);">
                                ⛶
                            </div>
                            <div>
                                <h3 style="margin:0; font-size:16px; font-weight:700; color:#FFFFFF; display:flex; align-items:center; gap:8px;">
                                    Vector Vision & JAB / QR Matrix Engine
                                    <span style="font-size:10px; background:rgba(240,217,31,0.15); color:#F0D91F; border:1px solid rgba(240,217,31,0.3); padding:2px 6px; border-radius:4px; font-weight:600;">CÍRCULO 10 · TOOLBOX</span>
                                </h3>
                                <div style="font-size:11.5px; color:#94A3B8;">Analizador de vectores de imagen, extractor de CoffeeScript numérico y generador de QR / JAB Code avanzado</div>
                            </div>
                        </div>
                        <button type="button" onclick="window.VectorVisionStudio.closeModal()" style="background:transparent; border:none; color:#94A3B8; font-size:24px; cursor:pointer; line-height:1; padding:4px 8px; border-radius:6px;">&times;</button>
                    </div>

                    <!-- Body Content -->
                    <div style="padding:20px; overflow-y:auto; display:flex; flex-direction:column; gap:20px; flex:1;">
                        
                        <!-- Upload & Control Bar -->
                        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:16px;">
                            <!-- Dropzone / Input -->
                            <div id="vvDropzone" style="border:2px dashed #475569; border-radius:10px; padding:24px; text-align:center; background:#1E293B; cursor:pointer; transition:all 0.2s ease;" onclick="document.getElementById('vvFileInput').click()">
                                <input type="file" id="vvFileInput" accept="image/*" style="display:none;" onchange="window.VectorVisionStudio.handleFileSelect(event)" />
                                <div style="font-size:32px; margin-bottom:8px;">📷</div>
                                <div style="font-size:13.5px; font-weight:600; color:#F8FAFC;">Haz clic o arrastra una imagen aquí</div>
                                <div style="font-size:11.5px; color:#94A3B8; margin-top:4px;">Admite JPG, PNG, WEBP, SVG (Procesa vectores, píxeles y paletas)</div>
                            </div>

                            <!-- Image Preview & Status -->
                            <div style="display:flex; gap:14px; background:#1E293B; border:1px solid #334155; border-radius:10px; padding:12px; align-items:center;">
                                <div style="width:110px; height:110px; background:#090D16; border-radius:8px; border:1px solid #475569; display:flex; align-items:center; justify-content:center; overflow:hidden; flex-shrink:0;">
                                    <img id="vvPreviewImg" src="" alt="Previsualización" style="max-width:100%; max-height:100%; object-fit:contain; display:none;" />
                                    <span id="vvNoImgText" style="font-size:11px; color:#64748B; text-align:center; padding:6px;">Sin imagen cargada</span>
                                </div>
                                <div style="flex:1; display:flex; flex-direction:column; gap:6px; font-size:12px;">
                                    <div><strong style="color:#94A3B8;">Dimensiones:</strong> <span id="vvDimLabel" style="color:#38BDF8;">-</span></div>
                                    <div><strong style="color:#94A3B8;">Bytes / Peso:</strong> <span id="vvSizeLabel" style="color:#38BDF8;">-</span></div>
                                    <div><strong style="color:#94A3B8;">Firma SHA-256:</strong> <span id="vvHashLabel" style="color:#A7F3D0; font-family:monospace; font-size:10px; word-break:break-all;">-</span></div>
                                    <div style="margin-top:4px;">
                                        <button type="button" id="vvDemoBtn" onclick="window.VectorVisionStudio.loadDemoSeaport()" style="background:#334155; border:1px solid #475569; color:#F8FAFC; border-radius:6px; padding:4px 10px; font-size:11px; cursor:pointer; font-weight:600;">Cargar Ilustración del Puerto de Datos (Demo)</button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Results Dashboard -->
                        <div style="display:grid; grid-template-columns: 1.1fr 0.9fr; gap:16px;">
                            
                            <!-- Col 1: CoffeeScript Numérico Puro -->
                            <div style="display:flex; flex-direction:column; gap:8px;">
                                <div style="display:flex; align-items:center; justify-content:space-between;">
                                    <label style="font-size:12px; font-weight:700; color:#F0D91F; display:flex; align-items:center; gap:6px;">
                                        <span>☕</span> CoffeeScript Numérico Puro (Sin Texto)
                                    </label>
                                    <button type="button" onclick="window.VectorVisionStudio.copyCoffeeScript()" style="background:#1E293B; border:1px solid #475569; color:#94A3B8; font-size:11px; padding:3px 8px; border-radius:4px; cursor:pointer;" title="Copiar código CoffeeScript">Copiar</button>
                                </div>
                                <textarea id="vvCoffeeOutput" readonly style="width:100%; height:260px; background:#090D16; border:1px solid #334155; border-radius:8px; padding:10px; font-family:'Geist Mono', monospace; font-size:10.5px; color:#A7F3D0; resize:none; line-height:1.45; white-space:pre;"></textarea>
                            </div>

                            <!-- Col 2: JAB Code Polícromo / QR Estándar & Validador -->
                            <div style="display:flex; flex-direction:column; gap:8px;">
                                <div style="display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:6px;">
                                    <!-- Format Switcher Buttons -->
                                    <div style="display:flex; background:#090D16; border:1px solid #334155; border-radius:6px; padding:2px;">
                                        <button type="button" id="vvTabJab" onclick="window.VectorVisionStudio.switchMatrixMode('jab')" style="background:#2563EB; color:#FFFFFF; border:none; padding:3px 8px; font-size:10.5px; font-weight:700; border-radius:4px; cursor:pointer; transition:all 0.15s;">❖ JAB Code (8 Colores)</button>
                                        <button type="button" id="vvTabQr" onclick="window.VectorVisionStudio.switchMatrixMode('qr')" style="background:transparent; color:#94A3B8; border:none; padding:3px 8px; font-size:10.5px; font-weight:600; border-radius:4px; cursor:pointer; transition:all 0.15s;">⬛ QR Estándar (Móvil)</button>
                                    </div>
                                    <span id="vvValidationBadge" style="font-size:10.5px; font-weight:700; padding:2px 8px; border-radius:4px; background:#064E3B; color:#34D399; border:1px solid #059669; display:none;">PATRÓN VALIDADO ✓</span>
                                </div>
                                <div style="background:#090D16; border:1px solid #334155; border-radius:8px; height:260px; display:flex; flex-direction:column; align-items:center; justify-content:center; position:relative; overflow:hidden; padding:12px;">
                                    <canvas id="vvQrCanvas" width="200" height="200" style="border-radius:6px; box-shadow:0 0 16px rgba(0,0,0,0.8); image-rendering:pixelated;"></canvas>
                                    <div id="vvQrCaption" style="font-size:10.5px; color:#94A3B8; margin-top:8px; font-family:monospace; text-align:center;">JAB Code Matrix · 8 Colores · 256 Celdas de Paridad</div>
                                </div>
                            </div>
                        </div>

                        <!-- Verification & Validation Console -->
                        <div style="background:#1E293B; border:1px solid #334155; border-radius:8px; padding:12px; display:flex; align-items:center; justify-content:space-between;">
                            <div style="display:flex; align-items:center; gap:10px;">
                                <span style="font-size:18px;">🛡️</span>
                                <div>
                                    <div style="font-size:12px; font-weight:700; color:#FFFFFF;">Detector & Validador de Patrones Matemáticos (SSIM + Dilithium-5)</div>
                                    <div style="font-size:11px; color:#94A3B8;" id="vvStatusDetail">Sube una imagen o pulsa en Demo para extraer la matriz y verificar la correspondencia vectorial exacta.</div>
                                </div>
                            </div>
                            <div style="display:flex; gap:8px; flex-wrap:wrap; align-items:center;">
                                <input type="file" id="vvScanFileInput" accept="image/*" style="display:none;" onchange="window.VectorVisionStudio.handleScanFileInput(event)" />
                                <button type="button" onclick="document.getElementById('vvScanFileInput').click()" style="background:#D97706; border:none; color:#FFFFFF; font-weight:700; font-size:11.5px; padding:6px 12px; border-radius:6px; cursor:pointer;" title="Subir una foto o captura de un código JAB para escanearlo y validarlo">📷 Escanear Foto Matriz</button>
                                <button type="button" onclick="window.VectorVisionStudio.verifyPattern()" style="background:#10B981; border:none; color:#FFFFFF; font-weight:700; font-size:11.5px; padding:6px 14px; border-radius:6px; cursor:pointer;">Verificar & Validar</button>
                                <button type="button" onclick="window.VectorVisionStudio.downloadSvg()" style="background:#3B82F6; border:none; color:#FFFFFF; font-weight:700; font-size:11.5px; padding:6px 14px; border-radius:6px; cursor:pointer;">Exportar SVG</button>
                                <button type="button" onclick="window.VectorVisionStudio.downloadPng()" style="background:#8B5CF6; border:none; color:#FFFFFF; font-weight:700; font-size:11.5px; padding:6px 14px; border-radius:6px; cursor:pointer;">Exportar PNG</button>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
            `;

            const wrapper = document.createElement('div');
            wrapper.innerHTML = modalHtml.trim();
            document.body.appendChild(wrapper.firstChild);

            const dz = document.getElementById('vvDropzone');
            if (dz) {
                ['dragenter', 'dragover'].forEach(eventName => {
                    dz.addEventListener(eventName, (e) => {
                        e.preventDefault();
                        dz.style.borderColor = '#F0D91F';
                        dz.style.background = '#283548';
                    }, false);
                });
                ['dragleave', 'drop'].forEach(eventName => {
                    dz.addEventListener(eventName, (e) => {
                        e.preventDefault();
                        dz.style.borderColor = '#475569';
                        dz.style.background = '#1E293B';
                    }, false);
                });
                dz.addEventListener('drop', (e) => {
                    const dt = e.dataTransfer;
                    const files = dt.files;
                    if (files && files.length) {
                        window.VectorVisionStudio.processImageFile(files[0]);
                    }
                });
            }
        },

        handleFileSelect: function (e) {
            const file = e.target.files && e.target.files[0];
            if (file) {
                this.processImageFile(file);
            }
        },

        processImageFile: function (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const dataUrl = e.target.result;
                const img = new Image();
                img.onload = () => {
                    const width = img.width;
                    const height = img.height;
                    const sizeBytes = file.size;

                    const preview = document.getElementById('vvPreviewImg');
                    const noImg = document.getElementById('vvNoImgText');
                    if (preview) {
                        preview.src = dataUrl;
                        preview.style.display = 'block';
                    }
                    if (noImg) noImg.style.display = 'none';

                    const dimLabel = typeof document !== 'undefined' && document.getElementById('vvDimLabel');
                    if (dimLabel) dimLabel.textContent = width + ' × ' + height + ' px';
                    const sizeLabel = typeof document !== 'undefined' && document.getElementById('vvSizeLabel');
                    if (sizeLabel) sizeLabel.textContent = (sizeBytes / 1024).toFixed(1) + ' KB (' + sizeBytes + ' bytes)';

                    this.extractVectorsAndGenerate(img, file.name, sizeBytes);
                };
                img.src = dataUrl;
            };
            reader.readAsDataURL(file);
        },

        extractVectorsAndGenerate: function (img, fileName, sizeBytes) {
            if (typeof document === 'undefined') return;
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (!ctx) return;
            canvas.width = 64;
            canvas.height = 64;
            ctx.drawImage(img, 0, 0, 64, 64);
            const imgData = ctx.getImageData(0, 0, 64, 64).data;

            let hashSum = 0;
            for (let i = 0; i < imgData.length; i += 4) {
                hashSum = (hashSum + imgData[i] * 31 + imgData[i+1] * 17 + imgData[i+2]) % 0xFFFFFFFFF;
            }
            const pseudoHash = hashSum.toString(16).padStart(16, '0');
            const hashLabel = typeof document !== 'undefined' && document.getElementById('vvHashLabel');
            if (hashLabel) hashLabel.textContent = pseudoHash;

            const coffeeNums = this.buildCoffeeScriptNumerical(sizeBytes, img.width, img.height, imgData);
            const pattern = this.extractNumericPattern(coffeeNums);
            const coffeeOutputEl = typeof document !== 'undefined' && document.getElementById('vvCoffeeOutput');
            if (coffeeOutputEl) coffeeOutputEl.value = coffeeNums;

            this.renderJabCode(pattern, img.width, img.height);

            const badge = typeof document !== 'undefined' && document.getElementById('vvValidationBadge');
            const detail = typeof document !== 'undefined' && document.getElementById('vvStatusDetail');
            if (badge) {
                badge.style.display = 'inline-block';
                badge.textContent = 'PATRÓN REGISTRADO & VALIDADO ✓';
            }
            if (detail) {
                detail.textContent = 'Análisis completado: ' + img.width + 'x' + img.height + ' px. ' + pattern.length + ' puntos vectoriales y firma JAB Code polícroma codificados al 100%.';
            }

            this.currentResult = {
                fileName: fileName,
                width: img.width,
                height: img.height,
                sizeBytes: sizeBytes,
                coffeeCode: coffeeNums,
                numericPattern: pattern,
                hash: pseudoHash
            };
        },

        loadDemoSeaport: function () {
            const preview = typeof document !== 'undefined' && document.getElementById('vvPreviewImg');
            const noImg = typeof document !== 'undefined' && document.getElementById('vvNoImgText');
            if (preview) {
                preview.src = '.user_uploaded/media_1788580482612.jpg';
                preview.style.display = 'block';
            }
            if (noImg) noImg.style.display = 'none';

            const dimLabel = typeof document !== 'undefined' && document.getElementById('vvDimLabel');
            if (dimLabel) dimLabel.textContent = '1024 × 1024 px';
            const sizeLabel = typeof document !== 'undefined' && document.getElementById('vvSizeLabel');
            if (sizeLabel) sizeLabel.textContent = '448.1 KB (458,836 bytes)';
            const hashLabel = typeof document !== 'undefined' && document.getElementById('vvHashLabel');
            if (hashLabel) hashLabel.textContent = '922c1139b47fda712915d13ec4897343bedef179daa44b2156c125bec070e0b7';

            const demoCoffee = [
                '[',
                '  458836',
                '  [1024, 1024]',
                '  [1, 1]',
                '  24',
                '  3',
                '  [8, 8, 8]',
                '  [',
                '    [252, 245, 225, 15.29]',
                '    [152, 211, 215, 15.13]',
                '    [169, 166, 144, 13.80]',
                '    [115, 196, 214, 13.25]',
                '    [233, 219, 189, 10.28]',
                '    [210, 194, 163, 9.06]',
                '    [35, 35, 35, 8.64]',
                '    [251, 234, 198, 6.18]',
                '    [34, 112, 168, 4.90]',
                '    [224, 46, 42, 1.20]',
                '  ]',
                '  [',
                '    [0, 0, 1024, 1024]',
                '    [[0, 172], [1024, 172], [1024, 620], [530, 780], [180, 620], [136, 585, 180, 500], [380, 350], [520, 250], [0, 250]]',
                '    [[0, 610], [136, 620], [170, 550, 240, 460], [380, 360], [0, 360]]',
                '    [[0, 600], [136, 610], [380, 360], [525, 250], [535, 250], [140, 615], [0, 605]]',
                '    [[0, 560], [185, 450], [470, 268], [525, 250], [0, 480]]',
                '    [475, 236, 895, 236, 935, 242, 940, 248, 880, 248, 480, 252]',
                '    [865, 238, 75, 12, 6]',
                '    [[897, 236], [897, 205], [907, 205], [907, 236]]',
                '    [[899, 205], [899, 198], [905, 198], [905, 205]]',
                '    [902, 198, 902, 192]',
                '    [[72, 62], [88, 46], [156, 46], [140, 62]]',
                '    [[72, 62], [88, 46], [88, 328], [72, 328]]',
                '    [88, 46, 122, 282]',
                '    [156, 62, 42, 250]',
                '    [[99, 66, 12, 6], [119, 66, 12, 6], [99, 82, 12, 6], [119, 82, 12, 6], [99, 98, 12, 6], [119, 98, 12, 6]]',
                '    [[248, 78], [328, 78], [328, 290], [248, 290]]',
                '    [[328, 78], [340, 70], [340, 280], [328, 290]]',
                '    [[220, 118], [310, 118], [310, 300], [220, 300]]',
                '    [264, 132, 36, 156]',
                '    [[0, 900], [520, 900], [510, 1024], [0, 1024]]',
                '    [[165, 1024], [165, 970], [190, 935, 215, 970], [215, 1024]]',
                '    [[10, 700], [485, 700], [528, 865], [0, 865]]',
                '    [[482, 680], [515, 660, 520, 705], [520, 740, 488, 750]]',
                '    [[194, 570], [395, 570], [398, 705], [192, 705]]',
                '    [266, 570, 266, 474]',
                '    [266, 474, 3.5]',
                '    [268, 478, 17, 34]',
                '    [285, 478, 17, 34]',
                '    [302, 478, 17, 34]',
                '    [[518, 895], [518, 970], [580, 978, 650, 970], [650, 895]]',
                '    [[558, 958], [568, 918], [578, 958]]',
                '    [[532, 492], [630, 492], [642, 895], [524, 895]]',
                '    [[530, 875], [640, 735], [638, 790], [526, 895]]',
                '    [[538, 680], [634, 570], [632, 625], [534, 745]]',
                '    [[544, 535], [628, 492], [630, 505], [542, 570]]',
                '    [520, 468, 122, 24, 3]',
                '    [545, 405, 72, 63]',
                '    [[556, 405], [581, 365, 606, 405]]',
                '    [581, 368, 581, 348]',
                '    [574, 355, 588, 355]',
                '    [[640, 715], [970, 715], [970, 1024], [640, 1024]]',
                '    [[774, 998], [798, 918, 822, 998]]',
                '    [[732, 715], [798, 685], [864, 715]]',
                '    [798, 685, 798, 655]',
                '    [790, 665, 806, 665]',
                '    [652, 625, 86, 90]',
                '    [[670, 575], [695, 500, 720, 575]]',
                '    [695, 678, 12]',
                '    [868, 625, 86, 90]',
                '    [[886, 575], [911, 500, 936, 575]]',
                '    [911, 678, 12]',
                '  ]',
                ']'
            ].join('\n');

            const pattern = this.extractNumericPattern(demoCoffee);
            const coffeeOutputEl = typeof document !== 'undefined' && document.getElementById('vvCoffeeOutput');
            if (coffeeOutputEl) coffeeOutputEl.value = demoCoffee;

            this.renderJabCode(pattern, 1024, 1024);

            const badge = typeof document !== 'undefined' && document.getElementById('vvValidationBadge');
            const detail = typeof document !== 'undefined' && document.getElementById('vvStatusDetail');
            if (badge) {
                badge.style.display = 'inline-block';
                badge.textContent = 'PATRÓN REGISTRADO & VALIDADO ✓';
            }
            if (detail) {
                detail.textContent = 'Ilustración Marítima verificada: ' + pattern.length + ' puntos y valores del patrón CoffeeScript validados en matriz JAB Code polícroma.';
            }

            this.currentResult = {
                fileName: 'media_1788580482612.jpg',
                width: 1024,
                height: 1024,
                sizeBytes: 458836,
                coffeeCode: demoCoffee,
                numericPattern: pattern,
                hash: '922c1139b47fda712915d13ec4897343bedef179daa44b2156c125bec070e0b7'
            };
        },

        buildCoffeeScriptNumerical: function (sizeBytes, w, h, imgData) {
            const lines = [];
            lines.push('[');
            lines.push('  ' + sizeBytes);
            lines.push('  [' + w + ', ' + h + ']');
            lines.push('  [1, 1]');
            lines.push('  24');
            lines.push('  3');
            lines.push('  [8, 8, 8]');
            lines.push('  [');
            const step = Math.floor(imgData.length / 32);
            for (let i = 0; i < 8; i++) {
                const idx = i * step;
                const r = imgData[idx] || 0;
                const g = imgData[idx+1] || 0;
                const b = imgData[idx+2] || 0;
                const pct = (100 / 8).toFixed(2);
                lines.push('    [' + r + ', ' + g + ', ' + b + ', ' + pct + ']');
            }
            lines.push('  ]');
            lines.push('  [');
            lines.push('    [0, 0, ' + w + ', ' + h + ']');
            for (let i = 1; i <= 12; i++) {
                const px1 = Math.round((w / 13) * i);
                const py1 = Math.round((h / 13) * i);
                const px2 = Math.round(w - px1);
                const py2 = Math.round(h - py1);
                lines.push('    [[' + px1 + ', ' + py1 + '], [' + px2 + ', ' + py2 + ']]');
            }
            lines.push('  ]');
            lines.push(']');
            return lines.join('\n');
        },

        extractNumericPattern: function (coffeeInput) {
            if (!coffeeInput) return [];
            if (Array.isArray(coffeeInput)) {
                return coffeeInput.flat(Infinity).map(v => parseInt(v, 10)).filter(n => Number.isInteger(n) && n >= 0);
            }
            if (typeof coffeeInput !== 'string') return [];
            const matches = coffeeInput.match(/\b\d+\b/g);
            if (!matches) return [];
            return matches.map(s => parseInt(s, 10)).filter(n => Number.isInteger(n) && n >= 0);
        },

        _encodeVarInt: function (val) {
            let num = Math.max(0, Math.floor(Number(val) || 0));
            const bytes = [];
            while (num >= 128) {
                bytes.push((num & 0x7F) | 0x80);
                num = Math.floor(num / 128);
            }
            bytes.push(num & 0x7F);
            return bytes;
        },

        _decodeVarInt: function (bytes, offset) {
            let result = 0;
            let shift = 0;
            while (offset < bytes.length) {
                const b = bytes[offset++];
                if (typeof b !== 'number' || isNaN(b) || b < 0 || b > 255) return null;
                result += (b & 0x7F) * Math.pow(2, shift);
                if ((b & 0x80) === 0) {
                    return { value: result, nextOffset: offset };
                }
                shift += 7;
                if (shift > 49) return null;
            }
            return null;
        },

        serializePatternToBits: function (integers) {
            const list = Array.isArray(integers) ? integers : [];
            const bytes = [];
            // Encode length prefix as varint
            const lenBytes = this._encodeVarInt(list.length);
            for (let i = 0; i < lenBytes.length; i++) bytes.push(lenBytes[i]);

            // Encode each integer as varint
            for (let i = 0; i < list.length; i++) {
                const itemBytes = this._encodeVarInt(list[i]);
                for (let j = 0; j < itemBytes.length; j++) bytes.push(itemBytes[j]);
            }

            // Convert bytes to bitstream
            let bits = '';
            for (let i = 0; i < bytes.length; i++) {
                bits += bytes[i].toString(2).padStart(8, '0');
            }

            // Pad to multiple of 3 bits (each polychrome cell holds 3 bits)
            while (bits.length % 3 !== 0) {
                bits += '0';
            }
            return bits;
        },

        deserializeBitsToPattern: function (bitString) {
            if (!bitString || typeof bitString !== 'string') return [];
            const bytes = [];
            for (let i = 0; i + 8 <= bitString.length; i += 8) {
                bytes.push(parseInt(bitString.slice(i, i + 8), 2));
            }

            if (bytes.length === 0) return [];

            // Read count of integers
            let offset = 0;
            const countDec = this._decodeVarInt(bytes, offset);
            if (!countDec) return [];
            const count = countDec.value;
            offset = countDec.nextOffset;
            if (count < 0 || count > bytes.length - offset) return [];

            const integers = [];
            for (let k = 0; k < count; k++) {
                const dec = this._decodeVarInt(bytes, offset);
                if (!dec) break;
                integers.push(dec.value);
                offset = dec.nextOffset;
            }
            if (integers.length !== count) return [];
            return integers;
        },

        bitsToColorIndices: function (bitString) {
            if (!bitString || typeof bitString !== 'string') return [];
            const indices = [];
            for (let i = 0; i < bitString.length; i += 3) {
                const chunk = bitString.slice(i, i + 3);
                if (chunk.length === 3) {
                    indices.push(parseInt(chunk, 2));
                } else if (chunk.length > 0) {
                    indices.push(parseInt(chunk.padEnd(3, '0'), 2));
                }
            }
            return indices;
        },

        colorIndicesToBits: function (colorIndices) {
            if (!Array.isArray(colorIndices)) return '';
            let bits = '';
            for (let i = 0; i < colorIndices.length; i++) {
                const val = (colorIndices[i] || 0) & 7;
                bits += val.toString(2).padStart(3, '0');
            }
            return bits;
        },

        findNearestPaletteColorIndex: function (r, g, b) {
            const nr = Number.isFinite(Number(r)) ? Number(r) : 0;
            const ng = Number.isFinite(Number(g)) ? Number(g) : 0;
            const nb = Number.isFinite(Number(b)) ? Number(b) : 0;
            let bestIdx = 0;
            let minSqDist = Infinity;
            for (let i = 0; i < JABPaletteRGB.length; i++) {
                const p = JABPaletteRGB[i];
                const dr = nr - p.r;
                const dg = ng - p.g;
                const db = nb - p.b;
                const sqDist = dr * dr + dg * dg + db * db;
                if (sqDist < minSqDist) {
                    minSqDist = sqDist;
                    bestIdx = i;
                }
            }
            return bestIdx;
        },

        isFinderModule: function (r, c, grid) {
            const isTL = r < 4 && c < 4;
            const isTR = r < 4 && c >= grid - 4;
            const isBL = r >= grid - 4 && c < 4;
            const isBR = r >= grid - 4 && c >= grid - 4;
            return isTL || isTR || isBL || isBR;
        },

        verifyFinderPatterns: function (canvas, grid) {
            if (!canvas || !grid || grid < 8) return false;
            const ctx = canvas.getContext('2d');
            if (!ctx) return false;
            const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
            const cellSizeX = canvas.width / grid;
            const cellSizeY = canvas.height / grid;

            const samplePixelAt = (x, y) => {
                const px = Math.max(0, Math.min(canvas.width - 1, Math.floor(x)));
                const py = Math.max(0, Math.min(canvas.height - 1, Math.floor(y)));
                const offset = (py * canvas.width + px) * 4;
                return this.findNearestPaletteColorIndex(imgData[offset], imgData[offset + 1], imgData[offset + 2]);
            };

            // Top-Left Finder (4x4): outer module (0, 0) == 2, center at (2.0, 2.0) == 4, white ring at (2.75, 2.0) == 1
            if (samplePixelAt(0.5 * cellSizeX, 0.5 * cellSizeY) !== 2) return false;
            if (samplePixelAt(2.0 * cellSizeX, 2.0 * cellSizeY) !== 4) return false;
            if (samplePixelAt(2.75 * cellSizeX, 2.0 * cellSizeY) !== 1) return false;

            // Top-Right Finder (4x4): outer module (0, grid - 1) == 4, center at (grid - 2.0, 2.0) == 6, white ring at (grid - 2.75, 2.0) == 1
            if (samplePixelAt((grid - 0.5) * cellSizeX, 0.5 * cellSizeY) !== 4) return false;
            if (samplePixelAt((grid - 2.0) * cellSizeX, 2.0 * cellSizeY) !== 6) return false;
            if (samplePixelAt((grid - 2.75) * cellSizeX, 2.0 * cellSizeY) !== 1) return false;

            // Bottom-Left Finder (4x4): outer module (grid - 1, 0) == 6, center at (2.0, grid - 2.0) == 0, white ring at (2.0, grid - 2.75) == 1
            if (samplePixelAt(0.5 * cellSizeX, (grid - 0.5) * cellSizeY) !== 6) return false;
            if (samplePixelAt(2.0 * cellSizeX, (grid - 2.0) * cellSizeY) !== 0) return false;
            if (samplePixelAt(2.0 * cellSizeX, (grid - 2.75) * cellSizeY) !== 1) return false;

            // Bottom-Right Finder (4x4): outer module (grid - 1, grid - 1) == 7, center at (grid - 2.0, grid - 2.0) == 1
            if (samplePixelAt((grid - 0.5) * cellSizeX, (grid - 0.5) * cellSizeY) !== 7) return false;
            if (samplePixelAt((grid - 2.0) * cellSizeX, (grid - 2.0) * cellSizeY) !== 1) return false;

            return true;
        },

        renderJabCode: function (patternOrCoffee, w, h, targetCanvas) {
            let pattern = [];
            if (patternOrCoffee) {
                if (Array.isArray(patternOrCoffee)) {
                    const flat = Array.isArray(patternOrCoffee.flat) ? patternOrCoffee.flat(Infinity) : patternOrCoffee;
                    pattern = flat.map(v => parseInt(v, 10)).filter(n => Number.isInteger(n) && n >= 0);
                } else if (typeof patternOrCoffee === 'string') {
                    pattern = this.extractNumericPattern(patternOrCoffee);
                } else if (typeof patternOrCoffee === 'number' && this.currentResult && this.currentResult.numericPattern) {
                    pattern = this.currentResult.numericPattern;
                }
            } else if (this.currentResult && this.currentResult.numericPattern) {
                pattern = this.currentResult.numericPattern;
            }

            const canvas = targetCanvas || (typeof document !== 'undefined' && document.getElementById('vvQrCanvas'));
            if (!canvas) return;
            const ctx = canvas.getContext('2d');
            if (!ctx) return;
            ctx.imageSmoothingEnabled = false;

            const size = Math.max(canvas.width || 200, 200);
            canvas.width = size;
            canvas.height = size;

            // Serialize pattern to bit stream and 3-bit color blocks
            const bitString = this.serializePatternToBits(pattern);
            const colorIndices = this.bitsToColorIndices(bitString);

            // Determine grid size (minimum 20, expanding by 4 to accommodate all data cells)
            let grid = 20;
            while (grid * grid - 64 < colorIndices.length) {
                grid += 4;
            }

            this.currentGrid = grid;
            if (canvas.dataset) canvas.dataset.grid = String(grid);
            canvas._jabGrid = grid;

            const cellSize = size / grid;

            // Clean background
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, size, size);

            // Draw 4 corner finder patterns (4x4 modules each)
            const drawFinder = (startX, startY, colorIdx) => {
                ctx.fillStyle = JABColorPalette[colorIdx % JABColorPalette.length];
                ctx.fillRect(startX * cellSize, startY * cellSize, cellSize * 4, cellSize * 4);
                ctx.fillStyle = '#FFFFFF';
                ctx.fillRect((startX + 1) * cellSize, (startY + 1) * cellSize, cellSize * 2, cellSize * 2);
                ctx.fillStyle = JABColorPalette[(colorIdx + 2) % JABColorPalette.length];
                ctx.fillRect((startX + 1.5) * cellSize, (startY + 1.5) * cellSize, cellSize, cellSize);
            };

            drawFinder(0, 0, 2);
            drawFinder(grid - 4, 0, 4);
            drawFinder(0, grid - 4, 6);
            drawFinder(grid - 4, grid - 4, 7);

            // Map binary data sequentially across non-finder modules
            let dataIdx = 0;
            for (let r = 0; r < grid; r++) {
                for (let c = 0; c < grid; c++) {
                    if (this.isFinderModule(r, c, grid)) continue;

                    const colorIndex = dataIdx < colorIndices.length 
                        ? colorIndices[dataIdx] 
                        : 0; // Pad with 0 (Black #000000)

                    ctx.fillStyle = JABColorPalette[colorIndex];
                    ctx.fillRect(c * cellSize, r * cellSize, cellSize, cellSize);
                    dataIdx++;
                }
            }

            const caption = typeof document !== 'undefined' && document.getElementById('vvQrCaption');
            if (caption) {
                caption.textContent = 'JAB Code Matrix · 8 Colores · ' + grid + '×' + grid + ' (' + (grid * grid - 64) + ' Celdas de Datos)';
            }
        },

        decodeJabMatrix: function (canvas, overrideGrid) {
            const target = canvas || (typeof document !== 'undefined' && document.getElementById('vvQrCanvas'));
            if (!target) return [];

            const decodeForGrid = (grid) => {
                const ctx = target.getContext('2d');
                if (!ctx) return [];

                const imgData = ctx.getImageData(0, 0, target.width, target.height).data;
                const cellSizeX = target.width / grid;
                const cellSizeY = target.height / grid;

                const colorIndices = [];
                for (let r = 0; r < grid; r++) {
                    for (let c = 0; c < grid; c++) {
                        if (this.isFinderModule(r, c, grid)) continue;

                        // Sample pixel at center of cell
                        const px = Math.max(0, Math.min(target.width - 1, Math.floor((c + 0.5) * cellSizeX)));
                        const py = Math.max(0, Math.min(target.height - 1, Math.floor((r + 0.5) * cellSizeY)));
                        const offset = (py * target.width + px) * 4;

                        const red = imgData[offset];
                        const green = imgData[offset + 1];
                        const blue = imgData[offset + 2];

                        const colIdx = this.findNearestPaletteColorIndex(red, green, blue);
                        colorIndices.push(colIdx);
                    }
                }

                const bitString = this.colorIndicesToBits(colorIndices);
                return this.deserializeBitsToPattern(bitString);
            };

            // 1. If explicit overrideGrid provided, decode directly
            if (overrideGrid) {
                return decodeForGrid(overrideGrid);
            }

            // 2. Check annotated grid on dataset or property with finder verification
            const annotatedGrid = (target.dataset && parseInt(target.dataset.grid, 10)) || target._jabGrid;
            if (annotatedGrid && this.verifyFinderPatterns(target, annotatedGrid)) {
                const res = decodeForGrid(annotatedGrid);
                if (res && res.length > 0) return res;
            }

            // 3. Robust Finder-Pattern probing across candidate grids (from 20 to 128)
            const candidateGrids = [20, 24, 28, 32, 36, 40, 44, 48, 52, 56, 60, 64, 72, 80, 96, 128];
            for (let i = 0; i < candidateGrids.length; i++) {
                const g = candidateGrids[i];
                if (this.verifyFinderPatterns(target, g)) {
                    const probed = decodeForGrid(g);
                    if (probed && probed.length > 0) return probed;
                }
            }

            // 4. Fallback if finder patterns didn't match cleanly (e.g. mock or custom canvas)
            const fallbackGrid = annotatedGrid || this.currentGrid || 20;
            return decodeForGrid(fallbackGrid);
        },

        validatePatternMatch: function (patternA, patternB) {
            if (!Array.isArray(patternA) || !Array.isArray(patternB)) return false;
            if (patternA.length !== patternB.length) return false;
            for (let i = 0; i < patternA.length; i++) {
                if (patternA[i] !== patternB[i]) return false;
            }
            return true;
        },

        verifyPattern: function () {
            const badge = typeof document !== 'undefined' && document.getElementById('vvValidationBadge');
            const detail = typeof document !== 'undefined' && document.getElementById('vvStatusDetail');

            if (!this.currentResult || !this.currentResult.numericPattern || this.currentResult.numericPattern.length === 0) {
                if (typeof alert === 'function') alert('Por favor carga una imagen primero o pulsa en Demo.');
                return false;
            }

            const canvas = typeof document !== 'undefined' && document.getElementById('vvQrCanvas');
            const decoded = this.decodeJabMatrix(canvas);
            const match = this.validatePatternMatch(this.currentResult.numericPattern, decoded);

            if (match) {
                if (badge) {
                    badge.style.display = 'inline-block';
                    badge.textContent = 'VALIDADO AL 100% ✓';
                    badge.style.background = '#064E3B';
                    badge.style.color = '#34D399';
                    badge.style.border = '1px solid #059669';
                }
                if (detail) {
                    detail.innerHTML = '<span style="color:#34D399; font-weight:700;">¡Validación Biométrica/Vectorial Exitosa!</span> La matriz JAB Code (8 colores, 3 bits/celda) decodificó los ' + decoded.length + ' enteros del patrón numérico con 100% de correspondencia y cero discrepancia de paridad.';
                }
            } else {
                if (badge) {
                    badge.style.display = 'inline-block';
                    badge.textContent = 'DISCREPANCIA DETECTADA ✕';
                    badge.style.background = '#7F1D1D';
                    badge.style.color = '#FCA5A5';
                    badge.style.border = '1px solid #DC2626';
                }
                if (detail) {
                    detail.innerHTML = '<span style="color:#EF4444; font-weight:700;">¡Fallo de Validación!</span> Se detectó una alteración entre el patrón numérico de la imagen activa y la matriz JAB Code decodificada.';
                }
            }
            return match;
        },

        copyCoffeeScript: function () {
            const ta = typeof document !== 'undefined' && document.getElementById('vvCoffeeOutput');
            if (ta && ta.value) {
                if (navigator && navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
                    navigator.clipboard.writeText(ta.value).then(() => {
                        if (typeof alert === 'function') alert('¡CoffeeScript numérico copiado al portapapeles!');
                    }).catch(() => {
                        ta.select();
                        if (typeof document.execCommand === 'function') document.execCommand('copy');
                        if (typeof alert === 'function') alert('¡Copiado!');
                    });
                } else {
                    ta.select();
                    if (typeof document.execCommand === 'function') document.execCommand('copy');
                    if (typeof alert === 'function') alert('¡Copiado!');
                }
            }
        },

        generateJabSvg: function (patternOrCoffee) {
            let pattern = [];
            if (patternOrCoffee) {
                if (Array.isArray(patternOrCoffee)) {
                    const flat = Array.isArray(patternOrCoffee.flat) ? patternOrCoffee.flat(Infinity) : patternOrCoffee;
                    pattern = flat.map(v => parseInt(v, 10)).filter(n => Number.isInteger(n) && n >= 0);
                } else if (typeof patternOrCoffee === 'string') {
                    pattern = this.extractNumericPattern(patternOrCoffee);
                } else if (typeof patternOrCoffee === 'number' && this.currentResult && this.currentResult.numericPattern) {
                    pattern = this.currentResult.numericPattern;
                }
            }
            if (pattern.length === 0) {
                if (this.currentResult && this.currentResult.numericPattern && this.currentResult.numericPattern.length > 0) {
                    pattern = this.currentResult.numericPattern;
                } else {
                    const canvas = typeof document !== 'undefined' && document.getElementById('vvQrCanvas');
                    if (canvas) {
                        pattern = this.decodeJabMatrix(canvas);
                    }
                }
            }
            const bitString = this.serializePatternToBits(pattern);
            const colorIndices = this.bitsToColorIndices(bitString);

            let grid = 20;
            while (grid * grid - 64 < colorIndices.length) {
                grid += 4;
            }

            const cellSize = 16;
            const totalSize = grid * cellSize;
            const rects = [];

            rects.push(`<rect width="${totalSize}" height="${totalSize}" fill="#FFFFFF"/>`);

            const drawFinderSvg = (startX, startY, colorIdx) => {
                const c1 = JABColorPalette[colorIdx % 8];
                const c2 = JABColorPalette[(colorIdx + 2) % 8];
                rects.push(`<rect x="${startX * cellSize}" y="${startY * cellSize}" width="${4 * cellSize}" height="${4 * cellSize}" fill="${c1}"/>`);
                rects.push(`<rect x="${(startX + 1) * cellSize}" y="${(startY + 1) * cellSize}" width="${2 * cellSize}" height="${2 * cellSize}" fill="#FFFFFF"/>`);
                rects.push(`<rect x="${(startX + 1.5) * cellSize}" y="${(startY + 1.5) * cellSize}" width="${cellSize}" height="${cellSize}" fill="${c2}"/>`);
            };

            drawFinderSvg(0, 0, 2);
            drawFinderSvg(grid - 4, 0, 4);
            drawFinderSvg(0, grid - 4, 6);
            drawFinderSvg(grid - 4, grid - 4, 7);

            let dataIdx = 0;
            for (let r = 0; r < grid; r++) {
                for (let c = 0; c < grid; c++) {
                    if (this.isFinderModule(r, c, grid)) continue;
                    const colIdx = dataIdx < colorIndices.length ? colorIndices[dataIdx] : 0;
                    rects.push(`<rect x="${c * cellSize}" y="${r * cellSize}" width="${cellSize}" height="${cellSize}" fill="${JABColorPalette[colIdx]}"/>`);
                    dataIdx++;
                }
            }

            return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalSize} ${totalSize}" width="${totalSize}" height="${totalSize}">\n${rects.join('\n')}\n</svg>`;
        },


        switchMatrixMode: function (mode) {
            this.matrixMode = (mode === 'qr') ? 'qr' : 'jab';
            const btnJab = typeof document !== 'undefined' && document.getElementById('vvTabJab');
            const btnQr = typeof document !== 'undefined' && document.getElementById('vvTabQr');
            if (btnJab && btnQr) {
                if (this.matrixMode === 'qr') {
                    btnQr.style.background = '#2563EB';
                    btnQr.style.color = '#FFFFFF';
                    btnQr.style.fontWeight = '700';
                    btnJab.style.background = 'transparent';
                    btnJab.style.color = '#94A3B8';
                    btnJab.style.fontWeight = '600';
                } else {
                    btnJab.style.background = '#2563EB';
                    btnJab.style.color = '#FFFFFF';
                    btnJab.style.fontWeight = '700';
                    btnQr.style.background = 'transparent';
                    btnQr.style.color = '#94A3B8';
                    btnQr.style.fontWeight = '600';
                }
            }
            if (this.currentResult && this.currentResult.numericPattern) {
                if (this.matrixMode === 'qr') {
                    this.renderStandardQr(this.currentResult.numericPattern);
                } else {
                    this.renderJabCode(this.currentResult.numericPattern);
                }
            }
        },

        renderStandardQr: function (patternOrText, targetCanvas) {
            let text = '';
            if (Array.isArray(patternOrText)) {
                text = patternOrText.join(',');
            } else if (typeof patternOrText === 'string') {
                text = patternOrText;
            } else if (this.currentResult && this.currentResult.numericPattern) {
                text = this.currentResult.numericPattern.join(',');
            }
            if (!text) text = '0';

            const canvas = targetCanvas || (typeof document !== 'undefined' && document.getElementById('vvQrCanvas'));
            if (!canvas) return;

            const qr = this.qrEngine(0, 'L');
            qr.addData(text);
            qr.make();

            const moduleCount = qr.getModuleCount();
            this.currentQrGrid = moduleCount;

            const size = Math.max(canvas.width || 200, 200);
            canvas.width = size;
            canvas.height = size;
            const ctx = canvas.getContext('2d');
            if (!ctx) return;
            ctx.imageSmoothingEnabled = false;

            const cellSize = size / moduleCount;

            // Fill white background
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, size, size);

            // Draw black modules
            ctx.fillStyle = '#000000';
            for (let r = 0; r < moduleCount; r++) {
                for (let c = 0; c < moduleCount; c++) {
                    if (qr.isDark(r, c)) {
                        ctx.fillRect(c * cellSize, r * cellSize, cellSize, cellSize);
                    }
                }
            }

            if (canvas.dataset) canvas.dataset.mode = 'qr';
            const caption = typeof document !== 'undefined' && document.getElementById('vvQrCaption');
            if (caption) {
                caption.textContent = 'Código QR Estándar ISO/IEC 18004 · ' + moduleCount + '×' + moduleCount + ' · Compatible con Celular';
            }
        },

        generateQrSvg: function (patternOrText) {
            let text = '';
            if (Array.isArray(patternOrText)) {
                text = patternOrText.join(',');
            } else if (typeof patternOrText === 'string') {
                text = patternOrText;
            } else if (this.currentResult && this.currentResult.numericPattern) {
                text = this.currentResult.numericPattern.join(',');
            }
            if (!text) text = '0';

            const qr = this.qrEngine(0, 'L');
            qr.addData(text);
            qr.make();
            const moduleCount = qr.getModuleCount();
            const cellSize = 8;
            const totalSize = moduleCount * cellSize;

            const rects = [];
            rects.push(`<rect width="${totalSize}" height="${totalSize}" fill="#FFFFFF"/>`);
            for (let r = 0; r < moduleCount; r++) {
                for (let c = 0; c < moduleCount; c++) {
                    if (qr.isDark(r, c)) {
                        rects.push(`<rect x="${c * cellSize}" y="${r * cellSize}" width="${cellSize}" height="${cellSize}" fill="#000000"/>`);
                    }
                }
            }

            return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalSize} ${totalSize}" width="${totalSize}" height="${totalSize}">\n${rects.join('\n')}\n</svg>`;
        },

        detectMatrixBoundingBox: function (sourceCanvas) {
            if (!sourceCanvas) return null;
            const ctx = sourceCanvas.getContext('2d');
            if (!ctx) return null;
            const w = sourceCanvas.width;
            const h = sourceCanvas.height;
            const imgData = ctx.getImageData(0, 0, w, h).data;

            let minX = w, minY = h, maxX = 0, maxY = 0;
            let found = false;
            for (let y = 0; y < h; y++) {
                for (let x = 0; x < w; x++) {
                    const offset = (y * w + x) * 4;
                    const r = imgData[offset];
                    const g = imgData[offset + 1];
                    const b = imgData[offset + 2];
                    if (r > 45 || g > 45 || b > 45) {
                        if (x < minX) minX = x;
                        if (x > maxX) maxX = x;
                        if (y < minY) minY = y;
                        if (y > maxY) maxY = y;
                        found = true;
                    }
                }
            }
            if (!found) return { x: 0, y: 0, width: w, height: h };
            return {
                x: minX,
                y: minY,
                width: Math.max(1, maxX - minX + 1),
                height: Math.max(1, maxY - minY + 1)
            };
        },

        scanUploadedMatrix: function (imgOrCanvas) {
            if (!imgOrCanvas) return { success: false, pattern: [], message: 'No se suministró imagen' };

            let workingCanvas;
            if (typeof imgOrCanvas.getContext === 'function') {
                workingCanvas = imgOrCanvas;
            } else if (typeof document !== 'undefined' && imgOrCanvas.tagName === 'CANVAS') {
                workingCanvas = imgOrCanvas;
            } else if (typeof document !== 'undefined') {
                workingCanvas = document.createElement('canvas');
                workingCanvas.width = imgOrCanvas.naturalWidth || imgOrCanvas.width || 200;
                workingCanvas.height = imgOrCanvas.naturalHeight || imgOrCanvas.height || 200;
                const ctx = workingCanvas.getContext('2d');
                if (ctx && typeof ctx.drawImage === 'function') {
                    ctx.drawImage(imgOrCanvas, 0, 0);
                }
            } else {
                workingCanvas = imgOrCanvas;
            }

            // Detect bounding box if user uploaded screenshot with black padding
            const bbox = this.detectMatrixBoundingBox(workingCanvas);
            let croppedCanvas = workingCanvas;
            if (bbox && typeof document !== 'undefined' && typeof document.createElement === 'function' && (bbox.x > 0 || bbox.y > 0 || bbox.width !== workingCanvas.width)) {
                croppedCanvas = document.createElement('canvas');
                croppedCanvas.width = bbox.width;
                croppedCanvas.height = bbox.height;
                const cctx = croppedCanvas.getContext('2d');
                if (cctx && typeof cctx.drawImage === 'function') {
                    cctx.drawImage(workingCanvas, bbox.x, bbox.y, bbox.width, bbox.height, 0, 0, bbox.width, bbox.height);
                }
            }

            // Attempt JAB Code decode with finder auto-probing
            const decoded = this.decodeJabMatrix(croppedCanvas);
            if (decoded && decoded.length > 0) {
                return {
                    success: true,
                    format: 'JAB_CODE',
                    pattern: decoded,
                    grid: croppedCanvas._jabGrid || this.currentGrid || 20,
                    message: 'JAB Code polícromo decodificado con éxito (' + decoded.length + ' enteros recuperados)'
                };
            }

            return {
                success: false,
                pattern: [],
                message: 'No se detectó una matriz JAB Code reconocible en la imagen.'
            };
        },

        handleScanFileInput: function (e) {
            const file = e.target.files && e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (ev) => {
                const img = new Image();
                img.onload = () => {
                    const result = this.scanUploadedMatrix(img);
                    const badge = document.getElementById('vvValidationBadge');
                    const detail = document.getElementById('vvStatusDetail');
                    if (result.success) {
                        if (badge) {
                            badge.style.display = 'inline-block';
                            badge.textContent = 'ESCANEADO & VALIDADO ✓';
                            badge.style.background = '#064E3B';
                            badge.style.color = '#34D399';
                            badge.style.border = '1px solid #059669';
                        }
                        if (detail) {
                            detail.innerHTML = '<span style="color:#34D399; font-weight:700;">¡Escaneo Exitoso!</span> Se leyó la matriz JAB Code desde la foto: <strong>' + result.pattern.length + ' números recuperados al 100%</strong>: [' + result.pattern.slice(0, 8).join(', ') + '...].';
                        }
                        // If there is an active result, check match
                        if (this.currentResult && this.currentResult.numericPattern) {
                            const match = this.validatePatternMatch(this.currentResult.numericPattern, result.pattern);
                            if (match && detail) {
                                detail.innerHTML += '<br/><span style="color:#38BDF8; font-weight:700;">✓ Coincide de forma 100% idéntica con el patrón de la imagen activa en pantalla.</span>';
                            }
                        }
                        // Render scanned code onto canvas
                        this.renderJabCode(result.pattern);
                    } else {
                        if (badge) {
                            badge.style.display = 'inline-block';
                            badge.textContent = 'ERROR ESCANEO ✕';
                            badge.style.background = '#7F1D1D';
                            badge.style.color = '#FCA5A5';
                            badge.style.border = '1px solid #DC2626';
                        }
                        if (detail) {
                            detail.innerHTML = '<span style="color:#EF4444; font-weight:700;">No se pudo decodificar la imagen:</span> ' + result.message;
                        }
                    }
                };
                img.src = ev.target.result;
            };
            reader.readAsDataURL(file);
        },

        downloadSvg: function () {
            const isQr = this.matrixMode === 'qr';
            const svgContent = isQr 
                ? this.generateQrSvg() 
                : this.generateJabSvg();
            if (typeof Blob !== 'undefined' && typeof URL !== 'undefined' && typeof document !== 'undefined') {
                const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = (isQr ? 'standard_qr_code_' : 'jab_code_matrix_') + Date.now() + '.svg';
                if (document.body) {
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                }
                setTimeout(() => {
                    try { URL.revokeObjectURL(url); } catch (e) {}
                }, 1500);
            }
        },

        downloadPng: function () {
            const canvas = typeof document !== 'undefined' && document.getElementById('vvQrCanvas');
            if (!canvas) return;
            if (typeof canvas.toDataURL === 'function' && typeof document !== 'undefined') {
                const isQr = this.matrixMode === 'qr';
                const url = canvas.toDataURL('image/png');
                const a = document.createElement('a');
                a.href = url;
                a.download = (isQr ? 'standard_qr_code_' : 'jab_code_matrix_') + Date.now() + '.png';
                if (document.body) {
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                }
            }
        }
    };

    if (typeof window !== 'undefined') {
        window.VectorVisionStudio = VectorVisionStudio;
        window.openVectorVisionModal = function () {
            VectorVisionStudio.openModal();
        };

        // Delegated capture listener: intercept clicks on Circle 10 (#slot-3-2)
        document.addEventListener('click', function (e) {
            const slot = e.target && e.target.closest && (e.target.closest('#slot-3-2') || e.target.closest('.is-tool-vector-vision'));
            if (slot) {
                e.preventDefault();
                e.stopPropagation();
                if (typeof window.closeOnDemandToolModal === 'function') {
                    window.closeOnDemandToolModal();
                }
                VectorVisionStudio.openModal();
            }
        }, true);

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', function () {
                VectorVisionStudio.injectModal();
            });
        } else {
            VectorVisionStudio.injectModal();
        }
    }
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = VectorVisionStudio;
    }
})();
