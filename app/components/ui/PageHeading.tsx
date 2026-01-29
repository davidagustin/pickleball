import type { HTMLAttributes } from "react";

export interface PageHeadingProps extends HTMLAttributes<HTMLDivElement> {
	title: string;
	description?: string;
	/** Optional actions (e.g. links, buttons) on the right */
	actions?: React.ReactNode;
}

export function PageHeading({
	title,
	description,
	actions,
	className = "",
	...props
}: PageHeadingProps) {
	return (
		<div
			className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-6 ${className}`}
			{...props}
		>
			<div>
				<h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">{title}</h1>
				{description && <p className="mt-1 text-gray-600 dark:text-gray-400">{description}</p>}
			</div>
			{actions && <div className="flex flex-wrap gap-2 shrink-0">{actions}</div>}
		</div>
	);
}
