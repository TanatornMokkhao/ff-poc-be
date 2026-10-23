FROM node:22-alpine
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
COPY server.js settings.js index.js .env.example ./
# The commit is baked in, so the image always knows what code it holds. The version is set by the
# hub at deploy time, since one image serves an rc and its prod release.
# SSM_PATH names the Parameter Store path the server reads its settings from at boot.
ARG GIT_SHA=unknown
ARG BUILT_AT=unknown
ENV GIT_SHA=$GIT_SHA BUILT_AT=$BUILT_AT
LABEL org.opencontainers.image.revision=$GIT_SHA org.opencontainers.image.created=$BUILT_AT
ENV PORT=3000
EXPOSE 3000
CMD ["node", "index.js"]
