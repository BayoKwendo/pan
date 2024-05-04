/**
*import mysql fron the node modules
@package mysql */
/**
*get variables from the .env configs
@package dotenv */
import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config({ path: '.env' }); // iniatilized configs here

/**
   * @desc  database connection config here; 
 * */
mongoose.set("strictQuery", false);
// Define the database URL to connect to.
// `mongodb+srv://${username}:${password}@${cluster}.mongodb.net/${dbname}?retryWrites=true&w=majority`
const url = `mongodb://${process.env.MONGO_INITDB_ROOT_USERNAME}:${process.env.MONGO_INITDB_ROOT_PASSWORD}@${process.env.MONGO_HOST}:${process.env.MONGO_PORT}/admin?retryWrites=true&w=majority`;

main().catch((err) => console.log(err));
async function main() {
  await mongoose.connect(url);
}


const connectDB = mongoose.connection;

export default connectDB; // exports
