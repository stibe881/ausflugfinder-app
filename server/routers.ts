import { z } from "zod";
import { COOKIE_NAME } from "../shared/const.js";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import * as db from "./db";

export const appRouter = router({
  system: systemRouter,
  
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
    deleteAccount: protectedProcedure.mutation(async ({ ctx }) => {
      await db.deleteUser(ctx.user.id);
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  trips: router({
    list: publicProcedure.query(async () => {
      return db.getAllTrips();
    }),
    
    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        // Use ausfluege (original webapp data) instead of trips
        return db.getAusflugById(input.id);
      }),
    
    search: publicProcedure
      .input(z.object({
        keyword: z.string().optional(),
        region: z.string().optional(),
        category: z.string().optional(),
        cost: z.string().optional(),
        isPublic: z.boolean().optional(),
      }))
      .query(async ({ input }) => {
        // Use ausfluege (original webapp data) instead of trips
        const kostenStufe = input.cost ? { free: 0, low: 1, medium: 2, high: 3, very_high: 4 }[input.cost] : undefined;
        return db.searchAusfluege({
          keyword: input.keyword,
          region: input.region,
          kostenStufe,
        });
      }),
    
    statistics: publicProcedure.query(async () => {
      // Use ausfluege statistics
      return db.getAusflugeStatistics();
    }),
    
    userTrips: protectedProcedure.query(async ({ ctx }) => {
      return db.getUserTrips(ctx.user.id);
    }),
    
    create: protectedProcedure
      .input(z.object({
        title: z.string().min(1),
        description: z.string().optional(),
        destination: z.string().min(1),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
        cost: z.enum(["free", "low", "medium", "high", "very_high"]).optional(),
        region: z.string().optional(),
        address: z.string().optional(),
        websiteUrl: z.string().optional(),
        latitude: z.string().optional(),
        longitude: z.string().optional(),
        isPublic: z.boolean().optional(),
        ageRecommendation: z.string().optional(),
        niceToKnow: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const tripId = await db.createTrip({
          userId: ctx.user.id,
          ...input,
          isPublic: input.isPublic,
        });
        return { id: tripId };
      }),
    
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        title: z.string().optional(),
        description: z.string().optional(),
        destination: z.string().optional(),
        cost: z.enum(["free", "low", "medium", "high", "very_high"]).optional(),
        region: z.string().optional(),
        isPublic: z.boolean().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { id, ...data } = input;
        await db.updateTrip(id, ctx.user.id, {
          ...data,
          isPublic: data.isPublic,
        });
        return { success: true };
      }),
    
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.deleteTrip(input.id, ctx.user.id);
        return { success: true };
      }),
    
    toggleFavorite: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.toggleFavorite(input.id);
        return { success: true };
      }),
    
    toggleDone: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.toggleDone(input.id);
        return { success: true };
      }),
  }),

  tripPhotos: router({
    list: publicProcedure
      .input(z.object({ tripId: z.number() }))
      .query(async ({ input }) => {
        return db.getTripPhotos(input.tripId);
      }),
    
    add: protectedProcedure
      .input(z.object({
        tripId: z.number(),
        photoUrl: z.string(),
        caption: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        await db.addTripPhoto(input);
        return { success: true };
      }),
    
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteTripPhoto(input.id);
        return { success: true };
      }),
  }),

  tripVideos: router({
    list: publicProcedure
      .input(z.object({ tripId: z.number() }))
      .query(async ({ input }) => {
        return db.getTripVideos(input.tripId);
      }),
    
    add: protectedProcedure
      .input(z.object({
        tripId: z.number(),
        videoId: z.string(),
        platform: z.enum(["youtube", "tiktok"]),
        title: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        await db.addVideo(input);
        return { success: true };
      }),
    
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteVideo(input.id);
        return { success: true };
      }),
  }),

  comments: router({
    list: publicProcedure
      .input(z.object({ tripId: z.number() }))
      .query(async ({ input }) => {
        return db.getTripComments(input.tripId);
      }),
    
    add: protectedProcedure
      .input(z.object({
        tripId: z.number(),
        content: z.string().min(1).max(2000),
      }))
      .mutation(async ({ ctx, input }) => {
        await db.addTripComment({
          tripId: input.tripId,
          userId: ctx.user.id,
          content: input.content,
        });
        return { success: true };
      }),
    
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.deleteComment(input.id, ctx.user.id);
        return { success: true };
      }),
  }),

  journal: router({
    list: publicProcedure
      .input(z.object({ tripId: z.number() }))
      .query(async ({ input }) => {
        return db.getTripJournalEntries(input.tripId);
      }),
    
    add: protectedProcedure
      .input(z.object({
        tripId: z.number(),
        content: z.string().min(1),
        entryDate: z.date(),
        mood: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        await db.addJournalEntry({
          tripId: input.tripId,
          userId: ctx.user.id,
          content: input.content,
          entryDate: input.entryDate,
          mood: input.mood,
        });
        return { success: true };
      }),
    
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.deleteJournalEntry(input.id, ctx.user.id);
        return { success: true };
      }),
  }),

  participants: router({
    list: publicProcedure
      .input(z.object({ tripId: z.number() }))
      .query(async ({ input }) => {
        return db.getTripParticipants(input.tripId);
      }),
    
    add: protectedProcedure
      .input(z.object({
        tripId: z.number(),
        name: z.string().min(1),
        email: z.string().email().optional(),
      }))
      .mutation(async ({ input }) => {
        await db.addTripParticipant(input);
        return { success: true };
      }),
  }),

  destinations: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return db.getUserDestinations(ctx.user.id);
    }),
    
    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return db.getDestinationById(input.id);
      }),
    
    create: protectedProcedure
      .input(z.object({
        name: z.string().min(1),
        location: z.string().min(1),
        description: z.string().optional(),
        imageUrl: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        await db.createDestination({
          userId: ctx.user.id,
          ...input,
        });
        return { success: true };
      }),
    
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        location: z.string().optional(),
        description: z.string().optional(),
        imageUrl: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { id, ...data } = input;
        await db.updateDestination(id, ctx.user.id, data);
        return { success: true };
      }),
    
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.deleteDestination(input.id, ctx.user.id);
        return { success: true };
      }),
  }),

  dayPlans: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return db.getDayPlansByUser(ctx.user.id);
    }),
    
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return db.getDayPlanById(input.id);
      }),
    
    create: protectedProcedure
      .input(z.object({
        title: z.string().min(1),
        description: z.string().optional(),
        startDate: z.date(),
        endDate: z.date(),
        isPublic: z.boolean().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const planId = await db.createDayPlan({
          userId: ctx.user.id,
          ...input,
          isPublic: input.isPublic,
        });
        return { id: planId };
      }),
    
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        title: z.string().optional(),
        description: z.string().optional(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
        isPublic: z.boolean().optional(),
        isDraft: z.boolean().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { id, ...data } = input;
        await db.updateDayPlan(id, ctx.user.id, {
          ...data,
          isPublic: data.isPublic,
          isDraft: data.isDraft,
        });
        return { success: true };
      }),
    
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.deleteDayPlan(input.id, ctx.user.id);
        return { success: true };
      }),
  }),

  dayPlanItems: router({
    list: protectedProcedure
      .input(z.object({ dayPlanId: z.number() }))
      .query(async ({ input }) => {
        return db.getDayPlanItems(input.dayPlanId);
      }),
    
    add: protectedProcedure
      .input(z.object({
        dayPlanId: z.number(),
        tripId: z.number(),
        dayNumber: z.number().optional(),
        orderIndex: z.number(),
        startTime: z.string().optional(),
        endTime: z.string().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        await db.addTripToDayPlan(input);
        return { success: true };
      }),
    
    remove: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.removeTripFromDayPlan(input.id);
        return { success: true };
      }),
  }),

  packingList: router({
    list: protectedProcedure
      .input(z.object({ dayPlanId: z.number() }))
      .query(async ({ input }) => {
        return db.getPackingListItems(input.dayPlanId);
      }),
    
    add: protectedProcedure
      .input(z.object({
        dayPlanId: z.number(),
        item: z.string().min(1),
        quantity: z.number().optional(),
        category: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        await db.addPackingListItem(input);
        return { success: true };
      }),
    
    toggle: protectedProcedure
      .input(z.object({ id: z.number(), isPacked: z.boolean() }))
      .mutation(async ({ input }) => {
        await db.updatePackingListItem(input.id, input.isPacked);
        return { success: true };
      }),
    
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deletePackingListItem(input.id);
        return { success: true };
      }),
  }),

  budget: router({
    list: protectedProcedure
      .input(z.object({ dayPlanId: z.number() }))
      .query(async ({ input }) => {
        return db.getBudgetItems(input.dayPlanId);
      }),
    
    add: protectedProcedure
      .input(z.object({
        dayPlanId: z.number(),
        category: z.string().min(1),
        description: z.string().min(1),
        estimatedCost: z.string(),
        actualCost: z.string().optional(),
        currency: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        await db.addBudgetItem(input);
        return { success: true };
      }),
    
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteBudgetItem(input.id);
        return { success: true };
      }),
  }),

  checklist: router({
    list: protectedProcedure
      .input(z.object({ dayPlanId: z.number() }))
      .query(async ({ input }) => {
        return db.getChecklistItems(input.dayPlanId);
      }),
    
    add: protectedProcedure
      .input(z.object({
        dayPlanId: z.number(),
        title: z.string().min(1),
        priority: z.enum(["low", "medium", "high"]).optional(),
        dueDate: z.date().optional(),
      }))
      .mutation(async ({ input }) => {
        await db.addChecklistItem(input);
        return { success: true };
      }),
    
    toggle: protectedProcedure
      .input(z.object({ id: z.number(), isCompleted: z.boolean() }))
      .mutation(async ({ input }) => {
        await db.updateChecklistItem(input.id, input.isCompleted);
        return { success: true };
      }),
    
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteChecklistItem(input.id);
        return { success: true };
      }),
  }),

  friends: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return db.getUserFriends(ctx.user.id);
    }),
    
    sendRequest: protectedProcedure
      .input(z.object({ friendId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.sendFriendRequest(ctx.user.id, input.friendId);
        return { success: true };
      }),
    
    accept: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.acceptFriendRequest(input.id);
        return { success: true };
      }),
  }),

  notifications: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return db.getUserNotifications(ctx.user.id);
    }),
    
    markRead: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.markNotificationRead(input.id);
        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;
