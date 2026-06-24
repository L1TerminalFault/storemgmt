import { auth, clerkClient } from "@clerk/nextjs/server";

export type UserMetadata = {
	adminClerkId?: string;
	storeId?: string;
	role?: "Admin" | "Sales";
};

export type StaffAssignment = {
	email: string;
	userId: string;
	storeId: string;
	name?: string;
};

export async function getEffectiveAdminId() {
	const { userId } = await auth();
	if (!userId) return null;

	try {
		const client = await clerkClient();
		const user = await client.users.getUser(userId);
		const metadata = user.publicMetadata as UserMetadata;

		return {
			userId,
			clerkId: metadata?.adminClerkId || userId,
			storeId: metadata?.storeId || null,
			role: metadata?.role || (metadata?.adminClerkId && metadata.adminClerkId !== userId ? "Sales" : "Admin"),
		};
	} catch {
		return null;
	}
}

export async function requireAdmin() {
	const adminData = await getEffectiveAdminId();
	if (!adminData) return null;
	if (adminData.role === "Sales") return null;
	return adminData;
}

export async function getStaffAssignments(adminUserId: string): Promise<StaffAssignment[]> {
	const client = await clerkClient();
	const admin = await client.users.getUser(adminUserId);
	const privateMeta = admin.privateMetadata as { staffAssignments?: StaffAssignment[] };
	return privateMeta?.staffAssignments || [];
}

export async function saveStaffAssignments(adminUserId: string, assignments: StaffAssignment[]) {
	const client = await clerkClient();
	await client.users.updateUserMetadata(adminUserId, {
		privateMetadata: { staffAssignments: assignments },
	});
}
