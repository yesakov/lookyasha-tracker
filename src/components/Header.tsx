"use client";

import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";

interface HeaderProps {
    title: string;
    subtitle?: string;
    backPath?: string;
    children?: React.ReactNode;
    titleIcon?: string;
}

export function Header({ title, subtitle, backPath, children, titleIcon = "⚽" }: HeaderProps) {
    return (
        <header className="flex-between" style={{ marginBottom: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                {backPath && (
                    <Link href={backPath} className="btn btn-secondary" style={{ padding: '0.5rem' }}>
                        <ChevronLeft size={20} />
                    </Link>
                )}
                <div>
                    <h1 style={{ color: 'var(--accent)', fontSize: backPath ? '1.5rem' : '2rem' }}>
                        {titleIcon} {title}
                    </h1>
                    {subtitle && <p style={{ color: 'var(--muted-foreground)' }}>{subtitle}</p>}
                </div>
            </div>
            <div className="flex-between" style={{ gap: '0.5rem' }}>
                <ThemeToggle />
                {children}
            </div>
        </header>
    );
}
