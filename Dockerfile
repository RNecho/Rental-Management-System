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

# Expose the application port
EXPOSE 5000

# Run the app
CMD ["npm", "run", "start"]
