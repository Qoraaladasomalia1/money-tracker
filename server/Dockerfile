# MoneyTrack API (Express + PostgreSQL)
FROM node:20-alpine AS base
WORKDIR /app
COPY package*.json ./

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
CMD ["npm", "start"]
