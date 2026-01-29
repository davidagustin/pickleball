import { Link } from "react-router";

export interface NavLinkProps {
	to: string;
	label: string;
	icon?: React.ReactNode;
	/** Whether this link is the current page */
	isActive: boolean;
	/** Optional class for the wrapper */
	className?: string;
	/** Show label on desktop only (icon always) */
	labelHiddenOnMobile?: boolean;
}

export function NavLink({
	to,
	label,
	icon,
	isActive,
	className = "",
	labelHiddenOnMobile = false,
}: NavLinkProps) {
	return (
		<Link
			to={to}
			className={`flex flex-col sm:flex-row items-center gap-0.5 sm:gap-2 px-2 sm:px-3 py-2 rounded-lg min-w-[48px] sm:min-w-[72px] transition-colors shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 ${
				isActive
					? "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20"
					: "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
			} ${className}`}
			title={label}
			aria-current={isActive ? "page" : undefined}
		>
			{icon}
			{labelHiddenOnMobile ? (
				<span className="hidden lg:inline text-sm font-medium truncate">{label}</span>
			) : (
				<span className="text-sm font-medium truncate">{label}</span>
			)}
		</Link>
	);
}
