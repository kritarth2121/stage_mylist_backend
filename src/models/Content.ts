import mongoose from 'mongoose';

export interface IMovie {
  _id: string;
  id: string;
  title: string;
  description: string;
  genres: string[];
  releaseDate: Date;
  director: string;
  actors: string[];
  type: 'movie';
  createdAt: Date;
}

export interface ITVShow {
  _id: string;
  id: string;
  title: string;
  description: string;
  genres: string[];
  episodes: Array<{
    episodeNumber: number;
    seasonNumber: number;
    releaseDate: Date;
    director: string;
    actors: string[];
  }>;
  type: 'tvshow';
  createdAt: Date;
}

const movieSchema = new mongoose.Schema<IMovie>(
  {
    id: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    genres: [String],
    releaseDate: Date,
    director: String,
    actors: [String],
    type: { type: String, enum: ['movie'], default: 'movie' },
  },
  { timestamps: true }
);

const tvShowSchema = new mongoose.Schema<ITVShow>(
  {
    id: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    genres: [String],
    episodes: [
      {
        episodeNumber: Number,
        seasonNumber: Number,
        releaseDate: Date,
        director: String,
        actors: [String],
      },
    ],
    type: { type: String, enum: ['tvshow'], default: 'tvshow' },
  },
  { timestamps: true }
);

movieSchema.index({ id: 1 });
tvShowSchema.index({ id: 1 });

export const Movie = mongoose.model<IMovie>('Movie', movieSchema);
export const TVShow = mongoose.model<ITVShow>('TVShow', tvShowSchema);
