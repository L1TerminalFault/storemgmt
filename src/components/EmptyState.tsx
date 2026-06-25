import type { ReactNode } from "react";

type EmptyStateProps = {
	title: string;
	message?: string;
	action?: ReactNode;
};

export default function EmptyState({ title, message, action }: EmptyStateProps) {
	return (
		<div className="w-full p-8 text-center border border-dashed border-theme-border rounded-2xl flex flex-col items-center gap-3">
			<p className="font-semibold text-theme-text/70">{title}</p>
			{message && <p className="text-sm text-theme-text/50 max-w-md">{message}</p>}
			{action}
		</div>
	);
}
