import { NextResponse } from "next/server";
import { getEffectiveAdminId } from "../../../lib/auth-util";
import * as dev from "../../../lib/devData";

const isDev = process.env.NODE_ENV === "development";

export async function GET() {
	if (isDev) {
		return NextResponse.json(dev.getAll("customers"));
	}
	const adminData = await getEffectiveAdminId();
	if (!adminData) return NextResponse.json([]);
	const { dbConnect, Customer } = await import("../../../db/model");
	await dbConnect();
	try {
		const query: any = { clerkId: adminData.clerkId };
		const data = await Customer.find(query);
		return NextResponse.json(data);
	} catch {
		return NextResponse.json({ error: "Failed to fetch customers" }, { status: 500 });
	}
}

export async function POST(req: Request) {
	const body = await req.json();
	if (isDev) {
		body.clerkId = "dev-user";
		return NextResponse.json(dev.create("customers", body), { status: 201 });
	}
	const adminData = await getEffectiveAdminId();
	if (!adminData) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	body.clerkId = adminData.clerkId;
	const { dbConnect, Customer } = await import("../../../db/model");
	await dbConnect();
	try {
		const newData = await Customer.create(body);
		return NextResponse.json(newData, { status: 201 });
	} catch {
		return NextResponse.json({ error: "Failed to create customer" }, { status: 500 });
	}
}

export async function PUT(req: Request) {
	const body = await req.json();
	const { _id, ...updates } = body;
	if (!_id) return NextResponse.json({ error: "Missing _id" }, { status: 400 });
	if (isDev) {
		const updated = dev.update("customers", _id, updates);
		if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
		return NextResponse.json(updated);
	}
	const adminData = await getEffectiveAdminId();
	if (!adminData) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	if (adminData.role !== "Admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
	const { dbConnect, Customer } = await import("../../../db/model");
	await dbConnect();
	try {
		const updated = await Customer.findOneAndUpdate({ _id, clerkId: adminData.clerkId }, updates, { new: true });
		if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
		return NextResponse.json(updated);
	} catch {
		return NextResponse.json({ error: "Failed to update customer" }, { status: 500 });
	}
}

export async function DELETE(req: Request) {
	const { searchParams } = new URL(req.url);
	const id = searchParams.get("id");
	if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
	if (isDev) {
		const removed = dev.remove("customers", id);
		if (!removed) return NextResponse.json({ error: "Not found" }, { status: 404 });
		return NextResponse.json({ success: true });
	}
	const adminData = await getEffectiveAdminId();
	if (!adminData) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	if (adminData.role !== "Admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
	const { dbConnect, Customer } = await import("../../../db/model");
	await dbConnect();
	try {
		const deleted = await Customer.findOneAndDelete({ _id: id, clerkId: adminData.clerkId });
		if (!deleted) return NextResponse.json({ error: "Not found" }, { status: 404 });
		return NextResponse.json({ success: true });
	} catch {
		return NextResponse.json({ error: "Failed to delete customer" }, { status: 500 });
	}
}
