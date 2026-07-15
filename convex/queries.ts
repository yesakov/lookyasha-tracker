import { v } from "convex/values";
import { query } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";

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
        const playersByTeam: Record<string, Doc<"players">[]> = {};

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

export const getPlayerStats = query({
    args: {
        startDate: v.optional(v.string()),
        endDate: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const events = await ctx.db.query("events").withIndex("by_date").collect();
        const filteredEvents = events.filter((event) => {
            const eventDate = event.date.slice(0, 10);
            if (args.startDate && eventDate < args.startDate) return false;
            if (args.endDate && eventDate > args.endDate) return false;
            return true;
        });

        const players = await ctx.db.query("players").collect();
        const stats: Record<string, {
            playerId: Id<"players">;
            name: string;
            shirtType: string;
            shirtValue: string;
            goals: number;
            assists: number;
            games: number;
        }> = {};

        for (const player of players) {
            stats[player._id] = {
                playerId: player._id,
                name: player.name,
                shirtType: player.shirtType,
                shirtValue: player.shirtValue,
                goals: 0,
                assists: 0,
                games: 0,
            };
        }

        const ensurePlayer = async (playerId: Id<"players">) => {
            if (!stats[playerId]) {
                const player = await ctx.db.get(playerId);
                if (!player) return null;
                stats[playerId] = {
                    playerId: player._id,
                    name: player.name,
                    shirtType: player.shirtType,
                    shirtValue: player.shirtValue,
                    goals: 0,
                    assists: 0,
                    games: 0,
                };
            }
            return stats[playerId];
        };

        for (const event of filteredEvents) {
            const matches = await ctx.db
                .query("matches")
                .withIndex("by_event", (q) => q.eq("eventId", event._id))
                .collect();

            for (const match of matches.filter((m) => m.status === "finished")) {
                const matchPlayerIds = new Set<Id<"players">>();
                for (const teamId of [match.homeTeamId, match.awayTeamId]) {
                    const assignments = await ctx.db
                        .query("team_players")
                        .withIndex("by_team", (q) => q.eq("teamId", teamId))
                        .collect();
                    assignments.forEach((assignment) => matchPlayerIds.add(assignment.playerId));
                }

                for (const playerId of matchPlayerIds) {
                    const playerStats = await ensurePlayer(playerId);
                    if (playerStats) playerStats.games++;
                }

                const goals = await ctx.db
                    .query("goals")
                    .withIndex("by_match", (q) => q.eq("matchId", match._id))
                    .collect();

                for (const goal of goals) {
                    if (goal.isOwnGoal) continue;

                    const scorerStats = await ensurePlayer(goal.scorerId);
                    if (scorerStats) scorerStats.goals++;

                    if (goal.assistantId) {
                        const assistantStats = await ensurePlayer(goal.assistantId);
                        if (assistantStats) assistantStats.assists++;
                    }
                }
            }
        }

        const activeStats = Object.values(stats).filter((player) => player.games > 0 || player.goals > 0 || player.assists > 0);
        const byName = (a: { name: string }, b: { name: string }) => a.name.localeCompare(b.name);

        return {
            goals: [...activeStats].sort((a, b) => b.goals - a.goals || a.games - b.games || byName(a, b)),
            assists: [...activeStats].sort((a, b) => b.assists - a.assists || a.games - b.games || byName(a, b)),
            goalContributions: [...activeStats].sort((a, b) => (b.goals + b.assists) - (a.goals + a.assists) || a.games - b.games || byName(a, b)),
            games: [...activeStats].sort((a, b) => b.games - a.games || byName(a, b)),
        };
    },
});
