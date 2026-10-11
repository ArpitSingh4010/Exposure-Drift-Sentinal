import { Schema, model, Document } from 'mongoose';

export type UserRole = 'UNDERWRITER' | 'SENIOR_UNDERWRITER' | 'ADMIN';

export interface IUser extends Document {
  userId: string;
  name: string;
  role: UserRole;
}

const UserSchema = new Schema<IUser>(
  {
    userId: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    role: {
      type: String,
      enum: ['UNDERWRITER', 'SENIOR_UNDERWRITER', 'ADMIN'],
      required: true,
    },
  },
  { timestamps: true },
);

export const User = model<IUser>('User', UserSchema);
