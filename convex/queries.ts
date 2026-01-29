import { v } from "convex/values";
import { query } from "./_generated/server";

export const getEvents = query({
    args: {},
    handler: async (ctx) => {
        return await ctx.db.query("events").order("desc").collect();
    },
});

export const getEventDetails = query({
    args: { eventId: v.id("events") },
    handler: async (ctx, args) => {
        const event = await ctx.db.get(args.eventId);
        if (!event) return null;

        const teams = await ctx.db
            .query("teams")
            .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
            .collect();

        const matches = await ctx.db
            .query("matches")
            .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
            .collect();

        const teamIds = teams.map((t) => t._id);
        const players = [];
        for (const teamId of teamIds) {
            const teamPlayers = await ctx.db
                .query("players")
                .withIndex("by_team", (q) => q.eq("teamId", teamId))
                .collect();
            players.push(...teamPlayers);
        }

        return { event, teams, matches, players };
    },
});

