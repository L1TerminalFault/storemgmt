"use client";

import { useEffect, useState } from "react";
import { FiPlus, FiTrash2, FiUser, FiCheck, FiX, FiShoppingCart } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import { CgSpinner } from "react-icons/cg";
import { useStoreStore } from "@/lib/store";
import { parseApiArray } from "@/lib/api-util";
import EmptyState from "@/components/EmptyState";
import Link from "next/link";

import type { StoreType, CustomerType } from "@/lib/types";

export default function CustomersCheckout() {
	const customers = useStoreStore((s) => s.customers);
	const setCustomers = useStoreStore((s) => s.setCustomers);
	const products = useStoreStore((s) => s.products);
	const setProducts = useStoreStore((s) => s.setProducts);
	const store = useStoreStore((s) => s.store);
	const setStore = useStoreStore((s) => s.setStore);

	const [data, setData] = useState<any>(null);
	const [loading, setLoading] = useState(true);

	// Expanded Customer State
	const [expandedCustomerId, setExpandedCustomerId] = useState<string | null>(null);

	// Transaction State
	const [cart, setCart] = useState<any[]>([]);
	const [paymentStatus, setPaymentStatus] = useState("Paid");
	const [paidPrice, setPaidPrice] = useState(0);
	const [deadline, setDeadline] = useState("");
	const [transactionComment, setTransactionComment] = useState("");
	const [saving, setSaving] = useState(false);

	// Product Popup State
	const [showProductPopup, setShowProductPopup] = useState(false);

	// Add form popups
	const [showAddCustomer, setShowAddCustomer] = useState(false);

	// Customer form fields
	const [newCustomerName, setNewCustomerName] = useState("");

	useEffect(() => {
		async function loadData() {
			let cData = customers;
			let pData = products;
			let sData = store ? [store] : null;

			if (!cData || !pData || !sData) {
				const [cRes, pRes, sRes] = await Promise.all([
					fetch("/api/customers"),
					fetch("/api/products"),
					fetch("/api/stores"),
				]);
				cData = await parseApiArray(cRes);
				pData = await parseApiArray(pRes);
				const fetchedStores: StoreType[] = await parseApiArray(sRes);
				sData = fetchedStores;

				setCustomers(cData || []);
				setProducts(pData || []);
				if (fetchedStores && fetchedStores.length > 0) {
					setStore(fetchedStores[0]);
				}
			}

			setData({ customers: cData, products: pData, stores: sData });
			setLoading(false);
		}
		loadData();
	}, [customers, products, store, setCustomers, setProducts, setStore]);

	const handleCustomerClick = (id: string) => {
		if (expandedCustomerId === id) return;
		setExpandedCustomerId(id);
		setCart([]);
		setPaymentStatus("Paid");
	};

	const handleSelectProduct = (product: any) => {
		setCart([
			...cart,
			{
				id: Date.now().toString(),
				productId: product._id,
				name: product.name,
				unitBuyingPrice: product.unitBuyingPrice,
				amount: 1,
				unitPrice: product.unitBuyingPrice * 1.5,
			},
		]);
		setShowProductPopup(false);
	};

	const updateCartItem = (index: number, field: string, value: any) => {
		const newCart = [...cart];
		newCart[index][field] = value;
		setCart(newCart);
	};

	const removeCartItem = (index: number) => {
		const newCart = [...cart];
		newCart.splice(index, 1);
		setCart(newCart);
	};

	const currentTotal = cart.reduce(
		(acc, item) => acc + item.unitPrice * item.amount,
		0,
	);

	const handleAddCustomer = async () => {
		if (!newCustomerName.trim()) return;
		await fetch("/api/customers", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ name: newCustomerName }),
		});

		const resRaw = await fetch("/api/customers");
		const allCus: CustomerType[] = await parseApiArray(resRaw);
		setData({ ...data, customers: allCus, });
		setCustomers(allCus);

		setNewCustomerName("");
		setShowAddCustomer(false);
	};

	const handleSubmit = async () => {
		if (!cart.length || !expandedCustomerId) return;
		setSaving(true);

		await fetch("/api/transactions", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				storeId: data.stores[0]?._id,
				customerId: expandedCustomerId,
				products: cart.map((c) => ({
					productId: c.productId,
					amount: c.amount,
					unitPrice: c.unitPrice,
					unitBuyingPrice: c.unitBuyingPrice,
				})),
				totalPrice: currentTotal,
				paidPrice: paymentStatus === "Paid" ? currentTotal : paidPrice,
				paymentStatus,
				shouldBePaidBeforeDate: deadline || undefined,
				comment: transactionComment || undefined,
			}),
		});

		const storeRes = await fetch("/api/stores");
		const stores: StoreType[] = await parseApiArray(storeRes);
		const activeStore = stores.find((s: any) => s._id === data.stores[0]?._id) || stores[0];
		if (activeStore) setStore(activeStore);

		setSaving(false);
		setExpandedCustomerId(null);
		setTransactionComment("");
	};

	if (loading || !data) {
		return (
			<div className="w-full h-full flex flex-col items-center justify-center text-theme-text opacity-70">
				<CgSpinner className="animate-spin text-4xl mb-4 text-theme-accent" />
				<p className="animate-pulse">Loading Customers...</p>
			</div>
		);
	}

	return (
		<div className="w-full h-full flex flex-col gap-6 p-6 px-4 md:px-8 overflow-y-auto mb-[100px] scrollbar-hidden">
			{/* Header — matching store UI pattern */}
			<div className="flex flex-col gap-2 mb-2 w-full">
				<h2 className="text-3xl font-extrabold tracking-tight flex items-center gap-3">
					<FiUser className="text-theme-accent" /> Customers
				</h2>

				<div className="flex flex-col w-full items-center justify-between mb-2">
					<p className="text-theme-text/50 w-full mb-4">
						{data.customers.length} customers &mdash; Select to begin a transaction
					</p>

					<div className="flex w-full justify-end">
					<button
						onClick={() => setShowAddCustomer(true)}
						className="flex items-center gap-2 px-4 py-2 bg-theme-accent/20 text-theme-accent rounded-full font-medium hover:bg-theme-accent hover:text-white transition-all"
					>
						<FiPlus /> Add Customer
					</button>
					</div>
				</div>


			</div>

			<div className="flex flex-col gap-3">
				{!data.stores?.length ? (
					<EmptyState
						title="No store found"
						message="Create a store from Home before processing customer transactions."
						action={
							<Link href="/home" className="px-5 py-2.5 bg-theme-accent text-theme-background rounded-full font-semibold hover:opacity-90">
								Go to Home
							</Link>
						}
					/>
				) : data.customers.length === 0 ? (
					<EmptyState
						title="No customers yet"
						message="Customers will appear here once added to your account."
					/>
				) : (
				data.customers.map((c: any, idx: number) => {
					const isExpanded = expandedCustomerId === c._id;

					return (
						<motion.div
							layout
							key={c._id}
							initial={{ opacity: 0, y: 12 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ delay: idx * 0.06, duration: 0.35 }}
							onClick={() => !isExpanded && handleCustomerClick(c._id)}
							className={`flex flex-col rounded-2xl transition-all duration-300 overflow-hidden ${
								isExpanded
									? "bg-theme-card shadow-[0_0_30px_rgba(59,130,246,0.15)]"
									: "bg-theme-card hover:bg-theme-card/80 cursor-pointer"
							}`}
						>
							{/* Customer Row */}
							<div className="p-4 flex items-center gap-4">
								{/* Avatar Circle */}
								<div
									className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
										isExpanded
											? "bg-theme-accent text-white"
											: "bg-sky-500/20 text-sky-400"
									}`}
								>
									<FiUser className="text-lg" />
								</div>

								{/* Name */}
								<div className="flex flex-col flex-1 min-w-0">
									<span className="font-bold text-base truncate">
										{c.name}
									</span>
								</div>

								{isExpanded && (
									<button
										onClick={(e) => {
											e.stopPropagation();
											setExpandedCustomerId(null);
										}}
										className="p-2 bg-theme-background hover:bg-red-500/20 hover:text-red-400 rounded-full transition-all"
									>
										<FiX />
									</button>
								)}
							</div>

							{/* Expander Body */}
							<AnimatePresence>
								{isExpanded && (
									<motion.div
										initial={{ opacity: 0, height: 0 }}
										animate={{ opacity: 1, height: "auto" }}
										exit={{ opacity: 0, height: 0 }}
										className="border-t border-theme-border/50 p-6 flex flex-col gap-6 bg-theme-background/30"
									>
										<div className="flex items-center justify-between">
											<h4 className="font-bold text-lg text-theme-text/80 flex items-center gap-2">
												<FiShoppingCart /> Cart Items
											</h4>
											<button
												onClick={() => setShowProductPopup(true)}
												className="flex items-center gap-2 px-4 py-2 bg-theme-accent/20 text-theme-accent rounded-full font-medium hover:bg-theme-accent hover:text-white transition-all"
											>
												<FiPlus /> Add Product
											</button>
										</div>

										<div className="flex flex-col gap-4">
											{cart.length === 0 && (
												<div className="w-full p-8 text-center border border-dashed border-theme-border rounded-xl text-theme-text/50">
													Cart is empty. Add products to generate a transaction.
												</div>
											)}
											{cart.map((item, idx) => (
												<div
													key={item.id}
													className="flex flex-col md:flex-row shadow-sm gap-4 items-center bg-theme-card p-4 rounded-xl relative"
												>
													<div className="flex-1 w-full font-bold text-lg">
														{item.name}
													</div>

													<div className="flex gap-4">
													<div className="w-1/4 md:w-32">
														<label className="text-xs text-theme-text/50 mb-1 block">
															Qty
														</label>
														<input
															type="number"
															min="1"
															value={item.amount}
															onChange={(e) =>
																updateCartItem(
																	idx,
																	"amount",
																	parseInt(e.target.value) || 0,
																)
															}
															className="w-full p-2.5 rounded-lg bg-theme-background outline-none text-theme-text"
														/>
													</div>
													<div className="w-full md:w-40">
														<label className="text-xs text-theme-text/50 mb-1 block">
															Selling Price ($)
														</label>
														<input
															type="number"
															min="0"
															step="0.01"
															value={item.unitPrice}
															onChange={(e) =>
																updateCartItem(
																	idx,
																	"unitPrice",
																	parseFloat(e.target.value) || 0,
																)
															}
															className="w-full p-2.5 rounded-lg bg-theme-background outline-none text-theme-text"
														/>
													</div>
													<button
														onClick={() => removeCartItem(idx)}
														className="md:mt-5 p-3 text-red-500 bg-red-500/10 hover:bg-red-500 hover:text-white rounded-xl transition-all"
													>
														<FiTrash2 />
													</button>
													</div>
												</div>
											))}
										</div>

										{cart.length > 0 && (
											<div className="flex flex-col md:flex-row justify-between gap-6 pt-6 border-t border-theme-border mt-2">
												<div className="flex flex-col gap-4 w-full md:w-1/2">
													<label className="text-sm font-semibold tracking-wide text-theme-text/70 uppercase">
														Payment Option
													</label>
													<select
														value={paymentStatus}
														onChange={(e) =>
															setPaymentStatus(e.target.value)
														}
														className="p-3 rounded-xl bg-theme-card focus:border-theme-accent outline-none text-theme-text transition-all appearance-none"
													>
														<option value="Paid">Fully Paid</option>
														<option value="Partial">Partial</option>
														<option value="Unpaid">Unpaid</option>
													</select>

													{paymentStatus !== "Paid" && (
														<motion.div
															initial={{ opacity: 0 }}
															animate={{ opacity: 1 }}
															className="flex flex-col gap-4"
														>
															{paymentStatus === "Partial" && (
																<input
																	type="number"
																	placeholder="Amount Paid..."
																	onChange={(e) =>
																		setPaidPrice(
																			parseFloat(e.target.value),
																		)
																	}
																	className="p-3 rounded-xl bg-theme-card"
																/>
															)}
															<input
																type="date"
																onChange={(e) =>
																	setDeadline(e.target.value)
																}
																className="p-3 rounded-xl bg-theme-card"
															/>
														</motion.div>
													)}
												</div>

												<div className="flex flex-col items-end gap-6 w-full md:w-auto mt-4 md:mt-0">
													<div className="flex items-center gap-4 bg-theme-card px-6 py-4 rounded-2xl w-full md:w-auto">
														<span className="text-theme-text/50 font-bold">
															Total:
														</span>
														<span className="text-3xl font-extrabold text-emerald-400">
															$
															{currentTotal.toLocaleString(undefined, {
																minimumFractionDigits: 2,
															})}
														</span>
													</div>

												</div>

												<div className="flex flex-col gap-2 w-full md:w-1/2">
													<label className="text-sm font-semibold tracking-wide text-theme-text/70 uppercase">
														Notes / Comments
													</label>
													<textarea
														value={transactionComment}
														onChange={(e) => setTransactionComment(e.target.value)}
														placeholder="Optional comments for this transaction..."
														className="p-3 rounded-xl bg-theme-card focus:border-theme-accent outline-none text-theme-text transition-all resize-none h-[116px]"
													/>
												</div>

													<button
														onClick={handleSubmit}
														disabled={saving}
														className="w-full flex items-center justify-center gap-2 p-4 bg-theme-text text-theme-background rounded-xl font-black text-lg hover:opacity-90 transition-opacity disabled:opacity-50 hover:scale-[1.03] active:scale-95 duration-300"
													>
														{saving ? (
															<CgSpinner className="animate-spin text-xl" />
														) : (
															"Complete Transaction"
														)}
													</button>
											</div>
										)}
									</motion.div>
								)}
							</AnimatePresence>
						</motion.div>
					);
				})
				)}
			</div>

			{/* Product Popup Modal */}
			<AnimatePresence>
				{showProductPopup && (
					<div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
						<motion.div
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							exit={{ opacity: 0 }}
							className="absolute inset-0 bg-black/60 backdrop-blur-sm"
							onClick={() => setShowProductPopup(false)}
						/>
						<motion.div
							initial={{ opacity: 0, scale: 0.9, y: 20 }}
							animate={{ opacity: 1, scale: 1, y: 0 }}
							exit={{ opacity: 0, scale: 0.9, y: 20 }}
							className="bg-theme-background relative z-10 w-full max-w-md rounded-3xl p-6 shadow-2xl flex flex-col gap-4"
						>
							<div className="flex justify-between items-center mb-2">
								<h3 className="text-2xl font-bold tracking-tight">
									Select Product
								</h3>
								<button
									onClick={() => setShowProductPopup(false)}
									className="p-2 bg-theme-card rounded-full text-theme-text/60 hover:text-theme-text hover:bg-theme-border"
								>
									<FiX />
								</button>
							</div>

							<div className="flex flex-col gap-3 max-h-[60vh] overflow-y-auto scrollbar-hidden">
								{data.products.length === 0 ? (
									<EmptyState
										title="No products available"
										message="Add products in Inputs before creating a transaction."
									/>
								) : (
								data.products.map((p: any) => (
									<div
										key={p._id}
										onClick={() => handleSelectProduct(p)}
										className="flex justify-between items-center p-4 bg-theme-card hover:bg-theme-accent/20 hover:border-theme-accent cursor-pointer rounded-2xl transition-all active:scale-[0.98] transition-transform duration-300"
									>
										<div className="flex flex-col">
											<span className="font-bold text-lg">
												{p.name}
											</span>
											<span className="text-xs text-theme-text/50 uppercase">
												{p.type}
											</span>
										</div>
										<FiPlus className="text-xl text-theme-accent" />
									</div>
								))
								)}
							</div>
						</motion.div>
					</div>
				)}
			</AnimatePresence>

			
			{/* Add Customer Modal */}
			<AnimatePresence>
				{showAddCustomer && (
					<div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
						<motion.div
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							exit={{ opacity: 0 }}
							className="absolute inset-0 bg-black/60 backdrop-blur-sm"
							onClick={() => setShowAddCustomer(false)}
						/>
						<motion.div
							initial={{ opacity: 0, scale: 0.9, y: 20 }}
							animate={{ opacity: 1, scale: 1, y: 0 }}
							exit={{ opacity: 0, scale: 0.9, y: 20 }}
							className="bg-theme-background relative z-10 w-full max-w-md rounded-3xl p-6 shadow-2xl flex flex-col gap-5"
						>
							<div className="flex justify-between items-center">
								<h3 className="text-2xl font-bold tracking-tight">
									Add Customer
								</h3>
								<button
									onClick={() => setShowAddCustomer(false)}
									className="p-2 bg-theme-card rounded-full text-theme-text/60 hover:text-theme-text hover:bg-theme-border"
								>
									<FiX />
								</button>
							</div>
							<div className="flex flex-col gap-2">
								<label className="text-sm font-semibold text-theme-text/70 uppercase">
									Customer Name
								</label>
								<input
									type="text"
									value={newCustomerName}
									onChange={(e) => setNewCustomerName(e.target.value)}
									placeholder="Customer name..."
									className="p-3 rounded-xl bg-theme-card outline-none text-theme-text"
								/>
							</div>
							<button
								onClick={handleAddCustomer}
								className="w-full p-4 bg-theme-text text-theme-background rounded-xl font-black text-lg hover:opacity-90 transition-opacity hover:scale-[1.03] active:scale-95 duration-300"
							>
								Add Customer
							</button>
						</motion.div>
					</div>
				)}
			</AnimatePresence>
		</div>
	);
}
