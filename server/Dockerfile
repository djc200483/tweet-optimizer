FROM node:18

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies using npm install instead of npm ci
RUN npm install

# Copy the rest of the application
COPY . .

# Start the application
CMD ["npm", "start"] 