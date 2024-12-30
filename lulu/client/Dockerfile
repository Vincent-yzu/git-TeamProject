FROM node:22-alpine

WORKDIR /app
RUN npm install -g pnpm
RUN npm install -g serve

COPY package.json .
RUN pnpm install
COPY . .

ARG VITE_BACKEND_URL
ARG VITE_GOOGLE_API_KEY
# Pass them to the environment
ENV VITE_BACKEND_URL=$VITE_BACKEND_URL
ENV VITE_GOOGLE_API_KEY=$VITE_GOOGLE_API_KEY
# Build the application
RUN pnpm build

# Use a lightweight server to serve the production build

CMD ["serve", "-s", "dist"]