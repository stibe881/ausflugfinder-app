import { describe, it, expect } from "vitest";

// Test the trips API endpoints
describe("Trips API", () => {
  const API_URL = process.env.API_URL || "http://127.0.0.1:3000";

  describe("GET /api/trpc/trips.list", () => {
    it("should return a list of trips", async () => {
      const response = await fetch(`${API_URL}/api/trpc/trips.list`);
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data).toHaveProperty("result");
      expect(data.result).toHaveProperty("data");
      expect(data.result.data).toHaveProperty("json");
      expect(Array.isArray(data.result.data.json)).toBe(true);
    });
  });

  describe("GET /api/trpc/trips.statistics", () => {
    it("should return trip statistics", async () => {
      const response = await fetch(`${API_URL}/api/trpc/trips.statistics`);
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data).toHaveProperty("result");
      expect(data.result).toHaveProperty("data");
      
      const stats = data.result.data;
      expect(stats).toHaveProperty("json");
      expect(stats.json).toHaveProperty("totalActivities");
      expect(typeof stats.json.totalActivities).toBe("number");
    });
  });

  
});

describe("Day Plans API", () => {
  const API_URL = process.env.API_URL || "http://127.0.0.1:3000";

  describe("Protected endpoints", () => {
    it("should require authentication for dayPlans.list", async () => {
      const response = await fetch(`${API_URL}/api/trpc/dayPlans.list`);
      // Should return error for unauthenticated requests
      const data = await response.json();
      expect(data).toHaveProperty("error");
    });

    it("should require authentication for trips.userTrips", async () => {
      const response = await fetch(`${API_URL}/api/trpc/trips.userTrips`);
      const data = await response.json();
      expect(data).toHaveProperty("error");
    });
  });
});

describe("Auth API", () => {
  const API_URL = process.env.API_URL || "http://127.0.0.1:3000";

  describe("GET /api/trpc/auth.me", () => {
    it("should return null for unauthenticated users", async () => {
      const response = await fetch(`${API_URL}/api/trpc/auth.me`);
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data).toHaveProperty("result");
      expect(data.result.data).toHaveProperty("json");
      expect(data.result.data.json).toBeNull();
    });
  });
});
