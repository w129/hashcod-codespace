FROM python:3.12-slim
WORKDIR /app
COPY review-backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt && useradd -u 10001 -m reviewer
COPY tools/review/protocol.py ./
COPY review-backend/*.py ./
USER 10001:10001
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1
CMD ["python", "server.py"]
