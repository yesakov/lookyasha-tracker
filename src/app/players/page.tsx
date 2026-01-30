"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "convex/_generated/api";
import { Header } from "@/components/Header";
import { UserPlus, Trash2, Edit2, Check, X, Palette, Trophy, Search } from "lucide-react";
import { useState, useMemo } from "react";
import PlayerAvatar from "@/components/PlayerAvatar";
import { Id } from "convex/_generated/dataModel";

const CLUBS = [
    "Real Madrid", "Barcelona", "Man City", "Liverpool", "Arsenal",
    "Bayern", "PSG", "AC Milan", "Juventus", "Inter",
    "Dynamo Kyiv", "Shakhtar Donetsk", "Man Utd", "Chelsea", "Tottenham",
    "Newcastle", "Aston Villa", "Atletico Madrid", "Sevilla", "Valencia",
    "Dortmund", "Leverkusen", "Roma", "Napoli", "Lazio",
    "Benfica", "Porto", "Ajax", "Sporting CP", "Galatasaray", "Fenerbahce"
];

const COLORS = ["#ef4444", "#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899", "#06b6d4", "#f97316", "#ffffff", "#000000"];

export default function PlayersPage() {
    const players = useQuery(api.queries.getPlayers);
    const createPlayer = useMutation(api.mutations.createPlayer);
    const updatePlayer = useMutation(api.mutations.updatePlayer);
    const deletePlayer = useMutation(api.mutations.deletePlayer);

    const [isCreating, setIsCreating] = useState(false);
    const [editingId, setEditingId] = useState<Id<"players"> | null>(null);

    const [name, setName] = useState("");
    const [shirtType, setShirtType] = useState("color");
    const [shirtValue, setShirtValue] = useState(COLORS[0]);
    const [searchQuery, setSearchQuery] = useState("");

    const resetForm = () => {
        setName("");
        setShirtType("color");
        setShirtValue(COLORS[0]);
        setIsCreating(false);
        setEditingId(null);
    };

    const handleEdit = (p: any) => {
        setEditingId(p._id);
        setName(p.name);
        setShirtType(p.shirtType);
        setShirtValue(p.shirtValue);
        setIsCreating(false);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;

        if (editingId) {
            await updatePlayer({ playerId: editingId, name, shirtType, shirtValue });
        } else {
            await createPlayer({ name, shirtType, shirtValue });
        }
        resetForm();
    };

    const handleDelete = async (id: Id<"players">) => {
        if (confirm("Delete this player permanently?")) {
            await deletePlayer({ playerId: id });
        }
    };

    const filteredPlayers = useMemo(() => {
        if (!players) return [];
        return players.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
            .sort((a, b) => a.name.localeCompare(b.name));
    }, [players, searchQuery]);

    if (players === undefined) return <div className="container animate-pulse">Squad list arriving...</div>;

    return (
        <div className="container animate-fade-in">
            <Header title="Squad Manager" backPath="/" titleIcon="👥">
                {!isCreating && !editingId && (
                    <button className="btn btn-primary" onClick={() => setIsCreating(true)}>
                        <UserPlus size={18} /> New Player
                    </button>
                )}
            </Header>

            {(isCreating || editingId) && (
                <form onSubmit={handleSubmit} className="card stack shadow-2xl" style={{ marginBottom: "2.5rem", border: "2px solid var(--accent)" }}>
                    <div className="flex-between">
                        <h2 style={{ fontSize: "1.25rem" }}>{editingId ? "Edit Player" : "Create Player"}</h2>
                        <button type="button" onClick={resetForm} style={{ background: 'none', border: 'none', color: 'var(--muted-foreground)', cursor: 'pointer' }}>
                            <X size={24} />
                        </button>
                    </div>

                    <div className="stack" style={{ gap: '0.75rem' }}>
                        <label style={{ fontSize: '0.8rem', color: 'var(--muted-foreground)', fontWeight: 800 }}>NAME</label>
                        <input
                            className="input"
                            placeholder="Cristiano"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            autoFocus
                        />
                    </div>

                    <div className="stack" style={{ gap: '0.75rem' }}>
                        <label style={{ fontSize: '0.8rem', color: 'var(--muted-foreground)', fontWeight: 800 }}>STYLE</label>
                        <div style={{ display: 'flex', gap: '0.75rem' }}>
                            <button
                                type="button"
                                className={`btn ${shirtType === 'color' ? 'btn-primary' : 'btn-secondary'}`}
                                style={{ flex: 1 }}
                                onClick={() => { setShirtType('color'); setShirtValue(COLORS[0]); }}
                            >
                                <Palette size={18} /> Color
                            </button>
                            <button
                                type="button"
                                className={`btn ${shirtType === 'club' ? 'btn-primary' : 'btn-secondary'}`}
                                style={{ flex: 1 }}
                                onClick={() => { setShirtType('club'); setShirtValue(CLUBS[0]); }}
                            >
                                <Trophy size={18} /> Club
                            </button>
                        </div>
                    </div>

                    <div className="stack" style={{ gap: '0.75rem' }}>
                        <label style={{ fontSize: '0.8rem', color: 'var(--muted-foreground)', fontWeight: 800 }}>
                            {shirtType === 'color' ? 'SELECT COLOR' : 'SELECT CLUB'}
                        </label>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', background: 'var(--muted)', padding: '1rem', borderRadius: 'var(--radius)' }}>
                            {shirtType === 'color' ? (
                                COLORS.map(c => (
                                    <div
                                        key={c}
                                        onClick={() => setShirtValue(c)}
                                        style={{
                                            width: 36, height: 36, borderRadius: '50%', backgroundColor: c, cursor: 'pointer',
                                            border: shirtValue === c ? '3px solid var(--accent)' : '2px solid transparent',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                                        }}
                                    >
                                        {shirtValue === c && <Check size={16} color={c === '#ffffff' ? '#000' : '#fff'} />}
                                    </div>
                                ))
                            ) : (
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', gap: '1rem', width: '100%', maxHeight: '300px', overflowY: 'auto', padding: '0.5rem' }}>
                                    {CLUBS.map(c => (
                                        <div
                                            key={c}
                                            onClick={() => setShirtValue(c)}
                                            className="stack"
                                            style={{
                                                alignItems: 'center', cursor: 'pointer', padding: '0.5rem', borderRadius: 'var(--radius)',
                                                background: shirtValue === c ? 'rgba(190, 242, 100, 0.1)' : 'transparent',
                                                border: shirtValue === c ? '1px solid var(--accent)' : '1px solid transparent',
                                                transition: 'all 0.1s'
                                            }}
                                        >
                                            <PlayerAvatar shirtType="club" shirtValue={c} size={44} />
                                            <span style={{ fontSize: '0.55rem', textAlign: 'center', marginTop: '0.4rem', lineHeight: 1, fontWeight: shirtValue === c ? 800 : 400 }}>{c}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    <button type="submit" className="btn btn-primary" style={{ marginTop: '1rem', padding: '0.8rem' }}>
                        <Check size={20} /> {editingId ? "Save Changes" : "Add Player"}
                    </button>
                </form>
            )}

            <div className="stack" style={{ gap: '1rem' }}>
                <div style={{ position: 'relative' }}>
                    <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted-foreground)' }} />
                    <input
                        className="input"
                        style={{ paddingLeft: '3rem' }}
                        placeholder="Search squad..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                    />
                </div>

                <div className="stack" style={{ gap: '0.5rem' }}>
                    {filteredPlayers.map(p => (
                        <div key={p._id} className="card flex-between" style={{ padding: '0.75rem 1rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <PlayerAvatar shirtType={p.shirtType} shirtValue={p.shirtValue} size={44} />
                                <div className="stack" style={{ gap: '0.1rem' }}>
                                    <span style={{ fontWeight: 700 }}>{p.name}</span>
                                    <span style={{ fontSize: '0.7rem', color: 'var(--muted-foreground)', textTransform: 'uppercase' }}>{p.shirtValue}</span>
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button className="btn btn-secondary" style={{ padding: '0.4rem', minWidth: 'auto' }} onClick={() => handleEdit(p)}>
                                    <Edit2 size={16} />
                                </button>
                                <button className="btn btn-secondary" style={{ padding: '0.4rem', minWidth: 'auto', color: '#ef4444' }} onClick={() => handleDelete(p._id)}>
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
