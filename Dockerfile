FROM node:22-alpine
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
COPY server.js settings.js index.js .env.example ./
# The version is set by the hub at deploy time, so one image serves rc and final.
# SSM_PATH names the Parameter Store path the server reads its settings from at boot.
ENV PORT=3000
EXPOSE 3000
CMD ["node", "index.js"]
