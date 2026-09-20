# --- Build stage: compile TypeScript to lib/ ---
FROM node:22-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY tsconfig.json ./
COPY src ./src
RUN npm run compile

# --- Runtime stage: production dependencies and compiled output only ---
FROM node:22-alpine
ENV NODE_ENV=production
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=build /app/lib ./lib
COPY config ./config
COPY public ./public

# Run as the unprivileged user that ships with the node image
USER node

EXPOSE 3030
CMD ["node", "lib/"]
