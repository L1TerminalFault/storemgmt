type StoreProduct = {
	productId: string;
	amount: number;
	approved: boolean;
};

type TransactionProduct = {
	productId: string;
	amount: number;
	unitPrice: number;
	unitBuyingPrice: number;
};

type PaymentStatus = "Paid" | "Partial" | "Unpaid";

// export type NotificationType = {
// 	content: string;
// 	createdAt: string;
// 	__more: string;
// };

export type SupplierType = {
	_id?: string;
	clerkId: string;
	name: string;
	__more: string;
};

export type ProductType = {
	_id?: string;
	clerkId: string;
	type: string;
	name: string;
	unitBuyingPrice: number;
	__more: string;
};

export type StoreType = {
	_id?: string;
	clerkId: string;
	title: string;
	inventory: StoreProduct[];
	__more: string;
};

export type PurchaseType = {
	_id?: string;
	clerkId: string;
	storeId: string;
	supplierId: string;
	products: {
		productId: string;
		amount: number;
		unitBuyingPrice: number;
	}[];
	totalPrice: number;
	paidPrice: number;
	paymentStatus: PaymentStatus;
	shouldBePaidBeforeDate?: string;
	comment?: string;
	createdAt?: string;
	__more?: string;
};

export type TransactionType = {
	_id?: string;
	clerkId: string;
	storeId: string;
	customerId: string;
	products: TransactionProduct[];
	totalPrice: number;
	paidPrice: number;
	paymentStatus: PaymentStatus;
	shouldBePaidBeforeDate?: string;
	isOutOfStore: boolean;
	__more: string;
};

export type CustomerType = {
	_id?: string;
	clerkId: string;
	name: string;
	__more: string;
};
