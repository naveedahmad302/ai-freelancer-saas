FROM mcr.microsoft.com/playwright:v1.48.0-noble

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Create directory for browser profiles
RUN mkdir -p /data/browser-profiles

EXPOSE 3001

CMD ["node", "dist/index.js"]
