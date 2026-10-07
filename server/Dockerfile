# MoneyTrack API — Express + PostgreSQL
# Build:  docker build -t moneytrack-server .
# Dev:    docker build --target development -t moneytrack-server-dev .

FROM node:20-alpine AS base
WORKDIR /app
COPY package.json package-lock.json ./

FROM base AS development
RUN npm install
COPY . .
ENV NODE_ENV=development
ENV HOST=0.0.0.0
ENV PORT=4000
EXPOSE 4000
CMD ["npm", "run", "dev"]

FROM base AS production
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=4000
RUN npm ci --omit=dev
COPY . .
RUN addgroup -S nodeapp && adduser -S nodeapp -G nodeapp \
  && chown -R nodeapp:nodeapp /app
USER nodeapp
EXPOSE 4000
HEALTHCHECK --interval=15s --timeout=5s --retries=5 --start-period=15s \
  CMD node -e "fetch('http://127.0.0.1:4000/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["npm", "start"]
