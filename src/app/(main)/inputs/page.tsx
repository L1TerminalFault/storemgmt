"use client";

import { useEffect, useState } from "react";
import { FiPlus, FiTrash2, FiBox, FiUsers, FiUser, FiLayers } from "react-icons/fi";
import { GiSoap, GiSpray } from "react-icons/gi";
import { motion, AnimatePresence } from "framer-motion";
import { CgSpinner } from "react-icons/cg";
import { FiX } from "react-icons/fi";
import { useStoreStore } from "@/lib/store";
import { parseApiArray } from "@/lib/api-util";
import EmptyState from "@/components/EmptyState";

import type { ProductType, SupplierType } from "@/lib/types";

type Tab = "products" | "suppliers" | "customers";

function getProductIcon(type: string) {
	const t = type.toLowerCase();
	if (t.includes("soap")) return <GiSoap className="text-lg" />;
	if (t.includes("deodorant") || t.includes("spray"))
		return <GiSpray className="text-lg" />;
	return <FiBox className="text-lg" />;
}

function getTypeColor(type: string) {
	const t = type.toLowerCase();
	if (t.includes("soap")) return "bg-sky-500/20 text-sky-400";
	if (t.includes("deodorant")) return "bg-violet-500/20 text-violet-400";
	return "bg-amber-500/20 text-amber-400";
}

export default function InputsPage() {
	const globalProducts = useStoreStore((s) => s.products);
	const setGlobalProducts = useStoreStore((s) => s.setProducts);
	const globalSuppliers = useStoreStore((s) => s.suppliers);
	const setGlobalSuppliers = useStoreStore((s) => s.setSuppliers);
	const globalCustomers = useStoreStore((s) => s.customers);
	const setGlobalCustomers = useStoreStore((s) => s.setCustomers);

	const [activeTab, setActiveTab] = useState<Tab>("products");
	const [loading, setLoading] = useState(true);

	const [products, setProducts] = useState<any[]>([]);
	const [suppliers, setSuppliers] = useState<any[]>([]);
	const [customers, setCustomers] = useState<any[]>([]);

	// Add form popups
	const [showAddProduct, setShowAddProduct] = useState(false);
	const [showAddSupplier, setShowAddSupplier] = useState(false);

	// Product form fields
	const [newProductName, setNewProductName] = useState("");
	const [newProductType, setNewProductType] = useState("Soap");
	const [newProductSubCategory, setNewProductSubCategory] = useState("");
	const [newProductPrice, setNewProductPrice] = useState(0);

	const [isNewCategory, setIsNewCategory] = useState(false);
	const [isNewSubCategory, setIsNewSubCategory] = useState(false);

	// Price edit popup state
	const [pricePopupProduct, setPricePopupProduct] = useState<ProductType | null>(null);
	const [pricePopupValue, setPricePopupValue] = useState<number>(0);

	// Supplier form fields
	const [newSupplierName, setNewSupplierName] = useState("");

	useEffect(() => {
		async function loadData() {
			let prodData = globalProducts;
			let supData = globalSuppliers;
			let custData = globalCustomers;

			if (prodData === undefined || supData === undefined || custData === undefined) {
				const [prodRes, supRes, custRes] = await Promise.all([
					fetch("/api/products"),
					fetch("/api/suppliers"),
					fetch("/api/customers"),
				]);
				prodData = await parseApiArray(prodRes);
				supData = await parseApiArray(supRes);
				custData = await parseApiArray(custRes);

				setGlobalProducts(prodData || []);
				setGlobalSuppliers(supData || []);
				setGlobalCustomers(custData || []);
			}

			setProducts(prodData || []);
			setSuppliers(supData || []);
			setCustomers(custData || []);
			setLoading(false);
		}
		loadData();
	}, [globalProducts, globalSuppliers, globalCustomers, setGlobalProducts, setGlobalSuppliers, setGlobalCustomers]);

	const handleAddProduct = async () => {
		if (!newProductName.trim()) return;
		await fetch("/api/products", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				name: newProductName,
				type: newProductType,
				category: newProductType,
				subCategory: newProductSubCategory,
				unitBuyingPrice: newProductPrice,
			}),
		});

		const resRaw = await fetch("/api/products");
		const allProds: ProductType[] = await parseApiArray(resRaw);
		setProducts(allProds);
		setGlobalProducts(allProds);

		setNewProductName("");
		setNewProductType("Soap");
		setNewProductSubCategory("");
		setNewProductPrice(0);
		setIsNewCategory(false);
		setIsNewSubCategory(false);
		setShowAddProduct(false);
	};

	const handleRemoveProduct = async (id: string) => {
		await fetch(`/api/products?id=${id}`, { method: "DELETE" });

		const resRaw = await fetch("/api/products");
		const allProds: ProductType[] = await parseApiArray(resRaw);
		setProducts(allProds);
		setGlobalProducts(allProds);
	};

	const handleUpdateProductPrice = async (id: string, newPrice: number) => {
		await fetch("/api/products", {
			method: "PUT",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ _id: id, unitBuyingPrice: newPrice }),
		});

		const resRaw = await fetch("/api/products");
		const allProds: ProductType[] = await parseApiArray(resRaw);
		setProducts(allProds);
		setGlobalProducts(allProds);
	};

	const handleAddSupplier = async () => {
		if (!newSupplierName.trim()) return;
		await fetch("/api/suppliers", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ name: newSupplierName }),
		});

		const resRaw = await fetch("/api/suppliers");
		const allSups: SupplierType[] = await parseApiArray(resRaw);
		setSuppliers(allSups);
		setGlobalSuppliers(allSups);

		setNewSupplierName("");
		setShowAddSupplier(false);
	};

	const handleRemoveSupplier = async (id: string) => {
		await fetch(`/api/suppliers?id=${id}`, { method: "DELETE" });

		const resRaw = await fetch("/api/suppliers");
		const allSups: SupplierType[] = await parseApiArray(resRaw);
		setSuppliers(allSups);
		setGlobalSuppliers(allSups);
	};

	if (loading) {
		return (
			<div className="w-full h-full flex flex-col items-center justify-center text-theme-text opacity-70">
				<CgSpinner className="animate-spin text-4xl mb-4 text-theme-accent" />
				<p className="animate-pulse">Loading Data...</p>
			</div>
		);
	}

	const uniqueCategories = Array.from(
		new Set(products.map((p) => (p.category || p.type)?.trim()).filter(Boolean))
	).sort();

	const uniqueSubCategories = Array.from(
		new Set(
			products
				.filter((p) => (p.category || p.type)?.trim() === newProductType?.trim())
				.map((p) => p.subCategory?.trim())
				.filter(Boolean)
		)
	).sort();

	const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
		{ key: "products", label: "Products", icon: <FiBox /> },
		{ key: "suppliers", label: "Suppliers", icon: <FiUsers /> },
		{ key: "customers", label: "Customers", icon: <FiUser /> },
	];

	return (
		<div className="w-full h-full flex flex-col gap-6 p-6 px-4 md:px-8 overflow-y-auto mb-[100px] scrollbar-hidden">
			{/* Header */}
			<div className="flex flex-col gap-2 mb-2">
				<h2 className="text-3xl font-extrabold tracking-tight flex items-center gap-3">
					<FiLayers className="text-theme-accent" /> Inputs
				</h2>
				<p className="text-theme-text/50">
					Manage products, suppliers, and view customers
				</p>
			</div>

			{/* Tab Bar */}
			<div className="flex gap-2 p-1 bg-theme-card rounded-full w-fit">
				{tabs.map((tab) => (
					<button
						key={tab.key}
						onClick={() => setActiveTab(tab.key)}
						className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-medium transition-all duration-300 ${
							activeTab === tab.key
								? "bg-theme-accent text-white shadow-lg"
								: "text-theme-text/60 hover:text-theme-text"
						}`}
					>
						{tab.icon}
						{tab.label}
					</button>
				))}
			</div>

			{/* Tab Content */}
			{activeTab === "products" && (
				<div className="flex flex-col gap-3">
					<div className="flex items-center justify-between mb-2">
						<span className="text-theme-text/50 text-sm">
							{products.length} products
						</span>
						<button
							onClick={() => setShowAddProduct(true)}
							className="flex items-center gap-2 px-4 py-2 bg-theme-accent/20 text-theme-accent rounded-full font-medium hover:bg-theme-accent hover:text-white transition-all"
						>
							<FiPlus /> Add Product
						</button>
					</div>

					{products.length === 0 ? (
						<EmptyState
							title="No products yet"
							message="Add your first product to use in purchases and transactions."
						/>
					) : (
					products.map((p, idx) => (
						<motion.div
							key={p._id}
							initial={{ opacity: 0, y: 12 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ delay: idx * 0.04, duration: 0.3 }}
							className="flex items-center gap-4 p-4 bg-theme-card rounded-2xl hover:bg-theme-card/80 transition-all duration-300"
						>
							<div
								className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${getTypeColor(p.type || "")}`}
							>
								{getProductIcon(p.type || "")}
							</div>
							<div className="flex flex-col flex-1 min-w-0">
								<span className="font-bold text-base truncate">
									{p.name}
								</span>
								<div className="flex items-center gap-2">
									<span className="text-xs text-theme-text/50 uppercase tracking-wide">
										{p.category || p.type}
									</span>
									{p.subCategory && (
										<span className="text-[10px] px-2 py-0.5 rounded-full bg-theme-text/10 text-theme-text/60 uppercase tracking-wider">
											{p.subCategory}
										</span>
									)}
								</div>
							</div>
							<div className="flex flex-col items-end shrink-0">
								<div className="flex items-center">
									<button
										onClick={() => {
											setPricePopupProduct(p);
											setPricePopupValue(p.unitBuyingPrice);
										}}
										className="flex items-center hover:bg-emerald-500/10 px-2 py-1 -mr-2 rounded-lg transition-colors cursor-pointer"
									>
										<span className="text-lg font-extrabold text-emerald-400 mr-1">$</span>
										<span className="text-lg font-extrabold text-emerald-400">
											{p.unitBuyingPrice}
										</span>
									</button>
								</div>
								<span className="text-[10px] text-theme-text/40 uppercase">
									buy price
								</span>
							</div>
							<button
								onClick={() => handleRemoveProduct(p._id)}
								className="p-2.5 text-red-400 hover:bg-red-400/20 rounded-xl transition-all shrink-0"
							>
								<FiTrash2 />
							</button>
						</motion.div>
					))
					)}
				</div>
			)}

			{activeTab === "suppliers" && (
				<div className="flex flex-col gap-3">
					<div className="flex items-center justify-between mb-2">
						<span className="text-theme-text/50 text-sm">
							{suppliers.length} suppliers
						</span>
						<button
							onClick={() => setShowAddSupplier(true)}
							className="flex items-center gap-2 px-4 py-2 bg-theme-accent/20 text-theme-accent rounded-full font-medium hover:bg-theme-accent hover:text-white transition-all"
						>
							<FiPlus /> Add Supplier
						</button>
					</div>

					{suppliers.length === 0 ? (
						<EmptyState
							title="No suppliers yet"
							message="Add suppliers to log purchases and restock inventory."
						/>
					) : (
					suppliers.map((s, idx) => (
						<motion.div
							key={s._id}
							initial={{ opacity: 0, y: 12 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ delay: idx * 0.04, duration: 0.3 }}
							className="flex items-center gap-4 p-4 bg-theme-card rounded-2xl hover:bg-theme-card/80 transition-all duration-300"
						>
							<div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 bg-violet-500/20 text-violet-400">
								<FiUsers className="text-lg" />
							</div>
							<div className="flex flex-col flex-1 min-w-0">
								<span className="font-bold text-base truncate">
									{s.name}
								</span>
							</div>
							<button
								onClick={() => handleRemoveSupplier(s._id)}
								className="p-2.5 text-red-400 hover:bg-red-400/20 rounded-xl transition-all shrink-0"
							>
								<FiTrash2 />
							</button>
						</motion.div>
					))
					)}
				</div>
			)}

			{activeTab === "customers" && (
				<div className="flex flex-col gap-3">
					<div className="flex items-center justify-between mb-2">
						<span className="text-theme-text/50 text-sm">
							{customers.length} customers (read-only)
						</span>
					</div>

					{customers.length === 0 ? (
						<EmptyState
							title="No customers yet"
							message="Customers are added when you complete transactions on the Customers page."
						/>
					) : (
					customers.map((c, idx) => (
						<motion.div
							key={c._id}
							initial={{ opacity: 0, y: 12 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ delay: idx * 0.04, duration: 0.3 }}
							className="flex items-center gap-4 p-4 bg-theme-card rounded-2xl"
						>
							<div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 bg-sky-500/20 text-sky-400">
								<FiUser className="text-lg" />
							</div>
							<div className="flex flex-col flex-1 min-w-0">
								<span className="font-bold text-base truncate">
									{c.name}
								</span>
							</div>
						</motion.div>
					))
					)}
				</div>
			)}

			{/* Add Product Modal */}
			<AnimatePresence>
				{showAddProduct && (
					<div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
						<motion.div
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							exit={{ opacity: 0 }}
							className="absolute inset-0 bg-black/60 backdrop-blur-sm"
							onClick={() => setShowAddProduct(false)}
						/>
						<motion.div
							initial={{ opacity: 0, scale: 0.9, y: 20 }}
							animate={{ opacity: 1, scale: 1, y: 0 }}
							exit={{ opacity: 0, scale: 0.9, y: 20 }}
							className="bg-theme-background relative z-10 w-full max-w-md rounded-3xl p-6 shadow-2xl flex flex-col gap-5"
						>
							<div className="flex justify-between items-center">
								<h3 className="text-2xl font-bold tracking-tight">
									Add Product
								</h3>
								<button
									onClick={() => setShowAddProduct(false)}
									className="p-2 bg-theme-card rounded-full text-theme-text/60 hover:text-theme-text hover:bg-theme-border"
								>
									<FiX />
								</button>
							</div>
							<div className="flex flex-col gap-2">
								<label className="text-sm font-semibold text-theme-text/70 uppercase">
									Name
								</label>
								<input
									type="text"
									value={newProductName}
									onChange={(e) => setNewProductName(e.target.value)}
									placeholder="Product name..."
									className="p-3 rounded-xl bg-theme-card outline-none text-theme-text"
								/>
							</div>
							<div className="flex flex-col gap-2">
								<label className="text-sm font-semibold text-theme-text/70 uppercase">
									Category
								</label>
								{uniqueCategories.length > 0 && !isNewCategory ? (
									<select
										value={newProductType}
										onChange={(e) => {
											if (e.target.value === "__NEW__") {
												setIsNewCategory(true);
												setNewProductType("");
											} else {
												setNewProductType(e.target.value);
											}
										}}
										className="p-3 rounded-xl bg-theme-card outline-none text-theme-text appearance-none cursor-pointer"
									>
										{!newProductType && <option value="" disabled>Select category</option>}
										{uniqueCategories.map(cat => (
											<option key={cat as string} value={cat as string}>{cat as string}</option>
										))}
										<option value="__NEW__">+ Add New Category</option>
									</select>
								) : (
									<div className="flex gap-2">
										<input
											type="text"
											value={newProductType}
											onChange={(e) => setNewProductType(e.target.value)}
											placeholder="Category e.g. Soap"
											className="p-3 rounded-xl bg-theme-card outline-none text-theme-text flex-1"
											autoFocus={isNewCategory}
										/>
										{uniqueCategories.length > 0 && (
											<button 
												onClick={() => { setIsNewCategory(false); setNewProductType(uniqueCategories[0] as string); }}
												className="p-3 bg-theme-border rounded-xl text-theme-text/70 hover:text-theme-text transition-colors"
												title="Choose existing"
											>
												<FiX />
											</button>
										)}
									</div>
								)}
							</div>
							<div className="flex flex-col gap-2">
								<label className="text-sm font-semibold text-theme-text/70 uppercase">
									Sub Category
								</label>
								{uniqueSubCategories.length > 0 && !isNewSubCategory ? (
									<select
										value={newProductSubCategory}
										onChange={(e) => {
											if (e.target.value === "__NEW__") {
												setIsNewSubCategory(true);
												setNewProductSubCategory("");
											} else {
												setNewProductSubCategory(e.target.value);
											}
										}}
										className="p-3 rounded-xl bg-theme-card outline-none text-theme-text appearance-none cursor-pointer"
									>
										{!newProductSubCategory && <option value="" disabled>Select sub category</option>}
										{uniqueSubCategories.map(sub => (
											<option key={sub as string} value={sub as string}>{sub as string}</option>
										))}
										<option value="__NEW__">+ Add New Sub Category</option>
									</select>
								) : (
									<div className="flex gap-2">
										<input
											type="text"
											value={newProductSubCategory}
											onChange={(e) => setNewProductSubCategory(e.target.value)}
											placeholder="e.g. BATH, CASH, OTHER..."
											className="p-3 rounded-xl bg-theme-card outline-none text-theme-text flex-1"
											autoFocus={isNewSubCategory}
										/>
										{uniqueSubCategories.length > 0 && (
											<button 
												onClick={() => { setIsNewSubCategory(false); setNewProductSubCategory(uniqueSubCategories[0] as string); }}
												className="p-3 bg-theme-border rounded-xl text-theme-text/70 hover:text-theme-text transition-colors"
												title="Choose existing"
											>
												<FiX />
											</button>
										)}
									</div>
								)}
							</div>
							<div className="flex flex-col gap-2">
								<label className="text-sm font-semibold text-theme-text/70 uppercase">
									Buying Price ($)
								</label>
								<input
									type="number"
									min="0"
									value={newProductPrice}
									onChange={(e) =>
										setNewProductPrice(
											parseFloat(e.target.value) || 0,
										)
									}
									className="p-3 rounded-xl bg-theme-card outline-none text-theme-text"
								/>
							</div>
							<button
								onClick={handleAddProduct}
								className="w-full p-4 bg-theme-text text-theme-background rounded-xl font-black text-lg hover:opacity-90 transition-opacity hover:scale-[1.03] active:scale-95 duration-300"
							>
								Add Product
							</button>
						</motion.div>
					</div>
				)}
			</AnimatePresence>

			{/* Edit Price Modal */}
			<AnimatePresence>
				{pricePopupProduct && (
					<div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
						<motion.div
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							exit={{ opacity: 0 }}
							className="absolute inset-0 bg-black/60 backdrop-blur-sm"
							onClick={() => setPricePopupProduct(null)}
						/>
						<motion.div
							initial={{ opacity: 0, scale: 0.9, y: 20 }}
							animate={{ opacity: 1, scale: 1, y: 0 }}
							exit={{ opacity: 0, scale: 0.9, y: 20 }}
							className="bg-theme-background relative z-10 w-full max-w-sm rounded-3xl p-6 shadow-2xl flex flex-col gap-5"
						>
							<div className="flex justify-between items-center">
								<h3 className="text-2xl font-bold tracking-tight">
									Edit Price
								</h3>
								<button
									onClick={() => setPricePopupProduct(null)}
									className="p-2 bg-theme-card rounded-full text-theme-text/60 hover:text-theme-text hover:bg-theme-border"
								>
									<FiX />
								</button>
							</div>
							<div className="text-theme-text/70">
								Updating price for <strong className="text-theme-text">{pricePopupProduct.name}</strong>
							</div>
							<div className="flex flex-col gap-2">
								<label className="text-sm font-semibold text-theme-text/70 uppercase">
									New Buying Price ($)
								</label>
								<input
									type="number"
									value={pricePopupValue}
									onChange={(e) => setPricePopupValue(parseFloat(e.target.value) || 0)}
									className="p-3 rounded-xl bg-theme-card outline-none text-theme-text"
									autoFocus
								/>
							</div>
							<button
								onClick={() => {
									if (pricePopupProduct._id) {
										handleUpdateProductPrice(pricePopupProduct._id, pricePopupValue);
									}
									setPricePopupProduct(null);
								}}
								className="w-full p-4 bg-emerald-500 text-white rounded-xl font-black text-lg hover:bg-emerald-600 transition-colors active:scale-95 duration-300"
							>
								Save Price
							</button>
						</motion.div>
					</div>
				)}
			</AnimatePresence>

			{/* Add Supplier Modal */}
			<AnimatePresence>
				{showAddSupplier && (
					<div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
						<motion.div
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							exit={{ opacity: 0 }}
							className="absolute inset-0 bg-black/60 backdrop-blur-sm"
							onClick={() => setShowAddSupplier(false)}
						/>
						<motion.div
							initial={{ opacity: 0, scale: 0.9, y: 20 }}
							animate={{ opacity: 1, scale: 1, y: 0 }}
							exit={{ opacity: 0, scale: 0.9, y: 20 }}
							className="bg-theme-background relative z-10 w-full max-w-md rounded-3xl p-6 shadow-2xl flex flex-col gap-5"
						>
							<div className="flex justify-between items-center">
								<h3 className="text-2xl font-bold tracking-tight">
									Add Supplier
								</h3>
								<button
									onClick={() => setShowAddSupplier(false)}
									className="p-2 bg-theme-card rounded-full text-theme-text/60 hover:text-theme-text hover:bg-theme-border"
								>
									<FiX />
								</button>
							</div>
							<div className="flex flex-col gap-2">
								<label className="text-sm font-semibold text-theme-text/70 uppercase">
									Supplier Name
								</label>
								<input
									type="text"
									value={newSupplierName}
									onChange={(e) => setNewSupplierName(e.target.value)}
									placeholder="Supplier name..."
									className="p-3 rounded-xl bg-theme-card outline-none text-theme-text"
								/>
							</div>
							<button
								onClick={handleAddSupplier}
								className="w-full p-4 bg-theme-text text-theme-background rounded-xl font-black text-lg hover:opacity-90 transition-opacity hover:scale-[1.03] active:scale-95 duration-300"
							>
								Add Supplier
							</button>
						</motion.div>
					</div>
				)}
			</AnimatePresence>
		</div>
	);
}
