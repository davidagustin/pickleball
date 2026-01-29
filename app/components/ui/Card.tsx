import type { HTMLAttributes } from "react";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
	/** Slightly elevated shadow */
	elevated?: boolean;
}

export function Card({ elevated = false, className = "", children, ...props }: CardProps) {
	return (
		<div
			className={`rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden ${elevated ? "shadow-md" : "shadow-sm"} ${className}`}
			{...props}
		>
			{children}
		</div>
	);
}
