type InventoryItem = {
	productId: string;
	amount: number;
	approved?: boolean;
};

type TxProduct = {
	productId: string;
	amount: number;
};

export function applyTransactionToInventory(
	inventory: InventoryItem[],
	products: TxProduct[],
): { isOutOfStore: boolean; inventory: InventoryItem[] } {
	let isOutOfStore = false;
	// console.log(products);
	// console.log(inventory);
	const updated = inventory.map((item) => ({ ...item }));
	// console.log("the updated inventory: ", updated);

	for (const p of products) {
		const pid = p.productId; // .toString();
		// console.log("updated data: ", updated.find(i => i.productId == undefined));
		const item = updated.find((i) => i.productId?.toString() === pid);
		const available = item?.amount ?? 0;

		if (p.amount > available) {
			isOutOfStore = true;
		}

		const deduct = Math.min(p.amount, available);
		if (item) {
			item.amount = Math.max(0, item.amount - deduct);
		} else if (p.amount > 0) {
			isOutOfStore = true;
		}
	}

	return { isOutOfStore, inventory: updated };
}
