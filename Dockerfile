ARG NODE_DOCKER_IMAGE_TAG=20-alpine3.17

# Stage 1: Install dependencies only when needed
FROM node:${NODE_DOCKER_IMAGE_TAG} AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install

# Stage 2: Build and compile the code
FROM node:${NODE_DOCKER_IMAGE_TAG} AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY *.json ./
COPY /src ./src
COPY /prisma ./prisma
COPY /resorces ./resorces
RUN npm run db:generate
RUN npm run build
RUN rm -rf node_modules
RUN npm ci
RUN npm run db:generate

# Stage 3: Production image, copy all the files and run the application
FROM node:${NODE_DOCKER_IMAGE_TAG} AS runner
WORKDIR /app

# Copy the build output from the builder stage
COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/*.json ./

# Expose the port the app runs on
EXPOSE 8080

# Run the web service on container startup
CMD ["node", "dist/main"]
