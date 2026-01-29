import type { ReactNode } from "react";

export interface TabItem {
	id: string;
	label: string;
	panel: ReactNode;
}

export interface TabsProps {
	items: TabItem[];
	activeId: string;
	onChange: (id: string) => void;
	/** Optional aria-label for the tablist */
	"aria-label"?: string;
}

export function Tabs({ items, activeId, onChange, "aria-label": ariaLabel = "Tabs" }: TabsProps) {
	return (
		<div>
			<div
				role="tablist"
				aria-label={ariaLabel}
				className="flex flex-wrap gap-2 p-1 rounded-xl bg-white dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 shadow-sm"
			>
				{items.map((item, _index) => {
					const isActive = activeId === item.id;
					return (
						<button
							key={item.id}
							type="button"
							role="tab"
							aria-selected={isActive}
							aria-controls={`tabpanel-${item.id}`}
							id={`tab-${item.id}`}
							tabIndex={isActive ? 0 : -1}
							onClick={() => onChange(item.id)}
							className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 ${
								isActive
									? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 shadow-sm"
									: "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700/50"
							}`}
						>
							{item.label}
						</button>
					);
				})}
			</div>
			{items.map((item) => (
				<div
					key={item.id}
					id={`tabpanel-${item.id}`}
					role="tabpanel"
					aria-labelledby={`tab-${item.id}`}
					hidden={activeId !== item.id}
					className="min-h-[40vh]"
				>
					{activeId === item.id ? item.panel : null}
				</div>
			))}
		</div>
	);
}
