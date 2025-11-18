import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Movie, TVShow } from '../models/Content';
import { User } from '../models/User';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ott-mylist';

async function seedDatabase() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB for seeding...');

    // Clear existing data
    await Movie.deleteMany({});
    await TVShow.deleteMany({});
    await User.deleteMany({});

    // Seed users
    const users = [
      {
        id: 'user-001',
        username: 'john_doe',
        preferences: {
          favoriteGenres: ['Action', 'SciFi'],
          dislikedGenres: ['Horror'],
        },
        watchHistory: [],
      },
      {
        id: 'user-002',
        username: 'jane_smith',
        preferences: {
          favoriteGenres: ['Drama', 'Romance'],
          dislikedGenres: ['Comedy'],
        },
        watchHistory: [],
      },
    ];

    await User.insertMany(users);
    console.log(`✓ Seeded ${users.length} users`);

    // Seed movies
    const movies = [
      {
        id: 'movie-001',
        title: 'The Matrix',
        description: 'A hacker learns about the true nature of reality.',
        genres: ['SciFi', 'Action'],
        releaseDate: new Date('1999-03-31'),
        director: 'Lana Wachowski',
        actors: ['Keanu Reeves', 'Laurence Fishburne'],
      },
      {
        id: 'movie-002',
        title: 'Inception',
        description: 'A skilled thief leads a team to perform an inception.',
        genres: ['SciFi', 'Action', 'Drama'],
        releaseDate: new Date('2010-07-16'),
        director: 'Christopher Nolan',
        actors: ['Leonardo DiCaprio', 'Marion Cotillard'],
      },
      {
        id: 'movie-003',
        title: 'The Shawshank Redemption',
        description: 'Two imprisoned men bond over years, finding redemption.',
        genres: ['Drama'],
        releaseDate: new Date('1994-09-23'),
        director: 'Frank Darabont',
        actors: ['Tim Robbins', 'Morgan Freeman'],
      },
      {
        id: 'movie-004',
        title: 'Pulp Fiction',
        description: 'Multiple interconnected stories of LA criminals.',
        genres: ['Drama', 'Action'],
        releaseDate: new Date('1994-10-14'),
        director: 'Quentin Tarantino',
        actors: ['John Travolta', 'Uma Thurman'],
      },
      {
        id: 'movie-005',
        title: 'Dune',
        description: 'The son of a noble family must prevent a war over spice.',
        genres: ['SciFi', 'Action', 'Drama'],
        releaseDate: new Date('2021-10-22'),
        director: 'Denis Villeneuve',
        actors: ['Timothée Chalamet', 'Oscar Isaac'],
      },
    ];

    await Movie.insertMany(movies);
    console.log(`✓ Seeded ${movies.length} movies`);

    // Seed TV shows
    const tvshows = [
      {
        id: 'tvshow-001',
        title: 'Breaking Bad',
        description: 'A chemistry teacher turned meth manufacturer.',
        genres: ['Drama', 'Crime'],
        episodes: [
          {
            seasonNumber: 1,
            episodeNumber: 1,
            releaseDate: new Date('2008-01-20'),
            director: 'Vince Gilligan',
            actors: ['Bryan Cranston', 'Aaron Paul'],
          },
        ],
      },
      {
        id: 'tvshow-002',
        title: 'Game of Thrones',
        description: 'Political intrigue in a fictional medieval world.',
        genres: ['Drama', 'Fantasy', 'Action'],
        episodes: [
          {
            seasonNumber: 1,
            episodeNumber: 1,
            releaseDate: new Date('2011-04-17'),
            director: 'Tim Van Patten',
            actors: ['Emilia Clarke', 'Jon Snow'],
          },
        ],
      },
      {
        id: 'tvshow-003',
        title: 'Stranger Things',
        description: 'Supernatural occurrences in a small Indiana town.',
        genres: ['Drama', 'Fantasy', 'Horror'],
        episodes: [
          {
            seasonNumber: 1,
            episodeNumber: 1,
            releaseDate: new Date('2016-07-15'),
            director: 'The Duffer Brothers',
            actors: ['Winona Ryder', 'David Harbour'],
          },
        ],
      },
    ];

    await TVShow.insertMany(tvshows);
    console.log(`✓ Seeded ${tvshows.length} TV shows`);

    console.log('✓ Database seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

seedDatabase();
