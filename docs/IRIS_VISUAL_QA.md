# Iris Visual QA for Hashcod Codespace

Hashcod Codespace uses [Iris](https://github.com/brijr/iris) as an optional visual-quality camera for development and CI. Iris is not shipped to end users and is not part of the browser runtime.

## What this adds

The workflow captures four deterministic visual checkpoints from a local Hashcod instance:

- desktop entrance/platform view;
- iPhone-sized view;
- full-page view;
- isolated `.top-bar` view, where platform tool icons are mounted.

Each capture produces a PNG and JSON metadata. CI uploads the evidence as a GitHub Actions artifact so layout regressions can be inspected after UI changes.

## Reproducibility and supply-chain controls

CI pins Iris to **v0.4.1** and verifies the upstream Linux release archive with SHA-256:

`aa6073ba255c0bcf09364a5503cbd4794791b832e5934a52b169a455d66101c7`

The workflow does not use the mutable `latest` installer path.

## Run locally

Requirements:

1. a Chrome-family browser;
2. Iris installed and available as `iris`;
3. PHP for the local Hashcod page.

Start Hashcod:

```bash
php -S 127.0.0.1:8099
```

Then run:

```bash
IRIS_URL=http://127.0.0.1:8099/laragon-local-entry.php \
  bash scripts/iris_visual_qa.sh
```

To choose a specific browser binary:

```bash
IRIS_CHROME=/path/to/chrome bash scripts/iris_visual_qa.sh
```

Artifacts are written to `artifacts/iris-visual-qa/` by default.

## Upstream attribution

Iris is Copyright (c) 2026 Bridger Tower and distributed under the MIT License. Hashcod Codespace invokes the upstream Iris executable as a development/CI tool; it does not copy Iris source code into the application runtime.
