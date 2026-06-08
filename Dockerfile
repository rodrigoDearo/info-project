FROM node:20-alpine AS base
WORKDIR /app

RUN apk add --no-cache python3 make g++
COPY package*.json ./
RUN npm ci

FROM base AS development
COPY . .
EXPOSE 3000
CMD ["npm", "run", "start:dev"]

FROM base AS builder
COPY . .
RUN npm run build && npm prune --production

FROM node:20-alpine AS production
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY package*.json ./
EXPOSE 3000
CMD ["node", "dist/main"]
