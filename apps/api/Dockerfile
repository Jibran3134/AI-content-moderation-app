FROM node:20-alpine
WORKDIR /app
COPY . .
RUN npm install
RUN npm run build --workspace=@repo/api
EXPOSE 4000
CMD ["npm", "run", "start", "--workspace=@repo/api"]
