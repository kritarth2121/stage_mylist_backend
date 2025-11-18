import mongoose from 'mongoose';

export interface IMyListItem {
  userId: string;
  contentId: string;
  contentType: 'movie' | 'tvshow';
  addedAt: Date;
}

export interface IMyList {
  userId: string;
  items: IMyListItem[];
  updatedAt: Date;
}

const myListItemSchema = new mongoose.Schema<IMyListItem>({
  userId: { type: String, required: true },
  contentId: { type: String, required: true },
  contentType: { type: String, enum: ['movie', 'tvshow'], required: true },
  addedAt: { type: Date, default: Date.now },
});

myListItemSchema.index({ userId: 1, contentId: 1 }, { unique: true });
myListItemSchema.index({ userId: 1, addedAt: -1 });

export const MyListItem = mongoose.model<IMyListItem>('MyListItem', myListItemSchema);
