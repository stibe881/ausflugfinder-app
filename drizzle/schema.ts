import {
  pgTable,
  serial,
  integer,
  varchar,
  text,
  timestamp,
  decimal,
  pgEnum,
  index,
  unique,
  boolean,
} from "drizzle-orm/pg-core";
import { type InferInsertModel, type InferSelectModel } from "drizzle-orm";

// Enums
export const roleEnum = pgEnum("role", ["user", "admin"]);
export const friendshipStatusEnum = pgEnum("friendship_status", ["pending", "accepted", "blocked"]);
export const notificationTypeEnum = pgEnum("notification_type", [
  "friend_request",
  "friend_accepted",
  "nearby_trip",
  "new_trip",
  "system",
]);
export const tripStatusEnum = pgEnum("trip_status", ["planned", "ongoing", "completed", "cancelled"]);
export const costEnum = pgEnum("cost", ["free", "low", "medium", "high", "very_high"]);
export const routeTypeEnum = pgEnum("route_type", ["round_trip", "one_way", "location"]);
export const platformEnum = pgEnum("platform", ["youtube", "tiktok"]);
export const participantStatusEnum = pgEnum("participant_status", ["confirmed", "pending", "declined"]);
export const priorityEnum = pgEnum("priority", ["low", "medium", "high"]);

// Users table
export const users = pgTable(
  "users",
  {
    id: serial("id").primaryKey(),
    openId: varchar("open_id", { length: 64 }),
    name: text("name"),
    email: varchar("email", { length: 320 }),
    loginMethod: varchar("login_method", { length: 64 }).default("local"),
    role: roleEnum("role").default("user").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
    lastSignedIn: timestamp("last_signed_in").defaultNow().notNull(),
    username: varchar("username", { length: 255 }),
    passwordHash: varchar("password_hash", { length: 255 }),
  },
  (table) => ({
    openIdUnique: unique("users_open_id_unique").on(table.openId),
    usernameUnique: unique("users_username_unique").on(table.username),
  })
);

// Trips table
export const trips = pgTable("trips", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  destination: varchar("destination", { length: 255 }).notNull(),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  participants: integer("participants").default(1).notNull(),
  status: tripStatusEnum("status").default("planned").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  cost: costEnum("cost").default("free").notNull(),
  ageRecommendation: varchar("age_recommendation", { length: 50 }),
  routeType: routeTypeEnum("route_type").default("location").notNull(),
  region: varchar("region", { length: 100 }),
  address: varchar("address", { length: 512 }),
  websiteUrl: varchar("website_url", { length: 512 }),
  contactEmail: varchar("contact_email", { length: 320 }),
  contactPhone: varchar("contact_phone", { length: 50 }),
  latitude: varchar("latitude", { length: 50 }),
  longitude: varchar("longitude", { length: 50 }),
  isFavorite: boolean("is_favorite").default(false).notNull(),
  isDone: boolean("is_done").default(false).notNull(),
  isPublic: boolean("is_public").default(false).notNull(),
  durationMin: decimal("duration_min", { precision: 5, scale: 2 }),
  durationMax: decimal("duration_max", { precision: 5, scale: 2 }),
  distanceMin: decimal("distance_min", { precision: 6, scale: 2 }),
  distanceMax: decimal("distance_max", { precision: 6, scale: 2 }),
  niceToKnow: varchar("nice_to_know", { length: 500 }),
  image: text("image"),
});

// Ausfluege table (original destinations from webapp)
export const ausfluege = pgTable("ausfluege", {
  id: serial("id").primaryKey(),
  userId: integer("user_id"),
  name: varchar("name", { length: 255 }).notNull(),
  beschreibung: text("beschreibung"),
  adresse: varchar("adresse", { length: 255 }).notNull(),
  land: varchar("land", { length: 50 }).default("Schweiz"),
  region: varchar("region", { length: 100 }),
  kategorieAlt: varchar("kategorie_alt", { length: 100 }),
  parkplatz: varchar("parkplatz", { length: 100 }),
  parkplatzKostenlos: boolean("parkplatz_kostenlos").default(false),
  kostenStufe: integer("kosten_stufe"),
  jahreszeiten: varchar("jahreszeiten", { length: 100 }),
  websiteUrl: varchar("website_url", { length: 255 }),
  lat: decimal("lat", { precision: 10, scale: 7 }),
  lng: decimal("lng", { precision: 10, scale: 7 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  niceToKnow: varchar("nice_to_know", { length: 255 }),
  dauerMin: decimal("dauer_min", { precision: 5, scale: 2 }),
  dauerMax: decimal("dauer_max", { precision: 5, scale: 2 }),
  distanzMin: decimal("distanz_min", { precision: 6, scale: 2 }),
  distanzMax: decimal("distanz_max", { precision: 6, scale: 2 }),
  dauerStunden: decimal("dauer_stunden", { precision: 5, scale: 2 }),
  distanzKm: decimal("distanz_km", { precision: 6, scale: 2 }),
  isRundtour: boolean("is_rundtour").default(false).notNull(),
  isVonANachB: boolean("is_von_a_nach_b").default(false).notNull(),
  altersempfehlung: varchar("altersempfehlung", { length: 255 }),
});

// Day Plans
export const dayPlans = pgTable("day_plans", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  isPublic: boolean("is_public").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  isDraft: boolean("is_draft").default(true).notNull(),
});

// Day Plan Items
export const dayPlanItems = pgTable("day_plan_items", {
  id: serial("id").primaryKey(),
  dayPlanId: integer("day_plan_id").notNull(),
  tripId: integer("trip_id").notNull(),
  dayNumber: integer("day_number").default(1).notNull(),
  orderIndex: integer("order_index").notNull(),
  startTime: varchar("start_time", { length: 10 }),
  endTime: varchar("end_time", { length: 10 }),
  notes: text("notes"),
  dateAssigned: timestamp("date_assigned"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Packing List Items
export const packingListItems = pgTable("packing_list_items", {
  id: serial("id").primaryKey(),
  dayPlanId: integer("day_plan_id").notNull(),
  item: varchar("item", { length: 255 }).notNull(),
  quantity: integer("quantity").default(1).notNull(),
  isPacked: boolean("is_packed").default(false).notNull(),
  category: varchar("category", { length: 100 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Budget Items
export const budgetItems = pgTable("budget_items", {
  id: serial("id").primaryKey(),
  dayPlanId: integer("day_plan_id").notNull(),
  category: varchar("category", { length: 100 }).notNull(),
  description: varchar("description", { length: 255 }).notNull(),
  estimatedCost: varchar("estimated_cost", { length: 20 }).notNull(),
  actualCost: varchar("actual_cost", { length: 20 }),
  currency: varchar("currency", { length: 10 }).default("CHF").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Checklist Items
export const checklistItems = pgTable("checklist_items", {
  id: serial("id").primaryKey(),
  dayPlanId: integer("day_plan_id").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  isCompleted: boolean("is_completed").default(false).notNull(),
  priority: priorityEnum("priority").default("medium").notNull(),
  dueDate: timestamp("due_date"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Trip Photos
export const tripPhotos = pgTable("trip_photos", {
  id: serial("id").primaryKey(),
  tripId: integer("trip_id").notNull(),
  photoUrl: varchar("photo_url", { length: 512 }).notNull(),
  caption: text("caption"),
  isPrimary: boolean("is_primary").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Trip Videos
export const tripVideos = pgTable(
  "trip_videos",
  {
    id: serial("id").primaryKey(),
    tripId: integer("trip_id").notNull(),
    videoId: varchar("video_id", { length: 255 }).notNull(),
    platform: platformEnum("platform").notNull(),
    title: varchar("title", { length: 255 }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    tripIdIdx: index("trip_videos_trip_id_idx").on(table.tripId),
    createdAtIdx: index("trip_videos_created_at_idx").on(table.createdAt),
  })
);

// Trip Categories
export const tripCategories = pgTable(
  "trip_categories",
  {
    id: serial("id").primaryKey(),
    tripId: integer("trip_id").notNull(),
    category: varchar("category", { length: 100 }).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    tripIdIdx: index("trip_categories_trip_id_idx").on(table.tripId),
    categoryIdx: index("trip_categories_category_idx").on(table.category),
  })
);

// Trip Attributes
export const tripAttributes = pgTable("trip_attributes", {
  id: serial("id").primaryKey(),
  tripId: integer("trip_id").notNull(),
  attribute: varchar("attribute", { length: 100 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Trip Journal
export const tripJournal = pgTable(
  "trip_journal",
  {
    id: serial("id").primaryKey(),
    tripId: integer("trip_id").notNull(),
    userId: integer("user_id").notNull(),
    content: text("content").notNull(),
    entryDate: timestamp("entry_date").notNull(),
    mood: varchar("mood", { length: 50 }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    tripIdIdx: index("trip_journal_trip_id_idx").on(table.tripId),
    userIdIdx: index("trip_journal_user_id_idx").on(table.userId),
    entryDateIdx: index("trip_journal_entry_date_idx").on(table.entryDate),
    createdAtIdx: index("trip_journal_created_at_idx").on(table.createdAt),
  })
);

// Trip Comments
export const tripComments = pgTable("trip_comments", {
  id: serial("id").primaryKey(),
  tripId: integer("trip_id").notNull(),
  userId: integer("user_id").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Trip Participants
export const tripParticipants = pgTable("trip_participants", {
  id: serial("id").primaryKey(),
  tripId: integer("trip_id").notNull(),
  userId: integer("user_id"),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }),
  status: participantStatusEnum("status").default("pending").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Friendships
export const friendships = pgTable(
  "friendships",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id").notNull(),
    friendId: integer("friend_id").notNull(),
    status: friendshipStatusEnum("status").default("pending").notNull(),
    requestedBy: integer("requested_by").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index("friendships_user_id_idx").on(table.userId),
    friendIdIdx: index("friendships_friend_id_idx").on(table.friendId),
    statusIdx: index("friendships_status_idx").on(table.status),
  })
);

// Notifications
export const notifications = pgTable(
  "notifications",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id").notNull(),
    title: varchar("title", { length: 255 }).notNull(),
    message: text("message").notNull(),
    type: notificationTypeEnum("type").default("system").notNull(),
    relatedId: integer("related_id"),
    isRead: boolean("is_read").default(false).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index("notifications_user_id_idx").on(table.userId),
    isReadIdx: index("notifications_is_read_idx").on(table.isRead),
    createdAtIdx: index("notifications_created_at_idx").on(table.createdAt),
  })
);

// User Settings
export const userSettings = pgTable(
  "user_settings",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id").notNull(),
    notificationsEnabled: boolean("notifications_enabled").default(true).notNull(),
    friendRequestNotifications: boolean("friend_request_notifications").default(true).notNull(),
    friendRequestAcceptedNotifications: boolean("friend_request_accepted_notifications")
      .default(true)
      .notNull(),
    nearbyTripNotifications: boolean("nearby_trip_notifications").default(true).notNull(),
    newTripNotifications: boolean("new_trip_notifications").default(true).notNull(),
    nearbyTripDistance: integer("nearby_trip_distance").default(5000).notNull(),
    locationTrackingEnabled: boolean("location_tracking_enabled").default(true).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index("user_settings_user_id_idx").on(table.userId),
    userIdUnique: unique("user_settings_user_id_unique").on(table.userId),
  })
);

// User Locations
export const userLocations = pgTable(
  "user_locations",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id").notNull(),
    latitude: varchar("latitude", { length: 50 }).notNull(),
    longitude: varchar("longitude", { length: 50 }).notNull(),
    accuracy: varchar("accuracy", { length: 50 }),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index("user_locations_user_id_idx").on(table.userId),
    updatedAtIdx: index("user_locations_updated_at_idx").on(table.updatedAt),
  })
);

// Push Subscriptions
export const pushSubscriptions = pgTable(
  "push_subscriptions",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id").notNull(),
    endpoint: varchar("endpoint", { length: 2048 }).notNull(),
    auth: text("auth").notNull(),
    p256dh: text("p256dh").notNull(),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index("push_subscriptions_user_id_idx").on(table.userId),
    endpointIdx: index("push_subscriptions_endpoint_idx").on(table.endpoint),
  })
);

// Password Reset Tokens
export const passwordResetTokens = pgTable(
  "password_reset_tokens",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id").notNull(),
    token: varchar("token", { length: 255 }).notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index("password_reset_tokens_user_id_idx").on(table.userId),
    tokenUnique: unique("password_reset_tokens_token_unique").on(table.token),
  })
);

// Destinations (for compatibility)
export const destinations = pgTable("destinations", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  location: varchar("location", { length: 255 }).notNull(),
  imageUrl: varchar("image_url", { length: 512 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Type exports
export type User = InferSelectModel<typeof users>;
export type InsertUser = InferInsertModel<typeof users>;

export type Trip = InferSelectModel<typeof trips>;
export type InsertTrip = InferInsertModel<typeof trips>;

export type Ausflug = InferSelectModel<typeof ausfluege>;
export type InsertAusflug = InferInsertModel<typeof ausfluege>;

export type DayPlan = InferSelectModel<typeof dayPlans>;
export type InsertDayPlan = InferInsertModel<typeof dayPlans>;

export type DayPlanItem = InferSelectModel<typeof dayPlanItems>;
export type InsertDayPlanItem = InferInsertModel<typeof dayPlanItems>;

export type PackingListItem = InferSelectModel<typeof packingListItems>;
export type InsertPackingListItem = InferInsertModel<typeof packingListItems>;

export type BudgetItem = InferSelectModel<typeof budgetItems>;
export type InsertBudgetItem = InferInsertModel<typeof budgetItems>;

export type ChecklistItem = InferSelectModel<typeof checklistItems>;
export type InsertChecklistItem = InferInsertModel<typeof checklistItems>;

export type TripPhoto = InferSelectModel<typeof tripPhotos>;
export type InsertTripPhoto = InferInsertModel<typeof tripPhotos>;

export type TripVideo = InferSelectModel<typeof tripVideos>;
export type InsertTripVideo = InferInsertModel<typeof tripVideos>;

export type TripCategory = InferSelectModel<typeof tripCategories>;
export type InsertTripCategory = InferInsertModel<typeof tripCategories>;

export type TripAttribute = InferSelectModel<typeof tripAttributes>;
export type InsertTripAttribute = InferInsertModel<typeof tripAttributes>;

export type TripJournalEntry = InferSelectModel<typeof tripJournal>;
export type InsertTripJournalEntry = InferInsertModel<typeof tripJournal>;

export type TripComment = InferSelectModel<typeof tripComments>;
export type InsertTripComment = InferInsertModel<typeof tripComments>;

export type TripParticipant = InferSelectModel<typeof tripParticipants>;
export type InsertTripParticipant = InferInsertModel<typeof tripParticipants>;

export type Friendship = InferSelectModel<typeof friendships>;
export type InsertFriendship = InferInsertModel<typeof friendships>;

export type Notification = InferSelectModel<typeof notifications>;
export type InsertNotification = InferInsertModel<typeof notifications>;

export type UserSettings = InferSelectModel<typeof userSettings>;
export type InsertUserSettings = InferInsertModel<typeof userSettings>;

export type UserLocation = InferSelectModel<typeof userLocations>;
export type InsertUserLocation = InferInsertModel<typeof userLocations>;

export type PushSubscription = InferSelectModel<typeof pushSubscriptions>;
export type InsertPushSubscription = InferInsertModel<typeof pushSubscriptions>;

export type PasswordResetToken = InferSelectModel<typeof passwordResetTokens>;
export type InsertPasswordResetToken = InferInsertModel<typeof passwordResetTokens>;

export type Destination = InferSelectModel<typeof destinations>;
export type InsertDestination = InferInsertModel<typeof destinations>;
