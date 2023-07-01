import { FastifyInstance, RouteShorthandOptions } from 'fastify';
import { Server, IncomingMessage, ServerResponse } from 'http';
import UserDB, { PERMISSIONS, User, UserCreationData } from '../../../models/userModel';
import { authenticate } from '../../../middleware/authenticate';


async function routes(fastify: FastifyInstance<Server, IncomingMessage, ServerResponse>, options: RouteShorthandOptions) {

    fastify.addHook('preHandler', async (request) => {
        await authenticate(request);
    })

    fastify.get('/', async (request, reply) => {
        try {
            const users = await UserDB.find({});

            reply.send({
                status: true,
                data: users
            });
        } catch (error: any) {
            throw new Error(error)
        }
    });

    fastify.post<{ Body: UserCreationData }>('/', async (request, reply) => {
        try {
            const user = await UserDB.findOne({"username": request.body.username});
            if(user) {
                throw new Error('Username already taken');
            }

            const newUser: UserCreationData = new UserDB(request.body);

            const response = await UserDB.create(newUser) as User;
            reply.send({
                status: true,
                data: response
            });

        } catch (error: any) {
            throw new Error(error)
        }

    });

    fastify.get<{ Params: { id: string; } }>('/:id', async (request, reply) => {
        try {
            const { id } = request.params;
            const user = await UserDB.findById(id);

            if(!user) {
                throw new Error(`Cannot find user with id: ${id}`);
            }

            reply.send({
                status: true,
                data: user
            });
        } catch (error: any) {
            throw new Error(error)
        }

    });

    fastify.put<{ Params: { id: string; }, Body: UserCreationData }>('/:id', async(request,reply) => {
        try {
            const {id} = request.params;
            const user = await UserDB.findByIdAndUpdate(id, request.body);
            if(!user) {
                throw new Error(`Cannot find user with id: ${id}`);
            }
    
            if(!user.email) {
                await UserDB.findByIdAndUpdate(id, {"email_verified": false, "permissions": [PERMISSIONS.READ_NOTES] });
            } else if (request.body.email || request.body.email === '' && (user.email !== request.body.email)) {
                await UserDB.findByIdAndUpdate(id, {"email_verified": false, "permissions": [PERMISSIONS.READ_NOTES] });
            }
    
    
            const updatedUser = await UserDB.findById(id);
            reply.send({
                status: true,
                data: updatedUser
            });
        } catch (error: any) {
            console.log(error.message);
            throw new Error(error.message)
        }
    })
    
    fastify.delete<{ Params: { id: string; } }>('/:id', async(request,reply) => {
        try {
            const {id} = request.params;
            const user = await UserDB.findByIdAndDelete(id);
            if(!user) {
                throw new Error(`Cannot find user with id: ${id}`);
            }
    
            reply.send({
                status: true,
                data: user
            });
        } catch (error: any) {
            console.log(error.message);
            throw new Error(error.message)
        }
    })
    
    // fastify.post<{ Params: { id: string; } }>('/:id/send-email-verification', async(request,reply) => {
    //     try {
    //         const {id} = request.params;
    //         const user = await UserDB.findById(id);
    //         if (user && !user.email) {
    //             throw new Error('Sorry! You first need to provide an email.')
    //         }
    
    //         const userOtpVerificationRecords = await userOTPVerification.find({"user_id": id});
    //         if(userOtpVerificationRecords.length >= 1) {
    //             await userOTPVerification.deleteMany({"user_id": id});
    //         }
    //         const otp = `${Math.floor(1000 + Math.random() * 9000)}`;
    
    //         //capire compe rimandare all'app o al sito, in base a dove è avvenuto il click.
    //         const mailDetails = {
    //             to: user.email,
    //             subject: "Tournament Site - Email di Verifica",
    //             html: `
    //             <h1 style="color: red">Test HTML</h1><h1>From ${user.email}</h1>
    //             <p>Your OTP code is ${otp}</p>
    //             <p>Click <a src="${CONFIG.CLIENT.ADDRESS}/profile?otpToken=${otp}">here</a> to confirm your email.</p>
    //             `
    //         };
    
    //         const hashedOtp = await bcrypt.hash(otp, 10);
    //         await userOTPVerification.create({
    //             user_id: user.id,
    //             otp: hashedOtp,
    //             created_at: new Date().getTime(),
    //             expires_at: new Date().getTime() + 3600000  //1 hour later
    //         })
    
    //         await mailService(mailDetails);
    //         reply.status(200).json({status: true, data: {otp}});
    //     } catch (error) {
    //         reply.status(500).json({message: error.message});
    //     }
        
    // })
    
    // fastify.put('/:id/add-email-verification/:token', async(request,reply) => {
    //     try {
    //         let {id, token} = request.params;
    //         if(!id || !token) {
    //             return reply.status(500).json({message: "Missing user id or token."})
    //         }
    
    //         const userOtpVerificationRecords = await userOTPVerification.find({"user_id": id});
    //         if(userOtpVerificationRecords.length <= 0) {
    //             return reply.status(500).json({message: `Cannot find existing otp equal to ${token}.`})
    //         } else {
    //             const { expires_at } = userOtpVerificationRecords[0];
    //             const hashedOtp = userOtpVerificationRecords[0].otp;
    
    //             if(expires_at <= new Date().getTime) {
    //                 // token expired
    //                 await userOTPVerification.deleteMany({"user_id": id});
    //                 return reply.status(500).json({message: `Token: ${token}, has expired.`})
    //             } else {
    //                 const validOtp = await bcrypt.compare(token, hashedOtp);
    //                 if (!validOtp) {
    //                     return reply.status(500).json({code: 'invalid_token', message: `Invalide token ${token}.`})
    //                 } else {
    //                     await User.findByIdAndUpdate(id, {"email_verified": true, $addToSet: { "permissions": "create-tournament" }}); //permissions
    //                     await userOTPVerification.deleteMany({"user_id": id});
    //                 }
    //             }
    //         }
            
    //         reply.status(200).json({status: true})
    
    //     } catch (error) {
    //         reply.status(500).json({message: error.message})
    //     }
    // })

}

export default routes;
