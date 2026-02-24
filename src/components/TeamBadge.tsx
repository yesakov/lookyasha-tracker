"use client";

import { Shield } from "lucide-react";

interface TeamBadgeProps {
    badgeType: string;
    badgeValue: string;
    size?: number;
}

const Crest = ({ primary, secondary, pattern, size, icon }: { primary: string, secondary: string, pattern?: string, size: number, icon?: string }) => {
    return (
        <svg viewBox="0 0 100 100" width={size} height={size}>
            {/* Shape: Shield-like or Circular crest */}
            <circle cx="50" cy="50" r="45" fill={primary} stroke="rgba(0,0,0,0.1)" strokeWidth="2" />

            {/* Patterns */}
            {pattern === 'stripes' && (
                <>
                    <rect x="25" y="10" width="10" height="80" fill={secondary} />
                    <rect x="45" y="10" width="10" height="80" fill={secondary} />
                    <rect x="65" y="10" width="10" height="80" fill={secondary} />
                </>
            )}
            {pattern === 'hoops' && (
                <>
                    <rect x="10" y="30" width="80" height="10" fill={secondary} />
                    <rect x="10" y="50" width="80" height="10" fill={secondary} />
                    <rect x="10" y="70" width="80" height="10" fill={secondary} />
                </>
            )}
            {pattern === 'center-stripe' && (
                <rect x="35" y="10" width="30" height="80" fill={secondary} />
            )}
            {pattern === 'diagonal' && (
                <path d="M20 20 L80 80 L85 75 L25 15 Z" fill={secondary} />
            )}
            {pattern === 'quarters' && (
                <>
                    <rect x="50" y="10" width="40" height="40" fill={secondary} />
                    <rect x="10" y="50" width="40" height="40" fill={secondary} />
                </>
            )}

            {/* Icons / Identifiers */}
            {icon === 'crown' && (
                <path d="M35 60 L30 40 L40 50 L50 35 L60 50 L70 40 L65 60 Z" fill={secondary} />
            )}
            {icon === 'cannon' && (
                <path d="M30 55 L70 55 L70 45 L50 45 L50 40 L40 40 L40 45 Z M35 60 A5 5 0 1 0 45 60 A5 5 0 1 0 35 60" fill={secondary} />
            )}
            {icon === 'bird' && (
                <path d="M45 35 Q50 25 55 35 Q65 40 50 65 Q35 40 45 35" fill={secondary} />
            )}
            {icon === 'ship' && (
                <path d="M30 45 Q50 35 70 45 L70 55 Q50 65 30 55 Z M50 35 L50 25" fill={secondary} stroke={secondary} strokeWidth="2" />
            )}
            {icon === 'diamond' && (
                <path d="M50 30 L65 50 L50 70 L35 50 Z" fill={secondary} stroke="white" strokeWidth="1" />
            )}
            {icon === 'castle' && (
                <rect x="40" y="40" width="20" height="20" fill={secondary} />
            )}
            {icon === 'star' && (
                <path d="M50 30 L55 45 L70 45 L58 55 L62 70 L50 60 L38 70 L42 55 L30 45 L45 45 Z" fill={secondary} />
            )}
            {icon && icon.length === 1 && (
                <text x="50" y="65" fontSize="40" fontWeight="900" fill={secondary} textAnchor="middle" style={{ fontFamily: 'sans-serif' }}>{icon}</text>
            )}

            {/* Inner Ring */}
            <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="4" />
            <circle cx="50" cy="50" r="38" fill="none" stroke="rgba(0,0,0,0.1)" strokeWidth="1" />
        </svg>
    );
};

export const CLUB_CONFIGS: Record<string, { primary: string, secondary: string, pattern?: string, icon?: string }> = {
    "Real Madrid": { primary: "#ffffff", secondary: "#f1c40f", pattern: "diagonal", icon: "crown" },
    "Barcelona": { primary: "#a50044", secondary: "#004d98", pattern: "stripes" },
    "Man City": { primary: "#6cabdd", secondary: "#ffffff", pattern: "none", icon: "ship" },
    "Liverpool": { primary: "#c8102e", secondary: "#ffffff", pattern: "none", icon: "bird" },
    "Arsenal": { primary: "#ef0107", secondary: "#ffffff", pattern: "none", icon: "cannon" },
    "Bayern": { primary: "#dc052d", secondary: "#ffffff", pattern: "none", icon: "diamond" },
    "PSG": { primary: "#004170", secondary: "#da291c", pattern: "center-stripe", icon: "P" },
    "AC Milan": { primary: "#fb090b", secondary: "#000000", pattern: "stripes" },
    "Juventus": { primary: "#ffffff", secondary: "#000000", pattern: "stripes" },
    "Inter": { primary: "#0062ab", secondary: "#000000", pattern: "stripes" },
    "Dynamo Kyiv": { primary: "#ffffff", secondary: "#005ba9", pattern: "none", icon: "D" },
    "Shakhtar Donetsk": { primary: "#ff6600", secondary: "#000000", pattern: "stripes" },
    "Man Utd": { primary: "#da291c", secondary: "#ffffff", pattern: "none", icon: "ship" },
    "Chelsea": { primary: "#034694", secondary: "#ffffff", pattern: "none", icon: "C" },
    "Tottenham": { primary: "#ffffff", secondary: "#132257", pattern: "none", icon: "bird" },
    "Newcastle": { primary: "#000000", secondary: "#ffffff", pattern: "stripes" },
    "Aston Villa": { primary: "#95bfe5", secondary: "#670e36", pattern: "none", icon: "bird" },
    "Atletico Madrid": { primary: "#cb3524", secondary: "#ffffff", pattern: "stripes" },
    "Sevilla": { primary: "#ffffff", secondary: "#cb3524", pattern: "none", icon: "S" },
    "Valencia": { primary: "#ffffff", secondary: "#000000", pattern: "none", icon: "bird" },
    "Dortmund": { primary: "#fde100", secondary: "#000000", pattern: "none", icon: "B" },
    "Leverkusen": { primary: "#e32219", secondary: "#000000", pattern: "none", icon: "L" },
    "Roma": { primary: "#8e1f2f", secondary: "#f0bc42", pattern: "none", icon: "R" },
    "Napoli": { primary: "#12a0d7", secondary: "#ffffff", pattern: "none", icon: "N" },
    "Lazio": { primary: "#87d3f8", secondary: "#ffffff", pattern: "none", icon: "bird" },
    "Benfica": { primary: "#e30613", secondary: "#ffffff", pattern: "none", icon: "B" },
    "Porto": { primary: "#005ca9", secondary: "#ffffff", pattern: "stripes" },
    "Ajax": { primary: "#ffffff", secondary: "#d2122e", pattern: "center-stripe", icon: "A" },
    "Sporting CP": { primary: "#00805c", secondary: "#ffffff", pattern: "hoops", icon: "S" },
    "Galatasaray": { primary: "#a92231", secondary: "#fdb912", pattern: "center-stripe", icon: "G" },
    "Fenerbahce": { primary: "#002b5c", secondary: "#fde100", pattern: "stripes" },
};

export default function TeamBadge({ badgeType, badgeValue, size = 32 }: TeamBadgeProps) {
    const isColor = badgeType === "color";

    return (
        <div
            style={{
                width: size,
                height: size,
                borderRadius: "50%",
                backgroundColor: "var(--secondary)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "2px solid var(--border)",
                overflow: "hidden",
                position: "relative",
                flexShrink: 0
            }}
        >
            {badgeType === "club" ? (
                <Crest
                    primary={CLUB_CONFIGS[badgeValue]?.primary || "#eee"}
                    secondary={CLUB_CONFIGS[badgeValue]?.secondary || "#333"}
                    pattern={CLUB_CONFIGS[badgeValue]?.pattern}
                    icon={CLUB_CONFIGS[badgeValue]?.icon}
                    size={size * 0.9}
                />
            ) : isColor ? (
                <div style={{ backgroundColor: badgeValue, width: '100%', height: '100%' }} />
            ) : (
                <Shield size={size * 0.6} color="var(--accent)" />
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
