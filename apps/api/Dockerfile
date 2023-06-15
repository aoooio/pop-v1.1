# Use an official Node.js runtime as the base image
FROM node:14-alpine

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Install project dependencies
RUN npm install --production

# Copy the entire project to the working directory
COPY . .

# Set the command to start the Node.js API
CMD ["npm", "start"]

# Expose port
EXPOSE 3000