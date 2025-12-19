# OTT Platform - My List Backend Service

A high-performance backend service for managing user's "My List" feature on an OTT (Over-The-Top) platform. Built with Express.js, MongoDB, TypeScript, and optimized for scalability and sub-10ms response times. 

## Features

- ✅ Add/Remove movies and TV shows to/from personal list
- ✅ Paginated retrieval of user's list with full content details
- ✅ JWT-based authentication with hardcoded mock user validation
- ✅ Redis caching for sub-10ms performance
- ✅ Comprehensive integration tests with 95%+ coverage
- ✅ User data isolation and security
- ✅ Production-ready deployment configuration
- ✅ CI/CD pipeline with AWS EC2 deployment

## Technology Stack

- **Runtime**: Node.js 20+
- **Language**: TypeScript
- **Framework**: Express.js
- **Database**: MongoDB 5.0+
- **Caching**: Redis with automatic TTL
- **Testing**: Vitest + Supertest
- **Authentication**: JWT with hardcoded mock user validation
- **Deployment**: Docker + Docker Compose + AWS EC2

## Installation

### Prerequisites

- Node.js 20 or higher
- MongoDB 5.0 or higher (or Docker)
- Redis (or Docker)
- npm or yarn

### Local Development

1. **Clone the repository**
   \`\`\`bash
   git clone <repository-url>
   cd ott-mylist-backend
   \`\`\`

2. **Install dependencies**
   \`\`\`bash
   npm install
   \`\`\`

3. **Set up environment variables**
   \`\`\`bash
   cp .env.example .env
   # Edit .env with your configuration
   \`\`\`

4. **Start MongoDB and Redis** (if using Docker)
   \`\`\`bash
   docker-compose up mongodb redis -d
   \`\`\`

5. **Run migrations**
   \`\`\`bash
   npm run migrations
   \`\`\`

6. **Seed sample data**
   \`\`\`bash
   npm run seed
   \`\`\`

7. **Start the development server**
   \`\`\`bash
   npm run backend:dev
   \`\`\`

The server will be available at \`http://localhost:3000\`

## Authentication

### JWT Token Generation (Testing)

Get a test token from the endpoint:

\`\`\`bash
curl http://localhost:3000/auth/test-token
\`\`\`

Response:
\`\`\`json
{
  "success": true,
  "token": "eyJhbGc...",
  "message": "Mock JWT token generated for testing. Use in Authorization header as: Bearer <token>"
}
\`\`\`

### Using JWT Tokens

Include the JWT token in the \`Authorization\` header for all API requests:

\`\`\`bash
Authorization: Bearer <your-jwt-token>
\`\`\`

### Token Validation

- Tokens are validated against a hardcoded mock user ID (\`user_12345\`)
- Only tokens with the correct userId and valid signature are accepted
- Expired tokens (older than 1 hour) will be rejected
- Invalid tokens return a 401 Unauthorized response

## API Endpoints

### Add to My List

\`\`\`http
POST /api/mylist/add
Authorization: Bearer <token>
Content-Type: application/json

{
  "contentId": "movie-001",
  "contentType": "movie"
}
\`\`\`

**Response (201)**:
\`\`\`json
{
  "success": true,
  "message": "Item added to My List",
  "data": {
    "_id": "...",
    "userId": "user_12345",
    "contentId": "movie-001",
    "contentType": "movie",
    "addedAt": "2024-01-15T10:30:00.000Z"
  }
}
\`\`\`

### Remove from My List

\`\`\`http
DELETE /api/mylist/remove/movie-001
Authorization: Bearer <token>
\`\`\`

**Response (200)**:
\`\`\`json
{
  "success": true,
  "message": "Item removed from My List"
}
\`\`\`

### List My Items

\`\`\`http
GET /api/mylist/items?page=1&limit=20
Authorization: Bearer <token>
\`\`\`

**Response (200)**:
\`\`\`json
{
  "success": true,
  "data": [
    {
      "id": "...",
      "contentId": "movie-001",
      "contentType": "movie",
      "addedAt": "2024-01-15T10:30:00.000Z",
      "content": {
        "id": "movie-001",
        "title": "The Matrix",
        "description": "A hacker learns about the true nature of reality.",
        "genres": ["SciFi", "Action"],
        "releaseDate": "1999-03-31T00:00:00.000Z",
        "director": "Lana Wachowski",
        "actors": ["Keanu Reeves", "Laurence Fishburne"]
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 5,
    "totalPages": 1
  },
  "cached": false
}
\`\`\`

## Error Responses

### 400 Bad Request
\`\`\`json
{
  "error": "contentId and contentType are required"
}
\`\`\`

### 401 Unauthorized
\`\`\`json
{
  "error": "Missing or invalid Authorization header"
}
\`\`\`

\`\`\`json
{
  "error": "Invalid or expired token"
}
\`\`\`

### 404 Not Found
\`\`\`json
{
  "error": "Movie not found"
}
\`\`\`

### 409 Conflict
\`\`\`json
{
  "error": "Item already in My List"
}
\`\`\`

## Running Tests

### Unit & Integration Tests

\`\`\`bash
npm test
\`\`\`

### Watch Mode

\`\`\`bash
npm run test:watch
\`\`\`

### Performance Tests

\`\`\`bash
npm test -- src/tests/performance.test.ts
\`\`\`

The performance tests verify that list retrieval with 1000+ items completes in under 10ms with caching enabled.

## Design Decisions

### 1. JWT Authentication

- **Mock User ID**: Hardcoded \`user_12345\` for validation
- **Token Validation**: Tokens decoded and userId verified against mock ID
- **Error Handling**: Clear 401 responses for missing or invalid tokens
- **Testing**: \`/auth/test-token\` endpoint generates valid test tokens

### 2. Redis Caching

- **Distributed Cache**: Replaced in-memory cache with Redis for multi-instance deployments
- **TTL Strategy**: First page cached for 60s, subsequent pages for 30s
- **Automatic Invalidation**: Cache invalidated immediately on add/remove operations
- **Connection Pool**: Reuses Redis connections for better performance

### 3. Database Optimization

- **Compound Indexes**: \`{ userId: 1, addedAt: -1 }\` for efficient pagination
- **Unique Constraint**: \`{ userId: 1, contentId: 1 }\` prevents duplicates
- **Lean Queries**: Using \`.lean()\` for read-only operations to reduce memory
- **Parallel Fetching**: Content details fetched in parallel to minimize latency

### 4. User Isolation

- **JWT-Based**: userId extracted from validated JWT token
- **Query Filtering**: All queries filtered by userId to ensure data isolation
- **Unique Constraints**: Database-level constraints prevent cross-user data access

### 5. Performance Targets

- **Add/Remove**: <50ms (includes database write)
- **List Retrieval**: <10ms (target, often <2ms with Redis cache)
- **Pagination**: Configurable limit with maximum of 50 items per page
- **Scalability**: Supports millions of items through indexed queries and Redis caching

## Deployment

### Docker Compose (Local/Development)

\`\`\`bash
docker-compose up --build
\`\`\`

### AWS EC2 Deployment via GitHub Actions

The CI/CD pipeline automatically:
1. Builds and tests the application
2. Creates a Docker image
3. Pushes to AWS ECR (Elastic Container Registry)
4. Deploys to AWS EC2 instance

**Required GitHub Secrets**:
- \`AWS_ACCESS_KEY_ID\`
- \`AWS_SECRET_ACCESS_KEY\`
- \`AWS_REGION\`
- \`AWS_ECR_REPOSITORY_NAME\`
- \`EC2_HOST\`
- \`EC2_USER\`
- \`EC2_SSH_KEY\`

### Environment Variables for Production

\`\`\`env
NODE_ENV=production
PORT=3000
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/ott-mylist?retryWrites=true&w=majority
REDIS_URL=redis://redis-host:6379
JWT_SECRET=your-production-jwt-secret-key
CORS_ORIGIN=https://your-domain.com
\`\`\`

## Database Schema

### MyListItem Collection

\`\`\`typescript
{
  _id: ObjectId,
  userId: String,           // Indexed
  contentId: String,        // Indexed with userId (unique pair)
  contentType: 'movie' | 'tvshow',
  addedAt: Date,           // Indexed with userId (for sorting)
  createdAt: Date,         // Auto-generated
  updatedAt: Date          // Auto-generated
}
\`\`\`

### Movie Collection

\`\`\`typescript
{
  _id: ObjectId,
  id: String,              // Unique index
  title: String,
  description: String,
  genres: String[],
  releaseDate: Date,
  director: String,
  actors: String[],
  type: 'movie',
  createdAt: Date
}
\`\`\`

### TVShow Collection

\`\`\`typescript
{
  _id: ObjectId,
  id: String,              // Unique index
  title: String,
  description: String,
  genres: String[],
  episodes: {
    episodeNumber: Number,
    seasonNumber: Number,
    releaseDate: Date,
    director: String,
    actors: String[]
  }[],
  type: 'tvshow',
  createdAt: Date
}
\`\`\`

## Testing Coverage

- **Endpoint Coverage**: 100% of public endpoints
- **JWT Authentication**: Token validation, invalid tokens, missing headers
- **Success Paths**: All positive scenarios tested
- **Error Cases**: 20+ error scenarios covered
- **Edge Cases**: Duplicates, pagination boundaries, user isolation
- **Performance**: Sub-10ms validation for queries with 1000+ items

## Known Assumptions

1. User authentication is JWT-based with hardcoded mock user ID for development
2. Content (movies/TV shows) pre-exist in the database
3. MongoDB is the persistent storage layer
4. Redis is used for distributed caching
5. Single or multi-instance deployments supported via Redis

## Future Enhancements

- [ ] Multiple user support with proper OAuth integration
- [ ] Sorting options (by date added, title, rating)
- [ ] Filtering by genre or content type
- [ ] Batch operations for adding/removing multiple items
- [ ] User list sharing and collaboration
- [ ] Advanced analytics on list patterns
- [ ] GraphQL API alongside REST
- [ ] WebSocket support for real-time list updates

## Support

For issues or questions, please create a GitHub issue or contact me on linkedin \`https://www.linkedin.com/in/kritarth-sharma1/\` .

## License

ISC
