import { createClient, RedisClientType } from 'redis';

let redisClient: RedisClientType | null = null;

export async function initRedis(): Promise<void> {
  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
  
  redisClient = createClient({
    url: redisUrl,
  });

  redisClient.on('error', (err) => {
    console.error('Redis Client Error', err);
  });

  await redisClient.connect();
  console.log('Connected to Redis');
}

export async function getRedisClient(): Promise<RedisClientType> {
  if (!redisClient) {
    await initRedis();
  }
  return redisClient!;
}

export async function setCache<T>(key: string, data: T, ttlSeconds: number = 30): Promise<void> {
  const client = await getRedisClient();
  await client.setEx(key, ttlSeconds, JSON.stringify(data));
}

export async function getCache<T>(key: string): Promise<T | null> {
  const client = await getRedisClient();
  const data = await client.get(key);
  if (!data) return null;
  return JSON.parse(data) as T;
}

export async function invalidateCache(pattern: string): Promise<void> {
  const client = await getRedisClient();
  const keys = await client.keys(`*${pattern}*`);
  if (keys.length > 0) {
    await client.del(keys);
  }
}

export async function clearCache(): Promise<void> {
  const client = await getRedisClient();
  await client.flushDb();
}

export async function closeRedis(): Promise<void> {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
  }
}
