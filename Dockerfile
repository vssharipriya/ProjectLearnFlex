FROM node:22.18-bookworm-slim
WORKDIR /app
ENV NODE_ENV=production HOST=0.0.0.0 LEARNFLEX_DATA_DIR=/var/data
COPY . .
EXPOSE 3100
CMD ["node", "server.js"]
