"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "convex/_generated/api";
import { Header } from "./Header";
import Link from "next/link";
import { Plus, Users, Trophy, Play, CheckCircle, Footprints, ListOrdered, Trash2, Edit3, XCircle, Search } from "lucide-react";
import { useState, useMemo } from "react";
import { Id } from "convex/_generated/dataModel";
import PlayerAvatar from "./PlayerAvatar";

export default function EventDetails({ id }: { id: Id<"events"> }) {
    const data = useQuery(api.queries.getEventDetails, { eventId: id });
    const allGlobalPlayers = useQuery(api.queries.getPlayers);

    const createTeam = useMutation(api.mutations.createTeam);
    const addPlayerToTeam = useMutation(api.mutations.addPlayerToTeam);
    const removePlayerFromTeam = useMutation(api.mutations.removePlayerFromTeam);

    const createMatch = useMutation(api.mutations.createMatch);
    const deleteMatch = useMutation(api.mutations.deleteMatch);
    const updateStatus = useMutation(api.mutations.updateMatchStatus);
    const addGoal = useMutation(api.mutations.addGoal);
    const removeGoal = useMutation(api.mutations.removeGoal);

    const [isAddingTeam, setIsAddingTeam] = useState(false);
    const [newTeamName, setNewTeamName] = useState("");

    const [addingPlayerToTeamId, setAddingPlayerToTeamId] = useState<Id<"teams"> | null>(null);
    const [playerSearchQuery, setPlayerSearchQuery] = useState("");

    const [isAddingMatch, setIsAddingMatch] = useState(false);
    const [homeTeamId, setHomeTeamId] = useState<string>("");
    const [awayTeamId, setAwayTeamId] = useState<string>("");

    const [recordingGoalForMatch, setRecordingGoalForMatch] = useState<Id<"matches"> | null>(null);
    const [selectedScorerId, setSelectedScorerId] = useState<Id<"players"> | null>(null);
    const [selectedScorerTeamId, setSelectedScorerTeamId] = useState<Id<"teams"> | null>(null);

    const [editingMatchId, setEditingMatchId] = useState<Id<"matches"> | null>(null);

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
            if (scorer) {
                if (!scorerStats[scorer._id]) scorerStats[scorer._id] = { name: scorer.name, shirtType: scorer.shirtType, shirtValue: scorer.shirtValue, count: 0 };
                scorerStats[scorer._id].count++;
            }

            if (goal.assistantId) {
                const assistant = data.players.find(p => p._id === goal.assistantId);
                if (assistant) {
                    if (!assistantStats[assistant._id]) assistantStats[assistant._id] = { name: assistant.name, shirtType: assistant.shirtType, shirtValue: assistant.shirtValue, count: 0 };
                    assistantStats[assistant._id].count++;
                }
            }
        });

        return {
            scorers: Object.values(scorerStats).sort((a, b) => b.count - a.count).slice(0, 5),
            assistants: Object.values(assistantStats).sort((a, b) => b.count - a.count).slice(0, 5)
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
        await createTeam({ name: newTeamName, eventId: id });
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
        if (confirm("Are you sure you want to delete this match?")) {
            await deleteMatch({ matchId });
        }
    };

    const handleAddGoal = async (scorerId: Id<"players">, teamId: Id<"teams">, assistantId?: Id<"players">) => {
        if (!recordingGoalForMatch) return;
        await addGoal({
            matchId: recordingGoalForMatch,
            scorerId,
            teamId,
            assistantId
        });
        setRecordingGoalForMatch(null);
        setSelectedScorerId(null);
        setSelectedScorerTeamId(null);
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

            <div className="stack" style={{ gap: '2.5rem' }}>
                {/* Teams Section */}
                <section>
                    <div className="flex-between" style={{ marginBottom: '1rem' }}>
                        <h2 className="flex-between" style={{ gap: '0.5rem', fontSize: '1.1rem' }}>
                            <Users size={18} /> Teams & Lineups
                        </h2>
                        <button className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }} onClick={() => setIsAddingTeam(true)}>
                            + Create Team
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
                                    <span style={{ fontWeight: 800, fontSize: '1.1rem' }}>{team.name}</span>
                                    <button
                                        className="btn btn-primary"
                                        style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}
                                        onClick={() => setAddingPlayerToTeamId(addingPlayerToTeamId === team._id ? null : team._id)}
                                    >
                                        {addingPlayerToTeamId === team._id ? 'Done' : '+ Add Player'}
                                    </button>
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

                {/* Matches Section */}
                <section className="stack">
                    <div className="flex-between" style={{ marginBottom: '1rem' }}>
                        <h2 style={{ fontSize: '1.1rem' }}>Fixtures & Results</h2>
                        {teams.length >= 2 && (
                            <button className="btn btn-primary" onClick={() => setIsAddingMatch(true)}>
                                <Plus size={18} /> Schedule Match
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
                                    <div className="flex-between">
                                        <span style={{ fontWeight: 800, flex: 1, textAlign: 'right', paddingRight: '1rem', fontSize: '1.1rem' }}>
                                            {teams.find(t => t._id === match.homeTeamId)?.name}
                                        </span>
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem' }}>
                                            <span style={{
                                                background: match.status === 'in_progress' ? 'rgba(190, 242, 100, 0.1)' : 'var(--secondary)',
                                                padding: '0.5rem 1rem',
                                                borderRadius: 'var(--radius)',
                                                fontWeight: 900,
                                                fontSize: '1.5rem',
                                                border: match.status === 'in_progress' ? '1px solid var(--accent)' : '1px solid var(--border)',
                                                minWidth: '80px',
                                                textAlign: 'center'
                                            }}>
                                                {match.homeScore} - {match.awayScore}
                                            </span>
                                            <span style={{ fontSize: '0.6rem', color: match.status === 'in_progress' ? 'var(--accent)' : 'var(--muted-foreground)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                                                {match.status}
                                            </span>
                                        </div>
                                        <span style={{ fontWeight: 800, flex: 1, textAlign: 'left', paddingLeft: '1rem', fontSize: '1.1rem' }}>
                                            {teams.find(t => t._id === match.awayTeamId)?.name}
                                        </span>
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
                                        {match.status === 'scheduled' && (
                                            <button onClick={() => handleDeleteMatch(match._id)} style={{ padding: '0.5rem', color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' }}>
                                                <Trash2 size={16} />
                                            </button>
                                        )}
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
                                                                    <span style={{ fontWeight: 700 }}>{scorer?.name}</span>
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
                                            {!selectedScorerId ? (
                                                <>
                                                    <p style={{ fontSize: '0.9rem', fontWeight: 800, marginBottom: '0.5rem' }}>Select Scorer ⚽</p>
                                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                                        <div className="stack" style={{ gap: '0.5rem' }}>
                                                            <p style={{ fontSize: '0.7rem', color: 'var(--muted-foreground)', fontWeight: 800 }}>HOME</p>
                                                            {players.map(p => (
                                                                <button
                                                                    key={p._id}
                                                                    className="btn btn-secondary"
                                                                    style={{ padding: '0.5rem', fontSize: '0.8rem', justifyContent: 'flex-start', border: (playersByTeam[match.homeTeamId] || []).find(pt => pt._id === p._id) ? 'none' : '1px dashed var(--accent)' }}
                                                                    onClick={() => { setSelectedScorerId(p._id); setSelectedScorerTeamId(match.homeTeamId); }}
                                                                >
                                                                    <PlayerAvatar shirtType={p.shirtType} shirtValue={p.shirtValue} size={20} />
                                                                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</span>
                                                                </button>
                                                            ))}
                                                        </div>
                                                        <div className="stack" style={{ gap: '0.5rem' }}>
                                                            <p style={{ fontSize: '0.7rem', color: 'var(--muted-foreground)', fontWeight: 800 }}>AWAY</p>
                                                            {players.map(p => (
                                                                <button
                                                                    key={p._id}
                                                                    className="btn btn-secondary"
                                                                    style={{ padding: '0.5rem', fontSize: '0.8rem', justifyContent: 'flex-start', border: (playersByTeam[match.awayTeamId] || []).find(pt => pt._id === p._id) ? 'none' : '1px dashed var(--accent)' }}
                                                                    onClick={() => { setSelectedScorerId(p._id); setSelectedScorerTeamId(match.awayTeamId); }}
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
                                                    <p style={{ fontSize: '0.9rem', fontWeight: 800, marginBottom: '0.5rem' }}>Select Assistant 👟 <span style={{ fontSize: '0.7rem', fontWeight: 400, opacity: 0.7 }}>(Optional)</span></p>
                                                    <div className="stack" style={{ gap: '0.75rem' }}>
                                                        <button
                                                            className="btn btn-primary"
                                                            style={{ padding: '0.75rem', width: '100%', fontWeight: 800 }}
                                                            onClick={() => handleAddGoal(selectedScorerId, selectedScorerTeamId!)}
                                                        >
                                                            Goal without Assist
                                                        </button>
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
                                                    </div>
                                                </>
                                            )}
                                            <button className="btn btn-secondary" style={{ marginTop: '1rem', fontSize: '0.8rem', width: '100%' }} onClick={() => { setRecordingGoalForMatch(null); setSelectedScorerId(null); setSelectedScorerTeamId(null); }}>Cancel</button>
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </section>

                {/* Standings Section */}
                {teams.length > 0 && (
                    <section className="stack">
                        <h2 className="flex-between" style={{ gap: '0.5rem', fontSize: '1.1rem', marginBottom: '0.5rem' }}>
                            <Trophy size={18} color="var(--accent)" /> Table Standings
                        </h2>
                        <div className="card shadow-lg" style={{ padding: '0.25rem', overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                <thead>
                                    <tr style={{ borderBottom: '2px solid var(--border)', color: 'var(--muted-foreground)', fontSize: '0.75rem' }}>
                                        <th style={{ padding: '1rem' }}>TEAM</th>
                                        <th style={{ padding: '1rem', textAlign: 'center' }}>P</th>
                                        <th style={{ padding: '1rem', textAlign: 'center' }}>GF</th>
                                        <th style={{ padding: '1rem', textAlign: 'center' }}>GA</th>
                                        <th style={{ padding: '1rem', textAlign: 'center' }}>GD</th>
                                        <th style={{ padding: '1rem', textAlign: 'center' }}>PTS</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {standings.map((s, i) => (
                                        <tr key={i} style={{ borderBottom: i === standings.length - 1 ? 'none' : '1px solid var(--border)' }}>
                                            <td style={{ padding: '1rem', fontWeight: 800, color: i === 0 ? 'var(--accent)' : 'inherit' }}>{s.name}</td>
                                            <td style={{ padding: '1rem', textAlign: 'center' }}>{s.played}</td>
                                            <td style={{ padding: '1rem', textAlign: 'center' }}>{s.gf}</td>
                                            <td style={{ padding: '1rem', textAlign: 'center' }}>{s.ga}</td>
                                            <td style={{ padding: '1rem', textAlign: 'center' }}>{s.gf - s.ga}</td>
                                            <td style={{ padding: '1rem', textAlign: 'center', color: 'var(--accent)', fontWeight: 800, fontSize: '1.1rem' }}>{s.pts}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </section>
                )}

                {/* Scoreboard Section - Top Scorers */}
                {scoreboard.scorers.length > 0 && (
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
                )}

                {/* Scoreboard Section - Top Assists */}
                {scoreboard.assistants.length > 0 && (
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
                )}
            </div>

        </div>
    );
}
