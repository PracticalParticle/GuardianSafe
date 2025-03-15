# Use Node.js 16 (Bullseye slim) as the base image
FROM node:16-bullseye-slim as truffle

# Install global dependencies: npm, Truffle, and Ganache
RUN npm install --global --quiet truffle

# Set a working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json (or yarn.lock) to the container
COPY package*.json ./

# Install local dependencies in the container
RUN npm install --quiet --production && npm cache clean --force

# Copy the entire project directory to the container (excluding the dependencies)
COPY . .

# Set the default command to run when the container starts: "truffle version"
CMD ["truffle", "version"]
