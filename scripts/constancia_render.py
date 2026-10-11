#!/usr/bin/env python3
"""Renders a Hashcod asset constancia (A4, 2 pages) and embeds the .cod package.

Reads one JSON request on stdin, writes the PDF to stdout. No network, no secrets.
The PDF follows the PDF/A-3b structure: every font embedded, sRGB output intent, XMP identification and the
.cod attached as an Associated File (AFRelationship=Data). It has not been checked with veraPDF in CI.
"""
import base64
import io
import json
import sys
from pathlib import Path

from PIL import ImageCms
from pypdf import PdfReader, PdfWriter
from pypdf.generic import (ArrayObject, DecodedStreamObject, DictionaryObject, NameObject, NumberObject,
                           TextStringObject, create_string_object)
from reportlab.graphics.barcode import qrencoder
from reportlab.lib.pagesizes import A4
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.pdfmetrics import stringWidth
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas

ROOT = Path(__file__).resolve().parent.parent / "assets" / "constancia"
W, H = A4
INK, MUTED, LINE = (0.07, 0.07, 0.07), (0.38, 0.38, 0.38), (0.82, 0.82, 0.8)

for name, file in (("Serif", "DejaVuSerif.ttf"), ("Serif-Bold", "DejaVuSerif-Bold.ttf"), ("Mono", "DejaVuSansMono.ttf"),
                   ("Mono-Bold", "DejaVuSansMono-Bold.ttf"), ("Sans", "DejaVuSans.ttf")):
    pdfmetrics.registerFont(TTFont(name, str(ROOT / "fonts" / file)))


def wrap(text, font, size, width):
    """Greedy word wrap; words longer than the line (hashes, URLs) are broken by character."""
    lines, current = [], ""
    for word in str(text).split(" "):
        candidate = (current + " " + word).strip()
        if stringWidth(candidate, font, size) <= width:
            current = candidate
            continue
        if current:
            lines.append(current)
        current = ""
        while stringWidth(word, font, size) > width:
            cut = len(word)
            while cut > 1 and stringWidth(word[:cut], font, size) > width:
                cut -= 1
            lines.append(word[:cut])
            word = word[cut:]
        current = word
    if current:
        lines.append(current)
    return lines or [""]


def text_block(c, x, y, text, font, size, width, leading=None, color=INK):
    leading = leading or size * 1.35
    c.setFont(font, size)
    c.setFillColorRGB(*color)
    for line in wrap(text, font, size, width):
        c.drawString(x, y, line)
        y -= leading
    return y


def draw_seal(c, ops, x, y, size):
    """Deterministic seal (ops come from constanciaSealOps in constancia-lib.php), 200x200 units -> `size` points."""
    k = size / 200.0
    c.saveState()
    c.setStrokeColorRGB(0.07, 0.07, 0.07)
    c.setFillColorRGB(0.07, 0.07, 0.07)
    c.setLineCap(1)
    X = lambda v: x + v * k
    Y = lambda v: y + size - v * k
    for op in ops:
        kind = op[0]
        if kind == "c":
            c.setLineWidth(op[4] * k)
            c.circle(X(op[1]), Y(op[2]), op[3] * k, stroke=1, fill=0)
        elif kind == "l":
            c.setLineWidth(op[5] * k)
            c.line(X(op[1]), Y(op[2]), X(op[3]), Y(op[4]))
        elif kind == "p":
            c.setLineWidth(op[2] * k)
            path = c.beginPath()
            for i, (px, py) in enumerate(op[1]):
                (path.moveTo if i == 0 else path.lineTo)(X(px), Y(py))
            path.close()
            c.drawPath(path, stroke=1, fill=0)
        elif kind == "r":
            c.rect(X(op[1]), Y(op[2] + op[4]), op[3] * k, op[4] * k, stroke=0, fill=1)
    c.restoreState()


def draw_qr(c, url, x, y, size):
    """Black on pure white, error correction Q (no logo in the centre), 4-module quiet zone, nothing behind it.
    Drawn module by module (renderPDF would pull in a non-embedded standard font, which PDF/A forbids)."""
    qr = qrencoder.QRCode(None, qrencoder.QRErrorCorrectLevel.Q)
    qr.addData(url)
    qr.make()
    border = 4
    box = size / (qr.getModuleCount() + 2 * border)
    c.saveState()
    c.setFillColorRGB(1, 1, 1)
    c.rect(x, y, size, size, stroke=0, fill=1)
    c.setFillColorRGB(0, 0, 0)
    for r, row in enumerate(qr.modules):
        for col, dark in enumerate(row):
            if dark:
                c.rect(x + (col + border) * box, y + size - (r + border + 1) * box, box + .05, box + .05, stroke=0, fill=1)
    c.restoreState()


def frame(c, page, total, req):
    c.drawImage(str(ROOT / "background.png"), 0, 0, W, H)
    c.drawImage(str(ROOT / "logo.png"), 48, H - 111, width=150, height=150 * 154 / 778, mask="auto")
    c.setFont("Mono", 7.5)
    c.setFillColorRGB(*MUTED)
    c.drawString(56, 44, f"{req['number']} | huella: {req['fingerprint'][:24]}…")
    c.drawRightString(W - 56, 44, f"Página {page} de {total}")


def card(c, x, y_top, w, h):
    c.saveState()
    c.setFillColorRGB(1, 1, 1)
    c.setStrokeColorRGB(*LINE)
    c.setLineWidth(.8)
    c.roundRect(x, y_top - h, w, h, 10, stroke=1, fill=1)
    c.restoreState()


def page_one(c, req):
    frame(c, 1, 2, req)
    c.setFillColorRGB(*INK)
    c.setFont("Serif-Bold", 7.5)
    c.drawRightString(W - 56, H - 62, "NÚMERO DE CONSTANCIA")
    c.setFont("Mono-Bold", 10.5)
    c.drawRightString(W - 56, H - 78, req["number"])
    c.setFont("Mono", 7)
    c.setFillColorRGB(*MUTED)
    c.drawRightString(W - 56, H - 94, "Emisor DID: " + req["issuerDid"])

    c.setFillColorRGB(*INK)
    c.setFont("Serif-Bold", 19)
    c.drawCentredString(W / 2, H - 192, "Constancia de Integridad de Activo de IA")
    c.setFont("Serif", 10.5)
    c.setFillColorRGB(*MUTED)
    c.drawCentredString(W / 2, H - 212, "Constancia de Registro Criptográfico")
    text_block(c, 62, H - 246, "Hashcod Codespace deja constancia técnica de que el activo descrito a continuación fue registrado "
               "criptográficamente y asociado a una huella hash, un sello temporal y una declaración de titularidad para fines de "
               "verificación posterior.", "Serif", 9.5, 410, 13)

    rows = [("Titular", req["holderName"]), ("Activo registrado", req["assetName"]), ("Tipo de activo", req["assetTypeLabel"]),
            ("Versión", req["version"]), ("Sello temporal (UTC)", req["genTimeUtc"]), ("Sello temporal (Rep. Dominicana)", req["genTimeAst"]),
            ("Fuente del sello de tiempo (TSA)", req["tsaSource"]), ("ID de la llave firmante", req["keyId"]),
            (req["digestLabel"] + " (abreviado)", req["digest"][:24] + "..." + req["digest"][-24:])]
    label_w, x0 = 178, 80                       # wide label column: nothing overprints its value
    value_w = W - 2 * 58 - 2 * 22 - label_w
    heights = []
    for label, value in rows:
        mono = label.startswith("Hash") or label.startswith("Raíz") or label.startswith("ID de la llave")
        lines = wrap(value, "Mono" if mono else "Serif", 8 if mono else 9.5, value_w)
        heights.append(max(len(lines), len(wrap(label, "Serif-Bold", 8.5, label_w - 8))) * 12.5 + 12)
    top = H - 290
    card(c, 58, top, W - 116, sum(heights) + 24)
    y = top - 18
    for (label, value), h in zip(rows, heights):
        mono = label.startswith("Hash") or label.startswith("Raíz") or label.startswith("ID de la llave")
        text_block(c, x0, y, label, "Serif-Bold", 8.5, label_w - 8, 12.5, MUTED)
        text_block(c, x0 + label_w, y, value, "Mono" if mono else "Serif", 8 if mono else 9.5, value_w, 12.5)
        c.setStrokeColorRGB(*LINE); c.setLineWidth(.4)
        c.line(x0, y - h + 17, W - 80, y - h + 17)
        y -= h

    # verification block: QR | text | seal, each in its own column so they never overlap
    block_top = top - sum(heights) - 24 - 22
    block_h = 168
    card(c, 58, block_top, W - 116, block_h)
    c.setFont("Serif-Bold", 11); c.setFillColorRGB(*INK)
    c.drawString(78, block_top - 24, "Bloque de verificación")
    draw_qr(c, req["qrUrl"], 78, block_top - block_h + 20, 112)
    tx, tw = 206, 204
    y = text_block(c, tx, block_top - 50, "Verificación pública:", "Serif", 8.5, tw, 11)
    y = text_block(c, tx, y, req["verifyUrl"], "Mono", 6.8, tw, 9.5)
    y = text_block(c, tx, y - 8, "Comando de verificación:", "Serif", 8.5, tw, 11)
    y = text_block(c, tx, y, "hcod verify " + req["number"], "Mono-Bold", 8.5, tw, 11)
    y = text_block(c, tx, y - 8, "Estado vigente: consultar en la verificación en línea (una constancia puede revocarse después de impresa).", "Serif", 7.5, tw, 10, MUTED)
    seal = 100
    draw_seal(c, req["sealOps"], W - 58 - 20 - seal, block_top - block_h + 30, seal)
    c.setFont("Serif", 7); c.setFillColorRGB(*MUTED)
    c.drawCentredString(W - 58 - 20 - seal / 2, block_top - block_h + 18, "Sello visual único derivado de la huella")

    text_block(c, 62, 92, "Esta constancia prueba la existencia, integridad y autoría declarada del activo registrado; no sustituye registros ante ONAPI u ONDA.",
               "Serif", 8, 330, 11)


def page_two(c, req):
    frame(c, 2, 2, req)
    c.setFont("Serif-Bold", 17); c.setFillColorRGB(*INK)
    c.drawString(222, H - 78, "Anexo técnico de verificación")
    fields = [("Número de constancia", req["number"], True), ("DID del emisor", req["issuerDid"], True), ("ID de la llave firmante", req["keyVm"], True),
              ("ID de la credencial", req["credentialId"], True), ("URL pública de verificación", req["verifyUrl"], True), ("Comando CLI", "hcod verify " + req["number"], True),
              (req["digestLabel"] + " completo", req["digest"], True), ("Huella de la constancia (SHA-512 de la credencial firmada)", req["fingerprint"], True),
              ("Fuente del sello de tiempo (TSA)", f"{req['tsaSource']} · {req['tsaUrl']} · genTime {req['genTimeUtc']}", True),
              ("Uso de IA en la creación", req["aiUseLabel"], False)]
    if req.get("license"): fields.append(("Licencia", req["license"], False))
    if req.get("description"): fields.append(("Descripción breve", req["description"], False))
    y = H - 140
    for label, value, mono in fields:
        c.setFont("Serif-Bold", 8.5); c.setFillColorRGB(*MUTED)
        c.drawString(62, y, label)
        y = text_block(c, 76, y - 12, value, "Mono" if mono else "Serif", 7.4 if mono else 9, W - 62 - 76 - 50, 10.5)
        c.setStrokeColorRGB(*LINE); c.setLineWidth(.4); c.line(62, y + 3, W - 62, y + 3)
        y -= 5
    y -= 2
    c.setFont("Serif-Bold", 11); c.setFillColorRGB(*INK)
    c.drawString(62, y, "Alcance declarado de la constancia")
    y = text_block(c, 62, y - 15, "La constancia hace constar, dentro del sistema de verificación Hashcod, que el activo quedó asociado al identificador indicado, a una "
                   "huella hash SHA-512, a un sello temporal de una autoridad RFC 3161 y a una declaración de autoría o titularidad aportada por el solicitante. "
                   "La comprobación del valor probatorio depende de la verificación del registro, la consistencia del hash y la validación de los datos asociados.",
                   "Serif", 8.8, 430, 12)
    y = text_block(c, 62, y - 6, "Estado vigente: consultar en la verificación en línea. Una constancia puede revocarse después de impresa.", "Serif-Bold", 8.8, 430, 12)
    y = text_block(c, 62, y - 6, "Declaración del solicitante: " + req["declaration"], "Serif", 8, 430, 11, MUTED)
    draw_qr(c, req["qrUrl"], 62, 88, 88)
    draw_seal(c, req["sealOps"], W - 62 - 88, 88, 88)
    text_block(c, 164, 140, "Este PDF lleva incrustado el paquete .cod (credencial firmada, token RFC 3161, anclajes y manifiesto): "
               "quien reciba solo el PDF conserva toda la prueba. Escanea el QR o ejecuta el comando para verificarla.", "Sans", 7, 250, 9.5, MUTED)


def finish(raw_pdf, req):
    """Adds PDF/A-3b structure: XMP, sRGB output intent, trailer ID, and the .cod as an Associated File."""
    reader = PdfReader(io.BytesIO(raw_pdf))
    writer = PdfWriter(clone_from=reader)
    cod = base64.b64decode(req["codB64"])
    stream = DecodedStreamObject()
    stream.set_data(cod)
    stream.update({NameObject("/Type"): NameObject("/EmbeddedFile"), NameObject("/Subtype"): NameObject("/application/octet-stream"),
                   NameObject("/Params"): DictionaryObject({NameObject("/Size"): NumberObject(len(cod))})})
    stream_ref = writer._add_object(stream)
    fname = f"{req['number']}.cod"
    spec = DictionaryObject({NameObject("/Type"): NameObject("/Filespec"), NameObject("/F"): TextStringObject(fname), NameObject("/UF"): TextStringObject(fname),
                             NameObject("/Desc"): TextStringObject("Paquete de verificación Hashcod (credencial firmada, token RFC 3161, anclajes)"),
                             NameObject("/AFRelationship"): NameObject("/Data"),
                             NameObject("/EF"): DictionaryObject({NameObject("/F"): stream_ref, NameObject("/UF"): stream_ref})})
    spec_ref = writer._add_object(spec)
    root = writer._root_object
    root[NameObject("/AF")] = ArrayObject([spec_ref])
    root[NameObject("/Names")] = DictionaryObject({NameObject("/EmbeddedFiles"): DictionaryObject({NameObject("/Names"): ArrayObject([TextStringObject(fname), spec_ref])})})

    icc = ImageCms.ImageCmsProfile(ImageCms.createProfile("sRGB")).tobytes()
    profile = DecodedStreamObject()
    profile.set_data(icc)
    profile.update({NameObject("/N"): NumberObject(3)})
    root[NameObject("/OutputIntents")] = ArrayObject([DictionaryObject({
        NameObject("/Type"): NameObject("/OutputIntent"), NameObject("/S"): NameObject("/GTS_PDFA1"),
        NameObject("/OutputConditionIdentifier"): create_string_object("sRGB IEC61966-2.1"),
        NameObject("/Info"): create_string_object("sRGB IEC61966-2.1"), NameObject("/DestOutputProfile"): writer._add_object(profile)})])

    title = f"Constancia de Integridad de Activo de IA {req['number']}"
    created = req["genTimeUtc"].replace(" UTC", "").replace(" ", "T") + "Z"
    xmp = f"""<?xpacket begin="﻿" id="W5M0MpCehiHzreSzNTczkc9d"?>
<x:xmpmeta xmlns:x="adobe:ns:meta/"><rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">
<rdf:Description rdf:about="" xmlns:pdfaid="http://www.aiim.org/pdfa/ns/id/" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:xmp="http://ns.adobe.com/xap/1.0/" xmlns:pdf="http://ns.adobe.com/pdf/1.3/">
<pdfaid:part>3</pdfaid:part><pdfaid:conformance>B</pdfaid:conformance>
<dc:title><rdf:Alt><rdf:li xml:lang="x-default">{title}</rdf:li></rdf:Alt></dc:title>
<dc:creator><rdf:Seq><rdf:li>Hashcod Codespace</rdf:li></rdf:Seq></dc:creator>
<xmp:CreateDate>{created}</xmp:CreateDate><xmp:ModifyDate>{created}</xmp:ModifyDate><xmp:CreatorTool>Hashcod constancia-render</xmp:CreatorTool>
<pdf:Producer>ReportLab + pypdf</pdf:Producer>
</rdf:Description></rdf:RDF></x:xmpmeta>
<?xpacket end="w"?>""".encode("utf-8")
    meta = DecodedStreamObject()
    meta.set_data(xmp)
    meta.update({NameObject("/Type"): NameObject("/Metadata"), NameObject("/Subtype"): NameObject("/XML")})
    root[NameObject("/Metadata")] = writer._add_object(meta)
    root[NameObject("/Lang")] = TextStringObject("es-DO")
    writer.add_metadata({"/Title": title, "/Author": "Hashcod Codespace", "/Producer": "ReportLab + pypdf",
                         "/CreationDate": "D:" + created.replace("-", "").replace(":", "").replace("T", "").replace("Z", "") + "Z",
                         "/ModDate": "D:" + created.replace("-", "").replace(":", "").replace("T", "").replace("Z", "") + "Z"})
    out = io.BytesIO()
    writer.write(out)
    return out.getvalue()


def main():
    req = json.load(sys.stdin)
    buffer = io.BytesIO()
    c = canvas.Canvas(buffer, pagesize=A4, initialFontName="Serif", invariant=1, pageCompression=1, lang="es-DO")
    page_one(c, req)
    c.showPage()
    page_two(c, req)
    c.showPage()
    c.save()
    sys.stdout.buffer.write(finish(buffer.getvalue(), req))


if __name__ == "__main__":
    main()
