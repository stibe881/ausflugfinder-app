import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal, tinyint, longtext, index } from "drizzle-orm/mysql-core";

/**
 * AusflugFinder Database Schema
 * Migrated from the original webapp
 */

// Users table
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

// Trips table - main excursion/activity data
export const trips = mysqlTable("trips", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  destination: varchar("destination", { length: 255 }).notNull(),
  startDate: timestamp("startDate"),
  endDate: timestamp("endDate"),
  participants: int("participants").default(1).notNull(),
  status: mysqlEnum("status", ["planned", "ongoing", "completed", "cancelled"]).default("planned").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  cost: mysqlEnum("cost", ["free", "low", "medium", "high", "very_high"]).default("free").notNull(),
  ageRecommendation: varchar("ageRecommendation", { length: 50 }),
  routeType: mysqlEnum("routeType", ["round_trip", "one_way", "location"]).default("location").notNull(),
  region: varchar("region", { length: 100 }),
  address: varchar("address", { length: 512 }),
  websiteUrl: varchar("websiteUrl", { length: 512 }),
  contactEmail: varchar("contactEmail", { length: 320 }),
  contactPhone: varchar("contactPhone", { length: 50 }),
  latitude: varchar("latitude", { length: 50 }),
  longitude: varchar("longitude", { length: 50 }),
  isFavorite: int("isFavorite").default(0).notNull(),
  isDone: int("isDone").default(0).notNull(),
  isPublic: int("isPublic").default(0).notNull(),
  durationMin: decimal("durationMin", { precision: 5, scale: 2 }),
  durationMax: decimal("durationMax", { precision: 5, scale: 2 }),
  distanceMin: decimal("distanceMin", { precision: 6, scale: 2 }),
  distanceMax: decimal("distanceMax", { precision: 6, scale: 2 }),
  niceToKnow: varchar("niceToKnow", { length: 500 }),
  image: longtext("image"),
});

// Trip categories
export const tripCategories = mysqlTable("tripCategories", {
  id: int("id").autoincrement().primaryKey(),
  tripId: int("tripId").notNull(),
  category: varchar("category", { length: 100 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => [
  index("trip_categories_trip_id_idx").on(table.tripId),
  index("trip_categories_category_idx").on(table.category),
]);

// Trip photos
export const tripPhotos = mysqlTable("tripPhotos", {
  id: int("id").autoincrement().primaryKey(),
  tripId: int("tripId").notNull(),
  photoUrl: varchar("photoUrl", { length: 512 }).notNull(),
  caption: text("caption"),
  isPrimary: int("isPrimary").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// Trip videos
export const tripVideos = mysqlTable("tripVideos", {
  id: int("id").autoincrement().primaryKey(),
  tripId: int("tripId").notNull(),
  videoId: varchar("videoId", { length: 255 }).notNull(),
  platform: mysqlEnum("platform", ["youtube", "tiktok"]).notNull(),
  title: varchar("title", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => [
  index("trip_videos_trip_id_idx").on(table.tripId),
]);

// Trip comments
export const tripComments = mysqlTable("tripComments", {
  id: int("id").autoincrement().primaryKey(),
  tripId: int("tripId").notNull(),
  userId: int("userId").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// Trip journal entries
export const tripJournal = mysqlTable("tripJournal", {
  id: int("id").autoincrement().primaryKey(),
  tripId: int("tripId").notNull(),
  userId: int("userId").notNull(),
  content: text("content").notNull(),
  entryDate: timestamp("entryDate").notNull(),
  mood: varchar("mood", { length: 50 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [
  index("trip_journal_trip_id_idx").on(table.tripId),
  index("trip_journal_user_id_idx").on(table.userId),
]);

// Trip participants
export const tripParticipants = mysqlTable("tripParticipants", {
  id: int("id").autoincrement().primaryKey(),
  tripId: int("tripId").notNull(),
  userId: int("userId"),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }),
  status: mysqlEnum("status", ["confirmed", "pending", "declined"]).default("pending").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// Trip attributes
export const tripAttributes = mysqlTable("tripAttributes", {
  id: int("id").autoincrement().primaryKey(),
  tripId: int("tripId").notNull(),
  attribute: varchar("attribute", { length: 100 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// Destinations (saved places)
export const destinations = mysqlTable("destinations", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  location: varchar("location", { length: 255 }).notNull(),
  imageUrl: varchar("imageUrl", { length: 512 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// Day plans
export const dayPlans = mysqlTable("dayPlans", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  startDate: timestamp("startDate").notNull(),
  endDate: timestamp("endDate").notNull(),
  isPublic: int("isPublic").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  isDraft: int("isDraft").default(1).notNull(),
});

// Day plan items (trips in a plan)
export const dayPlanItems = mysqlTable("dayPlanItems", {
  id: int("id").autoincrement().primaryKey(),
  dayPlanId: int("dayPlanId").notNull(),
  tripId: int("tripId").notNull(),
  dayNumber: int("dayNumber").default(1).notNull(),
  orderIndex: int("orderIndex").notNull(),
  startTime: varchar("startTime", { length: 10 }),
  endTime: varchar("endTime", { length: 10 }),
  notes: text("notes"),
  dateAssigned: timestamp("dateAssigned"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// Packing list items
export const packingListItems = mysqlTable("packingListItems", {
  id: int("id").autoincrement().primaryKey(),
  dayPlanId: int("dayPlanId").notNull(),
  item: varchar("item", { length: 255 }).notNull(),
  quantity: int("quantity").default(1).notNull(),
  isPacked: int("isPacked").default(0).notNull(),
  category: varchar("category", { length: 100 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// Budget items
export const budgetItems = mysqlTable("budgetItems", {
  id: int("id").autoincrement().primaryKey(),
  dayPlanId: int("dayPlanId").notNull(),
  category: varchar("category", { length: 100 }).notNull(),
  description: varchar("description", { length: 255 }).notNull(),
  estimatedCost: varchar("estimatedCost", { length: 20 }).notNull(),
  actualCost: varchar("actualCost", { length: 20 }),
  currency: varchar("currency", { length: 10 }).default("CHF").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// Checklist items
export const checklistItems = mysqlTable("checklistItems", {
  id: int("id").autoincrement().primaryKey(),
  dayPlanId: int("dayPlanId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  isCompleted: int("isCompleted").default(0).notNull(),
  priority: mysqlEnum("priority", ["low", "medium", "high"]).default("medium").notNull(),
  dueDate: timestamp("dueDate"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// Friendships
export const friendships = mysqlTable("friendships", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  friendId: int("friendId").notNull(),
  status: mysqlEnum("status", ["pending", "accepted", "blocked"]).default("pending").notNull(),
  requestedBy: int("requestedBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [
  index("friendships_user_id_idx").on(table.userId),
  index("friendships_friend_id_idx").on(table.friendId),
]);

// Notifications
export const notifications = mysqlTable("notifications", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message").notNull(),
  type: mysqlEnum("type", ["friend_request", "friend_accepted", "nearby_trip", "new_trip", "system"]).default("system").notNull(),
  relatedId: int("relatedId"),
  isRead: int("isRead").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => [
  index("notifications_user_id_idx").on(table.userId),
  index("notifications_is_read_idx").on(table.isRead),
]);

// User locations
export const userLocations = mysqlTable("userLocations", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  latitude: varchar("latitude", { length: 50 }).notNull(),
  longitude: varchar("longitude", { length: 50 }).notNull(),
  accuracy: varchar("accuracy", { length: 50 }),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
}, (table) => [
  index("user_locations_user_id_idx").on(table.userId),
]);

// Type exports
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Trip = typeof trips.$inferSelect;
export type InsertTrip = typeof trips.$inferInsert;
export type TripCategory = typeof tripCategories.$inferSelect;
export type TripPhoto = typeof tripPhotos.$inferSelect;
export type TripVideo = typeof tripVideos.$inferSelect;
export type TripComment = typeof tripComments.$inferSelect;
export type TripJournal = typeof tripJournal.$inferSelect;
export type TripParticipant = typeof tripParticipants.$inferSelect;
export type Destination = typeof destinations.$inferSelect;
export type DayPlan = typeof dayPlans.$inferSelect;
export type InsertDayPlan = typeof dayPlans.$inferInsert;
export type DayPlanItem = typeof dayPlanItems.$inferSelect;
export type PackingListItem = typeof packingListItems.$inferSelect;
export type BudgetItem = typeof budgetItems.$inferSelect;
export type ChecklistItem = typeof checklistItems.$inferSelect;
export type Friendship = typeof friendships.$inferSelect;
export type Notification = typeof notifications.$inferSelect;
