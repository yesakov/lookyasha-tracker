import { v } from "convex/values";
import { mutation } from "./_generated/server";

export const createEvent = mutation({
    args: { name: v.string(), date: v.string() },
    handler: async (ctx, args) => {
        return await ctx.db.insert("events", {
            name: args.name,
            date: args.date,
        });
    },
});

export const createTeam = mutation({
    args: { name: v.string(), eventId: v.id("events") },
    handler: async (ctx, args) => {
        return await ctx.db.insert("teams", {
            name: args.name,
            eventId: args.eventId,
        });
    },
});

export const createPlayer = mutation({
    args: { name: v.string(), teamId: v.id("teams") },
    handler: async (ctx, args) => {
        return await ctx.db.insert("players", {
            name: args.name,
            teamId: args.teamId,
        });
    },
});

export const createMatch = mutation({
    args: {
        eventId: v.id("events"),
        homeTeamId: v.id("teams"),
        awayTeamId: v.id("teams")
    },
    handler: async (ctx, args) => {
        return await ctx.db.insert("matches", {
            eventId: args.eventId,
            homeTeamId: args.homeTeamId,
            awayTeamId: args.awayTeamId,
            status: "scheduled",
            homeScore: 0,
            awayScore: 0,
        });
    },
});

export const updateMatchStatus = mutation({
    args: { matchId: v.id("matches"), status: v.union(v.literal("scheduled"), v.literal("in_progress"), v.literal("finished")) },
    handler: async (ctx, args) => {
        await ctx.db.patch(args.matchId, { status: args.status });
    },
});

export const addGoal = mutation({
    args: {
        matchId: v.id("matches"),
        scorerId: v.id("players"),
        teamId: v.id("teams"),
        assistantId: v.optional(v.id("players")),
    },
    handler: async (ctx, args) => {
        const match = await ctx.db.get(args.matchId);
        if (!match) throw new Error("Match not found");

        await ctx.db.insert("goals", {
            matchId: args.matchId,
            scorerId: args.scorerId,
            teamId: args.teamId,
            assistantId: args.assistantId,
        });

        // Update match score
        if (match.homeTeamId === args.teamId) {
            await ctx.db.patch(args.matchId, { homeScore: match.homeScore + 1 });
        } else if (match.awayTeamId === args.teamId) {
            await ctx.db.patch(args.matchId, { awayScore: match.awayScore + 1 });
        }
    },
});
