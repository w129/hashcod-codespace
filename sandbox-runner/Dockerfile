FROM ghcr.io/gitleaks/gitleaks:v8.28.0 AS gitleaks
FROM python:3.12-slim
RUN apt-get update && apt-get install -y --no-install-recommends nodejs libseccomp2 && rm -rf /var/lib/apt/lists/*
COPY --from=gitleaks /usr/bin/gitleaks /usr/bin/gitleaks
WORKDIR /app
COPY sandbox-runner/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt && useradd -u 10001 -m reviewer
COPY tools/review/protocol.py ./
COPY sandbox-runner/*.py ./
RUN python fetch-runtimes.py /usr/local/share/review-wasm
RUN timeout 300 python precompile.py /usr/local/share/review-wasm
COPY sandbox-runner/isolate.py /usr/local/bin/review-isolate.py
COPY sandbox-runner/wasm.py /usr/local/bin/review-wasm.py
USER 10001:10001
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1
CMD ["python","server.py"]
