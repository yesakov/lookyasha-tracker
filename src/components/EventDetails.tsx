"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import Link from "next/link";
import { ChevronLeft, Plus, Users, Trophy, Play, CheckCircle, UserPlus, Footprints } from "lucide-react";
import { useState, useMemo } from "react";
import { Id } from "../../../convex/_generated/dataModel";

export default function EventDetails({ id }: { id: Id<"events"> }) {
    const data = useQuery(api.queries.getEventDetails, { eventId: id });
    const createTeam = useMutation(api.mutations.createTeam);
    const createPlayer = useMutation(api.mutations.createPlayer);
    const createMatch = useMutation(api.mutations.createMatch);
    const updateStatus = useMutation(api.mutations.updateMatchStatus);
    const addGoal = useMutation(api.mutations.addGoal);

    const [isAddingTeam, setIsAddingTeam] = useState(false);
    const [newTeamName, setNewTeamName] = useState("");

    const [addingPlayerToTeamId, setAddingPlayerToTeamId] = useState<Id<"teams"> | null>(null);
    const [newPlayerName, setNewPlayerName] = useState("");

    const [isAddingMatch, setIsAddingMatch] = useState(false);
    const [homeTeamId, setHomeTeamId] = useState<string>("");
    const [awayTeamId, setAwayTeamId] = useState<string>("");

    const [recordingGoalForMatch, setRecordingGoalForMatch] = useState<Id<"matches"> | null>(null);

    const standings = useMemo(() => {
        if (!data) return [];

        const stats: Record<string, any> = {};
        data.teams.forEach(team => {
            stats[team._id] = { name: team.name, played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, pts: 0 };
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

    const handleAddTeam = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTeamName.trim()) return;
        await createTeam({ name: newTeamName, eventId: id });
        setNewTeamName("");
        setIsAddingTeam(false);
    };

    const handleCreatePlayer = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newPlayerName.trim() || !addingPlayerToTeamId) return;
        await createPlayer({ name: newPlayerName, teamId: addingPlayerToTeamId });
        setNewPlayerName("");
        setAddingPlayerToTeamId(null);
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

    if (data === undefined) return <div className="container animate-pulse">Loading event...</div>;
    if (data === null) return <div className="container">Event not found.</div>;

    const { event, teams, matches, players } = data;

    return (
        <div className="container animate-fade-in">
            <header className="flex-between" style={{ marginBottom: '2rem' }}>
                <Link href="/" className="btn btn-secondary" style={{ padding: '0.5rem' }}>
                    <ChevronLeft size={20} />
                </Link>
                <h1 style={{ fontSize: '1.5rem', color: 'var(--accent)' }}>{event.name}</h1>
                <div style={{ width: '40px' }}></div>
            </header>

            <div className="stack" style={{ gap: '2.5rem' }}>
                {/* Teams Section */}
                <section>
                    <div className="flex-between" style={{ marginBottom: '1rem' }}>
                        <h2 className="flex-between" style={{ gap: '0.5rem', fontSize: '1.1rem' }}>
                            <Users size={18} /> Teams & Players
                        </h2>
                        <button className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }} onClick={() => setIsAddingTeam(true)}>
                            + New Team
                        </button>
                    </div>

                    {isAddingTeam && (
                        <form onSubmit={handleAddTeam} className="card stack" style={{ marginBottom: '1.5rem', border: '1px solid var(--accent)' }}>
                            <input
                                className="input"
                                placeholder="Team Name"
                                value={newTeamName}
                                onChange={e => setNewTeamName(e.target.value)}
                                autoFocus
                            />
                            <div className="flex-between" style={{ gap: '1rem' }}>
                                <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setIsAddingTeam(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Save Team</button>
                            </div>
                        </form>
                    )}

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1rem' }}>
                        {teams.length === 0 ? (
                            <p style={{ color: 'var(--muted-foreground)', fontSize: '0.875rem', gridColumn: '1/-1' }}>Add some teams to start matches.</p>
                        ) : teams.map(team => (
                            <div key={team._id} className="card stack" style={{ padding: '0.75rem' }}>
                                <div className="flex-between">
                                    <span style={{ fontWeight: 600 }}>{team.name}</span>
                                    <button
                                        className="btn btn-secondary"
                                        style={{ padding: '0.2rem', minWidth: 'auto' }}
                                        onClick={() => setAddingPlayerToTeamId(team._id)}
                                    >
                                        <UserPlus size={14} />
                                    </button>
                                </div>

                                <div className="stack" style={{ gap: '0.25rem' }}>
                                    {players.filter(p => p.teamId === team._id).map(player => (
                                        <span key={player._id} style={{ fontSize: '0.8rem', color: 'var(--muted-foreground)' }}>
                                            • {player.name}
                                        </span>
                                    ))}
                                </div>

                                {addingPlayerToTeamId === team._id && (
                                    <form onSubmit={handleCreatePlayer} className="stack" style={{ marginTop: '0.5rem' }}>
                                        <input
                                            className="input"
                                            style={{ padding: '0.4rem', fontSize: '0.8rem' }}
                                            placeholder="Player Name"
                                            value={newPlayerName}
                                            onChange={e => setNewPlayerName(e.target.value)}
                                            autoFocus
                                        />
                                        <div className="flex-between" style={{ gap: '0.5rem' }}>
                                            <button type="button" className="btn btn-secondary" style={{ flex: 1, fontSize: '0.7rem', padding: '0.3rem' }} onClick={() => setAddingPlayerToTeamId(null)}>X</button>
                                            <button type="submit" className="btn btn-primary" style={{ flex: 1, fontSize: '0.7rem', padding: '0.3rem' }}>Add</button>
                                        </div>
                                    </form>
                                )}
                            </div>
                        ))}
                    </div>
                </section>

                {/* Standings Section */}
                {teams.length > 0 && (
                    <section className="stack">
                        <h2 className="flex-between" style={{ gap: '0.5rem', fontSize: '1.1rem', marginBottom: '0.5rem' }}>
                            <Trophy size={18} color="var(--accent)" /> Standings
                        </h2>
                        <div className="card" style={{ padding: '0.25rem', overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                <thead>
                                    <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--muted-foreground)', fontSize: '0.75rem' }}>
                                        <th style={{ padding: '0.75rem' }}>TEAM</th>
                                        <th style={{ padding: '0.75rem', textAlign: 'center' }}>P</th>
                                        <th style={{ padding: '0.75rem', textAlign: 'center' }}>GD</th>
                                        <th style={{ padding: '0.75rem', textAlign: 'center' }}>PTS</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {standings.map((s, i) => (
                                        <tr key={i} style={{ borderBottom: i === standings.length - 1 ? 'none' : '1px solid var(--border)' }}>
                                            <td style={{ padding: '0.75rem', fontWeight: 600 }}>{s.name}</td>
                                            <td style={{ padding: '0.75rem', textAlign: 'center' }}>{s.played}</td>
                                            <td style={{ padding: '0.75rem', textAlign: 'center' }}>{s.gf - s.ga}</td>
                                            <td style={{ padding: '0.75rem', textAlign: 'center', color: 'var(--accent)', fontWeight: 800 }}>{s.pts}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </section>
                )}

                {/* Matches Section */}
                <section className="stack">
                    <div className="flex-between" style={{ marginBottom: '1rem' }}>
                        <h2 style={{ fontSize: '1.1rem' }}>Recent Matches</h2>
                        {teams.length >= 2 && (
                            <button className="btn btn-primary" style={{ padding: '0.4rem 1rem', fontSize: '0.8rem' }} onClick={() => setIsAddingMatch(true)}>
                                + New Match
                            </button>
                        )}
                    </div>

                    {isAddingMatch && (
                        <form onSubmit={handleCreateMatch} className="card stack" style={{ marginBottom: '1.5rem', border: '1px solid var(--accent)' }}>
                            <div className="flex-between" style={{ gap: '0.5rem' }}>
                                <select className="input" style={{ flex: 1 }} value={homeTeamId} onChange={e => setHomeTeamId(e.target.value)}>
                                    <option value="">Home Team</option>
                                    {teams.filter(t => t._id !== awayTeamId).map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
                                </select>
                                <span style={{ fontWeight: 800 }}>VS</span>
                                <select className="input" style={{ flex: 1 }} value={awayTeamId} onChange={e => setAwayTeamId(e.target.value)}>
                                    <option value="">Away Team</option>
                                    {teams.filter(t => t._id !== homeTeamId).map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
                                </select>
                            </div>
                            <div className="flex-between" style={{ gap: '1rem' }}>
                                <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setIsAddingMatch(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={!homeTeamId || !awayTeamId}>Create Match</button>
                            </div>
                        </form>
                    )}

                    <div className="stack">
                        {matches.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--muted-foreground)', border: '1px dashed var(--border)', borderRadius: 'var(--radius)' }}>
                                No matches scheduled.
                            </div>
                        ) : (
                            matches.map((match) => (
                                <div key={match._id} className="card stack" style={{ padding: '1rem' }}>
                                    <div className="flex-between">
                                        <span style={{ fontWeight: 600, flex: 1, textAlign: 'right', paddingRight: '1rem' }}>
                                            {teams.find(t => t._id === match.homeTeamId)?.name}
                                        </span>
                                        <span style={{
                                            background: match.status === 'in_progress' ? 'rgba(190, 242, 100, 0.1)' : 'var(--secondary)',
                                            padding: '0.4rem 0.75rem',
                                            borderRadius: 'var(--radius)',
                                            fontWeight: 800,
                                            fontSize: '1.1rem',
                                            textAlign: 'center',
                                            border: match.status === 'in_progress' ? '1px solid var(--accent)' : '1px solid var(--border)',
                                            minWidth: '60px'
                                        }}>
                                            {match.homeScore} - {match.awayScore}
                                        </span>
                                        <span style={{ fontWeight: 600, flex: 1, textAlign: 'left', paddingLeft: '1rem' }}>
                                            {teams.find(t => t._id === match.awayTeamId)?.name}
                                        </span>
                                    </div>

                                    <div className="flex-between" style={{ marginTop: '0.75rem' }}>
                                        <span style={{ fontSize: '0.75rem', color: match.status === 'in_progress' ? 'var(--accent)' : 'var(--muted-foreground)', fontWeight: 600 }}>
                                            {match.status.toUpperCase()}
                                        </span>
                                        <div className="flex-between" style={{ gap: '0.5rem' }}>
                                            {match.status === 'scheduled' && (
                                                <button className="btn btn-secondary" style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }} onClick={() => updateStatus({ matchId: match._id, status: 'in_progress' })}>
                                                    <Play size={12} /> Start
                                                </button>
                                            )}
                                            {match.status === 'in_progress' && (
                                                <>
                                                    <button className="btn btn-secondary" style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }} onClick={() => setRecordingGoalForMatch(match._id)}>
                                                        <Footprints size={12} /> Goal
                                                    </button>
                                                    <button className="btn btn-primary" style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }} onClick={() => updateStatus({ matchId: match._id, status: 'finished' })}>
                                                        <CheckCircle size={12} /> Finish
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    {recordingGoalForMatch === match._id && (
                                        <div className="glass-panel stack" style={{ marginTop: '1rem', padding: '1rem' }}>
                                            <p style={{ fontSize: '0.85rem', fontWeight: 600 }}>Who scored?</p>
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                                                <div className="stack" style={{ gap: '0.25rem' }}>
                                                    <span style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>HOME</span>
                                                    {players.filter(p => p.teamId === match.homeTeamId).map(player => (
                                                        <button
                                                            key={player._id}
                                                            className="btn btn-secondary"
                                                            style={{ padding: '0.3rem', fontSize: '0.75rem' }}
                                                            onClick={() => {
                                                                addGoal({ matchId: match._id, scorerId: player._id, teamId: match.homeTeamId });
                                                                setRecordingGoalForMatch(null);
                                                            }}
                                                        >
                                                            {player.name}
                                                        </button>
                                                    ))}
                                                </div>
                                                <div className="stack" style={{ gap: '0.25rem' }}>
                                                    <span style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>AWAY</span>
                                                    {players.filter(p => p.teamId === match.awayTeamId).map(player => (
                                                        <button
                                                            key={player._id}
                                                            className="btn btn-secondary"
                                                            style={{ padding: '0.3rem', fontSize: '0.75rem' }}
                                                            onClick={() => {
                                                                addGoal({ matchId: match._id, scorerId: player._id, teamId: match.awayTeamId });
                                                                setRecordingGoalForMatch(null);
                                                            }}
                                                        >
                                                            {player.name}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                            <button className="btn btn-secondary" style={{ marginTop: '0.5rem', fontSize: '0.75rem' }} onClick={() => setRecordingGoalForMatch(null)}>Cancel</button>
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </section>
            </div>

            <footer style={{ marginTop: '3rem', textAlign: 'center', color: 'var(--muted-foreground)', fontSize: '0.875rem' }}>
                Updated in real-time with Convex.
            </footer>
        </div>
    );
}
