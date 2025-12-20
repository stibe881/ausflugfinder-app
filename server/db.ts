import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users } from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = "admin";
      updateSet.role = "admin";
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// TODO: add feature queries here as your schema grows.

// ============ AUSFLUGFINDER DATABASE FUNCTIONS ============

import { and, like, or, desc, asc, sql, count } from "drizzle-orm";
import {
  trips,
  tripCategories,
  tripPhotos,
  tripVideos,
  tripComments,
  tripJournal,
  tripParticipants,
  destinations,
  dayPlans,
  dayPlanItems,
  packingListItems,
  budgetItems,
  checklistItems,
  friendships,
  notifications,
  type InsertTrip,
  type InsertDayPlan,
} from "../drizzle/schema";

// ============ TRIPS ============

export async function getAllTrips() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(trips).where(eq(trips.isPublic, 1));
}

export async function getPublicTrips() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(trips).where(eq(trips.isPublic, 1));
}

export async function getTripById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(trips).where(eq(trips.id, id));
  return result[0] || null;
}

export async function getUserTrips(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(trips).where(eq(trips.userId, userId));
}

export async function searchTrips(params: {
  keyword?: string;
  region?: string;
  category?: string;
  cost?: string;
  isPublic?: boolean;
}) {
  const db = await getDb();
  if (!db) return { data: [], total: 0 };

  const conditions = [];
  
  if (params.isPublic) {
    conditions.push(eq(trips.isPublic, 1));
  }
  
  if (params.keyword) {
    conditions.push(
      or(
        like(trips.title, `%${params.keyword}%`),
        like(trips.description, `%${params.keyword}%`),
        like(trips.destination, `%${params.keyword}%`)
      )
    );
  }
  
  if (params.region) {
    conditions.push(eq(trips.region, params.region));
  }
  
  if (params.cost) {
    conditions.push(eq(trips.cost, params.cost as any));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
  
  const data = await db.select().from(trips).where(whereClause).orderBy(desc(trips.createdAt));
  
  // Filter by category if specified
  let filteredData = data;
  if (params.category) {
    const categoryTrips = await db
      .select({ tripId: tripCategories.tripId })
      .from(tripCategories)
      .where(eq(tripCategories.category, params.category));
    const categoryTripIds = new Set(categoryTrips.map(c => c.tripId));
    filteredData = data.filter(t => categoryTripIds.has(t.id));
  }

  return { data: filteredData, total: filteredData.length };
}

export async function createTrip(data: InsertTrip) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(trips).values(data);
  return result[0].insertId;
}

export async function updateTrip(id: number, userId: number, data: Partial<InsertTrip>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(trips).set(data).where(and(eq(trips.id, id), eq(trips.userId, userId)));
}

export async function deleteTrip(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(trips).where(and(eq(trips.id, id), eq(trips.userId, userId)));
}

export async function toggleFavorite(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const trip = await getTripById(id);
  if (!trip) throw new Error("Trip not found");
  await db.update(trips).set({ isFavorite: trip.isFavorite ? 0 : 1 }).where(eq(trips.id, id));
}

export async function toggleDone(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const trip = await getTripById(id);
  if (!trip) throw new Error("Trip not found");
  await db.update(trips).set({ isDone: trip.isDone ? 0 : 1 }).where(eq(trips.id, id));
}

export async function getStatistics() {
  const db = await getDb();
  if (!db) return { totalActivities: 0, freeActivities: 0, totalRegions: 0, categories: [] };

  const totalResult = await db.select({ count: count() }).from(trips).where(eq(trips.isPublic, 1));
  const freeResult = await db.select({ count: count() }).from(trips).where(and(eq(trips.isPublic, 1), eq(trips.cost, "free")));
  const regionsResult = await db.selectDistinct({ region: trips.region }).from(trips).where(eq(trips.isPublic, 1));
  const categoriesResult = await db
    .select({ category: tripCategories.category, count: count() })
    .from(tripCategories)
    .groupBy(tripCategories.category);

  return {
    totalActivities: totalResult[0]?.count || 0,
    freeActivities: freeResult[0]?.count || 0,
    totalRegions: regionsResult.filter(r => r.region).length,
    categories: categoriesResult,
  };
}

// ============ TRIP PHOTOS ============

export async function getTripPhotos(tripId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(tripPhotos).where(eq(tripPhotos.tripId, tripId));
}

export async function addTripPhoto(data: { tripId: number; photoUrl: string; caption?: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(tripPhotos).values(data);
}

export async function deleteTripPhoto(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(tripPhotos).where(eq(tripPhotos.id, id));
}

// ============ TRIP VIDEOS ============

export async function getTripVideos(tripId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(tripVideos).where(eq(tripVideos.tripId, tripId));
}

export async function addVideo(data: { tripId: number; videoId: string; platform: "youtube" | "tiktok"; title?: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(tripVideos).values(data);
}

export async function deleteVideo(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(tripVideos).where(eq(tripVideos.id, id));
}

// ============ TRIP COMMENTS ============

export async function getTripComments(tripId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(tripComments).where(eq(tripComments.tripId, tripId)).orderBy(desc(tripComments.createdAt));
}

export async function addTripComment(data: { tripId: number; userId: number; content: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(tripComments).values(data);
}

export async function deleteComment(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(tripComments).where(and(eq(tripComments.id, id), eq(tripComments.userId, userId)));
}

// ============ TRIP JOURNAL ============

export async function getTripJournalEntries(tripId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(tripJournal).where(eq(tripJournal.tripId, tripId)).orderBy(desc(tripJournal.entryDate));
}

export async function addJournalEntry(data: { tripId: number; userId: number; content: string; entryDate: Date; mood?: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(tripJournal).values(data);
}

export async function deleteJournalEntry(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(tripJournal).where(and(eq(tripJournal.id, id), eq(tripJournal.userId, userId)));
}

// ============ TRIP PARTICIPANTS ============

export async function getTripParticipants(tripId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(tripParticipants).where(eq(tripParticipants.tripId, tripId));
}

export async function addTripParticipant(data: { tripId: number; name: string; email?: string; userId?: number }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(tripParticipants).values(data);
}

// ============ DESTINATIONS ============

export async function getUserDestinations(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(destinations).where(eq(destinations.userId, userId));
}

export async function getDestinationById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(destinations).where(eq(destinations.id, id));
  return result[0] || null;
}

export async function createDestination(data: { userId: number; name: string; location: string; description?: string; imageUrl?: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(destinations).values(data);
}

export async function updateDestination(id: number, userId: number, data: Partial<{ name: string; location: string; description: string; imageUrl: string }>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(destinations).set(data).where(and(eq(destinations.id, id), eq(destinations.userId, userId)));
}

export async function deleteDestination(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(destinations).where(and(eq(destinations.id, id), eq(destinations.userId, userId)));
}

// ============ DAY PLANS ============

export async function getDayPlansByUser(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(dayPlans).where(eq(dayPlans.userId, userId)).orderBy(desc(dayPlans.startDate));
}

export async function getDayPlanById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(dayPlans).where(eq(dayPlans.id, id));
  return result[0] || null;
}

export async function createDayPlan(data: InsertDayPlan) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(dayPlans).values(data);
  return result[0].insertId;
}

export async function updateDayPlan(id: number, userId: number, data: Partial<InsertDayPlan>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(dayPlans).set(data).where(and(eq(dayPlans.id, id), eq(dayPlans.userId, userId)));
}

export async function deleteDayPlan(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(dayPlans).where(and(eq(dayPlans.id, id), eq(dayPlans.userId, userId)));
}

// ============ DAY PLAN ITEMS ============

export async function getDayPlanItems(dayPlanId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(dayPlanItems).where(eq(dayPlanItems.dayPlanId, dayPlanId)).orderBy(asc(dayPlanItems.orderIndex));
}

export async function addTripToDayPlan(data: { dayPlanId: number; tripId: number; dayNumber?: number; orderIndex: number; startTime?: string; endTime?: string; notes?: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(dayPlanItems).values(data);
}

export async function removeTripFromDayPlan(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(dayPlanItems).where(eq(dayPlanItems.id, id));
}

// ============ PACKING LIST ============

export async function getPackingListItems(dayPlanId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(packingListItems).where(eq(packingListItems.dayPlanId, dayPlanId));
}

export async function addPackingListItem(data: { dayPlanId: number; item: string; quantity?: number; category?: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(packingListItems).values(data);
}

export async function updatePackingListItem(id: number, isPacked: boolean) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(packingListItems).set({ isPacked: isPacked ? 1 : 0 }).where(eq(packingListItems.id, id));
}

export async function deletePackingListItem(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(packingListItems).where(eq(packingListItems.id, id));
}

// ============ BUDGET ============

export async function getBudgetItems(dayPlanId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(budgetItems).where(eq(budgetItems.dayPlanId, dayPlanId));
}

export async function addBudgetItem(data: { dayPlanId: number; category: string; description: string; estimatedCost: string; actualCost?: string; currency?: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(budgetItems).values(data);
}

export async function deleteBudgetItem(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(budgetItems).where(eq(budgetItems.id, id));
}

// ============ CHECKLIST ============

export async function getChecklistItems(dayPlanId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(checklistItems).where(eq(checklistItems.dayPlanId, dayPlanId));
}

export async function addChecklistItem(data: { dayPlanId: number; title: string; priority?: "low" | "medium" | "high"; dueDate?: Date }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(checklistItems).values(data);
}

export async function updateChecklistItem(id: number, isCompleted: boolean) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(checklistItems).set({ isCompleted: isCompleted ? 1 : 0 }).where(eq(checklistItems.id, id));
}

export async function deleteChecklistItem(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(checklistItems).where(eq(checklistItems.id, id));
}

// ============ FRIENDSHIPS ============

export async function getUserFriends(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(friendships).where(
    and(
      or(eq(friendships.userId, userId), eq(friendships.friendId, userId)),
      eq(friendships.status, "accepted")
    )
  );
}

export async function sendFriendRequest(userId: number, friendId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(friendships).values({ userId, friendId, requestedBy: userId, status: "pending" });
}

export async function acceptFriendRequest(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(friendships).set({ status: "accepted" }).where(eq(friendships.id, id));
}

// ============ NOTIFICATIONS ============

export async function getUserNotifications(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(notifications).where(eq(notifications.userId, userId)).orderBy(desc(notifications.createdAt));
}

export async function markNotificationRead(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(notifications).set({ isRead: 1 }).where(eq(notifications.id, id));
}

// ============ USER ============

export async function deleteUser(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(trips).where(eq(trips.userId, userId));
  await db.delete(destinations).where(eq(destinations.userId, userId));
  await db.delete(dayPlans).where(eq(dayPlans.userId, userId));
  await db.delete(friendships).where(or(eq(friendships.userId, userId), eq(friendships.friendId, userId)));
  await db.delete(notifications).where(eq(notifications.userId, userId));
  await db.delete(users).where(eq(users.id, userId));
}
