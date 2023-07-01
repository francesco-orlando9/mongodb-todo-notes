import { FastifyInstance, RouteShorthandOptions } from 'fastify';
import { Server, IncomingMessage, ServerResponse } from 'http';

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

import CONFIG from '../../../config/config';
import UserDB, { User, UserCreationData } from '../../../models/userModel';
import Token from '../../../models/tokenModel';

interface LoginData {
    username: string;
    password: string;
}

interface SignupData extends UserCreationData {}

const getAccessTokenExpireDate = () => {
    const now = new Date();
    const expires_at = now.setHours(now.getHours() + 1)

    return expires_at;
}

const getRefreshTokenExpireDate = () => {
    const today = new Date();
    const expires_at = today.setDate(today.getDate() + 30)

    return expires_at;
}
async function routes(fastify: FastifyInstance<Server, IncomingMessage, ServerResponse>, options: RouteShorthandOptions) {

    fastify.post<{ Body: LoginData }>('/login', async (request, reply) => {
        try {
            const user = await UserDB.findOne({ "username": request.body.username });
            const isCorrectPassword = user ? await bcrypt.compare(request.body.password, user.password) : false;

            if (!user || !isCorrectPassword) {
                throw new Error(`Wrong username or password`)
            }

            const accessToken = jwt.sign(
                { username: user.username },
                CONFIG.TOKEN.ACCESS_TOKEN_SECRET,
                {
                    expiresIn: '1h'
                }
            );

            const refreshToken = jwt.sign(
                { username: user.username },
                CONFIG.TOKEN.REFRESH_TOKEN_SECRET,
                {
                    expiresIn: "30d",
                }
            );

            const accessTokenExpiresAt = getAccessTokenExpireDate();
            const refreshTokenExpiresAt = getRefreshTokenExpireDate();

            // save access token and refresh token in db
            await Token.findOneAndUpdate({ "user_id": user.id }, {
                access_token: {
                    token: accessToken,
                    expires_at: accessTokenExpiresAt
                },
                refresh_token: {
                    token: refreshToken,
                    expires_at: refreshTokenExpiresAt
                }
            });

            reply.send({
                data: {
                    user,
                    access_token: {
                        token: accessToken,
                        expires_at: accessTokenExpiresAt
                    },
                    refresh_token: {
                        token: refreshToken,
                        expires_at: refreshTokenExpiresAt
                    }
                }
            });

        } catch (error: any) {
            console.log(error.message);
            throw new Error(error.message);
        }
    })


    fastify.post<{ Body: SignupData }>('/signup', async (request, reply) => {
        try {
            const hashedPassword = await bcrypt.hash(request.body.password, 10);
            const user = await UserDB.findOne({ "username": request.body.username });
            if (user) {
                throw new Error('Username already taken');
            }
            const newUser = await UserDB.create({ ...request.body, password: hashedPassword });

            const accessToken = jwt.sign(
                { username: newUser.username },
                CONFIG.TOKEN.ACCESS_TOKEN_SECRET,
                {
                    expiresIn: '1h'
                }
            );

            const refreshToken = jwt.sign(
                { username: newUser.username },
                CONFIG.TOKEN.REFRESH_TOKEN_SECRET,
                {
                    expiresIn: "30d",
                }
            );

            const accessTokenExpiresAt = getAccessTokenExpireDate();
            const refreshTokenExpiresAt = getRefreshTokenExpireDate();

            // save access token and refresh token in db
            await Token.create({
                access_token: {
                    token: accessToken,
                    expires_at: accessTokenExpiresAt
                },
                refresh_token: {
                    token: refreshToken,
                    expires_at: refreshTokenExpiresAt
                },
                user_id: newUser.id
            });

            reply.send({
                data: {
                    user: newUser,
                    access_token: {
                        token: accessToken,
                        expires_at: accessTokenExpiresAt
                    },
                    refresh_token: {
                        token: refreshToken,
                        expires_at: refreshTokenExpiresAt
                    }
                }

            });

        } catch (error:any) {
            console.log(error.message);
            throw new Error(error.message)
        }

    })

    fastify.post("/refresh-token", async (request, reply) => {
        const refreshToken = request.headers.authorization && request.headers.authorization.split(' ')[1];

        // If token is not provided, send error message
        if (!refreshToken) {
            throw new Error('Token not found');
        }

        try {
            const user = jwt.verify(
                refreshToken,
                CONFIG.TOKEN.REFRESH_TOKEN_SECRET
            ) as User;

            const { username } = user;
            const accessToken = jwt.sign(
                { username },
                CONFIG.TOKEN.ACCESS_TOKEN_SECRET,
                { expiresIn: "1h" }
            );
            const accessTokenExpiresAt = getAccessTokenExpireDate();

            reply.send({
                data: {
                    access_token: {
                        token: accessToken,
                        expires_at: accessTokenExpiresAt
                    },
                }
            });
        } catch (error) {
            throw new Error("Invalid token")
        }
    });
}
export default routes;