import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import * as schema from "@shared/schema";

// Configure WebSocket for Neon database connections
// Only set WebSocket constructor in environments where it's needed and available
try {
  // In production environments with native WebSocket support, don't override
  if (process.env.NODE_ENV === 'development' || typeof globalThis.WebSocket === 'undefined') {
    const ws = require("ws");
    neonConfig.webSocketConstructor = ws;
  }
} catch (error) {
  console.warn('WebSocket configuration failed, using default WebSocket implementation:', error);
}

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

export const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle({ client: pool, schema });