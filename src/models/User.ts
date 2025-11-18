import mongoose from 'mongoose';

export interface IUser {
  _id: string;
  id: string;
  username: string;
  preferences: {
    favoriteGenres: string[];
    dislikedGenres: string[];
  };
  watchHistory: Array<{
    contentId: string;
    watchedOn: Date;
    rating?: number;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new mongoose.Schema<IUser>(
  {
    id: { type: String, required: true, unique: true },
    username: { type: String, required: true },
    preferences: {
      favoriteGenres: [String],
      dislikedGenres: [String],
    },
    watchHistory: [
      {
        contentId: String,
        watchedOn: Date,
        rating: Number,
      },
    ],
  },
  { timestamps: true }
);

userSchema.index({ id: 1 });

export const User = mongoose.model<IUser>('User', userSchema);
