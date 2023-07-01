import fastify from 'fastify';
import mongoose from 'mongoose';

import CONFIG from './config/config';
import userRoutes from './api/v1/routes/user';
import authRoutes from './api/v1/routes/auth';

const server = fastify({ logger: true });

mongoose.connect(CONFIG.MONGO.URL).then(() => {
    console.log('Connected to MongoDb')
    server.listen({ port: CONFIG.SERVER.PORT, host: CONFIG.SERVER.ADDRESS }, (err, address) => {
        if (err) {
            console.error(err);
            process.exit(1);
        }
    
        console.log(`Server listening at ${address}`);
    });
}).catch((error) => {
    console.log(error)
})


server.get('/', async (request, reply) => {
    reply.send({
        status: true
    })
});

server.register(userRoutes, { prefix: 'api/v1/users' });
server.register(authRoutes, { prefix: 'api/v1/auth' });
