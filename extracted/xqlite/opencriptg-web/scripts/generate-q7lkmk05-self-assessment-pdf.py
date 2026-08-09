from __future__ import annotations

import hashlib
import os
import subprocess
from datetime import datetime, timezone, timedelta
from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
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
PDF_PATH = EXPORTS / "Hashcod-Self-Assessment-and-Technical-Conformity-Report-v1.0.pdf"
SHA_PATH = PDF_PATH.with_suffix(PDF_PATH.suffix + ".sha256")
DR_TZ = timezone(timedelta(hours=-4))
ISSUED_AT = datetime.now(DR_TZ)

INK = colors.HexColor("#101010")
MUTED = colors.HexColor("#5D6268")
GRID = colors.HexColor("#DADDE1")
LIGHT = colors.HexColor("#F3F5F7")
LIGHT_BLUE = colors.HexColor("#EAF1F8")
BLUE = colors.HexColor("#123A5B")
GREEN = colors.HexColor("#17663A")
AMBER = colors.HexColor("#8A5A00")
RED = colors.HexColor("#9A1B1B")
BLACK = colors.black
WHITE = colors.white


def run_text(args: list[str]) -> str:
    return subprocess.check_output(args, cwd=ROOT, text=True, encoding="utf-8").strip()


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        while True:
            chunk = handle.read(1024 * 1024)
            if not chunk:
                break
            digest.update(chunk)
    return digest.hexdigest().upper()


def core_hashes() -> list[tuple[str, str]]:
    names = [
        "app/app.jsx",
        "server.js",
        "data/catalog.js",
        "scripts/enterprise-selftest.js",
    ]
    return [(name, sha256_file(ROOT / name)) for name in names]


def git_value(*parts: str) -> str:
    return run_text(["git", *parts])


def selftest_lines() -> list[str]:
    output = run_text(["node", "scripts/enterprise-selftest.js"])
    return [line for line in output.splitlines() if line.startswith("PASS ") or line.startswith("ENTERPRISE ")]


class TerminalLogo(Flowable):
    def __init__(self, size: float = 44):
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
        canvas.setLineWidth(max(1.5, s * 0.075))
        canvas.setLineCap(1)
        canvas.setLineJoin(1)
        canvas.roundRect(s * 0.16, s * 0.08, s * 0.68, s * 0.84, s * 0.06, stroke=1, fill=0)
        canvas.line(s * 0.58, s * 0.92, s * 0.58, s * 0.71)
        canvas.line(s * 0.58, s * 0.71, s * 0.84, s * 0.71)
        canvas.line(s * 0.30, s * 0.48, s * 0.40, s * 0.39)
        canvas.line(s * 0.40, s * 0.39, s * 0.30, s * 0.30)
        canvas.line(s * 0.50, s * 0.23, s * 0.70, s * 0.23)
        canvas.restoreState()


def p(text: str, style: ParagraphStyle) -> Paragraph:
    return Paragraph(text, style)


def status_color(status: str):
    if status == "IMPLEMENTED":
        return GREEN
    if status == "CONFIGURABLE":
        return BLUE
    if status == "PARTIAL":
        return AMBER
    return RED


def status_badge(status: str) -> Paragraph:
    return Paragraph(f"<b>{status}</b>", ParagraphStyle(
        f"badge-{status}",
        fontName="Helvetica-Bold",
        fontSize=7.2,
        leading=8.5,
        textColor=status_color(status),
    ))


def styled_table(data, widths, header=True, font_size=8.1, row_bgs=True):
    table = Table(data, colWidths=widths, repeatRows=1 if header else 0, hAlign="LEFT")
    commands = [
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("GRID", (0, 0), (-1, -1), 0.35, GRID),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ("FONTNAME", (0, 0), (-1, -1), "Helvetica"),
        ("FONTSIZE", (0, 0), (-1, -1), font_size),
        ("TEXTCOLOR", (0, 0), (-1, -1), INK),
    ]
    if header:
        commands += [
            ("BACKGROUND", (0, 0), (-1, 0), INK),
            ("TEXTCOLOR", (0, 0), (-1, 0), WHITE),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ]
    if row_bgs:
        start = 1 if header else 0
        for index in range(start, len(data)):
            if (index - start) % 2:
                commands.append(("BACKGROUND", (0, index), (-1, index), LIGHT))
    table.setStyle(TableStyle(commands))
    return table


def page_decor(canvas, doc):
    canvas.saveState()
    width, height = letter
    canvas.setFillColor(INK)
    canvas.rect(0, height - 16, width, 16, stroke=0, fill=1)
    canvas.setStrokeColor(GRID)
    canvas.setLineWidth(0.55)
    canvas.line(54, 43, width - 54, 43)
    canvas.setFillColor(MUTED)
    canvas.setFont("Helvetica", 7.5)
    canvas.drawString(54, 29, "Hashcod | INTERNAL TECHNICAL SELF-ASSESSMENT | NOT AN OFFICIAL CERTIFICATION")
    canvas.drawRightString(width - 54, 29, f"PAGE {doc.page}")
    canvas.restoreState()


styles = getSampleStyleSheet()
styles.add(ParagraphStyle(
    "ReportTitle",
    fontName="Helvetica-Bold",
    fontSize=25,
    leading=29,
    textColor=INK,
    spaceAfter=5,
))
styles.add(ParagraphStyle(
    "ReportSubtitle",
    fontName="Helvetica",
    fontSize=11,
    leading=15,
    textColor=MUTED,
    spaceAfter=14,
))
styles.add(ParagraphStyle(
    "Kicker",
    fontName="Helvetica-Bold",
    fontSize=7.5,
    leading=9,
    textColor=BLUE,
    tracking=1.2,
    spaceAfter=7,
))
styles.add(ParagraphStyle(
    "H1Custom",
    fontName="Helvetica-Bold",
    fontSize=15,
    leading=18,
    textColor=BLUE,
    spaceBefore=11,
    spaceAfter=7,
))
styles.add(ParagraphStyle(
    "H2Custom",
    fontName="Helvetica-Bold",
    fontSize=11,
    leading=14,
    textColor=INK,
    spaceBefore=8,
    spaceAfter=5,
))
styles.add(ParagraphStyle(
    "BodyCustom",
    fontName="Helvetica",
    fontSize=9.5,
    leading=13.2,
    textColor=INK,
    spaceAfter=6,
))
styles.add(ParagraphStyle(
    "SmallCustom",
    fontName="Helvetica",
    fontSize=7.6,
    leading=10.2,
    textColor=MUTED,
    spaceAfter=3,
))
styles.add(ParagraphStyle(
    "CellCustom",
    fontName="Helvetica",
    fontSize=7.7,
    leading=9.5,
    textColor=INK,
))
styles.add(ParagraphStyle(
    "CellSmall",
    fontName="Helvetica",
    fontSize=6.8,
    leading=8.1,
    textColor=INK,
))
styles.add(ParagraphStyle(
    "Callout",
    fontName="Helvetica-Bold",
    fontSize=9.4,
    leading=13.2,
    textColor=RED,
    backColor=colors.HexColor("#F9ECEC"),
    borderColor=colors.HexColor("#D9A3A3"),
    borderWidth=0.7,
    borderPadding=8,
    spaceAfter=9,
))
styles.add(ParagraphStyle(
    "PositiveCallout",
    fontName="Helvetica",
    fontSize=9.2,
    leading=13,
    textColor=BLUE,
    backColor=LIGHT_BLUE,
    borderColor=colors.HexColor("#A9C4DD"),
    borderWidth=0.7,
    borderPadding=8,
    spaceAfter=9,
))
styles.add(ParagraphStyle(
    "BulletCustom",
    parent=styles["BodyCustom"],
    leftIndent=13,
    firstLineIndent=-8,
    bulletIndent=0,
    spaceAfter=3,
))


def bullets(items):
    return [Paragraph(f"- {item}", styles["BulletCustom"]) for item in items]


def build_report():
    EXPORTS.mkdir(parents=True, exist_ok=True)
    full_commit = git_value("rev-parse", "HEAD")
    short_commit = full_commit[:7]
    commit_subject = git_value("log", "-1", "--format=%s")
    test_rows = selftest_lines()
    hashes = core_hashes()
    fingerprint_material = "|".join([full_commit] + [value for _, value in hashes])
    snapshot_id = hashlib.sha256(fingerprint_material.encode("ascii")).hexdigest()[:16].upper()
    report_id = f"Q7-SELF-{ISSUED_AT.strftime('%Y%m%d')}-{snapshot_id[:8]}"

    doc = SimpleDocTemplate(
        str(PDF_PATH),
        pagesize=letter,
        rightMargin=0.72 * inch,
        leftMargin=0.72 * inch,
        topMargin=0.56 * inch,
        bottomMargin=0.68 * inch,
        title="Hashcod Self-Assessment and Technical Conformity Report v1.0",
        author="Hashcod Project",
        subject="Internal technical self-assessment. Not an official certification.",
    )
    story = []

    identity = Table([
        [TerminalLogo(52), [
            p("Hashcod", styles["ReportTitle"]),
            p("SELF-ASSESSMENT AND TECHNICAL CONFORMITY REPORT v1.0", styles["Kicker"]),
            p("Internal engineering evidence package for the cryptographic platform snapshot.", styles["ReportSubtitle"]),
        ]]
    ], colWidths=[66, 440])
    identity.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (-1, -1), 0),
        ("TOPPADDING", (0, 0), (-1, -1), 0),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
    ]))
    story.append(identity)
    story.append(Spacer(1, 7))
    metadata = [
        [p("<b>Report ID</b>", styles["CellCustom"]), p(report_id, styles["CellCustom"]),
         p("<b>Issued</b>", styles["CellCustom"]), p(ISSUED_AT.strftime("%Y-%m-%d %H:%M:%S UTC-04:00"), styles["CellCustom"])],
        [p("<b>Git snapshot</b>", styles["CellCustom"]), p(full_commit, styles["CellSmall"]),
         p("<b>Version</b>", styles["CellCustom"]), p("Platform v12 / package 2.1.0", styles["CellCustom"])],
        [p("<b>Snapshot digest</b>", styles["CellCustom"]), p(snapshot_id, styles["CellCustom"]),
         p("<b>Assessment type</b>", styles["CellCustom"]), p("Internal self-assessment", styles["CellCustom"])],
    ]
    story.append(styled_table(metadata, [76, 190, 86, 154], header=False, font_size=7.8, row_bgs=True))
    story.append(Spacer(1, 13))
    story.append(p(
        "LEGAL AND TECHNICAL NOTICE: This document is an internal self-assessment issued by the Hashcod project. "
        "It is not an official FIPS 140-3 validation, ISO/IEC 27001 certificate, SOC 2 examination, accredited "
        "laboratory result, penetration-test attestation, or legal guarantee of security.",
        styles["Callout"],
    ))
    story.append(p("Executive statement", styles["H1Custom"]))
    story.append(p(
        "Hashcod is a web-based cryptographic workstation and analysis platform. The evaluated snapshot includes "
        "a 10,000-entry catalog, code generation workflows, export tools, database-oriented features, authentication "
        "controls, QR and evidence functions, visual laboratories, and operational utilities. The platform is suitable "
        "for controlled demonstrations, prototyping, educational work, internal evaluation, and further security hardening.",
        styles["BodyCustom"],
    ))
    story.append(p(
        "This report documents observed implementation evidence and reproducible repository checks. It does not claim "
        "that every catalog name is a standardized cryptographic primitive, that every deployment is configured securely, "
        "or that the platform currently replaces a certified HSM, an independent audit, or a regulated security product.",
        styles["PositiveCallout"],
    ))
    story.append(p("Assessment conclusion", styles["H2Custom"]))
    story.extend(bullets([
        "Internal technical self-assessment: COMPLETED for the repository snapshot identified above.",
        "Reproducible enterprise self-test: PASSED for the checks listed in this report.",
        "Production certification status: NOT YET EXTERNALLY VALIDATED.",
        "Recommended next gate: independent application-security review and deployment hardening.",
    ]))

    story.append(PageBreak())
    story.append(p("1. Scope and evidence basis", styles["H1Custom"]))
    story.append(p(
        "The assessment covers source files in the local repository and the automated enterprise self-test. Runtime "
        "environment settings in Render, third-party service accounts, infrastructure administration, and operational "
        "procedures must be verified separately in the deployed environment.",
        styles["BodyCustom"],
    ))
    scope_rows = [
        [p("<b>Area</b>", styles["CellCustom"]), p("<b>Observed evidence</b>", styles["CellCustom"]), p("<b>Assessment boundary</b>", styles["CellCustom"])],
        [p("Application UI", styles["CellCustom"]), p("app/app.jsx and browser bundle", styles["CellCustom"]), p("Workstation interface, tools, exports, dialogs, labs", styles["CellCustom"])],
        [p("Server", styles["CellCustom"]), p("server.js", styles["CellCustom"]), p("HTTP routes, headers, authentication, persistence, audit, gateways", styles["CellCustom"])],
        [p("Catalog", styles["CellCustom"]), p("data/catalog.js and data/generators.js", styles["CellCustom"]), p("10,000 IDs and generator health checks", styles["CellCustom"])],
        [p("Automated test", styles["CellCustom"]), p("scripts/enterprise-selftest.js", styles["CellCustom"]), p("Known vectors and catalog/generator checks", styles["CellCustom"])],
        [p("Deployment", styles["CellCustom"]), p("Environment-dependent", styles["CellCustom"]), p("Requires separate Render configuration review", styles["CellCustom"])],
    ]
    story.append(styled_table(scope_rows, [100, 174, 232]))
    story.append(p("Repository integrity anchors", styles["H2Custom"]))
    hash_rows = [[p("<b>File</b>", styles["CellCustom"]), p("<b>SHA-256</b>", styles["CellCustom"])]]
    for name, digest in hashes:
        hash_rows.append([p(name, styles["CellCustom"]), p(digest, styles["CellSmall"])])
    story.append(styled_table(hash_rows, [160, 346], font_size=7.2))
    story.append(Spacer(1, 6))
    story.append(p(f"Latest commit subject: {commit_subject}", styles["SmallCustom"]))

    story.append(PageBreak())
    story.append(p("2. Reproducible automated checks", styles["H1Custom"]))
    story.append(p(
        "The repository enterprise self-test was executed with: <b>npm run test:enterprise</b>. The following results "
        "were returned by the evaluated snapshot.",
        styles["BodyCustom"],
    ))
    test_data = [[p("<b>Result</b>", styles["CellCustom"]), p("<b>Check</b>", styles["CellCustom"])]]
    for line in test_rows:
        status = "PASS" if line.startswith("PASS ") or line.startswith("ENTERPRISE SELFTEST OK") else "INFO"
        test_data.append([status_badge(status if status == "PASS" else "IMPLEMENTED"), p(line, styles["CellSmall"])])
    story.append(styled_table(test_data, [68, 438], font_size=7.3))
    story.append(Spacer(1, 8))
    story.append(p(
        "Interpretation: these checks are meaningful regression evidence, but they are not a substitute for a full "
        "cryptographic module validation, third-party code review, fuzzing campaign, adversarial penetration test, or "
        "formal verification.",
        styles["PositiveCallout"],
    ))

    story.append(PageBreak())
    story.append(p("3. Security control matrix", styles["H1Custom"]))
    story.append(p(
        "Status definitions: IMPLEMENTED means the repository contains an active implementation path. CONFIGURABLE means "
        "the capability exists but requires deployment settings. PARTIAL means useful controls exist but the target "
        "assurance level is not yet complete. NOT VALIDATED means no independent certification evidence is claimed.",
        styles["BodyCustom"],
    ))
    controls = [
        ("Password protection", "IMPLEMENTED", "Server hashes passwords with scrypt and random salt; legacy PBKDF2 verification remains supported."),
        ("Session cookies", "IMPLEMENTED", "HttpOnly and SameSite=Lax cookies; Secure flag enabled for production or forwarded HTTPS."),
        ("CSRF protection", "IMPLEMENTED", "Per-session CSRF token checked on protected mutation routes."),
        ("Rate limiting", "IMPLEMENTED", "IP and authenticated-user buckets with method-based limits and 429 responses."),
        ("Security headers", "IMPLEMENTED", "HSTS, X-Frame-Options DENY, nosniff, no-referrer, COOP, CORP, Permissions-Policy, CSP."),
        ("Encrypted local auth cache", "IMPLEMENTED", "AES-256-GCM envelope with random 96-bit IV and authentication tag."),
        ("Render PostgreSQL", "CONFIGURABLE", "DATABASE_URL activates PostgreSQL persistence; deployment environment must be reviewed."),
        ("OAuth / OIDC", "CONFIGURABLE", "Google, Microsoft and GitHub flows are present; provider credentials must be configured."),
        ("Audit records", "PARTIAL", "Security events are appended locally and synchronized to PostgreSQL when available."),
        ("Immutable hash-chained logs", "PARTIAL", "Append-style audit exists, but tamper-evident hash chaining is not demonstrated in server.js."),
        ("Automatic backups", "PARTIAL", "Daily best-effort local backups exist; restore drills and encrypted off-site retention need validation."),
        ("Secrets management", "PARTIAL", "Environment-variable support exists, but a production secret manager and rotation process are required."),
        ("CSP hardening", "PARTIAL", "CSP exists; unsafe-inline and unsafe-eval remain allowed because of current browser build dependencies."),
        ("MFA / passkeys", "PARTIAL", "Recommended for production; not demonstrated as an enforced account control in this snapshot."),
        ("HSM-backed key custody", "NOT VALIDATED", "No certified hardware-backed key management integration is claimed."),
        ("External penetration test", "NOT VALIDATED", "No independent penetration-test report is attached to this self-assessment."),
        ("FIPS 140-3 validation", "NOT VALIDATED", "No CMVP validation certificate is claimed for this application or module."),
        ("ISO/IEC 27001 certification", "NOT VALIDATED", "No accredited information-security management certificate is claimed."),
    ]
    control_rows = [[p("<b>Control</b>", styles["CellCustom"]), p("<b>Status</b>", styles["CellCustom"]), p("<b>Observed evidence or limitation</b>", styles["CellCustom"])]]
    for name, status, note in controls:
        control_rows.append([p(name, styles["CellCustom"]), status_badge(status), p(note, styles["CellSmall"])])
    story.append(styled_table(control_rows, [125, 80, 301], font_size=7.2))

    story.append(PageBreak())
    story.append(p("4. Platform capability inventory", styles["H1Custom"]))
    capabilities = [
        ("Core workstation", "Generation, copied-code database, QR workflows, exports, Code GUI/CMD, IDE utilities."),
        ("Analysis laboratories", "Parametric Analyzer, Pivot Kernel Crypto Lab, Complex Entropy Map, Graph Lab, Crypto Exam Suite."),
        ("Evidence and identity", "Evidence Vault concepts, certificates, QR verification, tickets, fingerprints, client records."),
        ("Cryptographic experiments", "LWE Lattice Lab, derivatives, geometric codes, BASEMAT-style mathematical tools."),
        ("Transport and phone flows", "HNS/HOS/HCP concepts, HNS Browser, Phone OS link, SMS gateway paths."),
        ("Security utilities", "Token Inspector, Secret Scanner, API Trust Score, File Integrity Monitor, Risk Engine, Developer Vault."),
        ("Business utilities", "Quotation, billing timer, ticket forge, license factory, launch-center materials."),
    ]
    capability_rows = [[p("<b>Capability group</b>", styles["CellCustom"]), p("<b>Observed scope</b>", styles["CellCustom"])]]
    for name, note in capabilities:
        capability_rows.append([p(name, styles["CellCustom"]), p(note, styles["CellCustom"])])
    story.append(styled_table(capability_rows, [145, 361], font_size=7.8))
    story.append(p("Cryptographic naming policy", styles["H2Custom"]))
    story.append(p(
        "The platform catalog includes standardized names, internal profiles, composite formats, experimental labels, "
        "educational artifacts, and generated variants. Internal or branded names must not be advertised as new proven "
        "cryptographic algorithms unless they receive public specification, expert review, reproducible testing, and "
        "appropriate external validation.",
        styles["PositiveCallout"],
    ))
    story.extend(bullets([
        "Use established libraries and standards for security-critical production encryption.",
        "Treat visual metrics, entropy scores, parametric curves, and Pivot Kernel results as analysis aids, not proofs of security.",
        "Label experimental profiles clearly in UI, reports, exports, and commercial materials.",
        "Document formula inputs, thresholds, false-positive limits, and datasets for every proprietary metric.",
    ]))

    story.append(PageBreak())
    story.append(p("5. Priority findings and corrective actions", styles["H1Custom"]))
    findings = [
        ("P0", "Rotate development fallback secret", "server.js contains a development fallback for HASHCOD_SECRET.", "Set a high-entropy HASHCOD_SECRET in Render and rotate it before external use."),
        ("P0", "Protect gate and admin hashes operationally", "Default hash constants are present as fallback values.", "Move production values to environment variables and maintain a documented rotation procedure."),
        ("P1", "Tighten browser CSP", "Current CSP allows unsafe-inline and unsafe-eval for existing build dependencies.", "Bundle frontend dependencies locally and remove unsafe directives where feasible."),
        ("P1", "Add tamper-evident audit chaining", "Audit events are append-oriented but not cryptographically chained.", "Store prevHash and rowHash for every audit row; verify chain integrity during export."),
        ("P1", "Verify PostgreSQL protection model", "Render persistence stores structured JSON; local cache is AES-GCM protected.", "Define encryption-at-rest responsibility, backup retention, access roles, and restore drills."),
        ("P1", "Enforce MFA or WebAuthn for sensitive actions", "Strong session controls exist, but a second factor is not demonstrated.", "Require step-up authentication for admin actions, secret export, and key rotation."),
        ("P2", "Expand automated tests", "Known vectors and catalog checks pass.", "Add API integration tests, auth negative cases, CSRF tests, file-upload tests, dependency scanning, and fuzzing."),
        ("P2", "Commission independent review", "This report is internal.", "Request an external pentest and remediate findings before marketing enterprise assurance."),
    ]
    finding_rows = [[p("<b>Priority</b>", styles["CellCustom"]), p("<b>Finding</b>", styles["CellCustom"]), p("<b>Evidence</b>", styles["CellCustom"]), p("<b>Recommended action</b>", styles["CellCustom"])]]
    for priority, name, evidence, action in findings:
        finding_rows.append([p(priority, styles["CellCustom"]), p(name, styles["CellCustom"]), p(evidence, styles["CellSmall"]), p(action, styles["CellSmall"])])
    story.append(styled_table(finding_rows, [42, 120, 160, 184], font_size=7.1))

    story.append(PageBreak())
    story.append(p("6. External assurance roadmap", styles["H1Custom"]))
    roadmap = [
        ("1", "Internal baseline", "Maintain this signed snapshot report, automated tests, change log, and reproducible hashes.", "Now"),
        ("2", "OWASP ASVS review", "Map server and frontend controls against OWASP ASVS requirements and record evidence per control.", "Next"),
        ("3", "Independent pentest", "Engage an external application-security reviewer for authenticated and unauthenticated testing.", "Before broad launch"),
        ("4", "Operational hardening", "Document incident response, backups, secret rotation, deployment approvals, and restore exercises.", "Before customer data"),
        ("5", "ISO/IEC 27001 path", "If selling enterprise services, build an ISMS and work with an accredited certification body.", "Business decision"),
        ("6", "FIPS 140-3 path", "Only if offering a cryptographic module requiring validation: work with an accredited lab and CMVP.", "Product decision"),
        ("7", "HSM integration", "For regulated key custody, integrate an appropriate HSM/KMS rather than claiming software equivalence.", "Enterprise tier"),
    ]
    roadmap_rows = [[p("<b>#</b>", styles["CellCustom"]), p("<b>Gate</b>", styles["CellCustom"]), p("<b>Deliverable</b>", styles["CellCustom"]), p("<b>Timing</b>", styles["CellCustom"])]]
    for index, gate, deliverable, timing in roadmap:
        roadmap_rows.append([p(index, styles["CellCustom"]), p(gate, styles["CellCustom"]), p(deliverable, styles["CellSmall"]), p(timing, styles["CellCustom"])])
    story.append(styled_table(roadmap_rows, [28, 120, 268, 90], font_size=7.5))
    story.append(p("Suggested public wording", styles["H2Custom"]))
    story.append(p(
        '"Hashcod maintains an internal technical self-assessment with reproducible repository checks. '
        'External certification and independent penetration testing remain separate assurance activities."',
        styles["PositiveCallout"],
    ))

    story.append(PageBreak())
    story.append(p("7. Standards and authoritative references", styles["H1Custom"]))
    refs = [
        ("OWASP Application Security Verification Standard (ASVS)", "https://owasp.org/www-project-application-security-verification-standard/"),
        ("NIST Cryptographic Module Validation Program (CMVP)", "https://csrc.nist.gov/projects/cryptographic-module-validation-program"),
        ("NIST FIPS 140-3 standard", "https://csrc.nist.gov/pubs/fips/140-3/final"),
        ("ODAC - Que es acreditacion", "https://odac.gob.do/que-es-acreditacion/"),
        ("ODAC - Laboratorios bajo NORDOM ISO/IEC 17025:2017", "https://odac.gob.do/todos-los-servicios/acreditacion-de-laboratorios-de-ensayo-y-calibracion-bajo-la-norma-nordom-iso-iec-170252017/"),
        ("ISO/IEC 27001 information security management systems", "https://www.iso.org/standard/27001"),
        ("AICPA SOC for Service Organizations", "https://www.aicpa-cima.com/topic/audit-assurance/audit-and-assurance-greater-than-soc-2"),
    ]
    ref_rows = [[p("<b>Reference</b>", styles["CellCustom"]), p("<b>Official URL</b>", styles["CellCustom"])]]
    for label, url in refs:
        ref_rows.append([p(label, styles["CellCustom"]), p(f'<link href="{url}" color="#123A5B">{url}</link>', styles["CellSmall"])])
    story.append(styled_table(ref_rows, [206, 300], font_size=7.5))
    story.append(Spacer(1, 10))
    story.append(p("Detached integrity verification", styles["H2Custom"]))
    story.append(p(
        "A companion .sha256 file is generated beside this PDF. Verify it before distribution or archival. The companion "
        "file contains the SHA-256 digest of the final PDF and can be checked independently with standard operating-system tools.",
        styles["BodyCustom"],
    ))
    story.append(p("Sign-off", styles["H2Custom"]))
    signoff = [
        [p("<b>Issued by</b>", styles["CellCustom"]), p("Hashcod Project - Internal Technical Self-Assessment", styles["CellCustom"])],
        [p("<b>Snapshot</b>", styles["CellCustom"]), p(full_commit, styles["CellSmall"])],
        [p("<b>Report ID</b>", styles["CellCustom"]), p(report_id, styles["CellCustom"])],
        [p("<b>Qualification</b>", styles["CellCustom"]), p("Internal evidence report only. External certification not claimed.", styles["CellCustom"])],
    ]
    story.append(styled_table(signoff, [105, 401], header=False, font_size=7.7))

    doc.build(story, onFirstPage=page_decor, onLaterPages=page_decor)
    pdf_hash = sha256_file(PDF_PATH)
    SHA_PATH.write_text(f"{pdf_hash}  {PDF_PATH.name}\n", encoding="ascii")
    return PDF_PATH, SHA_PATH, report_id, pdf_hash


if __name__ == "__main__":
    pdf_path, sha_path, report_id, pdf_hash = build_report()
    print(f"PDF={pdf_path}")
    print(f"SHA256_FILE={sha_path}")
    print(f"REPORT_ID={report_id}")
    print(f"PDF_SHA256={pdf_hash}")
