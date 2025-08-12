# Backend Dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Create data directory for JSON files
RUN mkdir -p /app/data

# Expose port
EXPOSE 5001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "const http = require('http'); const options = { host: 'localhost', port: 5001, path: '/health', timeout: 2000 }; const request = http.request(options, (res) => { process.exit(res.statusCode === 200 ? 0 : 1); }); request.on('error', () => { process.exit(1); }); request.end();"

# Start the application
CMD ["npm", "run", "dev"]
