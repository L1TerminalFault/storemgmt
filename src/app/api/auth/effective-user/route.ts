import { NextResponse } from "next/server";
import { getEffectiveAdminId } from "@/lib/auth-util";

const isDev = process.env.NODE_ENV === "development";

export async function GET() {
	if (isDev) {
		return NextResponse.json({
			userId: "dev-user",
			clerkId: "dev-user",
			storeId: process.env.DEV_STORE_ID || null,
			role: process.env.DEV_USER_ROLE === "Sales" ? "Sales" : "Admin",
		});
	}

	const adminData = await getEffectiveAdminId();

	if (!adminData) {
		return NextResponse.json({ role: "Sales" });
	}

	return NextResponse.json({
		userId: adminData.userId,
		clerkId: adminData.clerkId,
		storeId: adminData.storeId,
		firstName: adminData.firstName,
		role: adminData.role,
	});
}
