import connectDB from './db/connect';
/**
/**
 *import node packages fron the node modules
  @packages express, cors 
*/
const path = require('path');
const VIEWS = path.join(__dirname, 'views');

import express from 'express';
import cors from 'cors';
/**
* @desc  looger middleware  */
import logger from './middlewares/logger';
/**
* @desc not found response */
import notFound from './middlewares/notFound'
/**
    * 
    * @desc not found response 
    * @desc db connection 
* @desc path to routes */
import userProfile from './routes/user.route';
import userEvent from './routes/event.route';
import userShow from './routes/show.route';
import reportRoute from './routes/report.route';
import quoteRoute from './routes/quote.route';
import settingRoute from './routes/settting.route';

import client from './db/redis';
import { getConversation, getUserList, postMessage } from './helpers';
// import { murl } from './helpers/config';
/**
* express server iniatilization
* @name server
*/
const server = express();
server.use(cors());
server.use(express.json());

/**
* ports and server start
* @const port, start  
* */
const port = `${process.env.PORT}`;
/**
   * @api iniatilize api version to be used in routers 
 * */
const api_version = '/api/v2';

server.use(api_version, userProfile); // user profile router
server.use(api_version, userEvent); // user event router
server.use(api_version, userShow); // user show router
server.use(api_version, quoteRoute); // quote router
server.use(api_version, reportRoute); // report router

server.use(api_version, settingRoute); // setting router



/**ss
 * @desc we healthcheck our server to see if its online or not 
* */
server.get(api_version, async (req, res) => {
    logger.info(`/GET check server`);
    try {
        /**
           * @return  server seems to be running well 
        * */
        res.render('./welcome.html')
    }
    catch (error) {
        /**
          * @return  catch the error here 
        * */
        res.status(400).send({
            Status: false,
            StatusCode: 2,
            StatusMessage: `${error}`
        })
    }
})
/**
  * @desc 404 page wrong endpoint when called
* */
server.use(notFound);

/**
    * @const start
    * @desc server start point 
* */
const start = async () => {
    try {
        /**
          * @desc connection instance
        * */
        connectDB.on("error", console.error.bind(console, "connection error: "));
        connectDB.once("open", function () {
            console.log("Connected Successfully");
        });
        /**
           * @desc  check if we already have the db, if not we create one for ourselves 
        * */
        await client.connect().then(() => {
            console.log("Redis connected");

        }).catch((err: any) => {

            console.log(err)
            /**
                      * @desc not connected!
            * */
            logger.error("Redis Connection Failed ", err);
            process.exit();
        });

        console.log(`Your port is ${port}`, "success")
        /**
           @desc  database connection indicator 
        */
        logger.info(`Database connected...`);
        /**
           @desc  port which the server is running on 
        */
        logger.info(`Server listening on port ${port}....`)
        /**
           * @desc listening port 
        * */
        const servr = server.listen(port, () =>
            console.log(`Server running on port ${port}`)
        );

        const io = require('socket.io')(servr, {  // connection with front server
            cors: {
                norigin: "http://localhost:3000"
            }
        });
        // connection happening
        io.on('connection', (socket) => {
            console.log(`⚡: ${socket.id} user just connected!`)
            socket.on("message", async (data: { curent_user_id: any; recipient_id: any; body: any; }) => {
                const result = await postMessage(data.curent_user_id, data.recipient_id, data.body)
                io.emit("messageResponse", result)
            })
            //fetching history conversation on page Load
            socket.on("fetch-conversation", async data => {
                const conversation = await getConversation(data.current_user_id, data.recipient_id)
                io.emit("fetchConversationresponse", conversation)
            })

            //fetching history conversation on page Load
            socket.on("fetch-userlist", async data => {
                const conversation = await getUserList(data.current_user_id)
                io.emit("fetchserlistresponse", conversation)
            })

            // typing socket
            socket.on("typing", data => (
                socket.broadcast.emit("typingResponse", data)
            ))

            // socket disconnect
            socket.on('disconnect', () => {
                console.log('🔥: A user disconnected');
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               socket.disconnect()
            });
        });
    }
    catch (error) {
        /**
        * @desc throw server error if there is any 
        * */
        logger.error("error ", error)
        process.exit()
    }
};



/**
* @desc  start server 
* */
start();

