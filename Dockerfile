FROM node:22-alpine
WORKDIR /app
COPY package.json server.js index.js ./
# The version is set by the hub at deploy time, so one image serves rc and final.
ENV PORT=3000
EXPOSE 3000
CMD ["node", "index.js"]
