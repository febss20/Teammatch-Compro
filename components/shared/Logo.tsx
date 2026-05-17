import React from "react";

interface LogoProps extends React.SVGProps<SVGSVGElement> {
    className?: string;
}

export function LogoIcon({ className, ...props }: LogoProps) {
    return (
        <svg
            width="48"
            height="48"
            viewBox="0 0 48 48"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={`shrink-0 ${className || ""}`}
            {...props}
        >
            <g className="origin-center">
                <rect x="18" y="18" width="26" height="26" rx="6" fill="var(--tm-line)" />
                <rect
                    x="15"
                    y="15"
                    width="26"
                    height="26"
                    rx="6"
                    fill="var(--tm-accent-3)"
                    stroke="var(--tm-line)"
                    strokeWidth="3"
                />

                <rect x="6" y="6" width="26" height="26" rx="6" fill="var(--tm-line)" />
                <rect
                    x="3"
                    y="3"
                    width="26"
                    height="26"
                    rx="6"
                    fill="var(--tm-accent-2)"
                    stroke="var(--tm-line)"
                    strokeWidth="3"
                />

                <circle cx="36" cy="12" r="9" fill="var(--tm-line)" />
                <circle cx="34" cy="10" r="9" fill="var(--tm-accent)" stroke="var(--tm-line)" strokeWidth="3" />
            </g>
        </svg>
    );
}

interface FullLogoProps {
    className?: string;
    showText?: boolean;
    textClassName?: string;
}

export function Logo({ className = "", showText = true, textClassName = "" }: FullLogoProps) {
    return (
        <div className={`group flex items-center gap-3 ${className}`}>
            <LogoIcon className="h-9 w-9 transition-transform duration-300 ease-out group-hover:-rotate-6 group-hover:scale-110 md:h-10 md:w-10" />
            {showText && (
                <span
                    className={`display-font pt-1 text-2xl leading-none tracking-wide text-[var(--tm-line)] md:text-3xl ${textClassName}`}
                >
                    TeamMatch
                </span>
            )}
        </div>
    );
}
