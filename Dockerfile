FROM node:24-bookworm-slim

WORKDIR /app

# better-sqlite3 falls back to a native build when no binary is published for
# the current Node.js/CPU combination.
RUN apt-get update \
    && apt-get install --no-install-recommends -y python3 make g++ \
    && rm -rf /var/lib/apt/lists/*

# Install production dependencies first so Docker can reuse this layer when only
# application code changes.
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY . .

# SQLite files are written under /app/data.  The node user keeps the runtime
# container unprivileged while retaining write access to the mounted volume.
RUN mkdir -p /app/data && chown -R node:node /app
USER node

ENV NODE_ENV=production

CMD ["npm", "start"]
