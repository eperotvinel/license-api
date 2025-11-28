import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

export async function POST(request) {
  const { userId, key, expiresAt, dashboardSecret } = await request.json();

  if (dashboardSecret !== process.env.DASHBOARD_SECRET) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let current = { keys: [] };
  const existing = await redis.get(`licenses:${userId}`);
  if (existing) {
    current = typeof existing === 'string' ? JSON.parse(existing) : existing;
  }

  current.keys.push({ key, createdAt: new Date().toISOString(), expiresAt });
  await redis.set(`licenses:${userId}`, JSON.stringify(current));

  return Response.json({ success: true, key });
}
