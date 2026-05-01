import dotenv from "dotenv";
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || "4000", 10),
  nodeEnv: process.env.NODE_ENV || "development",

  database: {
    url: process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/freelancer_saas",
  },

  mongodb: {
    uri: process.env.MONGODB_URI || "mongodb://localhost:27017/freelancer_saas",
  },

  redis: {
    url: process.env.REDIS_URL || "redis://localhost:6379",
  },

  jwt: {
    secret: process.env.JWT_SECRET || "super-secret-jwt-key-change-in-production",
    expiry: process.env.JWT_EXPIRY || "7d",
  },

  aiService: {
    url: process.env.AI_SERVICE_URL || "http://localhost:8000",
  },

  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY || "",
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || "",
    prices: {
      starter: process.env.STRIPE_PRICE_STARTER || "",
      pro: process.env.STRIPE_PRICE_PRO || "",
      enterprise: process.env.STRIPE_PRICE_ENTERPRISE || "",
    },
  },
} as const;
