import jwt from 'jsonwebtoken';
import CONFIG from '../config/config';
import { FastifyReply, FastifyRequest } from 'fastify';

declare module 'fastify' {
    interface FastifyRequest {
        user: any;
    }
}

export const authenticate = async (request: FastifyRequest): Promise<void> => {
    return new Promise<void>((resolve, reject) => {
        try {
            // get token splitting from Bearer
            const token = request.headers.authorization && request.headers.authorization.split(' ')[1];
            if (!token) {
                throw new Error('token not found');
            }

            const decode = token && jwt.verify(token, CONFIG.TOKEN.ACCESS_TOKEN_SECRET);

            request.user = decode;
            resolve();
        } catch (error: any) {
            if (error.name === 'TokenExpiredError') {
                console.log('Token expired')
            }
            console.log('Authenticate failed ::: ', error.message);
            reject(new Error("Authentication failed"));
        }
    });
}

