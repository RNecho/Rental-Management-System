FROM node:20-alpine

# Set working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json first
# This helps Docker cache dependencies if no package files changed
COPY package*.json ./

# Install all dependencies
RUN npm install

# Copy application source code
COPY . .

# Build the application (client & server)
RUN npm run build

# Make sure the data directory exists to store the SQLite database
RUN mkdir -p /app/data

# Set the SQLite database URL to use the data folder
ENV DATABASE_URL="file:/app/data/sqlite.db"

# Expose the application port
EXPOSE 5000

# Push the database schema and then run the app
CMD ["sh", "-c", "npm run db:push && npm run start"]
