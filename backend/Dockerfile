FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 4000

# Apply migrations then start server
CMD sh -c "npx prisma migrate deploy && npx ts-node src/server.ts"
