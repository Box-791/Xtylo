FROM node:20-bullseye-slim

WORKDIR /app

# Install OpenSSL + pg_isready dependency
RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates postgresql-client \
  && rm -rf /var/lib/apt/lists/*

# Copy package files
COPY package.json package-lock.json ./

# Install deps (tolerates lockfile drift)
RUN npm install

# Copy backend source
COPY . .

# Generate Prisma client + build TS
RUN npx prisma generate
RUN npm run build

EXPOSE 4000

# Wait for DB -> run migrations -> start server
CMD ["sh", "-c", "until pg_isready -h db -p 5432 -U xtylo; do echo 'Waiting for Postgres...'; sleep 1; done; npx prisma migrate deploy && node dist/server.js"]
