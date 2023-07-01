import mongoose, { Document, Schema } from 'mongoose';

export interface TokenCreationData extends Document {
    access_token: TokenInfo;
    refresh_token: TokenInfo;
    user_id: string;
}

interface TokenInfo {
    token: string;
    expires_at: number;
}

const tokenSchema = new mongoose.Schema(
    {
        access_token: {
            token: { type:String, required: true },
            expires_at: { type: Number, required: true }
        },
        refresh_token: {
            token: { type:String, required: true },
            expires_at: { type: Number, required: true }
        },
        user_id: {
            type: String,
            required: true
        }
    },
    {
        timestamps: true
    }
)

const Token = mongoose.model('Token', tokenSchema);

export default Token;