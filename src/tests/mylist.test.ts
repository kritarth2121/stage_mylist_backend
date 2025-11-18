import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import mongoose from 'mongoose';
import { MyListItem } from '../models/MyList';
import { Movie, TVShow } from '../models/Content';
import myListRoutes from '../routes/mylist';
import { generateMockToken } from '../utils/auth';

// Create test app
const createTestApp = () => {
  const app = express();
  app.use(express.json());
  app.use('/api/mylist', myListRoutes);
  return app;
};

const TEST_MONGO_URI = process.env.TEST_MONGODB_URI || 'mongodb://localhost:27017/ott-mylist-test';
const TEST_MOVIE_ID = 'movie-001';
const TEST_TVSHOW_ID = 'tvshow-001';

describe('My List API - JWT Authentication', () => {
  let app: any;
  let validToken: string;

  beforeAll(async () => {
    // Connect to test database
    await mongoose.connect(TEST_MONGO_URI);
    app = createTestApp();
    validToken = generateMockToken();
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  beforeEach(async () => {
    // Clean up collections
    await MyListItem.deleteMany({});
    await Movie.deleteMany({});
    await TVShow.deleteMany({});

    // Seed test data
    await Movie.create({
      id: TEST_MOVIE_ID,
      title: 'Test Movie',
      description: 'A great test movie',
      genres: ['Action', 'Drama'],
      releaseDate: new Date('2023-01-01'),
      director: 'Test Director',
      actors: ['Actor 1', 'Actor 2'],
    });

    await TVShow.create({
      id: TEST_TVSHOW_ID,
      title: 'Test TV Show',
      description: 'A great test TV show',
      genres: ['Comedy', 'Drama'],
      episodes: [
        {
          episodeNumber: 1,
          seasonNumber: 1,
          releaseDate: new Date('2023-01-01'),
          director: 'Test Director',
          actors: ['Actor 1'],
        },
      ],
    });
  });

  describe('POST /api/mylist/add - Add to My List', () => {
    it('should successfully add a movie to My List with valid JWT', async () => {
      const response = await request(app)
        .post('/api/mylist/add')
        .set('Authorization', `Bearer ${validToken}`)
        .send({
          contentId: TEST_MOVIE_ID,
          contentType: 'movie',
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.contentId).toBe(TEST_MOVIE_ID);
      expect(response.body.data.contentType).toBe('movie');

      const saved = await MyListItem.findOne({ contentId: TEST_MOVIE_ID });
      expect(saved).toBeDefined();
    });

    it('should successfully add a TV show to My List', async () => {
      const response = await request(app)
        .post('/api/mylist/add')
        .set('Authorization', `Bearer ${validToken}`)
        .send({
          contentId: TEST_TVSHOW_ID,
          contentType: 'tvshow',
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.contentId).toBe(TEST_TVSHOW_ID);
    });

    it('should return 401 if Authorization header is missing', async () => {
      const response = await request(app)
        .post('/api/mylist/add')
        .send({
          contentId: TEST_MOVIE_ID,
          contentType: 'movie',
        });

      expect(response.status).toBe(401);
      expect(response.body.error).toContain('Missing or invalid Authorization header');
    });

    it('should return 401 if token is invalid', async () => {
      const response = await request(app)
        .post('/api/mylist/add')
        .set('Authorization', 'Bearer invalid-token')
        .send({
          contentId: TEST_MOVIE_ID,
          contentType: 'movie',
        });

      expect(response.status).toBe(401);
      expect(response.body.error).toContain('Invalid or expired token');
    });

    it('should return 401 if Authorization header lacks Bearer prefix', async () => {
      const response = await request(app)
        .post('/api/mylist/add')
        .set('Authorization', validToken)
        .send({
          contentId: TEST_MOVIE_ID,
          contentType: 'movie',
        });

      expect(response.status).toBe(401);
      expect(response.body.error).toContain('Missing or invalid Authorization header');
    });

    it('should return 400 if contentId is missing', async () => {
      const response = await request(app)
        .post('/api/mylist/add')
        .set('Authorization', `Bearer ${validToken}`)
        .send({
          contentType: 'movie',
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('contentId and contentType are required');
    });

    it('should return 400 if contentType is invalid', async () => {
      const response = await request(app)
        .post('/api/mylist/add')
        .set('Authorization', `Bearer ${validToken}`)
        .send({
          contentId: TEST_MOVIE_ID,
          contentType: 'invalid',
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Invalid contentType');
    });

    it('should return 404 if movie does not exist', async () => {
      const response = await request(app)
        .post('/api/mylist/add')
        .set('Authorization', `Bearer ${validToken}`)
        .send({
          contentId: 'non-existent-movie',
          contentType: 'movie',
        });

      expect(response.status).toBe(404);
      expect(response.body.error).toContain('Movie not found');
    });

    it('should return 409 if item already in list', async () => {
      // Add item first time
      await request(app)
        .post('/api/mylist/add')
        .set('Authorization', `Bearer ${validToken}`)
        .send({
          contentId: TEST_MOVIE_ID,
          contentType: 'movie',
        });

      // Try to add again
      const response = await request(app)
        .post('/api/mylist/add')
        .set('Authorization', `Bearer ${validToken}`)
        .send({
          contentId: TEST_MOVIE_ID,
          contentType: 'movie',
        });

      expect(response.status).toBe(409);
      expect(response.body.error).toContain('already in My List');
    });
  });

  describe('DELETE /api/mylist/remove/:contentId - Remove from My List', () => {
    it('should successfully remove a movie from My List', async () => {
      // Add first
      await MyListItem.create({
        userId: 'user_12345',
        contentId: TEST_MOVIE_ID,
        contentType: 'movie',
      });

      const response = await request(app)
        .delete(`/api/mylist/remove/${TEST_MOVIE_ID}`)
        .set('Authorization', `Bearer ${validToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      const remaining = await MyListItem.findOne({ contentId: TEST_MOVIE_ID });
      expect(remaining).toBeNull();
    });

    it('should return 404 if item not in list', async () => {
      const response = await request(app)
        .delete(`/api/mylist/remove/${TEST_MOVIE_ID}`)
        .set('Authorization', `Bearer ${validToken}`);

      expect(response.status).toBe(404);
      expect(response.body.error).toContain('not found');
    });

    it('should return 401 if token is missing', async () => {
      const response = await request(app).delete(`/api/mylist/remove/${TEST_MOVIE_ID}`);

      expect(response.status).toBe(401);
      expect(response.body.error).toContain('Missing or invalid Authorization header');
    });
  });

  describe('GET /api/mylist/items - List My Items', () => {
    it('should return empty list for new user', async () => {
      const response = await request(app)
        .get('/api/mylist/items')
        .set('Authorization', `Bearer ${validToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual([]);
      expect(response.body.pagination.total).toBe(0);
    });

    it('should return paginated list of items', async () => {
      // Add 5 movies
      const movieIds = ['movie-001', 'movie-002', 'movie-003', 'movie-004', 'movie-005'];
      
      for (let i = 0; i < 5; i++) {
        await Movie.create({
          id: movieIds[i],
          title: `Test Movie ${i}`,
          description: 'Test',
          genres: ['Action'],
          releaseDate: new Date(),
          director: 'Test',
          actors: [],
        });

        await MyListItem.create({
          userId: 'user_12345',
          contentId: movieIds[i],
          contentType: 'movie',
          addedAt: new Date(Date.now() - i * 1000),
        });
      }

      const response = await request(app)
        .get('/api/mylist/items?page=1&limit=2')
        .set('Authorization', `Bearer ${validToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.limit).toBe(2);
      expect(response.body.pagination.total).toBe(5);
      expect(response.body.pagination.totalPages).toBe(3);
    });

    it('should enforce maximum limit of 50', async () => {
      const response = await request(app)
        .get('/api/mylist/items?limit=100')
        .set('Authorization', `Bearer ${validToken}`);

      expect(response.status).toBe(200);
      expect(response.body.pagination.limit).toBe(50);
    });

    it('should include full content details in response', async () => {
      await MyListItem.create({
        userId: 'user_12345',
        contentId: TEST_MOVIE_ID,
        contentType: 'movie',
      });

      const response = await request(app)
        .get('/api/mylist/items')
        .set('Authorization', `Bearer ${validToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].content.title).toBe('Test Movie');
      expect(response.body.data[0].content.genres).toContain('Action');
    });

    it('should return items sorted by most recently added', async () => {
      // Add 3 items with delays
      for (let i = 0; i < 3; i++) {
        const movieId = `movie-${i}`;
        await Movie.create({
          id: movieId,
          title: `Test Movie ${i}`,
          description: 'Test',
          genres: ['Action'],
          releaseDate: new Date(),
          director: 'Test',
          actors: [],
        });

        await MyListItem.create({
          userId: 'user_12345',
          contentId: movieId,
          contentType: 'movie',
          addedAt: new Date(Date.now() - i * 1000),
        });
      }

      const response = await request(app)
        .get('/api/mylist/items')
        .set('Authorization', `Bearer ${validToken}`);

      expect(response.body.data[0].contentId).toBe('movie-0');
      expect(response.body.data[1].contentId).toBe('movie-1');
      expect(response.body.data[2].contentId).toBe('movie-2');
    });

    it('should return 401 if token is missing', async () => {
      const response = await request(app).get('/api/mylist/items');

      expect(response.status).toBe(401);
    });
  });
});
