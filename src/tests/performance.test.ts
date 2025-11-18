import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import mongoose from 'mongoose';
import { MyListItem } from '../models/MyList';
import { Movie } from '../models/Content';
import { performance } from 'perf_hooks';

const TEST_MONGO_URI = process.env.TEST_MONGODB_URI || 'mongodb://localhost:27017/ott-mylist-test';

describe('Performance Tests', () => {
  beforeAll(async () => {
    await mongoose.connect(TEST_MONGO_URI);
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  it('should retrieve user list in under 10ms with 1000 items', async () => {
    const userId = 'perf-test-user';
    await MyListItem.deleteMany({ userId });
    await Movie.deleteMany({});

    // Create 1000 movies
    const movies = Array.from({ length: 1000 }, (_, i) => ({
      id: `movie-perf-${i}`,
      title: `Movie ${i}`,
      description: 'Test',
      genres: ['Action'],
      releaseDate: new Date(),
      director: 'Test',
      actors: [],
    }));
    await Movie.insertMany(movies);

    // Create 1000 list items
    const items = Array.from({ length: 1000 }, (_, i) => ({
      userId,
      contentId: `movie-perf-${i}`,
      contentType: 'movie',
      addedAt: new Date(Date.now() - i * 1000),
    }));
    await MyListItem.insertMany(items);

    // Measure performance
    const start = performance.now();
    await MyListItem.find({ userId })
      .sort({ addedAt: -1 })
      .skip(0)
      .limit(20)
      .lean()
      .exec();
    const duration = performance.now() - start;

    expect(duration).toBeLessThan(10);
    console.log(`✓ Query completed in ${duration.toFixed(2)}ms`);
  });
});
