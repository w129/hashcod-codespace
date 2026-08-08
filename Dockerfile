FROM php:8.1-cli

# Instalar librerías del sistema + GitHub CLI (gh) para Render
RUN apt-get update && apt-get install -y \
    ca-certificates \
    curl \
    gnupg \
    libzip-dev \
    libcurl4-openssl-dev \
    unzip \
    openssh-client \
    git \
    && curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg \
      | dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg \
    && chmod go+r /usr/share/keyrings/githubcli-archive-keyring.gpg \
    && echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" \
      > /etc/apt/sources.list.d/github-cli.list \
    && apt-get update \
    && apt-get install -y gh \
    && docker-php-ext-install opcache zip curl \
    && rm -rf /var/lib/apt/lists/*

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
    echo 'opcache.enable=1'; \
    echo 'opcache.enable_cli=1'; \
    echo 'opcache.memory_consumption=128'; \
    echo 'opcache.interned_strings_buffer=16'; \
    echo 'opcache.max_accelerated_files=10000'; \
    echo 'opcache.revalidate_freq=0'; \
    echo 'opcache.fast_shutdown=1'; \
} > /usr/local/etc/php/conf.d/docker-php-high-performance.ini

WORKDIR /var/www/html

COPY . /var/www/html

# Entrypoint: confirma qué vars de entorno llegan al contenedor (sin secretos)
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

VOLUME ["/var/www/html/data_storage", "/var/www/html/uploads"]

EXPOSE 8000

ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["php", "-S", "0.0.0.0:8000", "router.php"]
