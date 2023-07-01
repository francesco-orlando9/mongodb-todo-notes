import mongoose, { Document, Schema } from 'mongoose';


export interface UserCreationData extends Document {
    username: string;
    password: string;
    email: string;
    permissions?: PERMISSIONS[];
}

export interface User extends UserCreationData{
    id: string;
    createdAt: string;
    updatedAt: string;
}

export enum PERMISSIONS {
    READ_NOTES =  'read-notes',
    EDIT_NOTES = 'edit-notes',
    DELETE_NOTES = 'delete-notes'
}

const userSchema = new Schema<UserCreationData>({
    username: { type: String, required: true },
    password: { type: String, required: true },
    email: { type: String, required: true},
    permissions: { 
        type: [String],
        required: false,
        enum: Object.values(PERMISSIONS),
        default: [PERMISSIONS.READ_NOTES]
    }
});

userSchema.set('toJSON', {
    virtuals: true
});

const UserDB = mongoose.model<UserCreationData>('User', userSchema);

export default UserDB;