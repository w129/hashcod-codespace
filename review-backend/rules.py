"""Only fixed server rules can authorize a certificate. The model cannot."""
import json
import re
from protocol import ReviewError

REQUIRED = {"sandbox", "tests", "sast", "secrets", "deps"}
SEVERITIES = {"critical", "high", "medium", "low"}
KEY_PATTERN = re.compile(r"sk-(?:ant-)?[A-Za-z0-9_-]{16,}|AIza[A-Za-z0-9_-]{25,}|-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----")


def safe_text(text, key="", limit=20000):
    text = str(text)
    if key:
        text = text.replace(key, "[clave protegida]")
    return KEY_PATTERN.sub("[secreto protegido]", text)[:limit]


def ai_verdict(text):
    try:
        value = json.loads(text)
        if not isinstance(value, dict) or set(value) != {"verdict", "findings", "summary"}:
            return None
        if value["verdict"] not in {"pass", "fail", "needs_human"} or not isinstance(value["summary"], str) or len(value["summary"]) > 4000:
            return None
        if not isinstance(value["findings"], list) or len(value["findings"]) > 100:
            return None
        for item in value["findings"]:
            if not isinstance(item, dict) or set(item) != {"severity", "line", "title", "detail"}:
                return None
            if item["severity"] not in SEVERITIES or (item["line"] is not None and (type(item["line"]) is not int or not 1 <= item["line"] <= 1000000)):
                return None
            if not all(isinstance(item[k], str) and len(item[k]) <= 4000 for k in ("title", "detail")):
                return None
        return value
    except (ValueError, TypeError, KeyError):
        return None


def checked_results(checks):
    if not isinstance(checks, list) or len(checks) != len(REQUIRED) or {c.get("kind") for c in checks if isinstance(c, dict)} != REQUIRED:
        raise ReviewError("incomplete_checks", "Las verificaciones objetivas están incompletas.", 503)
    for check in checks:
        counts = check.get("severity_counts")
        if check.get("status") not in {"complete", "unavailable"} or type(check.get("passed")) is not bool:
            raise ReviewError("invalid_checks", "No se pudo comprobar el resultado del análisis.", 503)
        if not isinstance(counts, dict) or set(counts) != SEVERITIES or any(type(v) is not int or not 0 <= v <= 100000 for v in counts.values()):
            raise ReviewError("invalid_checks", "No se pudo comprobar el resultado del análisis.", 503)
        if not all(isinstance(check.get(k), str) and 0 < len(check[k]) <= 180 for k in ("tool", "tool_version")):
            raise ReviewError("invalid_checks", "No se pudo comprobar el resultado del análisis.", 503)
    return checks


def decide(checks, verdict):
    checked_results(checks)
    if any(c["severity_counts"]["critical"] for c in checks):
        return "fail"
    if any(c["status"] != "complete" for c in checks):
        return "needs_human"
    if any(c["severity_counts"]["high"] for c in checks):
        return "needs_human"
    if any(not c["passed"] for c in checks):
        return "fail"
    if verdict is None or verdict["verdict"] == "needs_human":
        return "needs_human"
    if verdict["verdict"] == "fail":
        return "fail"
    if any(f["severity"] in {"critical", "high"} for f in verdict["findings"]):
        return "needs_human"
    return "pass" if verdict["verdict"] == "pass" else "needs_human"
