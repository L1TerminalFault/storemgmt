import { NextResponse } from "next/server";
import { getEffectiveAdminId } from "../../../lib/auth-util";
import * as dev from "../../../lib/devData";

const isDev = process.env.NODE_ENV === "development";

export async function GET(req: Request) {
	const adminData = await getEffectiveAdminId();
	if (!adminData) return NextResponse.json([]);

	const { searchParams } = new URL(req.url);
	const storeId = searchParams.get("storeId");

	if (isDev) {
		return NextResponse.json(dev.getAll("customers"));
	}
	const { dbConnect, Customer } = await import("../../../db/model");
	await dbConnect();
	try {
		const query: any = { clerkId: adminData.clerkId };
		// If the user has a restricted storeId OR if the client requested a specific store
		if (adminData.storeId) query.storeId = adminData.storeId;
		else if (storeId) query.storeId = storeId;
		const data = await Customer.find(query);
		return NextResponse.json(data);
	} catch {
		return NextResponse.json({ error: "Failed to fetch customers" }, { status: 500 });
	}
}

export async function POST(req: Request) {
	const adminData = await getEffectiveAdminId();
	if (!adminData) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	const body = await req.json();
	body.clerkId = adminData.clerkId;
	if (isDev) {
		return NextResponse.json(dev.create("customers", body), { status: 201 });
	}
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
	const adminData = await getEffectiveAdminId();
	if (!adminData) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	const body = await req.json();
	const { _id, ...updates } = body;
	if (!_id) return NextResponse.json({ error: "Missing _id" }, { status: 400 });
	if (isDev) {
		const updated = dev.update("customers", _id, updates);
		if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
		return NextResponse.json(updated);
	}
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
	const adminData = await getEffectiveAdminId();
	if (!adminData) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	const { searchParams } = new URL(req.url);
	const id = searchParams.get("id");
	if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
	if (isDev) {
		const removed = dev.remove("customers", id);
		if (!removed) return NextResponse.json({ error: "Not found" }, { status: 404 });
		return NextResponse.json({ success: true });
	}
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
