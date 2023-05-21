FROM node:latest

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json files into the container
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Set the environment variable
ENV NODE_PATH=/app/node_modules

# Start the application with a delay
CMD [ "bash", "-c", "sleep 10 && node index.js" ]