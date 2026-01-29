import { v } from "convex/values";
import { query } from "./_generated/server";

export const getEvents = query({
    args: {},
    handler: async (ctx) => {
        return await ctx.db.query("events").withIndex("by_date").order("desc").collect();
    },
});

export const getPlayers = query({
    args: {},
    handler: async (ctx) => {
        return await ctx.db.query("players").collect();
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

        const matchIds = matches.map((m) => m._id);
        const goals = [];
        for (const matchId of matchIds) {
            const matchGoals = await ctx.db
                .query("goals")
                .withIndex("by_match", (q) => q.eq("matchId", matchId))
                .collect();
            goals.push(...matchGoals);
        }

        // Fetch all team assignments and players for this event
        const teamIds = teams.map((t) => t._id);
        const teamPlayers = [];
        const playersByTeam: Record<string, any[]> = {};

        for (const teamId of teamIds) {
            const assignments = await ctx.db
                .query("team_players")
                .withIndex("by_team", (q) => q.eq("teamId", teamId))
                .collect();

            const players = [];
            for (const adj of assignments) {
                const p = await ctx.db.get(adj.playerId);
                if (p) players.push(p);
            }
            playersByTeam[teamId] = players;
        }

        // Global list of all players associated with this event's teams
        const allEventPlayers = Object.values(playersByTeam).flat();
        // De-duplicate in case a player is in multiple teams (rare but supported by schema)
        const uniquePlayers = Array.from(new Map(allEventPlayers.map(p => [p._id, p])).values());

        return {
            event,
            teams,
            matches,
            goals,
            players: uniquePlayers,
            playersByTeam
        };
    },
});
