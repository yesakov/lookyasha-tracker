"use client";

import { User } from "lucide-react";

interface PlayerAvatarProps {
    shirtType: string;
    shirtValue: string;
    size?: number;
}

const Jersey = ({ primary, secondary, pattern, size }: { primary: string, secondary: string, pattern?: string, size: number }) => {
    return (
        <svg viewBox="0 0 100 100" width={size} height={size}>
            {/* Sleeves */}
            <path d="M10 35 L30 25 L35 45 L15 55 Z" fill={pattern === 'sleeves-alt' ? secondary : primary} />
            <path d="M90 35 L70 25 L65 45 L85 55 Z" fill={pattern === 'sleeves-alt' ? secondary : primary} />

            {/* Body */}
            <path d="M30 25 L70 25 L75 85 L25 85 Z" fill={primary} />

            {/* Patterns */}
            {pattern === 'stripes' && (
                <>
                    <rect x="38" y="25" width="8" height="60" fill={secondary} />
                    <rect x="54" y="25" width="8" height="60" fill={secondary} />
                    <path d="M15 32 L25 28 L28 35 L18 40 Z" fill={secondary} opacity="0.6" />
                    <path d="M85 32 L75 28 L72 35 L82 40 Z" fill={secondary} opacity="0.6" />
                </>
            )}
            {pattern === 'hoops' && (
                <>
                    <rect x="25" y="40" width="50" height="8" fill={secondary} />
                    <rect x="25" y="60" width="50" height="8" fill={secondary} />
                </>
            )}
            {pattern === 'center-stripe' && (
                <rect x="42" y="25" width="16" height="60" fill={secondary} />
            )}
            {pattern === 'diagonal' && (
                <path d="M30 25 L70 85 L75 85 L70 25 Z" fill={secondary} />
            )}

            {/* Neck / Collar */}
            <path d="M40 25 Q50 35 60 25" fill="none" stroke="rgba(0,0,0,0.2)" strokeWidth="4" />
            <path d="M40 25 Q50 35 60 25" fill="none" stroke={secondary} strokeWidth="2" opacity="0.8" />
        </svg>
    );
};

const CLUB_CONFIGS: Record<string, { primary: string, secondary: string, pattern?: string }> = {
    "Real Madrid": { primary: "#ffffff", secondary: "#f1c40f", pattern: "none" },
    "Barcelona": { primary: "#a50044", secondary: "#004d98", pattern: "stripes" },
    "Man City": { primary: "#6cabdd", secondary: "#ffffff", pattern: "none" },
    "Liverpool": { primary: "#c8102e", secondary: "#ffffff", pattern: "none" },
    "Arsenal": { primary: "#ef0107", secondary: "#ffffff", pattern: "sleeves-alt" },
    "Bayern": { primary: "#dc052d", secondary: "#ffffff", pattern: "none" },
    "PSG": { primary: "#004170", secondary: "#da291c", pattern: "center-stripe" },
    "AC Milan": { primary: "#fb090b", secondary: "#000000", pattern: "stripes" },
    "Juventus": { primary: "#ffffff", secondary: "#000000", pattern: "stripes" },
    "Inter": { primary: "#0062ab", secondary: "#000000", pattern: "stripes" },
    "Dynamo Kyiv": { primary: "#ffffff", secondary: "#005ba9", pattern: "none" },
    "Shakhtar Donetsk": { primary: "#ff6600", secondary: "#000000", pattern: "stripes" },
    "Man Utd": { primary: "#da291c", secondary: "#ffffff", pattern: "none" },
    "Chelsea": { primary: "#034694", secondary: "#ffffff", pattern: "none" },
    "Tottenham": { primary: "#ffffff", secondary: "#132257", pattern: "none" },
    "Newcastle": { primary: "#000000", secondary: "#ffffff", pattern: "stripes" },
    "Aston Villa": { primary: "#95bfe5", secondary: "#670e36", pattern: "sleeves-alt" },
    "Atletico Madrid": { primary: "#cb3524", secondary: "#ffffff", pattern: "stripes" },
    "Sevilla": { primary: "#ffffff", secondary: "#cb3524", pattern: "none" },
    "Valencia": { primary: "#ffffff", secondary: "#000000", pattern: "none" },
    "Dortmund": { primary: "#fde100", secondary: "#000000", pattern: "none" },
    "Leverkusen": { primary: "#e32219", secondary: "#000000", pattern: "none" },
    "Roma": { primary: "#8e1f2f", secondary: "#f0bc42", pattern: "none" },
    "Napoli": { primary: "#12a0d7", secondary: "#ffffff", pattern: "none" },
    "Lazio": { primary: "#87d3f8", secondary: "#ffffff", pattern: "none" },
    "Benfica": { primary: "#e30613", secondary: "#ffffff", pattern: "none" },
    "Porto": { primary: "#005ca9", secondary: "#ffffff", pattern: "stripes" },
    "Ajax": { primary: "#ffffff", secondary: "#d2122e", pattern: "center-stripe" },
    "Sporting CP": { primary: "#00805c", secondary: "#ffffff", pattern: "hoops" },
    "Galatasaray": { primary: "#a92231", secondary: "#fdb912", pattern: "center-stripe" },
    "Fenerbahce": { primary: "#002b5c", secondary: "#fde100", pattern: "stripes" },
};

export default function PlayerAvatar({ shirtType, shirtValue, size = 32 }: PlayerAvatarProps) {
    const isColor = shirtType === "color";

    return (
        <div
            style={{
                width: size,
                height: size,
                borderRadius: "50%",
                backgroundColor: "var(--secondary)", // Background for all
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "2px solid var(--border)",
                overflow: "hidden",
                position: "relative",
                flexShrink: 0
            }}
        >
            {shirtType === "club" ? (
                <Jersey
                    primary={CLUB_CONFIGS[shirtValue]?.primary || "#eee"}
                    secondary={CLUB_CONFIGS[shirtValue]?.secondary || "#333"}
                    pattern={CLUB_CONFIGS[shirtValue]?.pattern}
                    size={size * 0.9}
                />
            ) : isColor ? (
                <div style={{ backgroundColor: shirtValue, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <User size={size * 0.6} color="rgba(0,0,0,0.3)" />
                </div>
            ) : (
                <span style={{ fontSize: size * 0.4, fontWeight: 800, color: "var(--accent)" }}>
                    {shirtValue.substring(0, 2).toUpperCase()}
                </span>
            )}

            {/* Light effect */}
            <div style={{
                position: "absolute",
                top: 0, left: 0, right: 0, height: "100%",
                background: "linear-gradient(135deg, rgba(255,255,255,0.1), transparent 50%)",
                pointerEvents: "none"
            }} />
        </div>
    );
}
