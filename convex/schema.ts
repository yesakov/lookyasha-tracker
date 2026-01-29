import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
    events: defineTable({
        name: v.string(),
        date: v.string(),
        description: v.optional(v.string()),
    }).index("by_date", ["date"]),
    teams: defineTable({
        name: v.string(),
        eventId: v.id("events"),
    }).index("by_event", ["eventId"]),

    // Global Players - persisted across the whole app
    players: defineTable({
        name: v.string(),
        shirtType: v.string(), // "color" or "club"
        shirtValue: v.string(), // Hex color code or Club Name (e.g. "Real Madrid")
    }),

    // Join table to assign players to teams within specific events
    team_players: defineTable({
        teamId: v.id("teams"),
        playerId: v.id("players"),
    }).index("by_team", ["teamId"]).index("by_player", ["playerId"]),

    matches: defineTable({
        eventId: v.id("events"),
        homeTeamId: v.id("teams"),
        awayTeamId: v.id("teams"),
        status: v.union(
            v.literal("scheduled"),
            v.literal("in_progress"),
            v.literal("finished")
        ),
        homeScore: v.number(),
        awayScore: v.number(),
        startedAt: v.optional(v.number()),
    }).index("by_event", ["eventId"]),

    goals: defineTable({
        matchId: v.id("matches"),
        scorerId: v.id("players"),
        assistantId: v.optional(v.id("players")),
        minute: v.optional(v.number()),
        teamId: v.id("teams"),
    }).index("by_match", ["matchId"]),
});
