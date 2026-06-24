import { NextResponse } from "next/server";
import { clerkClient } from "@clerk/nextjs/server";
import {
	requireAdmin,
	getStaffAssignments,
	saveStaffAssignments,
	type StaffAssignment,
	type UserMetadata,
} from "@/lib/auth-util";

export async function GET() {
	const adminData = await requireAdmin();
	if (!adminData) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const assignments = await getStaffAssignments(adminData.userId);
	return NextResponse.json(assignments);
}

export async function POST(req: Request) {
	const adminData = await requireAdmin();
	if (!adminData) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const { email, storeId } = await req.json();
	if (!email || !storeId) {
		return NextResponse.json({ error: "Email and storeId are required" }, { status: 400 });
	}

	const client = await clerkClient();
	const users = await client.users.getUserList({ emailAddress: [email] });

	if (users.data.length === 0) {
		return NextResponse.json(
			{ error: "User not found. They must sign up with Clerk first." },
			{ status: 404 },
		);
	}

	const targetUser = users.data[0];
	if (targetUser.id === adminData.userId) {
		return NextResponse.json({ error: "Cannot assign yourself as sales staff" }, { status: 400 });
	}

	await client.users.updateUserMetadata(targetUser.id, {
		publicMetadata: {
			adminClerkId: adminData.userId,
			storeId,
			role: "Sales",
		} satisfies UserMetadata,
	});

	const assignments = await getStaffAssignments(adminData.userId);
	const primaryEmail = targetUser.emailAddresses[0]?.emailAddress || email;
	const name = [targetUser.firstName, targetUser.lastName].filter(Boolean).join(" ") || primaryEmail;

	const updated: StaffAssignment[] = [
		...assignments.filter((a) => a.userId !== targetUser.id),
		{ email: primaryEmail, userId: targetUser.id, storeId, name },
	];

	await saveStaffAssignments(adminData.userId, updated);

	return NextResponse.json({ success: true, assignment: updated[updated.length - 1] }, { status: 201 });
}

export async function DELETE(req: Request) {
	const adminData = await requireAdmin();
	if (!adminData) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const { searchParams } = new URL(req.url);
	const userId = searchParams.get("userId");
	if (!userId) {
		return NextResponse.json({ error: "Missing userId" }, { status: 400 });
	}

	const client = await clerkClient();
	const assignments = await getStaffAssignments(adminData.userId);
	const removed = assignments.find((a) => a.userId === userId);
	if (!removed) {
		return NextResponse.json({ error: "Staff member not found" }, { status: 404 });
	}

	await client.users.updateUserMetadata(userId, {
		publicMetadata: {
			adminClerkId: null,
			storeId: null,
			role: null,
		},
	});

	await saveStaffAssignments(
		adminData.userId,
		assignments.filter((a) => a.userId !== userId),
	);

	return NextResponse.json({ success: true });
}
