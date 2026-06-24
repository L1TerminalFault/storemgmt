// Re-export test data from JSON for any remaining client-side usage
import data from "./testData.json";

export const suppliers = data.suppliers;
export const notifications = data.notifications;
export const products = data.products;
export const stores = data.stores;
export const customers = data.customers;
export const transactions = data.transactions;
export const purchases = data.purchases;

// Helper to mock a delayed fetch response
export async function fetchMockData<T>(data: T, ms: number = 800): Promise<T> {
	return new Promise((resolve) => setTimeout(() => resolve(data), ms));
}
