// prisma.config.ts
import "dotenv/config"; // Ensure your environment variables are loaded
import { defineConfig, env } from "prisma/config";
import { PrismaPg } from "@prisma/adapter-pg";

export default defineConfig({
  earlyAccess: true,
  schema: "prisma/schema.prisma",
  
  // 1. Add this datasource block for the Prisma CLI commands (db push, migrate)
  datasource: {
    url: env("DATABASE_URL"), 
  },

  // 2. Keep your migration adapter configuration below it
  migrate: {
    async adapter() {
      const { Pool } = await import("pg");
      const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
      });
      return new PrismaPg(pool);
    },
  },
});