"use client";

import { useEffect, useState } from "react";
import { useStoreStore } from "@/lib/store";
import { motion, AnimatePresence } from "framer-motion";
import { CgSpinner } from "react-icons/cg";
import { GiSoap, GiSpray } from "react-icons/gi";
import {
	FiBox,
	FiPackage,
	FiCheck,
	FiLayers,
	FiShoppingBag,
	FiPlus,
	FiX,
	FiTrash2,
	FiList,
} from "react-icons/fi";
import Link from "next/link";
import type { StoreType } from "@/lib/types";
import { parseApiArray } from "@/lib/api-util";
import EmptyState from "@/components/EmptyState";

import type { PurchaseType } from "@/lib/types";

type Tab = "inventory" | "purchases";

// Maps product type strings to an icon component
function getProductIcon(type: string) {
	const t = type.toLowerCase();
	if (t.includes("soap")) return <GiSoap className="text-lg" />;
	if (t.includes("deodorant") || t.includes("spray"))
		return <GiSpray className="text-lg" />;
	return <FiBox className="text-lg" />;
}

// Returns a color class based on product type for the circle
function getTypeColor(type: string) {
	const t = type.toLowerCase();
	if (t.includes("soap")) return "bg-sky-500/20 text-sky-400";
	if (t.includes("deodorant")) return "bg-violet-500/20 text-violet-400";
	return "bg-amber-500/20 text-amber-400";
}

export default function StorePage() {
	const [activeTab, setActiveTab] = useState<Tab>("inventory");
	const [loading, setLoading] = useState(true);


	const globalProducts = useStoreStore((s) => s.products);
	const setGlobalProducts = useStoreStore((s) => s.setProducts);
	const globalPurchases = useStoreStore((s) => s.purchases);
	const setGlobalPurchases = useStoreStore((s) => s.setPurchases);
	const globalSuppliers = useStoreStore((s) => s.suppliers);
	const setGlobalSuppliers = useStoreStore((s) => s.setSuppliers);
	const effectiveUser = useStoreStore((s) => s.effectiveUser);

	// Local states for UI rendering
	const [localStoresList, setLocalStoresList] = useState<any[] | null>(null);
	const [productsList, setProductsList] = useState<any[] | null>(null);
	const [purchasesList, setPurchasesList] = useState<any[] | null>(null);
	const [suppliersList, setSuppliersList] = useState<any[] | null>(null);

	const globalStore = useStoreStore((s) => s.store);
	const setStore = useStoreStore((s) => s.setStore);

	// Add Purchase Popup State
	const [showAddPurchase, setShowAddPurchase] = useState(false);
	const [selectedSupplier, setSelectedSupplier] = useState("");
	const [purchaseItems, setPurchaseItems] = useState<any[]>([]);
	const [paymentStatus, setPaymentStatus] = useState("Paid");
	const [paidPrice, setPaidPrice] = useState<number>(0);
	const [deadline, setDeadline] = useState("");
	const [purchaseComment, setPurchaseComment] = useState("");
	const [savingPurchase, setSavingPurchase] = useState(false);

	useEffect(() => {
		async function loadData() {
			if (effectiveUser === undefined) return;

			const isAdmin = effectiveUser?.role === "Admin";
			const assignedStoreId = effectiveUser?.storeId || null;
			let pData = globalProducts;
			let purData = globalPurchases;
			let supData = globalSuppliers;

			if (globalStore === undefined || pData === undefined || purData === undefined || supData === undefined) {
				const [sRes, pRes, purRes, supRes] = await Promise.all([
					fetch("/api/stores"),
					fetch("/api/products"),
					fetch("/api/purchases"),
					fetch("/api/suppliers"),
				]);
				const sData = await parseApiArray<StoreType>(sRes);
				pData = await parseApiArray(pRes);
				purData = await parseApiArray(purRes);
				supData = await parseApiArray(supRes);

				const scopedStores = isAdmin
					? sData
					: sData.filter((s) => s._id === assignedStoreId);
				const savedStoreId = isAdmin
					? localStorage.getItem("currentStoreId")
					: assignedStoreId;
				const active =
					(savedStoreId && scopedStores.find((s) => s._id === savedStoreId)) ||
					scopedStores[0] ||
					null;
				setStore(active as StoreType | null);

				setGlobalProducts(pData || []);
				setGlobalPurchases(purData || []);
				setGlobalSuppliers(supData || []);
				
				setLocalStoresList(scopedStores || []);
			} else {
				setLocalStoresList(globalStore ? [globalStore] : []);
			}

			setProductsList(pData || []);
			setPurchasesList(
				isAdmin
					? purData || []
					: (purData || []).filter((p: any) => p.storeId === assignedStoreId),
			);
			setSuppliersList(supData || []);

			// FIX: touched here
			if (supData && supData.length > 0) setSelectedSupplier(supData[0]._id || "");

			setLoading(false);
		}
		loadData();
	}, [globalStore, globalProducts, globalPurchases, globalSuppliers, effectiveUser, setStore, setGlobalProducts, setGlobalPurchases, setGlobalSuppliers]);

	const handleApprove = async (storeId: string, productId: string) => {
		if (effectiveUser?.role !== "Admin") return;
		if (!localStoresList) return;
		// Find the store and update inventory item
		const store = localStoresList.find((s) => s._id === storeId);
		if (!store) return;
		const updatedInventory = store.inventory.map((item: any) =>
			item.productId === productId ? { ...item, approved: true } : item,
		);
		const updatedStore = { ...store, inventory: updatedInventory };

		// Optimistic local update
		const updatedList = localStoresList.map((s) => (s._id === storeId ? updatedStore : s));
		setLocalStoresList(updatedList);
		if (storeId === globalStore?._id) {
			setStore(updatedStore as unknown as StoreType);
		}

		await fetch("/api/stores", {
			method: "PUT",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ _id: storeId, inventory: updatedInventory }),
		});

		const storeRes = await fetch("/api/stores");
		const sData = await parseApiArray<StoreType>(storeRes);
		setLocalStoresList(sData);
		if (sData && sData.length > 0) {
			setStore(sData[0] as unknown as StoreType);
		}
	};

	// Add Purchase Handlers
	const handleAddPurchaseItem = () => {
		if (effectiveUser?.role !== "Admin") return;
		if (!productsList?.length) return;
		setPurchaseItems([
			...purchaseItems,
			{
				id: Date.now().toString(),
				productId: productsList[0]._id,
				amount: 1,
				unitBuyingPrice: productsList[0].unitBuyingPrice,
			},
		]);
	};

	const handleUpdatePurchaseItem = (index: number, field: string, value: any) => {
		const list = [...purchaseItems];
		list[index][field] = value;
		if (field === "productId") {
			const p = productsList?.find((x: any) => x._id === value);
			if (p) list[index].unitBuyingPrice = p.unitBuyingPrice;
		}
		setPurchaseItems(list);
	};

	const handleRemovePurchaseItem = (index: number) => {
		const list = [...purchaseItems];
		list.splice(index, 1);
		setPurchaseItems(list);
	};

	const purchaseTotal = purchaseItems.reduce(
		(acc, curr) => acc + curr.amount * curr.unitBuyingPrice,
		0,
	);

	const handleSubmitPurchase = async () => {
		if (effectiveUser?.role !== "Admin") return;
		if (!purchaseItems.length || !localStoresList?.length) return;
		setSavingPurchase(true);

		const activeStore = localStoresList[0];

		const res = await fetch("/api/purchases", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				storeId: activeStore._id,
				supplierId: selectedSupplier,
				products: purchaseItems.map((p) => ({
					productId: p.productId,
					amount: p.amount,
					unitBuyingPrice: p.unitBuyingPrice,
				})),
				totalPrice: purchaseTotal,
				paidPrice: paymentStatus === "Paid" ? purchaseTotal : paidPrice,
				paymentStatus,
				shouldBePaidBeforeDate: deadline || undefined,
				comment: purchaseComment || undefined,
			}),
		});

		await res.json();
		
		const [purRes, sRes] = await Promise.all([
			fetch("/api/purchases"),
			fetch("/api/stores")
		]);
		const allPurs: PurchaseType[] = await parseApiArray(purRes);
		const sData = await sRes.json();

		setPurchasesList(allPurs);
		setGlobalPurchases(allPurs);

		if (sData && sData.length > 0) {
			setStore(sData[0] as unknown as StoreType);
		}
		setLocalStoresList(sData);

		setSavingPurchase(false);
		setShowAddPurchase(false);
		setPurchaseItems([]);
		setPaidPrice(0);
		setPurchaseComment("");
	};

	if (loading) {
		return (
			<div className="w-full h-full flex flex-col items-center justify-center text-theme-text opacity-70">
				<CgSpinner className="animate-spin text-4xl mb-4 text-theme-accent" />
				<p className="animate-pulse">Loading Store...</p>
			</div>
		);
	}

	if (!localStoresList?.length) {
		return (
			<div className="w-full h-full flex flex-col gap-6 p-6 px-4 md:px-8 overflow-y-auto mb-[100px] scrollbar-hidden">
				<h2 className="text-3xl font-extrabold tracking-tight flex items-center gap-3">
					<FiLayers className="text-theme-accent" /> Store Management
				</h2>
				<EmptyState
					title="No store found"
					message="Create a store from the Home page to manage inventory and purchases."
					action={
						<Link
							href="/home"
							className="px-5 py-2.5 bg-theme-accent text-theme-background rounded-full font-semibold hover:opacity-90 transition-all"
						>
							Go to Home
						</Link>
					}
				/>
			</div>
		);
	}

	const productsListSafe = productsList ?? [];
	const purchasesListSafe = purchasesList ?? [];
	const suppliersListSafe = suppliersList ?? [];
	const isAdmin = effectiveUser?.role === "Admin";
	const currentTab: Tab = isAdmin ? activeTab : "inventory";

	// Build a quick lookup map: productId → product
	const productsMap = new Map<string, any>();
	productsListSafe.forEach((p: any) => productsMap.set(p._id, p));

	// Build lookup map for suppliers
	const suppliersMap = new Map<string, any>();
	suppliersListSafe.forEach((s: any) => suppliersMap.set(s._id, s));

	// Use active store from list or global
	const activeStore =
		localStoresList.find((s) => s._id === globalStore?._id) || localStoresList[0];
	const inventory = activeStore?.inventory ?? [];
	const totalUnits = inventory.reduce(
		(sum: number, item: any) => sum + item.amount,
		0,
	);

	const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
		{ key: "inventory", label: "Inventory", icon: <FiPackage /> },
		...(isAdmin
			? [{ key: "purchases" as const, label: "Purchases", icon: <FiShoppingBag /> }]
			: []),
	];

	return (
		<div className="w-full h-full flex flex-col gap-6 p-6 px-4 md:px-8 overflow-y-auto mb-[100px] scrollbar-hidden">
			{/* Title */}
			<div className="flex items-start justify-between gap-4 mb-2">
				<div className="flex flex-col gap-2">
					<h2 className="text-3xl font-extrabold tracking-tight flex items-center gap-3">
						<FiLayers className="text-theme-accent" /> Store Management
					</h2>
					<p className="text-theme-text/50">
						{activeStore.title}
					</p>
				</div>
				{isAdmin && (
				<Link
					href="/inputs"
					className="flex items-center gap-2 px-4 py-2.5 bg-theme-accent/20 text-theme-accent rounded-full font-medium hover:bg-theme-accent hover:text-white transition-all shrink-0"
				>
					<FiList />
					<span className="hidden sm:inline">Inputs</span>
				</Link>
				)}
			</div>

			{/* Tab Bar - Match /inputs UI style */}
			<div className="flex gap-2 p-1 bg-theme-card rounded-full w-fit">
				{tabs.map((tab) => (
					<button
						key={tab.key}
						onClick={() => setActiveTab(tab.key)}
						className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-medium transition-all duration-300 ${
							currentTab === tab.key
								? "bg-theme-accent text-white shadow-lg"
								: "text-theme-text/60 hover:text-theme-text"
						}`}
					>
						{tab.icon}
						{tab.label}
					</button>
				))}
			</div>

			{/* Tab Content: Inventory */}
			{currentTab === "inventory" && (
				<div className="flex flex-col gap-3">
					<div className="flex items-center justify-between mb-2">
						<span className="text-theme-text/50 text-sm">
							{totalUnits} items total
						</span>
					</div>

					{inventory.length === 0 ? (
						<EmptyState
							title="No inventory yet"
							message="Add products via Inputs, then log a purchase to stock this store."
							action={isAdmin ? (
								<Link
									href="/inputs"
									className="px-5 py-2.5 bg-theme-accent/20 text-theme-accent rounded-full font-semibold hover:bg-theme-accent hover:text-white transition-all"
								>
									Go to Inputs
								</Link>
							) : undefined}
						/>
					) : (
					inventory.map((item: any, idx: number) => {
						const product = productsMap.get(item.productId);
						const name = product?.name ?? `Product #${item.productId}`;
						const type = product?.type ?? "Unknown";

						return (
							<motion.div
								key={item.productId}
								initial={{ opacity: 0, y: 12 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ delay: idx * 0.04, duration: 0.3 }}
								className="flex items-center gap-4 p-4 bg-theme-card rounded-2xl hover:bg-theme-card/80 transition-all duration-300"
							>
								{/* Icon Circle */}
								<div
									className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${getTypeColor(type)}`}
								>
									{getProductIcon(type)}
								</div>

								{/* Name & Type */}
								<div className="flex flex-col flex-1 min-w-0">
									<span className="font-bold text-base truncate">
										{name}
									</span>
									<span className="text-xs text-theme-text/50 uppercase tracking-wide">
										{type}
									</span>
								</div>

								{/* Amount */}
								<div className="flex flex-col items-end shrink-0">
									<span className="text-lg font-extrabold text-emerald-400">
										{item.amount}
									</span>
									<span className="text-[10px] text-theme-text/40 uppercase">
										units
									</span>
								</div>

								{/* Approve Button or Badge */}
								{item.approved || !isAdmin ? (
									<div className="px-3 py-1 rounded-full text-xs font-bold shrink-0 bg-emerald-500/20 text-emerald-400">
										{item.approved ? "Approved" : "Pending"}
									</div>
								) : (
									<button
										onClick={() =>
											handleApprove(
												activeStore._id,
												item.productId,
											)
										}
										className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold shrink-0 bg-orange-500/20 text-orange-400 hover:bg-emerald-500/30 hover:text-emerald-400 transition-all duration-300 cursor-pointer"
									>
										<FiCheck className="text-sm" />
										Approve
									</button>
								)}
							</motion.div>
						);
					})
					)}
				</div>
			)}

			{/* Tab Content: Purchases */}
			{currentTab === "purchases" && (
				<div className="flex flex-col gap-3">
					<div className="flex items-center justify-between mb-2">
						<span className="text-theme-text/50 text-sm">
							{purchasesListSafe.length} purchases
						</span>
						{isAdmin && (
						<button
							onClick={() => setShowAddPurchase(true)}
							className="flex items-center gap-2 px-4 py-2 bg-theme-accent/20 text-theme-accent rounded-full font-medium hover:bg-theme-accent hover:text-white transition-all"
						>
							<FiPlus /> Add Purchase
						</button>
						)}
					</div>

					{purchasesListSafe.length === 0 ? (
						<EmptyState
							title="No purchases yet"
							message="Log a purchase to restock inventory from suppliers."
						/>
					) : (
					purchasesListSafe.map((pur: any, idx: number) => (
						<motion.div
							key={pur._id}
							initial={{ opacity: 0, y: 12 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ delay: idx * 0.04, duration: 0.3 }}
							className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 bg-theme-card rounded-2xl hover:bg-theme-card/80 transition-all duration-300"
						>
							<div className="flex flex-col flex-1 min-w-0">
								<span className="font-bold text-base truncate">
									{suppliersMap.get(pur.supplierId)?.name ||
										"Unknown Supplier"}
								</span>
								<span className="text-xs text-theme-text/50 uppercase tracking-wide">
									{new Date(pur.createdAt).toLocaleDateString()}
								</span>
							</div>

							<div className="flex flex-col items-start sm:items-end flex-1 min-w-0">
								{pur.comment && (
									<span className="text-sm italic text-theme-text/70 line-clamp-1 break-all bg-theme-background px-3 py-1 rounded-xl">
										"{pur.comment}"
									</span>
								)}
							</div>

							<div className="flex flex-col items-end shrink-0 ml-auto">
								<span className="text-lg font-extrabold text-emerald-400">
									${pur.totalPrice.toLocaleString()}
								</span>
								<span className="text-[10px] text-theme-text/40 uppercase">
									Paid: ${pur.paidPrice.toLocaleString()}
								</span>
							</div>

							<div
								className={`px-3 py-1 rounded-full text-xs font-bold shrink-0 ${
									pur.paymentStatus === "Paid"
										? "bg-emerald-500/20 text-emerald-400"
										: pur.paymentStatus === "Partial"
											? "bg-orange-500/20 text-orange-400"
											: "bg-red-500/20 text-red-400"
								}`}
							>
								{pur.paymentStatus}
							</div>
						</motion.div>
					))
					)}
				</div>
			)}

			{/* Add Purchase Pop-up Modal */}
			<AnimatePresence>
				{isAdmin && showAddPurchase && (
					<div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
						<motion.div
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							exit={{ opacity: 0 }}
							className="absolute inset-0 bg-black/60 backdrop-blur-sm"
							onClick={() => setShowAddPurchase(false)}
						/>
						<motion.div
							initial={{ opacity: 0, scale: 0.9, y: 20 }}
							animate={{ opacity: 1, scale: 1, y: 0 }}
							exit={{ opacity: 0, scale: 0.9, y: 20 }}
							className="bg-theme-background relative z-10 w-full max-w-2xl rounded-3xl p-6 shadow-2xl flex flex-col gap-5 max-h-[90vh] overflow-y-auto scrollbar-hidden"
						>
							<div className="flex justify-between items-center bg-theme-background sticky top-0 z-20 pb-2">
								<h3 className="text-2xl font-bold tracking-tight">
									New Purchase
								</h3>
								<button
									onClick={() => setShowAddPurchase(false)}
									className="p-2 bg-theme-card rounded-full text-theme-text/60 hover:text-theme-text hover:bg-theme-border"
								>
									<FiX />
								</button>
							</div>

							<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
								<div className="flex flex-col gap-2">
									<label className="text-sm font-semibold text-theme-text/70 uppercase">
										Supplier
									</label>
									<select
										value={selectedSupplier}
										onChange={(e) =>
											setSelectedSupplier(e.target.value)
										}
										className="p-3 rounded-xl bg-theme-card outline-none text-theme-text appearance-none"
									>
										{suppliersList?.map((s: any) => (
											<option key={s._id} value={s._id}>
												{s.name}
											</option>
										))}
									</select>
								</div>
								<div className="flex flex-col gap-2">
									<label className="text-sm font-semibold text-theme-text/70 uppercase">
										Comment
									</label>
									<input
										type="text"
										value={purchaseComment}
										onChange={(e) =>
											setPurchaseComment(e.target.value)
										}
										placeholder="Optional comment..."
										className="p-3 rounded-xl bg-theme-card outline-none text-theme-text"
									/>
								</div>
							</div>

							<div className="flex items-center justify-between border-t border-theme-border/50 pt-4">
								<h4 className="font-bold">Products Received</h4>
								<button
									onClick={handleAddPurchaseItem}
									className="flex items-center gap-2 px-3 py-1.5 bg-theme-accent/20 text-theme-accent rounded-full font-medium hover:bg-theme-accent hover:text-white transition-all text-sm"
								>
									<FiPlus /> Add
								</button>
							</div>

							<div className="flex flex-col gap-3">
								{purchaseItems.length === 0 && (
									<div className="p-4 border border-dashed border-theme-border/50 text-center rounded-2xl text-theme-text/40 text-sm">
										No products added.
									</div>
								)}
								{purchaseItems.map((item, i) => (
									<div
										key={item.id}
										className="flex flex-col sm:flex-row gap-3 items-center bg-theme-card/50 p-3 rounded-2xl"
									>
										<select
											value={item.productId}
											onChange={(e) =>
												handleUpdatePurchaseItem(
													i,
													"productId",
													e.target.value,
												)
											}
											className="w-full p-2.5 rounded-lg bg-theme-card outline-none text-theme-text flex-1 min-w-0 text-sm"
										>
											{productsList?.map((p: any) => (
												<option key={p._id} value={p._id}>
													{p.name}
												</option>
											))}
										</select>
										<div className="flex w-full sm:w-auto gap-3">
											<input
												title="Amount"
												type="number"
												min="1"
												value={item.amount}
												onChange={(e) =>
													handleUpdatePurchaseItem(
														i,
														"amount",
														parseInt(e.target.value) ||
															0,
													)
												}
												className="w-24 p-2.5 rounded-lg bg-theme-card outline-none text-theme-text text-sm"
											/>
											<input
												title="Cost per Unit"
												type="number"
												min="0"
												value={item.unitBuyingPrice}
												onChange={(e) =>
													handleUpdatePurchaseItem(
														i,
														"unitBuyingPrice",
														parseFloat(
															e.target.value,
														) || 0,
													)
												}
												className="w-24 p-2.5 rounded-lg bg-theme-card outline-none text-theme-text text-sm"
											/>
											<button
												onClick={() =>
													handleRemovePurchaseItem(i)
												}
												className="p-2 text-red-400 hover:bg-red-400/20 rounded-xl transition-all h-[40px] w-[40px] flex items-center justify-center shrink-0"
											>
												<FiTrash2 />
											</button>
										</div>
									</div>
								))}
							</div>

							<div className="flex flex-col sm:flex-row gap-4 border-t border-theme-border/50 pt-4">
								<div className="flex flex-col gap-2 flex-1">
									<label className="text-sm font-semibold text-theme-text/70 uppercase">
										Payment
									</label>
									<select
										value={paymentStatus}
										onChange={(e) =>
											setPaymentStatus(e.target.value)
										}
										className="p-3 rounded-xl bg-theme-card outline-none text-theme-text appearance-none"
									>
										<option value="Paid">Fully Paid</option>
										<option value="Partial">Partial</option>
										<option value="Unpaid">Unpaid</option>
									</select>
								</div>
								{paymentStatus !== "Paid" && (
									<div className="flex flex-col gap-2 flex-1">
										<label className="text-sm font-semibold text-theme-text/70 uppercase">
											Deadline
										</label>
										<input
											type="date"
											value={deadline}
											onChange={(e) =>
												setDeadline(e.target.value)
											}
											className="p-3 rounded-xl bg-theme-card outline-none text-theme-text"
										/>
									</div>
								)}
								{paymentStatus === "Partial" && (
									<div className="flex flex-col gap-2 flex-1">
										<label className="text-sm font-semibold text-theme-text/70 uppercase">
											Paid Amt
										</label>
										<input
											type="number"
											value={paidPrice}
											onChange={(e) =>
												setPaidPrice(
													parseFloat(e.target.value) || 0,
												)
											}
											className="p-3 rounded-xl bg-theme-card outline-none text-theme-text"
										/>
									</div>
								)}
							</div>

							<div className="flex items-center justify-between mt-2 pt-4 border-t border-theme-border/50">
								<div className="flex items-center gap-4">
									<span className="text-theme-text/50 font-bold text-sm">
										Total:
									</span>
									<span className="text-2xl font-extrabold text-emerald-400">
										${purchaseTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
									</span>
								</div>
								<button
									onClick={handleSubmitPurchase}
									disabled={savingPurchase || purchaseItems.length === 0}
									className="px-6 py-3 bg-theme-text text-theme-background rounded-full font-black text-sm md:text-base hover:opacity-90 disabled:opacity-50 transition-all active:scale-95 flex items-center gap-2"
								>
									{savingPurchase ? (
										<CgSpinner className="animate-spin text-lg" />
									) : (
										"Log Purchase"
									)}
								</button>
							</div>
						</motion.div>
					</div>
				)}
			</AnimatePresence>
		</div>
	);
}
