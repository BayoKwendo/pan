import * as redis from 'redis';

const url = process.env.REDIS_URL;

console.log("redis url ", url)
const client = redis.createClient({ url });


export default client