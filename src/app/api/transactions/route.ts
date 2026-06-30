import { NextResponse } from "next/server";
import { getEffectiveAdminId } from "../../../lib/auth-util";
import * as dev from "../../../lib/devData";

const isDev = process.env.NODE_ENV === "development";

export async function GET(req: Request) {
	const { searchParams } = new URL(req.url);
	const storeId = searchParams.get("storeId");

	if (isDev) {
		const transactions = dev.getAll("transactions");
		return NextResponse.json(storeId ? transactions.filter((tx: any) => tx.storeId === storeId) : transactions);
	}
	const adminData = await getEffectiveAdminId();
	if (!adminData) return NextResponse.json([]);
	const { dbConnect, Transaction } = await import("../../../db/model");
	await dbConnect();
	try {
		const query: any = { clerkId: adminData.clerkId };
		// If the user has a restricted storeId OR if the client requested a specific store
		if (adminData.storeId) query.storeId = adminData.storeId;
		else if (storeId) query.storeId = storeId;
		const data = await Transaction.find(query);
		return NextResponse.json(data);
	} catch {
		return NextResponse.json({ error: "Failed to fetch transactions" }, { status: 500 });
	}
}

export async function POST(req: Request) {
	const body = await req.json();
	if (!isDev) {
		body.clerkId = "dev-user";
		const { applyTransactionToInventory } = await import("../../../lib/transaction-util");
		const store = dev.getById("stores", body.storeId);
		if (store) {
			const { isOutOfStore, inventory } = applyTransactionToInventory(
				store.inventory || [],
				body.products || [],
			);
			body.isOutOfStore = isOutOfStore;
			dev.update("stores", body.storeId, { inventory });
		} else {
			body.isOutOfStore = true;
		}
		return NextResponse.json(dev.create("transactions", body), { status: 201 });
	}
	const adminData = await getEffectiveAdminId();
	if (!adminData) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	body.clerkId = adminData.clerkId;
	if (adminData.storeId) body.storeId = adminData.storeId;

	const { applyTransactionToInventory } = await import("../../../lib/transaction-util");

	const { dbConnect, Transaction, Store } = await import("../../../db/model");
	await dbConnect();
	try {
		const store = await Store.findById(body.storeId);
		if (!store) {
			return NextResponse.json({ error: "Store not found" }, { status: 404 });
		}

		const { isOutOfStore, inventory } = applyTransactionToInventory(
			store.inventory,
			body.products || [],
		);
		body.isOutOfStore = isOutOfStore;
		store.inventory = inventory;
		console.log("updated store: ", store);
		await store.save();

		console.log("failing body: ", body);
		const newData = await Transaction.create(body);
		console.log("the new transaction: ", newData);
		return NextResponse.json(newData, { status: 201 });
	} catch (e) {
		console.log("Transaction Error: POST: ", e);
		return NextResponse.json({ error: "Failed to create transaction" }, { status: 500 });
	}
}

export async function PUT(req: Request) {
	const body = await req.json();
	const { _id, ...updates } = body;
	if (!_id) return NextResponse.json({ error: "Missing _id" }, { status: 400 });
	if (isDev) {
		const updated = dev.update("transactions", _id, updates);
		if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
		return NextResponse.json(updated);
	}
	const adminData = await getEffectiveAdminId();
	if (!adminData) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	if (adminData.role !== "Admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
	const { dbConnect, Transaction } = await import("../../../db/model");
	await dbConnect();
	try {
		const updated = await Transaction.findOneAndUpdate({ _id, clerkId: adminData.clerkId }, updates, { new: true });
		if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
		return NextResponse.json(updated);
	} catch {
		return NextResponse.json({ error: "Failed to update transaction" }, { status: 500 });
	}
}

export async function DELETE(req: Request) {
	const { searchParams } = new URL(req.url);
	const id = searchParams.get("id");
	if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
	if (isDev) {
		const removed = dev.remove("transactions", id);
		if (!removed) return NextResponse.json({ error: "Not found" }, { status: 404 });
		return NextResponse.json({ success: true });
	}
	const adminData = await getEffectiveAdminId();
	if (!adminData) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	if (adminData.role !== "Admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
	const { dbConnect, Transaction } = await import("../../../db/model");
	await dbConnect();
	try {
		const deleted = await Transaction.findOneAndDelete({ _id: id, clerkId: adminData.clerkId });
		if (!deleted) return NextResponse.json({ error: "Not found" }, { status: 404 });
		return NextResponse.json({ success: true });
	} catch {
		return NextResponse.json({ error: "Failed to delete transaction" }, { status: 500 });
	}
}
