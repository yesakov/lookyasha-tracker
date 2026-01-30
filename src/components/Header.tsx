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
        <header className="flex-between" style={{ marginBottom: '1.5rem', gap: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0 }}>
                {backPath && (
                    <Link href={backPath} className="btn btn-secondary" style={{ padding: '0.5rem', flexShrink: 0 }}>
                        <ChevronLeft size={20} />
                    </Link>
                )}
                <div style={{ minWidth: 0, overflow: 'hidden' }}>
                    <h1 className={`header-title ${backPath ? 'sub' : 'main'}`} style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {titleIcon} {title}
                    </h1>
                    {subtitle && <p className="header-subtitle" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{subtitle}</p>}
                </div>
            </div>
            <div className="flex-between" style={{ gap: '0.2rem', flexShrink: 0 }}>
                <ThemeToggle />
                {children}
            </div>
        </header>
    );
}
