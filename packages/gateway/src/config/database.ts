import { Pool } from "pg";
import mongoose from "mongoose";
import Redis from "ioredis";
import { config } from "./index";
import { logger } from "../utils/logger";

// PostgreSQL connection pool
export const pgPool = new Pool({
  connectionString: config.database.url,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// MongoDB connection
export async function connectMongoDB(): Promise<void> {
  try {
    await mongoose.connect(config.mongodb.uri);
    logger.info("MongoDB connected");
  } catch (error) {
    logger.error("MongoDB connection error:", error);
    throw error;
  }
}

// Redis client
export const redis = new Redis(config.redis.url, {
  maxRetriesPerRequest: 3,
  retryStrategy(times: number) {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
});

redis.on("connect", () => logger.info("Redis connected"));
redis.on("error", (err) => logger.error("Redis error:", err));

// Test PostgreSQL connection
export async function connectPostgres(): Promise<void> {
  try {
    const client = await pgPool.connect();
    await client.query("SELECT NOW()");
    client.release();
    logger.info("PostgreSQL connected");
  } catch (error) {
    logger.error("PostgreSQL connection error:", error);
    throw error;
  }
}
