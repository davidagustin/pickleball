import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
	variant?: Variant;
	size?: "sm" | "md" | "lg";
	/** Full width when true */
	block?: boolean;
}

const variantClasses: Record<Variant, string> = {
	primary:
		"bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold shadow-sm hover:from-emerald-500 hover:to-teal-500 focus-visible:ring-emerald-400 disabled:opacity-50",
	secondary:
		"border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-100 dark:hover:bg-gray-800 focus-visible:ring-gray-400 disabled:opacity-50",
	ghost:
		"text-gray-600 dark:text-gray-400 font-medium hover:bg-gray-100 dark:hover:bg-gray-800 focus-visible:ring-gray-400 disabled:opacity-50",
	danger:
		"text-red-600 dark:text-red-400 font-medium hover:bg-red-50 dark:hover:bg-red-900/20 focus-visible:ring-red-400 disabled:opacity-50",
};

const sizeClasses = {
	sm: "px-3 py-1.5 text-sm rounded-lg",
	md: "px-4 py-2.5 text-sm rounded-xl",
	lg: "px-6 py-3 text-base rounded-xl",
};

export function Button({
	variant = "primary",
	size = "md",
	block = false,
	className = "",
	...props
}: ButtonProps) {
	return (
		<button
			type={props.type ?? "button"}
			className={`inline-flex items-center justify-center transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${variantClasses[variant]} ${sizeClasses[size]} ${block ? "w-full" : ""} ${className}`}
			{...props}
		/>
	);
}
