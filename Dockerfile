FROM node:18


## exposed port
EXPOSE 2394

## work directory
WORKDIR /app
COPY . .


RUN npm cache clean --force
RUN npm install

## cmd command
# CMD /wait && npm start
CMD ["npm", "start"]
