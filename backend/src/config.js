import "dotenv/config";

export const config = {
  port: process.env.PORT || 3001,
  mongoUri: process.env.MONGODB_URI,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
  corsOrigin: process.env.CORS_ORIGIN || "*",
};

if (!config.mongoUri) throw new Error("MONGODB_URI ausente");
if (!config.jwtSecret) throw new Error("JWT_SECRET ausente");