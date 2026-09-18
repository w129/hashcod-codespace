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
    gosu \
    && groupadd -g 10001 l8group \
    && useradd -u 10001 -g l8group -m -d /home/l8user -s /bin/bash l8user \
    && curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg \
      | dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg \
    && chmod go+r /usr/share/keyrings/githubcli-archive-keyring.gpg \
    && echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" \
      > /etc/apt/sources.list.d/github-cli.list \
    && apt-get update \
    && apt-get install -y gh $PHPIZE_DEPS \
    && docker-php-ext-install opcache zip curl \
    && pecl install apcu \
    && docker-php-ext-enable apcu \
    && curl -fsSL https://bun.sh/install | bash \
    && ln -sf /root/.bun/bin/bun /usr/local/bin/bun \
    && ln -sf /root/.bun/bin/bunx /usr/local/bin/bunx \
    && curl -fsSL https://claude.ai/install.sh | bash \
    && (ln -sf /root/.local/bin/claude /usr/local/bin/claude || true) \
    && curl -fsSL "https://caddyserver.com/api/download?os=linux&arch=amd64" -o /usr/local/bin/caddy \
    && chmod +x /usr/local/bin/caddy \
    && python3 -m venv /opt/l8-py \
    && /opt/l8-py/bin/pip install --no-cache-dir --upgrade pip \
    && chown -R l8user:l8group /opt/l8-py \
    && rm -rf /var/lib/apt/lists/*

# Node.js + agent-browser (control de páginas Google)
# https://github.com/vercel-labs/agent-browser
RUN curl -fsSL https://deb.nodesource.com/setup_22.x | bash - \
    && apt-get update && apt-get install -y --no-install-recommends nodejs \
    && mkdir -p /opt/agent-browser \
    && cd /opt/agent-browser && npm install agent-browser@^0.34.0 --no-fund --no-audit \
    && ln -sf /opt/agent-browser/node_modules/.bin/agent-browser /usr/local/bin/agent-browser \
    && (agent-browser install --with-deps || agent-browser install || true) \
    && chown -R l8user:l8group /opt/agent-browser \
    && rm -rf /var/lib/apt/lists/* /root/.npm

# Configurar directorio SSH y archivo config de GitHub para root y l8user
RUN curl --proto '=https' --tlsv1.2 -fsSL https://api.github.com/meta \
    | python3 -c 'import json,sys; d=json.load(sys.stdin); print("\\n".join("github.com "+k for k in d.get("ssh_keys", [])))' \
    > /etc/ssh/ssh_known_hosts \
    && test -s /etc/ssh/ssh_known_hosts \
    && chmod 644 /etc/ssh/ssh_known_hosts

RUN mkdir -p /root/.ssh && chmod 700 /root/.ssh && \
    echo "Host github.com\n\tStrictHostKeyChecking yes\n\tIdentityFile /root/.ssh/id_ed25519_github\n" > /root/.ssh/config && \
    chmod 600 /root/.ssh/config && \
    mkdir -p /home/l8user/.ssh && chmod 700 /home/l8user/.ssh && \
    echo "Host github.com\n\tStrictHostKeyChecking yes\n\tIdentityFile /home/l8user/.ssh/id_ed25519_github\n" > /home/l8user/.ssh/config && \
    chmod 600 /home/l8user/.ssh/config && \
    chown -R l8user:l8group /home/l8user/.ssh

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
    echo 'apc.enable_cli=1'; \
} > /usr/local/etc/php/conf.d/docker-php-high-performance.ini

WORKDIR /var/www/html

COPY requirements-streamlit.txt /tmp/requirements-streamlit.txt
RUN /opt/l8-py/bin/pip install --no-cache-dir -r /tmp/requirements-streamlit.txt \
    && ln -sf /opt/l8-py/bin/streamlit /usr/local/bin/streamlit \
    && ln -sf /opt/l8-py/bin/python /usr/local/bin/l8-python \
    && rm -f /tmp/requirements-streamlit.txt

COPY . /var/www/html

# Build the actual Rare UI React + Motion folder as a local browser bundle.
# This keeps the PHP platform native while using the same React/Motion behavior
# as `npx shadcn@latest add swamimalode07/rare-ui/folder-component`.
RUN cd /var/www/html/rare-folder-build \
    && npm install --no-fund --no-audit \
    && npm run build \
    && test -s /var/www/html/components/rare-folder-entry.bundle.js \
    && rm -rf /var/www/html/rare-folder-build/node_modules /root/.npm

RUN chown -R l8user:l8group /var/www/html \
    && mkdir -p /var/www/html/data_storage /var/www/html/uploads \
    && chown -R l8user:l8group /var/www/html/data_storage /var/www/html/uploads

# Entrypoint: confirma qué vars de entorno llegan al contenedor (sin secretos) y arranca servicios con l8user
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

VOLUME ["/var/www/html/data_storage", "/var/www/html/uploads"]

EXPOSE 8000

ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["caddy", "run", "--config", "/var/www/html/Caddyfile", "--adapter", "caddyfile"]
