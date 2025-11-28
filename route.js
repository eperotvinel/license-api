import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

export async function GET(request, { params }) {
  const { userId } = params;

  // Protection simple pour ton logiciel client
  const apiKey = request.headers.get('x-api-key');
  if (apiKey !== process.env.MASTER_API_KEY) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const raw = await redis.get(`licenses:${userId}`);
  if (!raw) return Response.json({ error: "Not found" }, { status: 404 });

  const data = typeof raw === 'string' ? JSON.parse(raw) : raw;
  const now = new Date();

  const enrichedKeys = data.keys.map(k => ({
    ...k,
    isValid: new Date(k.expiresAt) > now
  }));

  return Response.json({
    userId,
    generatedAt: new Date().toISOString(),
    totalKeys: data.keys.length,
    activeKeys: enrichedKeys.filter(k => k.isValid).length,
    keys: enrichedKeys
  });
}
