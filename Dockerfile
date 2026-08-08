FROM php:8.1-cli

# Instalar librerías del sistema requeridas para opcache, zip, openssh y git
RUN apt-get update && apt-get install -y \
    libzip-dev \
    unzip \
    openssh-client \
    git \
    && docker-php-ext-install opcache zip \
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

EXPOSE 8000

CMD ["php", "-S", "0.0.0.0:8000", "router.php"]
