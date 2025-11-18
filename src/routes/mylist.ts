import express, { Router, Request, Response, NextFunction } from 'express';
import { MyListItem } from '../models/MyList';
import { Movie, TVShow } from '../models/Content';
import { setCache, getCache, invalidateCache } from '../services/cache';
import { decodeAndValidateToken } from '../utils/auth';

const router: Router = express.Router();

const extractUserId = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization as string;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid Authorization header' });
  }

  const token = authHeader.substring(7); // Remove 'Bearer ' prefix
  const decoded = decodeAndValidateToken(token);

  if (!decoded) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  (req as any).userId = decoded.userId;
  next();
};

router.use(extractUserId);

const cacheListMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  const userId = (req as any).userId;
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(50, parseInt(req.query.limit as string) || 20);
  const cacheKey = `list:${userId}:${page}:${limit}`;

  const cached = await getCache(cacheKey);
  if (cached) {
    return res.status(200).json({
      success: true,
      ...cached,
      cached: true,
    });
  }

  (req as any).cacheKey = cacheKey;
  next();
};

// Add to My List
router.post('/add', async (req: Request, res: Response) => {
  try {
    const { contentId, contentType } = req.body;
    const userId = (req as any).userId;

    if (!contentId || !contentType) {
      return res.status(400).json({ error: 'contentId and contentType are required' });
    }

    if (!['movie', 'tvshow'].includes(contentType)) {
      return res.status(400).json({ error: 'Invalid contentType. Must be movie or tvshow' });
    }

    // Verify content exists
    if (contentType === 'movie') {
      const movie = await Movie.findOne({ id: contentId });
      if (!movie) {
        return res.status(404).json({ error: 'Movie not found' });
      }
    } else {
      const tvshow = await TVShow.findOne({ id: contentId });
      if (!tvshow) {
        return res.status(404).json({ error: 'TV Show not found' });
      }
    }

    // Check if already in list
    const existing = await MyListItem.findOne({ userId, contentId });
    if (existing) {
      return res.status(409).json({ error: 'Item already in My List' });
    }

    // Add to list
    const listItem = new MyListItem({
      userId,
      contentId,
      contentType,
      addedAt: new Date(),
    });

    await listItem.save();

    await invalidateCache(`list:${userId}`);

    res.status(201).json({
      success: true,
      message: 'Item added to My List',
      data: listItem,
    });
  } catch (error) {
    console.error('Error adding to My List:', error);
    res.status(500).json({ error: 'Failed to add item to My List' });
  }
});

// Remove from My List
router.delete('/remove/:contentId', async (req: Request, res: Response) => {
  try {
    const { contentId } = req.params;
    const userId = (req as any).userId;

    const result = await MyListItem.findOneAndDelete({ userId, contentId });

    if (!result) {
      return res.status(404).json({ error: 'Item not found in My List' });
    }

    await invalidateCache(`list:${userId}`);

    res.status(200).json({
      success: true,
      message: 'Item removed from My List',
    });
  } catch (error) {
    console.error('Error removing from My List:', error);
    res.status(500).json({ error: 'Failed to remove item from My List' });
  }
});

router.get('/items', cacheListMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, parseInt(req.query.limit as string) || 20);
    const skip = (page - 1) * limit;
    const cacheKey = (req as any).cacheKey;

    // Optimized query with pagination - using lean() and exec() for better performance
    const items = await MyListItem.find({ userId })
      .sort({ addedAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean()
      .exec();

    const total = await MyListItem.countDocuments({ userId });

    // Fetch full content details in parallel for better performance
    const contentIds = items.map((item) => item.contentId);
    const [movies, tvshows] = await Promise.all([
      Movie.find({ id: { $in: contentIds } }).lean().exec(),
      TVShow.find({ id: { $in: contentIds } }).lean().exec(),
    ]);

    // Map content back to list items
    const enrichedItems = items.map((item) => {
      const content =
        item.contentType === 'movie'
          ? movies.find((m) => m.id === item.contentId)
          : tvshows.find((t) => t.id === item.contentId);

      return {
        id: item._id,
        contentId: item.contentId,
        contentType: item.contentType,
        addedAt: item.addedAt,
        content,
      };
    });

    const responseData = {
      data: enrichedItems,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };

    const ttl = page === 1 ? 60 : 30;
    await setCache(cacheKey, responseData, ttl);

    res.status(200).json({
      success: true,
      ...responseData,
    });
  } catch (error) {
    console.error('Error fetching My List items:', error);
    res.status(500).json({ error: 'Failed to fetch My List items' });
  }
});

export default router;
