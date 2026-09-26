from __future__ import annotations

import hashlib
import subprocess
from datetime import datetime, timezone, timedelta
from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.platypus import (
    Flowable,
    KeepTogether,
    PageBreak,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)


ROOT = Path(__file__).resolve().parents[1]
EXPORTS = ROOT / "exports"
PDF_PATH = EXPORTS / "Hashcod-Proprietary-Software-License-v1.0.pdf"
SHA_PATH = PDF_PATH.with_suffix(PDF_PATH.suffix + ".sha256")
DR_TZ = timezone(timedelta(hours=-4))
ISSUED_AT = datetime.now(DR_TZ)

INK = colors.HexColor("#111111")
MUTED = colors.HexColor("#5C6268")
GRID = colors.HexColor("#D7DADF")
LIGHT = colors.HexColor("#F2F4F6")
BLUE = colors.HexColor("#153B5A")
AMBER = colors.HexColor("#855A00")
RED = colors.HexColor("#8F1D1D")
WHITE = colors.white


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest().upper()


def git_value(*parts: str) -> str:
    return subprocess.check_output(
        ["git", *parts], cwd=ROOT, text=True, encoding="utf-8"
    ).strip()


class TerminalLogo(Flowable):
    def __init__(self, size: float = 42):
        super().__init__()
        self.width = size
        self.height = size
        self.size = size

    def draw(self):
        canvas = self.canv
        s = self.size
        canvas.saveState()
        canvas.setStrokeColor(INK)
        canvas.setFillColor(INK)
        canvas.setLineWidth(max(1.5, s * 0.07))
        canvas.setLineCap(1)
        canvas.setLineJoin(1)
        canvas.roundRect(s * 0.16, s * 0.08, s * 0.68, s * 0.84, s * 0.06, stroke=1, fill=0)
        canvas.line(s * 0.58, s * 0.92, s * 0.58, s * 0.71)
        canvas.line(s * 0.58, s * 0.71, s * 0.84, s * 0.71)
        canvas.line(s * 0.30, s * 0.48, s * 0.40, s * 0.39)
        canvas.line(s * 0.40, s * 0.39, s * 0.30, s * 0.30)
        canvas.line(s * 0.50, s * 0.23, s * 0.70, s * 0.23)
        canvas.restoreState()


styles = getSampleStyleSheet()
styles.add(ParagraphStyle(
    "TitleCustom", fontName="Helvetica-Bold", fontSize=25, leading=29,
    textColor=INK, spaceAfter=4,
))
styles.add(ParagraphStyle(
    "SubtitleCustom", fontName="Helvetica", fontSize=11, leading=15,
    textColor=MUTED, spaceAfter=13,
))
styles.add(ParagraphStyle(
    "Kicker", fontName="Helvetica-Bold", fontSize=7.5, leading=9,
    textColor=BLUE, tracking=1.2, spaceAfter=6,
))
styles.add(ParagraphStyle(
    "H1Custom", fontName="Helvetica-Bold", fontSize=15, leading=18,
    textColor=BLUE, spaceBefore=10, spaceAfter=6,
))
styles.add(ParagraphStyle(
    "H2Custom", fontName="Helvetica-Bold", fontSize=10.5, leading=13,
    textColor=INK, spaceBefore=7, spaceAfter=4,
))
styles.add(ParagraphStyle(
    "BodyCustom", fontName="Helvetica", fontSize=9.2, leading=12.8,
    textColor=INK, spaceAfter=5,
))
styles.add(ParagraphStyle(
    "SmallCustom", fontName="Helvetica", fontSize=7.5, leading=10,
    textColor=MUTED, spaceAfter=3,
))
styles.add(ParagraphStyle(
    "Callout", fontName="Helvetica-Bold", fontSize=9.2, leading=12.8,
    textColor=RED,
))
styles.add(ParagraphStyle(
    "Mono", fontName="Courier", fontSize=7.6, leading=10, textColor=INK,
))


def p(text: str, style_name: str = "BodyCustom") -> Paragraph:
    return Paragraph(text, styles[style_name])


def table(data, widths, header=True):
    result = Table(data, colWidths=widths, repeatRows=1 if header else 0, hAlign="LEFT")
    commands = [
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("GRID", (0, 0), (-1, -1), 0.35, GRID),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ("FONTNAME", (0, 0), (-1, -1), "Helvetica"),
        ("FONTSIZE", (0, 0), (-1, -1), 8.2),
    ]
    if header:
        commands += [
            ("BACKGROUND", (0, 0), (-1, 0), INK),
            ("TEXTCOLOR", (0, 0), (-1, 0), WHITE),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ]
        for index in range(1, len(data)):
            if index % 2 == 0:
                commands.append(("BACKGROUND", (0, index), (-1, index), LIGHT))
    result.setStyle(TableStyle(commands))
    return result


def page_decor(canvas, doc):
    canvas.saveState()
    width, height = letter
    canvas.setFillColor(INK)
    canvas.rect(0, height - 16, width, 16, stroke=0, fill=1)
    canvas.setStrokeColor(GRID)
    canvas.setLineWidth(0.55)
    canvas.line(54, 43, width - 54, 43)
    canvas.setFillColor(MUTED)
    canvas.setFont("Helvetica", 7.3)
    canvas.drawString(54, 29, "Hashcod | PROPRIETARY SOFTWARE LICENSE | SIGNATURE-GATED AUTHORIZATION")
    canvas.drawRightString(width - 54, 29, f"PAGE {doc.page}")
    canvas.restoreState()


def add_bullet(story, text):
    story.append(p(f"&#8226;&nbsp;&nbsp;{text}"))


def build():
    EXPORTS.mkdir(exist_ok=True)
    commit = git_value("rev-parse", "--short", "HEAD")
    license_md_hash = sha256_file(ROOT / "LICENSE.md")
    license_id = f"Q7-LIC-{ISSUED_AT.strftime('%Y%m%d')}-{license_md_hash[:10]}"

    doc = SimpleDocTemplate(
        str(PDF_PATH), pagesize=letter,
        rightMargin=0.72 * inch, leftMargin=0.72 * inch,
        topMargin=0.62 * inch, bottomMargin=0.70 * inch,
    )
    story = []

    story.append(Table(
        [[TerminalLogo(42), p("<b>Hashcod</b><br/><font color='#5C6268'>CRYPTOGRAPHIC PLATFORM</font>", "SubtitleCustom")]],
        colWidths=[0.65 * inch, 5.7 * inch],
        style=TableStyle([("VALIGN", (0, 0), (-1, -1), "MIDDLE"), ("LEFTPADDING", (0, 0), (-1, -1), 0)]),
    ))
    story.append(Spacer(1, 16))
    story.append(p("PROPRIETARY SOFTWARE LICENSE", "Kicker"))
    story.append(p("Signature-Gated Authorization Agreement", "TitleCustom"))
    story.append(p(
        "Licencia propietaria de uso restringido para Hashcod. Este documento establece "
        "las condiciones base; no concede acceso por sí solo.",
        "SubtitleCustom",
    ))
    story.append(table([
        ["DOCUMENT ID", license_id],
        ["VERSION", "1.0"],
        ["ISSUED", ISSUED_AT.strftime("%Y-%m-%d %H:%M:%S UTC-04:00")],
        ["OWNER / REQUIRED SIGNATORY", "Emil Enmanuel Pieter Mora"],
        ["REPOSITORY SNAPSHOT", commit],
        ["LICENSE TERMS SHA-256", license_md_hash],
    ], [2.18 * inch, 4.30 * inch], header=False))
    story.append(Spacer(1, 10))
    story.append(Table(
        [[p("IMPORTANT: An unsigned authorization is invalid. Possession of this PDF, the repository, or a deployed copy does not grant permission to use the software.", "Callout")]],
        colWidths=[6.48 * inch],
        style=TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#FCEEEE")),
            ("BOX", (0, 0), (-1, -1), 0.8, RED),
            ("LEFTPADDING", (0, 0), (-1, -1), 8),
            ("RIGHTPADDING", (0, 0), (-1, -1), 8),
            ("TOPPADDING", (0, 0), (-1, -1), 8),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
        ]),
    ))
    story.append(Spacer(1, 8))
    story.append(p("Nature of this document", "H1Custom"))
    story.append(p(
        "Hashcod, its code, interfaces, catalogs, reports, cryptographic workflows, "
        "graphics, scripts, documentation, and downloadable artifacts are proprietary. "
        "This agreement reserves all rights that have not been expressly granted in writing.",
    ))
    story.append(p(
        "This document is designed as a practical proprietary license template. It should be "
        "reviewed by a qualified attorney before commercial deployment or use across jurisdictions.",
    ))
    story.append(p("The authorization rule", "H1Custom"))
    story.append(p(
        "A person or organization may use the software only after receiving an individual "
        "License Grant Certificate that identifies the licensee, the permitted environment, "
        "the scope, the validity period, and a unique license identifier. The certificate must "
        "carry the signature of <b>Emil Enmanuel Pieter Mora</b>.",
    ))
    add_bullet(story, "Repository access is not a license.")
    add_bullet(story, "A deployed instance is not a license.")
    add_bullet(story, "A copied PDF without the required signature is not a license.")
    add_bullet(story, "An altered certificate, expired certificate, or mismatched integrity record is invalid.")

    story.append(PageBreak())
    story.append(p("1. Rights reserved", "H1Custom"))
    story.append(p(
        "Unless an individual signed License Grant Certificate expressly states otherwise, "
        "the owner retains the exclusive right to authorize execution, copying, modification, "
        "distribution, commercialization, sublicensing, service exposure, and derivative works.",
    ))
    story.append(p("2. Standard restrictions", "H1Custom"))
    for item in [
        "Do not redistribute, resell, sublicense, lease, publish, or transfer the software.",
        "Do not disclose source code, credentials, activation material, or private keys to third parties.",
        "Do not remove attribution, proprietary notices, integrity records, or audit controls.",
        "Do not bypass access controls, activation checks, audit mechanisms, or security restrictions.",
        "Do not claim official legal, regulatory, or government certification unless separately obtained.",
        "Do not use the software to violate applicable law or third-party rights.",
    ]:
        add_bullet(story, item)

    story.append(p("3. Confidentiality and security duties", "H1Custom"))
    story.append(p(
        "Credentials, private keys, activation records, signed certificates, and customer data "
        "must be protected as confidential information. Compromised credentials must be revoked "
        "and rotated promptly. Authorization does not expand because a credential was copied or exposed.",
    ))
    story.append(p("4. Revocation and termination", "H1Custom"))
    story.append(p(
        "Authorization terminates automatically at expiration or when signed conditions are violated. "
        "Access may be revoked as permitted by the applicable agreement and applicable law. After "
        "termination, the former licensee must cease use and delete unauthorized copies unless retention "
        "is legally required.",
    ))
    story.append(p("5. Warranty and professional review", "H1Custom"))
    story.append(p(
        "To the maximum extent permitted by applicable law, the software is provided without warranties "
        "unless a separate signed agreement states otherwise. Independent security and legal review is "
        "required before use in critical, regulated, or high-risk environments.",
    ))
    story.append(p("6. Mandatory law", "H1Custom"))
    story.append(p(
        "Nothing in this license limits rights that cannot legally be excluded. Any exception required by "
        "applicable law remains applicable only to the extent required by that law.",
    ))

    story.append(PageBreak())
    story.append(p("INDIVIDUAL LICENSE GRANT CERTIFICATE", "Kicker"))
    story.append(p("Activation Annex", "TitleCustom"))
    story.append(p(
        "Complete one annex for each authorized person or organization. The annex becomes valid only "
        "after the required signature is added and its integrity record is issued.",
        "SubtitleCustom",
    ))
    fields = [
        ("LICENSE CERTIFICATE ID", "____________________________________________"),
        ("AUTHORIZED LICENSEE", "____________________________________________"),
        ("IDENTIFICATION / REGISTRATION", "____________________________________________"),
        ("AUTHORIZED ENVIRONMENT", "____________________________________________"),
        ("AUTHORIZED PURPOSE", "____________________________________________"),
        ("VALID FROM", "____________________"),
        ("VALID UNTIL", "____________________"),
        ("DEVICE / DEPLOYMENT BINDING", "____________________________________________"),
        ("SPECIAL CONDITIONS", "____________________________________________"),
        ("DETACHED DIGITAL SIGNATURE", "____________________________________________"),
        ("CERTIFICATE SHA-256", "____________________________________________"),
    ]
    story.append(table([[p(f"<b>{label}</b>"), p(value, "Mono")] for label, value in fields],
                       [2.22 * inch, 4.26 * inch], header=False))
    story.append(Spacer(1, 14))
    story.append(p("Required authorization signature", "H1Custom"))
    story.append(p(
        "By signing this annex, the owner grants only the limited authorization described above. "
        "No unsigned, copied, or modified annex is valid.",
    ))
    story.append(Spacer(1, 18))
    story.append(table([
        [p("<b>Required signatory</b>"), p("<b>Emil Enmanuel Pieter Mora</b>")],
        [p("<b>Signature</b>"), p("<br/><br/>____________________________________________")],
        [p("<b>Date and time</b>"), p("____________________________________________")],
        [p("<b>Signing method</b>"), p("Manuscript / qualified e-signature / detached digital signature")],
    ], [2.22 * inch, 4.26 * inch], header=False))
    story.append(Spacer(1, 9))
    story.append(p(
        "Recommended implementation: issue each activation annex with a unique identifier and a detached "
        "Ed25519 signature from a protected private key. The private signing key must not be embedded in "
        "the browser bundle or committed to the repository.",
        "SmallCustom",
    ))

    story.append(PageBreak())
    story.append(p("Integrity and verification record", "H1Custom"))
    story.append(p(
        "The PDF is accompanied by a detached SHA-256 file. SHA-256 proves whether the PDF changed after "
        "generation; it does not replace the owner's signature or create authorization.",
    ))
    story.append(table([
        ["CONTROL", "PURPOSE", "STATUS"],
        ["Signed individual annex", "Proves an explicit grant to a named licensee", "REQUIRED"],
        ["Unique certificate ID", "Prevents ambiguous or reusable authorizations", "REQUIRED"],
        ["Certificate SHA-256", "Detects modification of the signed artifact", "REQUIRED"],
        ["Detached digital signature", "Recommended cryptographic validation of issuer", "RECOMMENDED"],
        ["Private key isolation", "Keeps issuer signing material outside frontend code", "RECOMMENDED"],
        ["Revocation registry", "Allows an issued certificate to be disabled", "RECOMMENDED"],
        ["Audit record", "Tracks issuance, verification, expiration, and revocation", "RECOMMENDED"],
    ], [1.75 * inch, 3.84 * inch, 0.89 * inch]))
    story.append(p("Implementation note", "H1Custom"))
    story.append(p(
        "A strong commercial workflow should combine the signed legal annex with server-side certificate "
        "verification, revocation, HTTPS, access controls, and audit records. No document alone can make "
        "software impossible to copy or bypass.",
    ))
    story.append(p("Legal notice", "H1Custom"))
    story.append(p(
        "This draft is not legal advice and is not an official registration, government certificate, "
        "notarial act, or digital-signature certificate. It is a proprietary software license template "
        "prepared for Hashcod. Obtain legal review before relying on it commercially.",
    ))
    story.append(p("Reference points", "H1Custom"))
    add_bullet(story, "WIPO Copyright: https://www.wipo.int/copyright/en/")
    add_bullet(story, "GitHub licensing guidance: https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/licensing-a-repository")
    add_bullet(story, "ONDA Dominican Republic: https://onda.gob.do/")

    doc.build(story, onFirstPage=page_decor, onLaterPages=page_decor)
    pdf_hash = sha256_file(PDF_PATH)
    SHA_PATH.write_text(f"{pdf_hash}  {PDF_PATH.name}\n", encoding="utf-8")
    print(f"LICENSE_ID={license_id}")
    print(f"PDF_SHA256={pdf_hash}")


if __name__ == "__main__":
    build()
