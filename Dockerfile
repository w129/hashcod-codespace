FROM php:8.1-cli

# Sistema + GitHub CLI + Python/Streamlit + Caddy (proxy websockets /st/*)
RUN apt-get update && apt-get install -y \
    ca-certificates \
    curl \
    gnupg \
    libzip-dev \
    libcurl4-openssl-dev \
    unzip \
    openssh-client \
    git \
    python3 \
    python3-pip \
    python3-venv \
    && curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg \
      | dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg \
    && chmod go+r /usr/share/keyrings/githubcli-archive-keyring.gpg \
    && echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" \
      > /etc/apt/sources.list.d/github-cli.list \
    && apt-get update \
    && apt-get install -y gh \
    && docker-php-ext-install opcache zip curl \
    && curl -fsSL https://bun.sh/install | bash \
    && ln -sf /root/.bun/bin/bun /usr/local/bin/bun \
    && ln -sf /root/.bun/bin/bunx /usr/local/bin/bunx \
    && curl -fsSL https://claude.ai/install.sh | bash \
    && (ln -sf /root/.local/bin/claude /usr/local/bin/claude || true) \
    && curl -fsSL "https://caddyserver.com/api/download?os=linux&arch=amd64" -o /usr/local/bin/caddy \
    && chmod +x /usr/local/bin/caddy \
    && python3 -m venv /opt/l8-py \
    && /opt/l8-py/bin/pip install --no-cache-dir --upgrade pip \
    && rm -rf /var/lib/apt/lists/*

# Node.js + agent-browser (control de páginas Google)
# https://github.com/vercel-labs/agent-browser
RUN curl -fsSL https://deb.nodesource.com/setup_22.x | bash - \
    && apt-get update && apt-get install -y --no-install-recommends nodejs \
    && mkdir -p /opt/agent-browser \
    && cd /opt/agent-browser && npm install agent-browser@^0.34.0 --no-fund --no-audit \
    && ln -sf /opt/agent-browser/node_modules/.bin/agent-browser /usr/local/bin/agent-browser \
    && (agent-browser install --with-deps || agent-browser install || true) \
    && rm -rf /var/lib/apt/lists/* /root/.npm

# Configurar directorio SSH y archivo config de GitHub
RUN mkdir -p /root/.ssh && chmod 700 /root/.ssh && \
    echo "Host github.com\n\tStrictHostKeyChecking no\n\tIdentityFile /root/.ssh/id_ed25519_github\n" > /root/.ssh/config && \
    chmod 600 /root/.ssh/config

# Configuración de memoria y OPcache para procesamiento de datos masivos
RUN { \
    echo 'memory_limit = 512M'; \
    echo 'max_execution_time = 120'; \
    echo 'upload_max_filesize = 100M'; \
    echo 'post_max_size = 100M'; \
    echo 'variables_order = "EGPCS"'; \
    echo 'expose_php = Off'; \
    echo 'display_errors = Off'; \
    echo 'display_startup_errors = Off'; \
    echo 'log_errors = On'; \
    echo 'allow_url_fopen = Off'; \
    echo 'allow_url_include = Off'; \
    echo 'session.cookie_httponly = 1'; \
    echo 'session.cookie_samesite = Lax'; \
    echo 'opcache.enable=1'; \
    echo 'opcache.enable_cli=1'; \
    echo 'opcache.memory_consumption=128'; \
    echo 'opcache.interned_strings_buffer=16'; \
    echo 'opcache.max_accelerated_files=10000'; \
    echo 'opcache.revalidate_freq=0'; \
    echo 'opcache.fast_shutdown=1'; \
} > /usr/local/etc/php/conf.d/docker-php-high-performance.ini

WORKDIR /var/www/html

COPY requirements-streamlit.txt /tmp/requirements-streamlit.txt
RUN /opt/l8-py/bin/pip install --no-cache-dir -r /tmp/requirements-streamlit.txt \
    && ln -sf /opt/l8-py/bin/streamlit /usr/local/bin/streamlit \
    && ln -sf /opt/l8-py/bin/python /usr/local/bin/l8-python \
    && rm -f /tmp/requirements-streamlit.txt

COPY . /var/www/html

# Entrypoint: confirma qué vars de entorno llegan al contenedor (sin secretos)
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

VOLUME ["/var/www/html/data_storage", "/var/www/html/uploads"]

EXPOSE 8000

ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["caddy", "run", "--config", "/var/www/html/Caddyfile", "--adapter", "caddyfile"]
