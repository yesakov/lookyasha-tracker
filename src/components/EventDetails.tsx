"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "convex/_generated/api";
import { Header } from "./Header";
import Link from "next/link";
import { Plus, Users, Trophy, Play, CheckCircle, Footprints, ListOrdered, Trash2, Edit3, XCircle, Search, TrendingUp } from "lucide-react";
import { useState, useMemo } from "react";
import { Id } from "convex/_generated/dataModel";
import PlayerAvatar from "./PlayerAvatar";
import TeamBadge, { CLUB_CONFIGS } from "./TeamBadge";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function EventDetails({ id }: { id: Id<"events"> }) {
    const data = useQuery(api.queries.getEventDetails, { eventId: id });
    const allGlobalPlayers = useQuery(api.queries.getPlayers);

    const createTeam = useMutation(api.mutations.createTeam);
    const addPlayerToTeam = useMutation(api.mutations.addPlayerToTeam);
    const removePlayerFromTeam = useMutation(api.mutations.removePlayerFromTeam);

    const createMatch = useMutation(api.mutations.createMatch);
    const deleteMatch = useMutation(api.mutations.deleteMatch);
    const deleteTeam = useMutation(api.mutations.deleteTeam);
    const updateStatus = useMutation(api.mutations.updateMatchStatus);
    const addGoal = useMutation(api.mutations.addGoal);
    const removeGoal = useMutation(api.mutations.removeGoal);

    const [isAddingTeam, setIsAddingTeam] = useState(false);
    const [newTeamName, setNewTeamName] = useState("");
    const [newTeamBadgeType, setNewTeamBadgeType] = useState<string>("color");
    const [newTeamBadgeValue, setNewTeamBadgeValue] = useState<string>("#bef264");

    const [addingPlayerToTeamId, setAddingPlayerToTeamId] = useState<Id<"teams"> | null>(null);
    const [playerSearchQuery, setPlayerSearchQuery] = useState("");

    const [isAddingMatch, setIsAddingMatch] = useState(false);
    const [homeTeamId, setHomeTeamId] = useState<string>("");
    const [awayTeamId, setAwayTeamId] = useState<string>("");

    const [recordingGoalForMatch, setRecordingGoalForMatch] = useState<Id<"matches"> | null>(null);
    const [selectedScorerId, setSelectedScorerId] = useState<Id<"players"> | null>(null);
    const [selectedScorerTeamId, setSelectedScorerTeamId] = useState<Id<"teams"> | null>(null);

    const [editingMatchId, setEditingMatchId] = useState<Id<"matches"> | null>(null);
    const [isOwnGoal, setIsOwnGoal] = useState(false);
    const [activeTab, setActiveTab] = useState<'games' | 'teams' | 'stats'>('games');

    const standings = useMemo(() => {
        if (!data) return [];

        const stats: Record<string, any> = {};
        data.teams.forEach(team => {
            stats[team._id] = { _id: team._id, name: team.name, played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, pts: 0 };
        });

        data.matches.filter(m => m.status === 'finished').forEach(match => {
            const home = stats[match.homeTeamId];
            const away = stats[match.awayTeamId];
            if (!home || !away) return;

            home.played++;
            away.played++;
            home.gf += match.homeScore;
            home.ga += match.awayScore;
            away.gf += match.awayScore;
            away.ga += match.homeScore;

            if (match.homeScore > match.awayScore) {
                home.won++;
                home.pts += 3;
                away.lost++;
            } else if (match.homeScore < match.awayScore) {
                away.won++;
                away.pts += 3;
                home.lost++;
            } else {
                home.drawn++;
                away.drawn++;
                home.pts += 1;
                away.pts += 1;
            }
        });

        return Object.values(stats).sort((a, b) => b.pts - a.pts || (b.gf - b.ga) - (a.gf - a.ga));
    }, [data]);

    const scoreboard = useMemo(() => {
        if (!data) return { scorers: [], assistants: [] };

        const scorerStats: Record<string, any> = {};
        const assistantStats: Record<string, any> = {};

        data.goals.forEach(goal => {
            const scorer = data.players.find(p => p._id === goal.scorerId);
            if (scorer && !goal.isOwnGoal) {
                if (!scorerStats[scorer._id]) scorerStats[scorer._id] = { name: scorer.name, shirtType: scorer.shirtType, shirtValue: scorer.shirtValue, count: 0 };
                scorerStats[scorer._id].count++;
            }

            if (goal.assistantId && !goal.isOwnGoal) {
                const assistant = data.players.find(p => p._id === goal.assistantId);
                if (assistant) {
                    if (!assistantStats[assistant._id]) assistantStats[assistant._id] = { name: assistant.name, shirtType: assistant.shirtType, shirtValue: assistant.shirtValue, count: 0 };
                    assistantStats[assistant._id].count++;
                }
            }
        });

        return {
            scorers: Object.values(scorerStats).sort((a, b) => b.count - a.count),
            assistants: Object.values(assistantStats).sort((a, b) => b.count - a.count)
        };
    }, [data]);

    const sortedMatchesWithNumbers = useMemo(() => {
        if (!data?.matches) return [];
        // Stable order by creation time
        const baseOrder = [...data.matches].sort((a, b) => a._creationTime - b._creationTime);
        const gameNumbers = new Map(baseOrder.map((m, i) => [m._id, i + 1]));

        // Display order: finished games at the bottom
        return [...data.matches]
            .sort((a, b) => (a.status === 'finished' ? 1 : 0) - (b.status === 'finished' ? 1 : 0))
            .map(m => ({ ...m, gameNumber: gameNumbers.get(m._id) }));
    }, [data?.matches]);

    const progressionData = useMemo(() => {
        if (!data || data.matches.length === 0) return [];

        const teamPoints: Record<string, number> = {};
        data.teams.forEach(t => teamPoints[t._id] = 0);

        const sortedMatches = [...data.matches]
            .filter(m => m.status === 'finished')
            .sort((a, b) => a._creationTime - b._creationTime);

        const history: (Record<string, number> & { game: number })[] = [{ game: 0, ...teamPoints }];

        sortedMatches.forEach((match, i) => {
            const lastPoints = history[history.length - 1];
            const currentPoints = { ...lastPoints };
            if (match.homeScore > match.awayScore) {
                currentPoints[match.homeTeamId] = (currentPoints[match.homeTeamId] || 0) + 3;
            } else if (match.homeScore < match.awayScore) {
                currentPoints[match.awayTeamId] = (currentPoints[match.awayTeamId] || 0) + 3;
            } else {
                currentPoints[match.homeTeamId] = (currentPoints[match.homeTeamId] || 0) + 1;
                currentPoints[match.awayTeamId] = (currentPoints[match.awayTeamId] || 0) + 1;
            }
            history.push({ ...currentPoints, game: i + 1 });
        });

        return history;
    }, [data]);

    const chartColors = ['#bef264', '#3b82f6', '#ef4444', '#f59e0b', '#8b5cf6', '#ec4899', '#10b981'];

    const filteredGlobalPlayers = useMemo(() => {
        if (!allGlobalPlayers) return [];
        const query = playerSearchQuery.toLowerCase();
        // Exclude players already in the current team if we are adding to a specific team
        const currentTeamPlayerIds = addingPlayerToTeamId && data ?
            (data.playersByTeam[addingPlayerToTeamId] || []).map(p => p._id) : [];

        return allGlobalPlayers
            .filter(p => p.name.toLowerCase().includes(query))
            .filter(p => !currentTeamPlayerIds.includes(p._id));
    }, [allGlobalPlayers, playerSearchQuery, addingPlayerToTeamId, data]);

    const handleAddTeam = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTeamName.trim()) return;
        await createTeam({
            name: newTeamName,
            eventId: id,
            badgeType: newTeamBadgeType,
            badgeValue: newTeamBadgeValue
        });
        setNewTeamName("");
        setIsAddingTeam(false);
    };

    const handleAssignPlayer = async (playerId: Id<"players">) => {
        if (!addingPlayerToTeamId) return;
        await addPlayerToTeam({ teamId: addingPlayerToTeamId, playerId });
        setPlayerSearchQuery("");
    };

    const handleRemoveFromTeam = async (teamId: Id<"teams">, playerId: Id<"players">) => {
        if (confirm("Remove player from this team?")) {
            await removePlayerFromTeam({ teamId, playerId });
        }
    };

    const handleCreateMatch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!homeTeamId || !awayTeamId || homeTeamId === awayTeamId) return;
        await createMatch({
            eventId: id,
            homeTeamId: homeTeamId as Id<"teams">,
            awayTeamId: awayTeamId as Id<"teams">
        });
        setIsAddingMatch(false);
        setHomeTeamId("");
        setAwayTeamId("");
    };

    const handleDeleteMatch = async (matchId: Id<"matches">) => {
        if (confirm("Are you sure you want to delete this match? All goals for this match will also be removed.")) {
            await deleteMatch({ matchId });
        }
    };

    const handleDeleteTeam = async (teamId: Id<"teams">) => {
        if (confirm("Are you sure you want to delete this team? All associated matches and player assignments for this team will be permanently removed.")) {
            await deleteTeam({ teamId });
        }
    };

    const handleAddGoal = async (scorerId: Id<"players">, teamId: Id<"teams">, assistantId?: Id<"players">) => {
        if (!recordingGoalForMatch) return;
        await addGoal({
            matchId: recordingGoalForMatch,
            scorerId,
            teamId,
            assistantId,
            isOwnGoal: isOwnGoal || undefined
        });
        setRecordingGoalForMatch(null);
        setSelectedScorerId(null);
        setSelectedScorerTeamId(null);
        setIsOwnGoal(false);
    };

    const handleRemoveGoal = async (goalId: Id<"goals">) => {
        await removeGoal({ goalId });
    };

    if (data === undefined) return <div className="container animate-pulse">Gathering the squad...</div>;
    if (data === null) return <div className="container">Event not found.</div>;

    const { event, teams, matches, players, goals, playersByTeam } = data;

    return (
        <div className="container animate-fade-in">
            <Header title={event.name} backPath="/" />

            <div className="flex" style={{ gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.25rem' }}>
                <button
                    onClick={() => setActiveTab('games')}
                    className={`btn ${activeTab === 'games' ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ flex: 1, borderRadius: 'var(--radius) var(--radius) 0 0', borderBottom: activeTab === 'games' ? 'none' : '1px solid var(--border)' }}
                >
                    <Play size={16} /> <span style={{ marginLeft: '0.5rem' }}>Games</span>
                </button>
                <button
                    onClick={() => setActiveTab('teams')}
                    className={`btn ${activeTab === 'teams' ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ flex: 1, borderRadius: 'var(--radius) var(--radius) 0 0', borderBottom: activeTab === 'teams' ? 'none' : '1px solid var(--border)' }}
                >
                    <Users size={16} /> <span style={{ marginLeft: '0.5rem' }}>Teams</span>
                </button>
                <button
                    onClick={() => setActiveTab('stats')}
                    className={`btn ${activeTab === 'stats' ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ flex: 1, borderRadius: 'var(--radius) var(--radius) 0 0', borderBottom: activeTab === 'stats' ? 'none' : '1px solid var(--border)' }}
                >
                    <Trophy size={16} /> <span style={{ marginLeft: '0.5rem' }}>Stats</span>
                </button>
            </div>

            <div className="stack" style={{ gap: '2rem' }}>
                {activeTab === 'teams' && (
                    <section className="animate-fade-in">
                        <div className="flex-between" style={{ marginBottom: '1rem' }}>
                            <h2 className="flex-between" style={{ gap: '0.5rem', fontSize: '1.1rem' }}>
                                <Users size={18} /> Teams & Lineups
                            </h2>
                            <button className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }} onClick={() => setIsAddingTeam(true)}>
                                <Plus size={14} /> <span className="mobile-hidden">Create Team</span>
                            </button>
                        </div>

                        {isAddingTeam && (
                            <form onSubmit={handleAddTeam} className="card stack shadow-lg" style={{ marginBottom: '1.5rem', border: '1px solid var(--accent)' }}>
                                <input
                                    className="input"
                                    placeholder="Team Name (e.g. Dream Team)"
                                    value={newTeamName}
                                    onChange={e => setNewTeamName(e.target.value)}
                                    autoFocus
                                />

                                <div className="stack" style={{ gap: '0.75rem' }}>
                                    <div className="flex-between">
                                        <span style={{ fontSize: '0.8rem', fontWeight: 800 }}>Badge Type</span>
                                        <div className="flex" style={{ gap: '0.5rem' }}>
                                            <button type="button" className={`btn ${newTeamBadgeType === 'color' ? 'btn-primary' : 'btn-secondary'}`} style={{ padding: '0.2rem 0.6rem', fontSize: '0.7rem' }} onClick={() => { setNewTeamBadgeType('color'); setNewTeamBadgeValue('#bef264'); }}>Color</button>
                                            <button type="button" className={`btn ${newTeamBadgeType === 'club' ? 'btn-primary' : 'btn-secondary'}`} style={{ padding: '0.2rem 0.6rem', fontSize: '0.7rem' }} onClick={() => { setNewTeamBadgeType('club'); setNewTeamBadgeValue('Real Madrid'); }}>Club</button>
                                        </div>
                                    </div>

                                    {newTeamBadgeType === 'color' ? (
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem', padding: '0.5rem', justifyItems: 'center' }}>
                                            {['#bef264', '#3b82f6', '#ef4444', '#f59e0b', '#8b5cf6', '#ec4899', '#ffffff', '#000000'].map(color => (
                                                <button
                                                    key={color}
                                                    type="button"
                                                    onClick={() => setNewTeamBadgeValue(color)}
                                                    style={{
                                                        width: '42px',
                                                        height: '42px',
                                                        borderRadius: '50%',
                                                        backgroundColor: color,
                                                        border: newTeamBadgeValue === color ? '3px solid var(--accent)' : '1px solid var(--border)',
                                                        cursor: 'pointer',
                                                        transition: 'transform 0.1s',
                                                        transform: newTeamBadgeValue === color ? 'scale(1.1)' : 'scale(1)'
                                                    }}
                                                />
                                            ))}
                                        </div>
                                    ) : (
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem', maxHeight: '220px', overflowY: 'auto', padding: '0.75rem', background: 'rgba(0,0,0,0.15)', borderRadius: 'var(--radius)' }}>
                                            {Object.keys(CLUB_CONFIGS).map(club => (
                                                <button
                                                    key={club}
                                                    type="button"
                                                    title={club}
                                                    onClick={() => setNewTeamBadgeValue(club)}
                                                    style={{
                                                        background: newTeamBadgeValue === club ? 'rgba(190, 242, 100, 0.1)' : 'transparent',
                                                        border: newTeamBadgeValue === club ? '2px solid var(--accent)' : '1px solid transparent',
                                                        borderRadius: 'var(--radius)',
                                                        padding: '0.5rem',
                                                        cursor: 'pointer',
                                                        display: 'flex',
                                                        justifyContent: 'center',
                                                        transition: 'all 0.1s',
                                                        transform: newTeamBadgeValue === club ? 'scale(1.1)' : 'scale(1)'
                                                    }}
                                                >
                                                    <TeamBadge badgeType="club" badgeValue={club} size={42} />
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="flex-between" style={{ gap: '1rem' }}>
                                    <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setIsAddingTeam(false)}>Cancel</button>
                                    <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Add Team</button>
                                </div>
                            </form>
                        )}

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
                            {teams.length === 0 ? (
                                <p style={{ color: 'var(--muted-foreground)', fontSize: '0.875rem', gridColumn: '1/-1', textAlign: 'center', padding: '2rem' }}>No teams created. Add teams to begin the tournament!</p>
                            ) : teams.map(team => (
                                <div key={team._id} className="card stack" style={{ padding: '1rem' }}>
                                    <div className="flex-between" style={{ borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem', marginBottom: '0.5rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                            <TeamBadge badgeType={team.badgeType || 'color'} badgeValue={team.badgeValue || '#eee'} size={32} />
                                            <span style={{ fontWeight: 800, fontSize: '1.1rem' }}>{team.name}</span>
                                        </div>
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            <button
                                                className="btn btn-primary"
                                                style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}
                                                onClick={() => setAddingPlayerToTeamId(addingPlayerToTeamId === team._id ? null : team._id)}
                                            >
                                                {addingPlayerToTeamId === team._id ? 'Done' : '+ Add Player'}
                                            </button>
                                            <button
                                                className="btn btn-secondary"
                                                style={{ padding: '0.3rem', color: '#ef4444' }}
                                                onClick={() => handleDeleteTeam(team._id)}
                                                title="Delete Team"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>

                                    {addingPlayerToTeamId === team._id && (
                                        <div className="stack" style={{ marginBottom: '1rem', gap: '0.5rem', background: 'var(--muted)', padding: '0.75rem', borderRadius: 'var(--radius)' }}>
                                            <div style={{ position: 'relative' }}>
                                                <Search size={14} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted-foreground)' }} />
                                                <input
                                                    className="input"
                                                    style={{ paddingLeft: '2.25rem', fontSize: '0.85rem' }}
                                                    placeholder="Search all players..."
                                                    value={playerSearchQuery}
                                                    onChange={e => setPlayerSearchQuery(e.target.value)}
                                                    autoFocus
                                                />
                                            </div>
                                            <div className="stack" style={{ maxHeight: '150px', overflowY: 'auto', gap: '0.25rem' }}>
                                                {filteredGlobalPlayers.length > 0 ? (
                                                    filteredGlobalPlayers.map(p => (
                                                        <button
                                                            key={p._id}
                                                            className="btn btn-secondary"
                                                            style={{ justifyContent: 'flex-start', padding: '0.4rem', fontSize: '0.8rem' }}
                                                            onClick={() => handleAssignPlayer(p._id)}
                                                        >
                                                            <PlayerAvatar shirtType={p.shirtType} shirtValue={p.shirtValue} size={20} />
                                                            {p.name}
                                                        </button>
                                                    ))
                                                ) : (
                                                    <Link href="/players" className="btn btn-secondary" style={{ fontSize: '0.8rem', borderStyle: 'dashed' }}>
                                                        <Plus size={14} /> Create new global player
                                                    </Link>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    <div className="stack" style={{ gap: '0.5rem' }}>
                                        {(playersByTeam[team._id] || []).map(p => (
                                            <div key={p._id} className="flex-between" style={{ padding: '0.25rem 0' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                    <PlayerAvatar shirtType={p.shirtType} shirtValue={p.shirtValue} size={28} />
                                                    <span style={{ fontWeight: 500 }}>{p.name}</span>
                                                </div>
                                                <button onClick={() => handleRemoveFromTeam(team._id, p._id)} style={{ background: 'none', border: 'none', color: 'var(--muted-foreground)', cursor: 'pointer' }}>
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        ))}
                                        {(playersByTeam[team._id] || []).length === 0 && (
                                            <p style={{ fontSize: '0.8rem', color: 'var(--muted-foreground)', textAlign: 'center' }}>No players assigned.</p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {activeTab === 'games' && (
                    <section className="stack animate-fade-in">
                        <div className="flex-between" style={{ marginBottom: '1rem' }}>
                            <h2 style={{ fontSize: '1.1rem' }}>Fixtures & Results</h2>
                            {teams.length >= 2 && (
                                <button className="btn btn-primary" onClick={() => setIsAddingMatch(true)}>
                                    <Plus size={18} /> <span className="mobile-hidden">Schedule Match</span>
                                </button>
                            )}
                        </div>

                        {isAddingMatch && (
                            <form onSubmit={handleCreateMatch} className="card stack shadow-2xl" style={{ marginBottom: '1.5rem', border: '1px solid var(--accent)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: '100%' }}>
                                    <select className="input" style={{ flex: 1, minWidth: 0 }} value={homeTeamId} onChange={e => setHomeTeamId(e.target.value)}>
                                        <option value="">Home Team</option>
                                        {teams.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
                                    </select>
                                    <span style={{ fontWeight: 800 }}>VS</span>
                                    <select className="input" style={{ flex: 1, minWidth: 0 }} value={awayTeamId} onChange={e => setAwayTeamId(e.target.value)}>
                                        <option value="">Away Team</option>
                                        {teams.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
                                    </select>
                                </div>
                                <div className="flex-between" style={{ gap: '1rem' }}>
                                    <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setIsAddingMatch(false)}>Cancel</button>
                                    <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={!homeTeamId || !awayTeamId || homeTeamId === awayTeamId}>Confirm Game</button>
                                </div>
                            </form>
                        )}

                        <div className="stack" style={{ gap: '1rem' }}>
                            {matches.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--muted-foreground)', border: '2px dashed var(--border)', borderRadius: 'var(--radius)' }}>
                                    No matches yet. Let's kick off!
                                </div>
                            ) : (
                                sortedMatchesWithNumbers.map((match) => (
                                    <div key={match._id} className="card stack" style={{ padding: '1.25rem', borderLeft: match.status === 'in_progress' ? '4px solid var(--accent)' : '1px solid var(--border)' }}>
                                        <div style={{ fontSize: '0.65rem', color: 'var(--muted-foreground)', fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.5rem', display: 'flex', justifyContent: 'space-between' }}>
                                            <span>Game {match.gameNumber}</span>
                                            {match.status === 'finished' && <span>Result</span>}
                                        </div>
                                        <div className="match-row">
                                            <div className="match-team home">
                                                <span className="team-name">
                                                    {teams.find(t => t._id === match.homeTeamId)?.name}
                                                </span>
                                                <TeamBadge badgeType={teams.find(t => t._id === match.homeTeamId)?.badgeType || 'color'} badgeValue={teams.find(t => t._id === match.homeTeamId)?.badgeValue || '#eee'} size={32} />
                                            </div>

                                            <div className="score-chip-container">
                                                <span className="score-chip" style={{
                                                    background: match.status === 'in_progress' ? 'rgba(190, 242, 100, 0.1)' : 'var(--secondary)',
                                                    border: match.status === 'in_progress' ? '1px solid var(--accent)' : '1px solid var(--border)',
                                                }}>
                                                    {match.homeScore} - {match.awayScore}
                                                </span>
                                                <span style={{ fontSize: '0.6rem', color: match.status === 'in_progress' ? 'var(--accent)' : 'var(--muted-foreground)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                                                    {match.status}
                                                </span>
                                            </div>

                                            <div className="match-team away">
                                                <TeamBadge badgeType={teams.find(t => t._id === match.awayTeamId)?.badgeType || 'color'} badgeValue={teams.find(t => t._id === match.awayTeamId)?.badgeValue || '#eee'} size={32} />
                                                <span className="team-name">
                                                    {teams.find(t => t._id === match.awayTeamId)?.name}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex-between" style={{ marginTop: '1rem' }}>
                                            <div className="flex-between" style={{ gap: '0.5rem' }}>
                                                {match.status === 'scheduled' && (
                                                    <button className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }} onClick={() => updateStatus({ matchId: match._id, status: 'in_progress' })}>
                                                        <Play size={14} /> Kickoff
                                                    </button>
                                                )}
                                                {match.status === 'in_progress' && (
                                                    <>
                                                        <button className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }} onClick={() => setRecordingGoalForMatch(match._id)}>
                                                            <Footprints size={14} /> Goal!!
                                                        </button>
                                                        <button className="btn btn-primary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }} onClick={() => updateStatus({ matchId: match._id, status: 'finished' })}>
                                                            <CheckCircle size={14} /> Full Time
                                                        </button>
                                                    </>
                                                )}
                                                {match.status === 'finished' && (
                                                    <button className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }} onClick={() => setEditingMatchId(editingMatchId === match._id ? null : match._id)}>
                                                        <Edit3 size={14} /> {editingMatchId === match._id ? 'Close' : 'Log'}
                                                    </button>
                                                )}
                                            </div>
                                            <button onClick={() => handleDeleteMatch(match._id)} style={{ padding: '0.5rem', color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' }} title="Delete Match">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>

                                        {editingMatchId === match._id && (
                                            <div className="glass-panel stack shadow-inner" style={{ marginTop: '1rem', padding: '1rem' }}>
                                                <div className="flex-between" style={{ marginBottom: '1rem' }}>
                                                    <p style={{ fontSize: '0.85rem', fontWeight: 800, textTransform: 'uppercase' }}>Goal Log</p>
                                                    <button className="btn btn-secondary" style={{ fontSize: '0.7rem', padding: '0.2rem 0.6rem' }} onClick={() => updateStatus({ matchId: match._id, status: 'in_progress' })}>
                                                        Reopen Game
                                                    </button>
                                                </div>
                                                <div className="stack" style={{ gap: '0.5rem' }}>
                                                    {goals.filter(g => g.matchId === match._id).map((goal) => {
                                                        const scorer = players.find(p => p._id === goal.scorerId);
                                                        const assistant = players.find(p => p._id === goal.assistantId);
                                                        return (
                                                            <div key={goal._id} className="flex-between card" style={{ padding: '0.75rem', fontSize: '0.9rem', background: 'rgba(0,0,0,0.2)' }}>
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                                    <PlayerAvatar shirtType={scorer?.shirtType || 'color'} shirtValue={scorer?.shirtValue || '#eee'} size={32} />
                                                                    <div className="stack" style={{ gap: '0' }}>
                                                                        <span style={{ fontWeight: 700 }}>{scorer?.name} {goal.isOwnGoal && <span style={{ color: 'var(--accent)', fontSize: '0.75rem' }}>(OG)</span>}</span>
                                                                        {assistant && <span style={{ fontSize: '0.7rem', color: 'var(--muted-foreground)' }}>Asst: {assistant.name}</span>}
                                                                    </div>
                                                                </div>
                                                                <div className="flex-between" style={{ gap: '0.75rem' }}>
                                                                    <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--accent)', textTransform: 'uppercase' }}>{teams.find(t => t._id === goal.teamId)?.name}</span>
                                                                    <button onClick={() => handleRemoveGoal(goal._id)} style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', padding: '0.2rem' }}>
                                                                        <XCircle size={14} />
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                    {goals.filter(g => g.matchId === match._id).length === 0 && <p style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--muted-foreground)' }}>No goals recorded yet.</p>}
                                                </div>
                                            </div>
                                        )}

                                        {recordingGoalForMatch === match._id && (
                                            <div className="glass-panel stack shadow-2xl" style={{ marginTop: '1rem', padding: '1.25rem', border: '2px solid var(--accent)' }}>
                                                <div className="flex-between" style={{ marginBottom: '1rem', padding: '0.5rem', background: isOwnGoal ? 'rgba(190, 242, 100, 0.1)' : 'transparent', borderRadius: 'var(--radius)', border: isOwnGoal ? '1px solid var(--accent)' : '1px solid transparent' }}>
                                                    <span style={{ fontSize: '0.85rem', fontWeight: 800 }}>Own Goal Option</span>
                                                    <button
                                                        className={`btn ${isOwnGoal ? 'btn-primary' : 'btn-secondary'}`}
                                                        style={{ padding: '0.2rem 0.6rem', fontSize: '0.7rem' }}
                                                        onClick={() => setIsOwnGoal(!isOwnGoal)}
                                                    >
                                                        {isOwnGoal ? 'ON' : 'OFF'}
                                                    </button>
                                                </div>

                                                {!selectedScorerId ? (
                                                    <>
                                                        <p style={{ fontSize: '0.9rem', fontWeight: 800, marginBottom: '0.5rem' }}>Select Scorer ⚽</p>
                                                        <div className="scorer-grid">
                                                            <div className="stack" style={{ gap: '0.5rem' }}>
                                                                <p style={{ fontSize: '0.7rem', color: 'var(--muted-foreground)', fontWeight: 800 }}>{teams.find(t => t._id === match.homeTeamId)?.name || 'HOME'}</p>
                                                                {players.map(p => (
                                                                    <button
                                                                        key={p._id}
                                                                        className="btn btn-secondary"
                                                                        style={{ padding: '0.5rem', fontSize: '0.8rem', justifyContent: 'flex-start', border: (playersByTeam[match.homeTeamId] || []).find(pt => pt._id === p._id) ? 'none' : '1px dashed var(--accent)' }}
                                                                        onClick={() => {
                                                                            setSelectedScorerId(p._id);
                                                                            setSelectedScorerTeamId(isOwnGoal ? match.awayTeamId : match.homeTeamId);
                                                                        }}
                                                                    >
                                                                        <PlayerAvatar shirtType={p.shirtType} shirtValue={p.shirtValue} size={20} />
                                                                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</span>
                                                                    </button>
                                                                ))}
                                                            </div>
                                                            <div className="stack" style={{ gap: '0.5rem' }}>
                                                                <p style={{ fontSize: '0.7rem', color: 'var(--muted-foreground)', fontWeight: 800 }}>{teams.find(t => t._id === match.awayTeamId)?.name || 'AWAY'}</p>
                                                                {players.map(p => (
                                                                    <button
                                                                        key={p._id}
                                                                        className="btn btn-secondary"
                                                                        style={{ padding: '0.5rem', fontSize: '0.8rem', justifyContent: 'flex-start', border: (playersByTeam[match.awayTeamId] || []).find(pt => pt._id === p._id) ? 'none' : '1px dashed var(--accent)' }}
                                                                        onClick={() => {
                                                                            setSelectedScorerId(p._id);
                                                                            setSelectedScorerTeamId(isOwnGoal ? match.homeTeamId : match.awayTeamId);
                                                                        }}
                                                                    >
                                                                        <PlayerAvatar shirtType={p.shirtType} shirtValue={p.shirtValue} size={20} />
                                                                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</span>
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </>
                                                ) : (
                                                    <>
                                                        <p style={{ fontSize: '0.9rem', fontWeight: 800, marginBottom: '0.5rem' }}>
                                                            {isOwnGoal ? 'Confirm Own Goal' : 'Select Assistant 👟'}
                                                            {!isOwnGoal && <span style={{ fontSize: '0.7rem', fontWeight: 400, opacity: 0.7 }}> (Optional)</span>}
                                                        </p>
                                                        <div className="stack" style={{ gap: '0.75rem' }}>
                                                            <button
                                                                className="btn btn-primary"
                                                                style={{ padding: '0.75rem', width: '100%', fontWeight: 800 }}
                                                                onClick={() => handleAddGoal(selectedScorerId, selectedScorerTeamId!)}
                                                            >
                                                                {isOwnGoal ? 'Confirm OG' : 'Goal without Assist'}
                                                            </button>
                                                            {!isOwnGoal && (
                                                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '0.5rem' }}>
                                                                    {players.filter(p => p._id !== selectedScorerId).map(p => (
                                                                        <button
                                                                            key={p._id}
                                                                            className="btn btn-secondary"
                                                                            style={{ padding: '0.4rem', fontSize: '0.8rem', justifyContent: 'flex-start' }}
                                                                            onClick={() => handleAddGoal(selectedScorerId, selectedScorerTeamId!, p._id)}
                                                                        >
                                                                            <PlayerAvatar shirtType={p.shirtType} shirtValue={p.shirtValue} size={18} />
                                                                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</span>
                                                                        </button>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </>
                                                )}
                                                <button className="btn btn-secondary" style={{ marginTop: '1rem', fontSize: '0.8rem', width: '100%' }} onClick={() => { setRecordingGoalForMatch(null); setSelectedScorerId(null); setSelectedScorerTeamId(null); setIsOwnGoal(false); }}>Cancel</button>
                                            </div>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    </section>
                )}

                {activeTab === 'stats' && (
                    <div className="stack animate-fade-in" style={{ gap: '2.5rem' }}>
                        {/* Progress Chart */}
                        {progressionData.length > 1 && (
                            <section className="stack">
                                <h2 className="flex-between" style={{ gap: '0.5rem', fontSize: '1.1rem', marginBottom: '0.5rem' }}>
                                    <TrendingUp size={18} color="var(--accent)" /> Team Progression
                                </h2>
                                <div className="card shadow-lg" style={{ padding: '1.5rem 1rem 1rem 0', height: '350px', background: 'rgba(0,0,0,0.2)' }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={progressionData}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                                            <XAxis
                                                dataKey="game"
                                                stroke="var(--muted-foreground)"
                                                fontSize={12}
                                                tickLine={false}
                                                axisLine={false}
                                                label={{ value: 'Games Played', position: 'insideBottom', offset: -5, fontSize: 10, fill: 'var(--muted-foreground)' }}
                                            />
                                            <YAxis
                                                stroke="var(--muted-foreground)"
                                                fontSize={12}
                                                tickLine={false}
                                                axisLine={false}
                                                label={{ value: 'Points', angle: -90, position: 'insideLeft', fontSize: 10, fill: 'var(--muted-foreground)' }}
                                            />
                                            <Tooltip
                                                contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', fontSize: '0.8rem' }}
                                                itemStyle={{ fontSize: '0.8rem', fontWeight: 700 }}
                                            />
                                            <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '0.8rem', paddingBottom: '1rem' }} />
                                            {teams.map((team, idx) => (
                                                <Line
                                                    key={team._id}
                                                    type="monotone"
                                                    dataKey={team._id}
                                                    name={team.name}
                                                    stroke={chartColors[idx % chartColors.length]}
                                                    strokeWidth={3}
                                                    dot={{ r: 4, strokeWidth: 2, fill: 'var(--card)' }}
                                                    activeDot={{ r: 6, strokeWidth: 0 }}
                                                    animationDuration={1500}
                                                />
                                            ))}
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                            </section>
                        )}

                        {/* Standings Section */}
                        {
                            teams.length > 0 && (
                                <section className="stack">
                                    <h2 className="flex-between" style={{ gap: '0.5rem', fontSize: '1.1rem', marginBottom: '0.5rem' }}>
                                        <Trophy size={18} color="var(--accent)" /> Table Standings
                                    </h2>
                                    <div className="card shadow-lg" style={{ padding: '0.25rem', overflowX: 'auto' }}>
                                        <table className="standings-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                            <thead>
                                                <tr style={{ borderBottom: '2px solid var(--border)', color: 'var(--muted-foreground)', fontSize: '0.75rem' }}>
                                                    <th className="standings-cell standings-team-cell" style={{ padding: '1rem' }}>TEAM</th>
                                                    <th className="standings-cell" style={{ padding: '1rem', textAlign: 'center' }}>P</th>
                                                    <th className="standings-cell" style={{ padding: '1rem', textAlign: 'center' }}>W</th>
                                                    <th className="standings-cell" style={{ padding: '1rem', textAlign: 'center' }}>D</th>
                                                    <th className="standings-cell" style={{ padding: '1rem', textAlign: 'center' }}>L</th>
                                                    <th className="standings-cell" style={{ padding: '1rem', textAlign: 'center' }}>GF</th>
                                                    <th className="standings-cell" style={{ padding: '1rem', textAlign: 'center' }}>GA</th>
                                                    <th className="standings-cell" style={{ padding: '1rem', textAlign: 'center' }}>GD</th>
                                                    <th className="standings-cell" style={{ padding: '1rem', textAlign: 'center' }}>PTS</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {standings.map((s, idx) => {
                                                    const team = teams.find(t => t._id === s._id);
                                                    return (
                                                        <tr key={idx} style={{ borderBottom: idx === standings.length - 1 ? 'none' : '1px solid var(--border)' }}>
                                                            <td className="standings-cell standings-team-cell" style={{ padding: '1rem', fontWeight: 800, color: idx === 0 ? 'var(--accent)' : 'inherit' }}>
                                                                <div className="standings-team-content" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                                    <TeamBadge badgeType={team?.badgeType || 'color'} badgeValue={team?.badgeValue || '#eee'} size={24} />
                                                                    {s.name}
                                                                </div>
                                                            </td>
                                                            <td className="standings-cell" style={{ padding: '1rem', textAlign: 'center' }}>{s.played}</td>
                                                            <td className="standings-cell" style={{ padding: '1rem', textAlign: 'center', color: s.won > 0 ? 'var(--accent)' : 'inherit' }}>{s.won}</td>
                                                            <td className="standings-cell" style={{ padding: '1rem', textAlign: 'center' }}>{s.drawn}</td>
                                                            <td className="standings-cell" style={{ padding: '1rem', textAlign: 'center', color: s.lost > 0 ? '#ef4444' : 'inherit' }}>{s.lost}</td>
                                                            <td className="standings-cell" style={{ padding: '1rem', textAlign: 'center' }}>{s.gf}</td>
                                                            <td className="standings-cell" style={{ padding: '1rem', textAlign: 'center' }}>{s.ga}</td>
                                                            <td className="standings-cell" style={{ padding: '1rem', textAlign: 'center' }}>{s.gf - s.ga}</td>
                                                            <td className="standings-cell standings-points-value" style={{ padding: '1rem', textAlign: 'center', color: 'var(--accent)', fontWeight: 800, fontSize: '1.1rem' }}>{s.pts}</td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </section>
                            )
                        }

                        {/* Scoreboard Section - Top Scorers */}
                        {
                            scoreboard.scorers.length > 0 && (
                                <section className="stack">
                                    <h2 className="flex-between" style={{ gap: '0.5rem', fontSize: '1.1rem', marginBottom: '0.5rem' }}>
                                        <ListOrdered size={18} color="var(--accent)" /> Top Scorers
                                    </h2>
                                    <div className="card stack shadow-lg" style={{ padding: '1rem', border: '1px solid rgba(190, 242, 100, 0.2)' }}>
                                        {scoreboard.scorers.map((s, i) => (
                                            <div key={i} className="flex-between" style={{ padding: '0.5rem 0', borderBottom: i < scoreboard.scorers.length - 1 ? '1px solid var(--border)' : 'none' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                    <span style={{ width: '1rem', fontWeight: 800, color: i === 0 ? 'var(--accent)' : 'var(--muted-foreground)' }}>{i + 1}</span>
                                                    <PlayerAvatar shirtType={s.shirtType} shirtValue={s.shirtValue} size={24} />
                                                    <span style={{ fontWeight: 600 }}>{s.name}</span>
                                                </div>
                                                <span style={{ fontWeight: 800, color: 'var(--accent)', fontSize: '1.1rem' }}>{s.count}</span>
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            )
                        }

                        {/* Scoreboard Section - Top Assists */}
                        {
                            scoreboard.assistants.length > 0 && (
                                <section className="stack">
                                    <h2 className="flex-between" style={{ gap: '0.5rem', fontSize: '1.1rem', marginBottom: '0.5rem' }}>
                                        <ListOrdered size={18} color="var(--accent)" /> Top Assists
                                    </h2>
                                    <div className="card stack shadow-lg" style={{ padding: '1rem' }}>
                                        {scoreboard.assistants.map((s, i) => (
                                            <div key={i} className="flex-between" style={{ padding: '0.5rem 0', borderBottom: i < scoreboard.assistants.length - 1 ? '1px solid var(--border)' : 'none' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                    <span style={{ width: '1rem', fontWeight: 800, color: i === 0 ? 'var(--accent)' : 'var(--muted-foreground)' }}>{i + 1}</span>
                                                    <PlayerAvatar shirtType={s.shirtType} shirtValue={s.shirtValue} size={24} />
                                                    <span style={{ fontWeight: 600 }}>{s.name}</span>
                                                </div>
                                                <span style={{ fontWeight: 800, color: 'var(--accent)', fontSize: '1.1rem' }}>{s.count}</span>
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            )
                        }
                    </div>
                )}
            </div >

        </div >
    );
}
