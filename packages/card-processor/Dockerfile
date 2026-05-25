FROM node:22-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json tsconfig.base.json ./
COPY packages/shared/package.json ./packages/shared/
COPY packages/card-issuer/package.json ./packages/card-issuer/
COPY packages/card-processor/package.json ./packages/card-processor/

RUN npm ci

COPY packages/shared ./packages/shared
COPY packages/card-processor ./packages/card-processor

RUN npx tsc -b --force packages/shared/tsconfig.json
RUN npx tsc -b --force packages/card-processor/tsconfig.json
RUN test -f packages/shared/dist/index.js || (echo "BUILD FAILED: shared/dist/index.js not produced" && exit 1)
RUN test -f packages/card-processor/dist/main.js || (echo "BUILD FAILED: card-processor/dist/main.js not produced" && exit 1)

FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

COPY package.json package-lock.json ./
COPY packages/shared/package.json ./packages/shared/
COPY packages/card-processor/package.json ./packages/card-processor/

RUN npm ci --omit=dev

COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/packages/card-processor/dist ./packages/card-processor/dist

USER node

CMD ["node", "packages/card-processor/dist/main.js"]
