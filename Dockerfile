# Orbital Academy — one container serves the site AND the API.
# Persistent data (SQLite + auth secret) goes to /data -> mount a volume/disk there.
FROM node:22-slim
WORKDIR /app
COPY package.json ./
COPY server ./server
COPY js ./js
COPY css ./css
COPY assets ./assets
COPY data ./data
COPY index.html ./
ENV NODE_ENV=production \
    PORT=8080 \
    DATA_DIR=/data \
    DB_FILE=/data/orbital.db
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||8080)+'/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "--no-warnings=ExperimentalWarning", "server/server.js"]
