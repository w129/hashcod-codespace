# CPU Detectron2 detector for the Hashcod Vision tool. Deploy as a separate service
# and point DETECTRON2_URL / DETECTRON2_TOKEN of the main app at it.
FROM public.ecr.aws/docker/library/python:3.11-slim
RUN apt-get update && apt-get install -y --no-install-recommends git build-essential \
    && rm -rf /var/lib/apt/lists/*
RUN pip install --no-cache-dir torch torchvision --index-url https://download.pytorch.org/whl/cpu \
    && pip install --no-cache-dir pillow numpy \
    && pip install --no-cache-dir 'git+https://github.com/facebookresearch/detectron2.git'
# Non-root user (uid 1000) so the same image runs on Hugging Face Spaces; model weights cache in its home.
RUN useradd -m -u 1000 user
USER user
WORKDIR /home/user/app
COPY --chown=user server.py .
ENV PORT=7860
EXPOSE 7860
CMD ["python", "server.py"]
