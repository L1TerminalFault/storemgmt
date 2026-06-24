import { create } from "zustand";
import type { SupplierType, StoreType, TransactionType, NotificationType, PurchaseType, ProductType, CustomerType } from "./types";

export const useStoreStore = create(
	(
		set,
	): {
		store: StoreType | null | undefined;
		availableStores: StoreType[] | undefined;
		setStore: (value: StoreType | null | undefined) => void;
		setAvailableStores: (value: StoreType[] | undefined) => void;
		suppliers: SupplierType[] | undefined;
		setSuppliers: (value: SupplierType[] | undefined) => void;
		notifications: NotificationType[] | undefined;
		setNotifications: (value: NotificationType[] | undefined) => void;

		// INFO: Admin use only
		products: ProductType[] | undefined;
		setProducts: (value: ProductType[] | undefined) => void;

		transactions: TransactionType[] | undefined;
		setTransactions: (value: TransactionType[] | undefined) => void;
		purchases: PurchaseType[] | undefined;
		setPurchases: (value: PurchaseType[] | undefined) => void;
		customers: CustomerType[] | undefined;
		setCustomers: (value: CustomerType[] | undefined) => void;
	} => ({
		store: undefined,
		availableStores: undefined,
		setStore: (value: StoreType | null | undefined) => set(() => ({ store: value })),
		setAvailableStores: (value: StoreType[] | undefined) => set(() => ({ availableStores: value })),
		suppliers: undefined,
		setSuppliers: (value: SupplierType[] | undefined) => set(() => ({ suppliers: value })),
		notifications: undefined,
		setNotifications: (value: NotificationType[] | undefined) => set(() => ({ notifications: value })),
		products: undefined,
		setProducts: (value: ProductType[] | undefined) => set(() => ({ products: value })),
		transactions: undefined,
		setTransactions: (value: TransactionType[] | undefined) => set(() => ({ transactions: value })),
		purchases: undefined,
		setPurchases: (value: PurchaseType[] | undefined) => set(() => ({ purchases: value })),
		customers: undefined,
		setCustomers: (value: CustomerType[] | undefined) => set(() => ({ customers: value })),
	}),
);
