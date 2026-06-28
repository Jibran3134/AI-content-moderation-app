FROM node:20-alpine
WORKDIR /app
COPY . .
RUN npm install
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build --workspace=@repo/web
EXPOSE 3000
CMD ["npm", "run", "start", "--workspace=@repo/web"]
