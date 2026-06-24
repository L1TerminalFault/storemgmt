// In-memory CRUD helper for development mode
// Loads testData.json once and serves all collections mutably

import seedData from "./testData.json";

type Collection =
	| "suppliers"
	| "notifications"
	| "products"
	| "stores"
	| "customers"
	| "transactions"
	| "purchases";

// Deep clone seed data so mutations don't affect the import cache
const db: Record<Collection, any[]> = JSON.parse(JSON.stringify(seedData));

let idCounter = 1000;
function nextId() {
	return String(++idCounter);
}

export function getAll(collection: Collection): any[] {
	return db[collection] ?? [];
}

export function getById(collection: Collection, id: string): any | null {
	return db[collection]?.find((item: any) => item._id === id) ?? null;
}

export function create(collection: Collection, body: any): any {
	const item = { _id: nextId(), ...body, createdAt: new Date().toISOString() };
	db[collection].push(item);
	return item;
}

export function update(
	collection: Collection,
	id: string,
	body: any,
): any | null {
	const arr = db[collection];
	const idx = arr.findIndex((item: any) => item._id === id);
	if (idx === -1) return null;
	arr[idx] = { ...arr[idx], ...body };
	return arr[idx];
}

export function remove(collection: Collection, id: string): boolean {
	const arr = db[collection];
	const idx = arr.findIndex((item: any) => item._id === id);
	if (idx === -1) return false;
	arr.splice(idx, 1);
	return true;
}
