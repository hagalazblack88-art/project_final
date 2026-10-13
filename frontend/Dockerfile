# ============================================
# ЭТАП 1: Сборка приложения
# ============================================
FROM node:20-alpine AS builder

WORKDIR /app

# Копируем только файлы зависимостей (для кэширования)
COPY package.json package-lock.json* ./

# Устанавливаем зависимости
RUN npm ci

# Копируем весь код
COPY . .

# Собираем production-версию
RUN npm run build

# ============================================
# ЭТАП 2: Production-сервер на nginx
# ============================================
FROM nginx:alpine

# Копируем нашу конфигурацию nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Копируем собранные файлы из первого этапа
COPY --from=builder /app/dist /usr/share/nginx/html

# Открываем порт
EXPOSE 80

# Запускаем nginx
CMD ["nginx", "-g", "daemon off;"]