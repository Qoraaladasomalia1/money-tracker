# MoneyTrack frontend — Vite React → nginx
# Production ALWAYS builds with empty API URL (same-origin /api).

FROM node:20-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# Ignore Coolify/build-arg localhost — production must use relative /api
ENV VITE_API_URL=
RUN npm run build

FROM node:20-alpine AS development
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install
COPY . .
ENV HOST=0.0.0.0
EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "5173"]

FROM nginx:1.27-alpine AS production
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1/ || exit 1
CMD ["nginx", "-g", "daemon off;"]
