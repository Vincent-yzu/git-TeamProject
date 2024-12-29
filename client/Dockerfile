FROM node:22-alpine

WORKDIR /app
RUN npm install -g pnpm

# Pass them to the environment
ENV VITE_BACKEND_URL=$VITE_BACKEND_URL
ENV VITE_GOOGLE_API_KEY=$VITE_GOOGLE_API_KEY

COPY package.json .
RUN pnpm install
COPY . .

# Build the application
RUN pnpm build

# Use a lightweight server to serve the production build
RUN npm install -g serve

CMD ["serve", "-s", "dist"]
