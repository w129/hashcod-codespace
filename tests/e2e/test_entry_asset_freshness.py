"""Read-only deployment check for the public entry and its mutable bundles."""
import hashlib
import re
import sys
from html.parser import HTMLParser
from urllib.parse import parse_qs, urljoin, urlsplit
from urllib.request import ProxyHandler, Request, build_opener, urlopen
from urllib.error import HTTPError


class Assets(HTMLParser):
    def __init__(self):
        super().__init__()
        self.urls = []

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        value = attrs.get("src") if tag == "script" else attrs.get("href") if tag == "link" else None
        if value:
            self.urls.append(value)


def get(url, headers=None):
    # Local CI servers must not be sent through a developer's HTTP proxy.
    opener = build_opener(ProxyHandler({})).open if urlsplit(url).hostname in {"127.0.0.1", "localhost"} else urlopen
    with opener(Request(url, headers=headers or {}), timeout=45) as response:
        assert response.status == 200, f"{url}: expected 200"
        assert "no-store" in response.headers.get("Cache-Control", ""), f"{url}: missing no-store"
        return response.read()


def main():
    base = sys.argv[1].rstrip("/") + "/"
    critical = {
        "/components/mldsa-access-gate.js", "/components/mldsa-access-gate.css",
        "/components/mldsa-access-gate-loader.js",
        "/components/center-empty-state.bundle.js", "/components/center-empty-state.bundle.css",
        "/components/first-screen-branched-menu.bundle.js", "/components/first-screen-branched-menu.bundle.css",
        "/components/react-bits-rotating-text.js", "/components/react-bits-rotating-text.css",
    }
    routes = ["", "index.php", "index.html", "l8/", "l8-codespace/"]
    checked = set()
    for route in routes:
        document = get(urljoin(base, route)).decode("utf-8")
        for marker in ["<?php return", "Loading OCG mesh binding", "HC20-LOADING", "Creates likecode", "d5CodeAccessMount", "code-access.bundle."]:
            assert marker not in document, f"{route}: retired text {marker}"
        parser = Assets()
        parser.feed(document)
        found = set()
        for value in parser.urls:
            url = urljoin(base, value)
            parsed = urlsplit(url)
            path = re.sub(r"^/(?:l8|l8-codespace)(?=/|$)", "", parsed.path)
            if path not in critical:
                continue
            assert parsed.netloc == urlsplit(base).netloc, "entry assets must be local"
            found.add(path)
            digest = parse_qs(parsed.query).get("hash", [""])[0]
            assert re.fullmatch(r"[a-f0-9]{64}", digest), f"{path}: missing content fingerprint"
            if url not in checked:
                body = get(url)
                assert hashlib.sha256(body).hexdigest() == digest, f"{path}: stale or mismatched asset"
                # Mutable entry assets must not return a stale 304 for old clients.
                conditional = get(url, {"If-None-Match": "*", "If-Modified-Since": "Wed, 01 Jan 2031 00:00:00 GMT"})
                assert body == conditional, f"{path}: conditional request differs"
                checked.add(url)
        assert found == critical, f"{route}: missing assets {critical - found}"
    # Landing aliases must never turn into a general direct-PHP exception.
    opener = build_opener(ProxyHandler({})).open if urlsplit(base).hostname in {"127.0.0.1", "localhost"} else urlopen
    for private in ["secrets.php", "entry-assets.php", "data_storage/repos_index.json"]:
        try:
            with opener(urljoin(base, private), timeout=45) as response:
                raise AssertionError(f"{private}: private file returned {response.status}")
        except HTTPError as error:
            assert error.code in {403, 404}, f"{private}: unexpected status {error.code}"
    print(f"OK: {len(routes)} entry routes; {len(checked)} content fingerprints; no-store, conditional refresh and private file denial")


if __name__ == "__main__":
    main()
