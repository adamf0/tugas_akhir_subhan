# Gunakan Node.js versi 22.13.1-alpine
FROM node:22.13.1-alpine

# Set working directory di container
WORKDIR /usr/src/app

# Install dependencies build tools (karena node-fetch dan xml2js kadang butuh build)
RUN apk add --no-cache bash curl git python3 make g++ 

# Copy package.json dan package-lock.json (kalau ada) dulu, supaya caching docker lebih efisien
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy seluruh source code ke container
COPY . .

# Ekspos port
EXPOSE 3000

# Jalankan server
CMD ["node", "server.js"]
