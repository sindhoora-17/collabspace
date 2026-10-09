FROM node:22-bookworm-slim AS builder

WORKDIR /app

RUN npm install -g npm@11.6.0

RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl \
  && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./

RUN npm ci

COPY prisma ./prisma
COPY prisma7.config.ts ./

COPY tsconfig*.json ./
COPY nest-cli.json ./

COPY src ./src

RUN DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy" \
    npx prisma generate --config prisma7.config.ts

RUN npm run build


FROM node:22-bookworm-slim AS production

WORKDIR /app

RUN npm install -g npm@11.6.0

ENV NODE_ENV=production

RUN apt-get update \
  && apt-get install -y --no-install-recommends \
    openssl \
    ca-certificates \
    curl \
  && rm -rf /var/lib/apt/lists/*

RUN mkdir -p /app/certs \
  && curl -fsSL \
    https://truststore.pki.rds.amazonaws.com/global/global-bundle.pem \
    -o /app/certs/global-bundle.pem

COPY package.json package-lock.json ./

RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist

EXPOSE 3000

CMD ["npm", "run", "start:prod"]