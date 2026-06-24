type ClerkUser = {
	id: string;
	publicMetadata?: Record<string, unknown>;
};

export const isAdmin = (user?: ClerkUser | null) => {
	if (!user?.id) return false;

	const metadata = user.publicMetadata as {
		adminClerkId?: string;
		role?: string;
	};

	if (metadata?.role === "Sales") return false;
	if (metadata?.adminClerkId && metadata.adminClerkId !== user.id) return false;

	return true;
};
