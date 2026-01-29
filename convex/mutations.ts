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

// GLOBAL PLAYER MUTATIONS
export const createPlayer = mutation({
    args: {
        name: v.string(),
        shirtType: v.string(),
        shirtValue: v.string()
    },
    handler: async (ctx, args) => {
        return await ctx.db.insert("players", {
            name: args.name,
            shirtType: args.shirtType,
            shirtValue: args.shirtValue,
        });
    },
});

export const updatePlayer = mutation({
    args: {
        playerId: v.id("players"),
        name: v.string(),
        shirtType: v.string(),
        shirtValue: v.string()
    },
    handler: async (ctx, args) => {
        await ctx.db.patch(args.playerId, {
            name: args.name,
            shirtType: args.shirtType,
            shirtValue: args.shirtValue,
        });
    },
});

export const deletePlayer = mutation({
    args: { playerId: v.id("players") },
    handler: async (ctx, args) => {
        // Remove from all teams first
        const teamAssignments = await ctx.db
            .query("team_players")
            .withIndex("by_player", (q) => q.eq("playerId", args.playerId))
            .collect();
        for (const ta of teamAssignments) {
            await ctx.db.delete(ta._id);
        }
        await ctx.db.delete(args.playerId);
    },
});

// TEAM-PLAYER ASSIGNMENT
export const addPlayerToTeam = mutation({
    args: { teamId: v.id("teams"), playerId: v.id("players") },
    handler: async (ctx, args) => {
        // Prevent duplicates
        const existing = await ctx.db
            .query("team_players")
            .withIndex("by_team", (q) => q.eq("teamId", args.teamId))
            .filter((q) => q.eq(q.field("playerId"), args.playerId))
            .unique();
        if (existing) return;

        await ctx.db.insert("team_players", {
            teamId: args.teamId,
            playerId: args.playerId,
        });
    },
});

export const removePlayerFromTeam = mutation({
    args: { teamId: v.id("teams"), playerId: v.id("players") },
    handler: async (ctx, args) => {
        const assignment = await ctx.db
            .query("team_players")
            .withIndex("by_team", (q) => q.eq("teamId", args.teamId))
            .filter((q) => q.eq(q.field("playerId"), args.playerId))
            .unique();
        if (assignment) {
            await ctx.db.delete(assignment._id);
        }
    },
});

// MATCH MUTATIONS
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

export const deleteMatch = mutation({
    args: { matchId: v.id("matches") },
    handler: async (ctx, args) => {
        const goals = await ctx.db
            .query("goals")
            .withIndex("by_match", (q) => q.eq("matchId", args.matchId))
            .collect();
        for (const goal of goals) {
            await ctx.db.delete(goal._id);
        }
        await ctx.db.delete(args.matchId);
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

        if (match.homeTeamId === args.teamId) {
            await ctx.db.patch(args.matchId, { homeScore: match.homeScore + 1 });
        } else if (match.awayTeamId === args.teamId) {
            await ctx.db.patch(args.matchId, { awayScore: match.awayScore + 1 });
        }
    },
});

export const removeGoal = mutation({
    args: { goalId: v.id("goals") },
    handler: async (ctx, args) => {
        const goal = await ctx.db.get(args.goalId);
        if (!goal) return;
        const match = await ctx.db.get(goal.matchId);
        if (!match) return;

        if (match.homeTeamId === goal.teamId) {
            await ctx.db.patch(goal.matchId, { homeScore: Math.max(0, match.homeScore - 1) });
        } else if (match.awayTeamId === goal.teamId) {
            await ctx.db.patch(goal.matchId, { awayScore: Math.max(0, match.awayScore - 1) });
        }
        await ctx.db.delete(args.goalId);
    },
});
