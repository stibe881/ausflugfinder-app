import { describe, expect, it } from "vitest";
import postgres from "postgres";

describe("Supabase Connection", () => {
  it("should connect to Supabase database successfully", async () => {
    const connectionString = process.env.SUPABASE_DATABASE_URL;
    
    expect(connectionString).toBeDefined();
    expect(connectionString).toContain("aws-1-eu-west-2.pooler.supabase.com");
    
    const sql = postgres(connectionString!);
    
    try {
      const result = await sql`SELECT 1 as test`;
      expect(result).toHaveLength(1);
      expect(result[0].test).toBe(1);
    } finally {
      await sql.end();
    }
  }, 15000); // 15 second timeout for network request
});
