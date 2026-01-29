import { useEffect } from "react";

export interface ModalProps {
	/** Whether the modal is open */
	open: boolean;
	/** Called when user requests close (e.g. overlay click, Escape) */
	onClose: () => void;
	/** Accessible title (for aria-labelledby or sr-only) */
	title: string;
	children: React.ReactNode;
}

export function Modal({ open, onClose, title, children }: ModalProps) {
	useEffect(() => {
		if (!open) return;
		const handleEscape = (e: KeyboardEvent) => {
			if (e.key === "Escape") onClose();
		};
		document.addEventListener("keydown", handleEscape);
		document.body.style.overflow = "hidden";
		return () => {
			document.removeEventListener("keydown", handleEscape);
			document.body.style.overflow = "";
		};
	}, [open, onClose]);

	if (!open) return null;

	return (
		<div
			className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in-up"
			role="dialog"
			aria-modal="true"
			aria-labelledby="modal-title"
			onClick={(e) => e.target === e.currentTarget && onClose()}
			onKeyDown={(e) => e.key === "Escape" && onClose()}
		>
			<div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-8 relative animate-fade-in-up">
				<h2 id="modal-title" className="sr-only">
					{title}
				</h2>
				<button
					type="button"
					onClick={onClose}
					className="absolute top-4 right-4 p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
					aria-label="Close"
				>
					<svg
						className="w-6 h-6"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
						aria-hidden
					>
						<title>Close</title>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M6 18L18 6M6 6l12 12"
						/>
					</svg>
				</button>
				{children}
			</div>
		</div>
	);
}
