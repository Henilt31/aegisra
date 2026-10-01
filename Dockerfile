# AegisRA production image.
# Pinned to Node 22 so the built-in `node:sqlite` module is available WITHOUT a
# runtime flag (it is on-by-default from Node 22.17+). Using an explicit base
# image keeps the deployment deterministic regardless of the platform default.
FROM node:22-slim

WORKDIR /app

# Install dependencies first for better layer caching. devDependencies (vite,
# @vitejs/plugin-react) are required to build the frontend, so we must NOT pass
# --omit=dev here.
COPY package.json package-lock.json ./
RUN npm ci

# Copy the rest of the application source.
COPY . .

# Build the Vite frontend into /app/dist, which server.cjs serves statically.
RUN npm run build

ENV NODE_ENV=production

# Railway injects PORT at runtime; server.cjs reads process.env.PORT.
# EXPOSE is documentation only and does not fix the port.
EXPOSE 4173

CMD ["npm", "start"]
