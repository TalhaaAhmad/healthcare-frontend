import { Redis } from '@upstash/redis';

// Upstash Redis for serverless-safe payment data storage
// Sign up at https://upstash.com/ for a free Redis instance

const redis = Redis.fromEnv();

const KEY_PREFIX = 'payment:';
const TTL_SECONDS = 30 * 60; // 30 minutes

export async function storePendingPayment(basketId: string, data: any): Promise<void> {
  await redis.set(`${KEY_PREFIX}${basketId}`, JSON.stringify(data), { ex: TTL_SECONDS });
}

export async function getPendingPayment(basketId: string): Promise<any | undefined> {
  const value = await redis.get<string>(`${KEY_PREFIX}${basketId}`);
  if (!value) return undefined;
  try {
    return typeof value === 'string' ? JSON.parse(value) : value;
  } catch {
    return value;
  }
}

export async function removePendingPayment(basketId: string): Promise<void> {
  await redis.del(`${KEY_PREFIX}${basketId}`);
}
