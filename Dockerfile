# Usa imagen oficial de PHP con extensiones necesarias
FROM php:8.2-fpm

# Instala dependencias del sistema
RUN apt-get update && apt-get install -y \
    git curl libpng-dev libonig-dev libxml2-dev zip unzip \
    libzip-dev libpq-dev libcurl4-openssl-dev \
    && docker-php-ext-install pdo pdo_mysql zip mbstring exif pcntl bcmath

# Instala Composer
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

# Copia el proyecto
WORKDIR /var/www
COPY . .

# Instala dependencias de Laravel
RUN composer install --no-interaction --prefer-dist --optimize-autoloader
RUN npm install && npm run build

# Da permisos a Laravel
RUN chown -R www-data:www-data /var/www/storage /var/www/bootstrap/cache

# Expone el puerto y arranca con PHP's built-in server
EXPOSE 8000
CMD php artisan serve --host=0.0.0.0 --port=8000
