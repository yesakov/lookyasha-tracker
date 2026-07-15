"use client";

import { useQuery } from "convex/react";
import { api } from "convex/_generated/api";
import { Header } from "@/components/Header";
import PlayerAvatar from "@/components/PlayerAvatar";
import { CalendarRange, ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";

type PlayerStat = {
    playerId: string;
    name: string;
    shirtType: string;
    shirtValue: string;
    goals: number;
    assists: number;
    games: number;
};

function averagePerGame(total: number, games: number) {
    if (games === 0) return "0.00";
    return (total / games).toFixed(2);
}

const MONTH_FORMATTER = new Intl.DateTimeFormat("en", { month: "long", year: "numeric" });
const WEEKDAYS = ["M", "T", "W", "T", "F", "S", "S"];

function toDateValue(date: Date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

function getDateFromValue(value: string) {
    if (!value) return new Date();
    const [year, month, day] = value.split("-").map(Number);
    return new Date(year, month - 1, day);
}

function CalendarPicker({
    label,
    value,
    isOpen,
    onOpen,
    onChange,
}: {
    label: string;
    value: string;
    isOpen: boolean;
    onOpen: () => void;
    onChange: (value: string) => void;
}) {
    const [visibleMonth, setVisibleMonth] = useState(() => {
        const date = getDateFromValue(value);
        return new Date(date.getFullYear(), date.getMonth(), 1);
    });
    const selectedDate = value ? getDateFromValue(value) : null;
    const firstDayOffset = (visibleMonth.getDay() + 6) % 7;
    const daysInMonth = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1, 0).getDate();
    const cells = [
        ...Array.from({ length: firstDayOffset }, () => null),
        ...Array.from({ length: daysInMonth }, (_, index) => index + 1),
    ];

    const moveMonth = (offset: number) => {
        setVisibleMonth((current) => new Date(current.getFullYear(), current.getMonth() + offset, 1));
    };

    return (
        <div className="stack" style={{ gap: '0.5rem', position: 'relative' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--muted-foreground)' }}>{label}</span>
            <button
                type="button"
                className="input flex-between"
                onClick={onOpen}
                style={{ textAlign: 'left', cursor: 'pointer', minHeight: '3rem' }}
            >
                <span style={{ color: value ? 'var(--foreground)' : 'var(--muted-foreground)', fontWeight: 700 }}>
                    {value || 'Select date'}
                </span>
                <CalendarRange size={18} color="var(--accent)" />
            </button>
            {isOpen && (
                <div className="card shadow-2xl" style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 20, padding: '0.75rem', marginTop: '0.4rem', border: '1px solid var(--accent)' }}>
                    <div className="flex-between" style={{ marginBottom: '0.75rem' }}>
                        <button type="button" className="btn btn-secondary" style={{ padding: '0.35rem' }} onClick={() => moveMonth(-1)}>
                            <ChevronLeft size={18} />
                        </button>
                        <strong style={{ fontSize: '0.95rem' }}>{MONTH_FORMATTER.format(visibleMonth)}</strong>
                        <button type="button" className="btn btn-secondary" style={{ padding: '0.35rem' }} onClick={() => moveMonth(1)}>
                            <ChevronRight size={18} />
                        </button>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.25rem', marginBottom: '0.25rem' }}>
                        {WEEKDAYS.map((day, index) => (
                            <div key={`${day}-${index}`} style={{ textAlign: 'center', fontSize: '0.7rem', color: 'var(--muted-foreground)', fontWeight: 800 }}>{day}</div>
                        ))}
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', gap: '0.25rem' }}>
                        {cells.map((day, index) => {
                            const dateValue = day ? toDateValue(new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), day)) : "";
                            const isSelected = selectedDate && day && selectedDate.getFullYear() === visibleMonth.getFullYear() && selectedDate.getMonth() === visibleMonth.getMonth() && selectedDate.getDate() === day;
                            return day ? (
                                <button
                                    key={dateValue}
                                    type="button"
                                    className={`btn ${isSelected ? 'btn-primary' : 'btn-secondary'}`}
                                    style={{ aspectRatio: '1', padding: 0, minWidth: 0, fontSize: '0.85rem' }}
                                    onClick={() => onChange(dateValue)}
                                >
                                    {day}
                                </button>
                            ) : (
                                <div key={`empty-${index}`} />
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}

function StatTable({
    title,
    rows,
    columns,
}: {
    title: string;
    rows: PlayerStat[];
    columns: { label: string; value: (row: PlayerStat) => number | string; highlight?: boolean }[];
}) {
    return (
        <section className="stack">
            <h2 style={{ fontSize: '1.1rem' }}>{title}</h2>
            <div className="card shadow-lg" style={{ padding: '0.25rem', overflowX: 'auto' }}>
                <table className="standings-table stats-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', tableLayout: 'auto' }}>
                    <thead>
                        <tr style={{ borderBottom: '2px solid var(--border)', color: 'var(--muted-foreground)', fontSize: '0.75rem' }}>
                            <th className="standings-cell standings-team-cell stats-player-cell" style={{ padding: '0.65rem 0.5rem' }}>PLAYER</th>
                            {columns.map((column) => (
                                <th key={column.label} className="standings-cell stats-number-cell" style={{ padding: '0.65rem 0.35rem', textAlign: 'center' }}>{column.label}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {rows.length === 0 ? (
                            <tr>
                                <td colSpan={columns.length + 1} style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--muted-foreground)' }}>
                                    No player stats for this period.
                                </td>
                            </tr>
                        ) : rows.map((row, index) => (
                            <tr key={row.playerId} style={{ borderBottom: index === rows.length - 1 ? 'none' : '1px solid var(--border)' }}>
                                <td className="standings-cell standings-team-cell stats-player-cell" style={{ padding: '0.55rem 0.5rem', fontWeight: 800, color: index === 0 ? 'var(--accent)' : 'inherit' }}>
                                    <div className="standings-team-content" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', minWidth: 0 }}>
                                        <PlayerAvatar shirtType={row.shirtType} shirtValue={row.shirtValue} size={20} />
                                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.name}</span>
                                    </div>
                                </td>
                                {columns.map((column) => (
                                    <td
                                        key={column.label}
                                        className="standings-cell standings-points-value"
                                        style={{
                                            padding: '0.55rem 0.35rem',
                                            textAlign: 'center',
                                            color: column.highlight ? 'var(--accent)' : 'inherit',
                                            fontWeight: column.highlight ? 800 : 600,
                                            fontSize: column.highlight ? '1.1rem' : 'inherit',
                                        }}
                                    >
                                        {column.value(row)}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </section>
    );
}

export default function StatsPage() {
    const [draftStartDate, setDraftStartDate] = useState("");
    const [draftEndDate, setDraftEndDate] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [openPicker, setOpenPicker] = useState<"start" | "end" | null>(null);
    const stats = useQuery(api.queries.getPlayerStats, {
        startDate: startDate || undefined,
        endDate: endDate || undefined,
    });

    const applyRange = () => {
        setStartDate(draftStartDate);
        setEndDate(draftEndDate);
    };

    const clearRange = () => {
        setDraftStartDate("");
        setDraftEndDate("");
        setStartDate("");
        setEndDate("");
        setOpenPicker(null);
    };

    return (
        <div className="container animate-fade-in">
            <Header title="Player Stats" subtitle="Goals, assists, and games by period" backPath="/" titleIcon="📊" />

            <section className="card stack shadow-lg" style={{ marginBottom: '2rem', border: '1px solid rgba(190, 242, 100, 0.2)' }}>
                <h2 className="flex-between" style={{ gap: '0.5rem', fontSize: '1.1rem', justifyContent: 'flex-start' }}>
                    <CalendarRange size={18} color="var(--accent)" /> Date Range
                </h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                    <CalendarPicker
                        label="FROM"
                        value={draftStartDate}
                        isOpen={openPicker === "start"}
                        onOpen={() => setOpenPicker(openPicker === "start" ? null : "start")}
                        onChange={(value) => {
                            setDraftStartDate(value);
                            setOpenPicker(null);
                        }}
                    />
                    <CalendarPicker
                        label="TO"
                        value={draftEndDate}
                        isOpen={openPicker === "end"}
                        onOpen={() => setOpenPicker(openPicker === "end" ? null : "end")}
                        onChange={(value) => {
                            setDraftEndDate(value);
                            setOpenPicker(null);
                        }}
                    />
                </div>
                <div className="flex-between" style={{ gap: '1rem', justifyContent: 'flex-start', flexWrap: 'wrap' }}>
                    <button className="btn btn-primary" onClick={applyRange}>
                        Apply Range
                    </button>
                    {(draftStartDate || draftEndDate || startDate || endDate) && (
                        <button className="btn btn-secondary" onClick={clearRange}>
                            Clear Range
                        </button>
                    )}
                    {(startDate || endDate) && (
                        <span style={{ color: 'var(--muted-foreground)', fontSize: '0.85rem', fontWeight: 600 }}>
                            Showing {startDate || 'first event'} to {endDate || 'latest event'}
                        </span>
                    )}
                </div>
            </section>

            {stats === undefined ? (
                <section className="card animate-pulse" style={{ textAlign: 'center', color: 'var(--muted-foreground)' }}>
                    Calculating player stats...
                </section>
            ) : (
                <div className="stack" style={{ gap: '2.5rem' }}>
                    <StatTable
                        title="Goals"
                        rows={stats.goals}
                        columns={[
                            { label: 'GOALS', value: (row) => row.goals, highlight: true },
                            { label: 'GP', value: (row) => row.games },
                        ]}
                    />
                    <StatTable
                        title="Assists"
                        rows={stats.assists}
                        columns={[
                            { label: 'AST', value: (row) => row.assists, highlight: true },
                            { label: 'GP', value: (row) => row.games },
                        ]}
                    />
                    <StatTable
                        title="Goals + Assists"
                        rows={stats.goalContributions}
                        columns={[
                            { label: 'G', value: (row) => row.goals },
                            { label: 'A', value: (row) => row.assists },
                            { label: 'G+A', value: (row) => row.goals + row.assists, highlight: true },
                            { label: 'GP', value: (row) => row.games },
                        ]}
                    />
                    <StatTable
                        title="Games Played"
                        rows={stats.games}
                        columns={[
                            { label: 'GP', value: (row) => row.games, highlight: true },
                            { label: 'G/GP', value: (row) => averagePerGame(row.goals, row.games) },
                            { label: 'A/GP', value: (row) => averagePerGame(row.assists, row.games) },
                        ]}
                    />
                </div>
            )}
        </div>
    );
}
