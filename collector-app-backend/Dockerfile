# Use official Node.js image
FROM node:18


# Create app directory
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

# Copy package.json and install dependencies
COPY package.json package-lock.json /usr/src/app/
RUN npm install


# Copy the rest of the app
COPY . /usr/src/app

# Expose the port the app runs on
EXPOSE 5000

# Command to start the backend
CMD ["node", "server.js"]
