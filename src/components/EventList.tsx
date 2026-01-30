"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "convex/_generated/api";

import Link from "next/link";
import { Plus, Users } from "lucide-react";
import { useState } from "react";
import { Header } from "./Header";

export default function EventList() {
    const events = useQuery(api.queries.getEvents);
    const createEvent = useMutation(api.mutations.createEvent);
    const [isCreating, setIsCreating] = useState(false);
    const [newEventName, setNewEventName] = useState("");

    const handleCreateEvent = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newEventName.trim()) return;
        await createEvent({ name: newEventName, date: new Date().toISOString() });
        setNewEventName("");
        setIsCreating(false);
    };

    if (events === undefined) {
        return (
            <div className="stack" style={{ alignItems: 'center', padding: '4rem' }}>
                <div className="animate-pulse" style={{ color: 'var(--muted-foreground)' }}>Loading events...</div>
            </div>
        );
    }

    return (
        <div className="container animate-fade-in">
            <Header title="Lookyasha" subtitle="Football Tracker">
                <Link href="/players" className="btn btn-secondary" title="Manage Players" style={{ padding: '0.6rem' }}>
                    <Users size={20} />
                </Link>
                <button
                    className="btn btn-primary"
                    onClick={() => setIsCreating(true)}
                >
                    <Plus size={18} /> <span className="hide-mobile">New Event</span>
                </button>
            </Header>

            {isCreating && (
                <div className="glass-panel shadow-lg" style={{ padding: '1.5rem', marginBottom: '2rem', border: '1px solid var(--accent)' }}>
                    <form onSubmit={handleCreateEvent} className="stack">
                        <h3 style={{ marginBottom: '0.5rem' }}>Create New Event</h3>
                        <input
                            className="input"
                            placeholder="Event Name (e.g. Winter Cup)"
                            value={newEventName}
                            onChange={(e) => setNewEventName(e.target.value)}
                            autoFocus
                        />
                        <div className="flex-between" style={{ gap: '1rem' }}>
                            <button
                                type="button"
                                className="btn btn-secondary"
                                style={{ flex: 1 }}
                                onClick={() => setIsCreating(false)}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="btn btn-primary"
                                style={{ flex: 1 }}
                            >
                                Create
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <section className="stack" style={{ gap: '1.5rem' }}>
                <h2 style={{ fontSize: '1.25rem' }}>
                    {events.length > 0 ? 'Active Events' : 'No events yet'}
                </h2>
                <div className="stack">
                    {events.map((event) => (
                        <Link
                            href={`/events/${event._id}`}
                            key={event._id}
                            className="card stack"
                            style={{ textDecoration: 'none' }}
                        >
                            <div className="flex-between">
                                <h3 style={{ fontSize: '1.1rem' }}>{event.name}</h3>
                                <span style={{ color: 'var(--accent)', fontSize: '0.875rem', fontWeight: 600 }}>
                                    Live Details →
                                </span>
                            </div>
                            <p style={{ color: 'var(--muted-foreground)', fontSize: '0.875rem' }}>
                                Started on {new Date(event.date).toLocaleDateString()}
                            </p>
                        </Link>
                    ))}
                </div>
            </section>

            <footer style={{ marginTop: '4rem', textAlign: 'center', borderTop: '1px solid var(--border)', paddingTop: '2rem' }}>
                <Link href="/players" className="btn btn-secondary" style={{ width: '100%', justifyContent: 'center' }}>
                    <Users size={18} /> Manage All Players
                </Link>
            </footer>

            <style jsx>{`
                @media (max-width: 480px) {
                    .hide-mobile { display: none; }
                }
            `}</style>
        </div>
    );
}
