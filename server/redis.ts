import { createClient } from "redis";

import { env } from "./config";

const client = createClient({ url: env.REDIS_URL });

export type RedisClient = typeof client;

export async function connectRedis(): Promise<RedisClient> {
  await client.connect();
  return client;
}

export function getRedisClient(): RedisClient {
  return client;
}
