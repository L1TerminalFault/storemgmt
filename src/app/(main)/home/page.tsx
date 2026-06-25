"use client";

import { useEffect, useState } from "react";
import {
	AreaChart,
	Area,
	XAxis,
	YAxis,
	Tooltip,
	ResponsiveContainer,
	CartesianGrid,
} from "recharts";
import { 
	FiTrendingUp, 
	FiAlertCircle, 
	FiDollarSign, 
	FiBell,
	FiPackage,
	FiCheckCircle,
	FiRefreshCw,
	FiX,
	FiTrendingDown,
	FiChevronDown,
	FiAlertTriangle,
	FiPlus,
} from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import { CgSpinner } from "react-icons/cg";
import { useStoreStore } from "@/lib/store";
import type { TransactionType, StoreType } from "@/lib/types";
import { parseApiArray } from "@/lib/api-util";
import EmptyState from "@/components/EmptyState";

type DashboardData = {
	chartData: any[];
	totalCurrentProfit: number;
	totalIdealProfit: number;
	totalDebits: number;
	totalSelfDebit: number;
	totalSpentPurchases: number;
	totalGainedTransactions: number;
	storeMoneyTotals: {
		storeId: string;
		title: string;
		moneyIn: number;
		moneyOut: number;
		isCurrent: boolean;
	}[];
	debitTransactions: any[];
	supplierDebits: any[];
	outOfStoreTransactions: TransactionType[];
	lowStock: any[];
	unapprovedItems: any[];
	gradientOffset: number;
};

export default function HomeDashboard() {
	// Zustand integration for data caching
	const globalTransactions = useStoreStore((s) => s.transactions);
	const setGlobalTransactions = useStoreStore((s) => s.setTransactions);
	const globalCustomers = useStoreStore((s) => s.customers);
	const setGlobalCustomers = useStoreStore((s) => s.setCustomers);
	const globalPurchases = useStoreStore((s) => s.purchases);
	const setGlobalPurchases = useStoreStore((s) => s.setPurchases);
	const globalStore = useStoreStore((s) => s.store);
	const setGlobalStore = useStoreStore((s) => s.setStore);
	const globalProducts = useStoreStore((s) => s.products);
	const setGlobalProducts = useStoreStore((s) => s.setProducts);
	const globalSuppliers = useStoreStore((s) => s.suppliers);
	const setGlobalSuppliers = useStoreStore((s) => s.setSuppliers);
	const availableStores = useStoreStore((s) => s.availableStores);
	const setAvailableStores = useStoreStore((s) => s.setAvailableStores);
	const effectiveUser = useStoreStore((s) => s.effectiveUser);

	const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
	const [customerMap, setCustomerMap] = useState<Record<string, string>>({});
	const [supplierMap, setSupplierMap] = useState<Record<string, string>>({});
	const [loading, setLoading] = useState(true);

	// Notification popup state
	const [showNotifications, setShowNotifications] = useState(false);
	const [showStorePicker, setShowStorePicker] = useState(false);
	const [showAddStore, setShowAddStore] = useState(false);
	const [newStoreTitle, setNewStoreTitle] = useState("");
	const [savingStore, setSavingStore] = useState(false);
	const [storeError, setStoreError] = useState("");

	useEffect(() => {
		async function loadData() {
			if (effectiveUser === undefined) return;

			const isAdmin = effectiveUser?.role === "Admin";
			const assignedStoreId = effectiveUser?.storeId || null;
			let txs = globalTransactions;
			let custs = globalCustomers;
			let purs = globalPurchases;
			let store = globalStore;
			let prods = globalProducts;
			let sups = globalSuppliers;
			let stores = availableStores;

			if (txs === undefined || custs === undefined || purs === undefined || store === undefined || prods === undefined || sups === undefined || stores === undefined) {
				const savedStoreId = isAdmin
					? localStorage.getItem("currentStoreId")
					: assignedStoreId;
				const qs = savedStoreId ? `?storeId=${savedStoreId}` : "";

				const [txRes, custRes, purRes, storeRes, prodRes, supRes] = await Promise.all([
					fetch(`/api/transactions${qs}`),
					fetch(`/api/customers`), // Customers usually global for admin, but can append qs if needed
					fetch(`/api/purchases${qs}`),
					fetch(`/api/stores`), // We fetch all available stores
					fetch(`/api/products`),
					fetch(`/api/suppliers`),
				]);
				txs = await parseApiArray(txRes);
				custs = await parseApiArray(custRes);
				purs = await parseApiArray(purRes);
				const fetchedStores = await parseApiArray<StoreType>(storeRes);
				stores = isAdmin
					? fetchedStores
					: fetchedStores.filter((s) => s._id === assignedStoreId);
				prods = await parseApiArray(prodRes);
				sups = await parseApiArray(supRes);

				// Determine active store
				if (stores.length > 0) {
					if (savedStoreId) {
						store = stores.find((s: any) => s._id === savedStoreId) || stores[0];
					} else {
						store = stores[0];
						if (store?._id) localStorage.setItem("currentStoreId", store?._id);
						else store = null;
					}
				} else {
					store = null;
				}

				setAvailableStores(stores || []);
				setGlobalTransactions(txs || []);
				setGlobalCustomers(custs || []);
				setGlobalPurchases(purs || []);
				setGlobalStore(store);
				setGlobalProducts(prods || []);
				setGlobalSuppliers(sups || []);
			}

			const cMap: Record<string, string> = {};
			(custs || []).forEach((c: any) => { cMap[c._id] = c.name; });
			setCustomerMap(cMap);

			const sMap: Record<string, string> = {};
			(sups || []).forEach((s: any) => { sMap[s._id] = s.name; });
			setSupplierMap(sMap);

			const pMap: Record<string, any> = {};
			(prods || []).forEach((p: any) => { pMap[p._id] = p; });

			const storesForTotals = isAdmin
				? stores || (store ? [store] : [])
				: store
					? [store]
					: [];
			const activeStoreId = store?._id;
			const activeTransactions = activeStoreId
				? (txs || []).filter((tx: any) => tx.storeId === activeStoreId)
				: (txs || []);
			const activePurchases = activeStoreId
				? (purs || []).filter((pur: any) => pur.storeId === activeStoreId)
				: (purs || []);

			let allStoreTransactions = txs || [];
			let allStorePurchases = purs || [];
			if (isAdmin && storesForTotals.length > 1) {
				const [allTxRes, allPurRes] = await Promise.all([
					fetch("/api/transactions"),
					fetch("/api/purchases"),
				]);
				allStoreTransactions = await parseApiArray(allTxRes);
				allStorePurchases = await parseApiArray(allPurRes);
			}

			const storeMoneyTotals = storesForTotals
				.filter((s: StoreType) => Boolean(s._id))
				.map((s: StoreType) => {
					const storeId = s._id!;
					const moneyIn = allStoreTransactions
						.filter((tx: any) => tx.storeId === storeId)
						.reduce((sum: number, tx: any) => sum + (tx.paidPrice || 0), 0);
					const moneyOut = allStorePurchases
						.filter((pur: any) => pur.storeId === storeId)
						.reduce((sum: number, pur: any) => sum + (pur.totalPrice || 0), 0);

					return {
						storeId,
						title: s.title,
						moneyIn,
						moneyOut,
						isCurrent: storeId === activeStoreId,
					};
				});

			let totalCurrentProfit = 0;
			let totalIdealProfit = 0;
			let totalDebits = 0;
			let totalSelfDebit = 0;
			let totalSpentPurchases = 0;
			let totalGainedTransactions = 0;
			const debitTxs: any[] = [];
			const chartMap: Record<string, any> = {};

			activeTransactions.forEach((tx: any) => {
				let totalCost = 0;
				let totalGross = 0;

				tx.products?.forEach((p: any) => {
					totalCost += p.unitBuyingPrice * p.amount;
					totalGross += p.unitPrice * p.amount;
				});

				const idealProfit = totalGross - totalCost;
				const currentProfit = tx.paidPrice - totalCost; // What we actually made right now

				totalIdealProfit += idealProfit;
				totalCurrentProfit += currentProfit;
				totalGainedTransactions += tx.paidPrice;

				const debit = tx.totalPrice - tx.paidPrice;
				if (debit > 0) {
					totalDebits += debit;
					debitTxs.push({ ...tx, debit });
				}

				const dateStr = new Date(tx.createdAt).toLocaleDateString(undefined, {
					month: 'short', day: 'numeric'
				});

				if (!chartMap[dateStr]) {
					chartMap[dateStr] = { date: dateStr, currentProfit: 0, idealProfit: 0 };
				}
				chartMap[dateStr].currentProfit += currentProfit;
				chartMap[dateStr].idealProfit += idealProfit;
			});

			const chartDataArr = Object.values(chartMap);
			const outOfStoreTransactions = activeTransactions.filter(
				(tx: TransactionType) => tx.isOutOfStore,
			);

				// Compute self debit from purchases
				const supplierDebits = isAdmin
					? activePurchases.filter((p: any) => p.paymentStatus !== "Paid")
					: [];
				activePurchases.forEach((pur: any) => {
					totalSpentPurchases += pur.totalPrice;
				});
				supplierDebits.forEach((pur: any) => {
					totalSelfDebit += (pur.totalPrice - pur.paidPrice);
				});

				const lowStock: any[] = [];
				const unapprovedItems: any[] = [];

				if (store?.inventory) {
					store.inventory.forEach((item: any) => {
						const prodName = pMap[item.productId]?.name || "Unknown Product";
						if (item.amount < 50) {
							lowStock.push({ ...item, name: prodName });
						}
						if (!item.approved) {
							unapprovedItems.push({ ...item, name: prodName });
						}
					});
				}

				// Calculate gradient offset for current profit (to color red below 0)
				const currentProfits = chartDataArr.map(d => d.currentProfit);
				const dataMax = Math.max(...currentProfits, 0);
				const dataMin = Math.min(...currentProfits, 0);
				let offset = 0;
				if (dataMax <= 0) {
					offset = 0; // all red
				} else if (dataMin >= 0) {
					offset = 1; // all green
				} else {
					offset = dataMax / (dataMax - dataMin);
				}

				setDashboardData({
					chartData: chartDataArr,
					totalCurrentProfit,
					totalIdealProfit,
					totalDebits,
					totalSelfDebit,
					totalSpentPurchases,
					totalGainedTransactions,
					storeMoneyTotals,
					debitTransactions: debitTxs.sort((a,b) => new Date(a.shouldBePaidBeforeDate).getTime() - new Date(b.shouldBePaidBeforeDate).getTime()),
						supplierDebits,
					outOfStoreTransactions,
					lowStock,
					unapprovedItems,
					gradientOffset: offset
				});
				setLoading(false);
		}

		loadData();
	}, [availableStores, globalTransactions, globalCustomers, globalPurchases, globalStore, globalProducts, globalSuppliers, effectiveUser, setGlobalTransactions, setGlobalCustomers, setGlobalPurchases, setGlobalStore, setGlobalProducts, setGlobalSuppliers, setAvailableStores]);

	if (loading || !dashboardData) {
		return (
			<div className="w-full h-full flex flex-col items-center justify-center p-6 text-theme-text opacity-70">
			<CgSpinner className="animate-spin text-4xl mb-4 text-theme-accent" />
			<p className="animate-pulse">Loading Dashboard Metrics...</p>
			</div>
		);
	}

	const { 
		chartData, 
		totalCurrentProfit, 
		totalIdealProfit, 
		totalDebits, 
		totalSelfDebit,
		totalSpentPurchases,
		totalGainedTransactions,
		storeMoneyTotals,
		debitTransactions,
		supplierDebits,
		outOfStoreTransactions,
		lowStock,
		unapprovedItems,
		gradientOffset
	} = dashboardData;
	const isAdmin = effectiveUser?.role === "Admin";

	const notificationCount =
		debitTransactions.length +
		(isAdmin ? supplierDebits.length : 0) +
		outOfStoreTransactions.length +
		lowStock.length +
		unapprovedItems.length;

	// const userName = "User"; // Public metadata allows any user

	const handleSelectStore = (store: StoreType) => {
		if (!store._id) return;
		localStorage.setItem("currentStoreId", store._id);
		setGlobalStore(store);
		setGlobalTransactions(undefined);
		setGlobalPurchases(undefined);
		setShowStorePicker(false);
		setLoading(true);
	};

	const handleCreateStore = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!newStoreTitle.trim()) return;
		setSavingStore(true);
		setStoreError("");

		try {
			const res = await fetch("/api/stores", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ title: newStoreTitle.trim(), inventory: [] }),
			});
			const created = await res.json();
			if (!res.ok) {
				setStoreError(created.error || "Failed to create store");
				return;
			}

			const updatedStores = [...(availableStores || []), created];
			setAvailableStores(updatedStores);
			localStorage.setItem("currentStoreId", created._id);
			setGlobalStore(created);
			setGlobalTransactions(undefined);
			setGlobalPurchases(undefined);
			setNewStoreTitle("");
			setShowAddStore(false);
			setLoading(true);
		} catch {
			setStoreError("Failed to create store");
		} finally {
			setSavingStore(false);
		}
	};

	return (
		<div className="w-full h-full flex flex-col gap-6 p-6 px-4 md:px-8 overflow-y-auto mb-[100px] scrollbar-hidden">

		{/* Top Header */}
		<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-theme-border/50 pb-6 pt-2">
		<div className="flex flex-col gap-1">
		<h1 className="text-3xl font-extrabold tracking-tight">
		Welcome back, <span className="text-theme-accent">{effectiveUser?.firstName || "User"}</span>!
		</h1>
		<p className="text-theme-text/50">Here is what's happening today in <span className="font-bold text-theme-accent">{globalStore?.title || "your store"}</span>.</p>
		</div>
		<div className="flex items-center gap-3">
		{isAdmin && (availableStores?.length ?? 0) > 0 && (
			<div className="relative">
			<button
			onClick={() => setShowStorePicker((v) => !v)}
			className="flex items-center gap-2 px-4 py-2 bg-theme-card border border-theme-border rounded-full font-medium hover:bg-theme-background transition-all"
			>
			<FiRefreshCw />
			{globalStore?.title || "Select Store"}
			<FiChevronDown className={`transition-transform ${showStorePicker ? "rotate-180" : ""}`} />
			</button>
			<AnimatePresence>
			{showStorePicker && (
				<>
				<div
				className="fixed inset-0 z-40"
				onClick={() => setShowStorePicker(false)}
				/>
				<motion.div
				initial={{ opacity: 0, y: -8 }}
				animate={{ opacity: 1, y: 0 }}
				exit={{ opacity: 0, y: -8 }}
				className="absolute right-0 top-full mt-2 z-50 min-w-[220px] bg-theme-card border border-theme-border/50 rounded-2xl shadow-xl overflow-hidden"
				>
				{availableStores!.map((s) => (
					<button
					key={s._id}
					onClick={() => handleSelectStore(s)}
					className={`w-full text-left px-4 py-3 hover:bg-theme-accent/10 transition-colors ${
						s._id === globalStore?._id
							? "bg-theme-accent/20 text-theme-accent font-bold"
							: "text-theme-text"
					}`}
					>
					{s.title}
					</button>
				))}
				{isAdmin && (
				<button
					onClick={() => { setShowStorePicker(false); setShowAddStore(true); }}
					className="w-full text-left px-4 py-3 border-t border-theme-border/50 text-theme-accent font-semibold hover:bg-theme-accent/10 transition-colors flex items-center gap-2"
				>
					<FiPlus /> Add Store
				</button>
				)}
				</motion.div>
				</>
			)}
			</AnimatePresence>
			</div>
		)}
		{isAdmin && (
		<button
			onClick={() => setShowAddStore(true)}
			className="flex items-center gap-2 px-4 py-2 bg-theme-accent/20 text-theme-accent rounded-full font-medium hover:bg-theme-accent hover:text-white transition-all"
		>
			<FiPlus />
			<span className="hidden sm:inline">Add Store</span>
		</button>
		)}
		<button 
		onClick={() => setShowNotifications(true)}
		className="relative p-3 bg-theme-card border border-theme-border rounded-full hover:bg-theme-background transition-all"
		>
		<FiBell className="text-xl" />
		{notificationCount > 0 && (
			<span className="absolute top-0 right-0 -mt-1 -mr-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white border-2 border-theme-background">
			{notificationCount}
			</span>
		)}
		</button>
		</div>
		</div>

		{!globalStore && (
			<EmptyState
				title="No store yet"
				message="Create your first store to start tracking inventory, purchases, and transactions."
				action={isAdmin ? (
					<button
						onClick={() => setShowAddStore(true)}
						className="flex items-center gap-2 px-5 py-2.5 bg-theme-accent text-theme-background rounded-full font-semibold hover:opacity-90 transition-all"
					>
						<FiPlus /> Create Store
					</button>
				) : undefined}
			/>
		)}

		{/* Summary Overview */}
		<motion.div
		initial={{ opacity: 0, y: 20 }}
		animate={{ opacity: 1, y: 0 }}
		className="w-full bg-theme-card p-8 rounded-3xl shadow-xl border border-theme-border/30"
		>
		<div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
		<div className="flex flex-col gap-2">
		<span className="font-bold tracking-widest text-xs uppercase text-theme-accent">Financial Overview</span>
		<h2 className="text-2xl font-extrabold tracking-tight">Money In &amp; Out</h2>
		<p className="text-theme-text/50 text-sm">Current totals for {globalStore?.title || "this store"}</p>
			</div>
		<div className="flex flex-col sm:flex-row gap-8 sm:gap-16">
		<div className="flex flex-col gap-1">
		<span className="text-theme-text/50 text-xs uppercase tracking-wider font-semibold">Current Money Out</span>
		<span className="text-4xl lg:text-5xl font-extrabold text-orange-400 tracking-tighter">
		${totalSpentPurchases.toLocaleString(undefined, { minimumFractionDigits: 2 })}
		</span>
		</div>
		<div className="hidden sm:block w-px bg-theme-border/50" />
		<div className="flex flex-col gap-1">
		<span className="text-theme-text/50 text-xs uppercase tracking-wider font-semibold">Current Money In</span>
		<span className="text-4xl lg:text-5xl font-extrabold text-emerald-400 tracking-tighter">
		${totalGainedTransactions.toLocaleString(undefined, { minimumFractionDigits: 2 })}
		</span>
		</div>
		</div>
		</div>
		{storeMoneyTotals.length > 0 && (
			<div className="mt-8 pt-6 border-t border-theme-border/50">
				<div className="flex items-center justify-between gap-4 mb-4">
					<h3 className="text-sm font-black uppercase tracking-widest text-theme-text/60">
						Stores
					</h3>
					<span className="text-xs text-theme-text/40">
						Money in and out by store
					</span>
				</div>
				<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
					{storeMoneyTotals.map((storeTotal) => (
						<div
							key={storeTotal.storeId}
							className={`rounded-2xl border p-4 bg-theme-background/35 ${
								storeTotal.isCurrent
									? "border-theme-accent/60 shadow-[0_0_20px_rgba(34,211,238,0.08)]"
									: "border-theme-border/40"
							}`}
						>
							<div className="flex items-center justify-between gap-3 mb-3">
								<span className="font-bold truncate">{storeTotal.title}</span>
								{storeTotal.isCurrent && (
									<span className="text-[10px] uppercase tracking-widest text-theme-accent font-black">
										Current
									</span>
								)}
							</div>
							<div className="grid grid-cols-2 gap-3">
								<div className="flex flex-col gap-1">
									<span className="text-[10px] uppercase tracking-widest text-theme-text/40 font-bold">
										Money In
									</span>
									<span className="text-lg font-black text-emerald-400">
										${storeTotal.moneyIn.toLocaleString(undefined, { minimumFractionDigits: 2 })}
									</span>
								</div>
								<div className="flex flex-col gap-1">
									<span className="text-[10px] uppercase tracking-widest text-theme-text/40 font-bold">
										Money Out
									</span>
									<span className="text-lg font-black text-orange-400">
										${storeTotal.moneyOut.toLocaleString(undefined, { minimumFractionDigits: 2 })}
									</span>
								</div>
							</div>
						</div>
					))}
				</div>
			</div>
		)}
		</motion.div>

		{/* Header Stat Cards */}
		<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full">
		<motion.div 
		initial={{ opacity: 0, y: 20 }}
		animate={{ opacity: 1, y: 0 }}
		className="flex flex-col bg-theme-card p-6 rounded-3xl shadow-lg border border-theme-border/30"
		>
		<div className="flex justify-between items-start mb-2">
		<div className="flex flex-col gap-1">
		<span className="font-bold tracking-widest text-xs uppercase text-emerald-400">Current Profit</span>
		<span className="text-theme-text/40 text-[10px] uppercase">Based on actual paid</span>
		</div>
		<div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl">
		<FiTrendingUp className="text-xl" />
		</div>
		</div>
		<h2 className="text-3xl lg:text-4xl font-extrabold text-theme-text tracking-tighter mt-2">
		${totalCurrentProfit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
		</h2>
		</motion.div>

		<motion.div 
		initial={{ opacity: 0, y: 20 }}
		animate={{ opacity: 1, y: 0 }}
		transition={{ delay: 0.1 }}
		className="flex flex-col bg-theme-card p-6 rounded-3xl shadow-lg border border-theme-border/30"
		>
		<div className="flex justify-between items-start mb-2">
		<div className="flex flex-col gap-1">
		<span className="font-bold tracking-widest text-xs uppercase text-sky-400">Ideal Profit</span>
		<span className="text-theme-text/40 text-[10px] uppercase">Assuming full payment</span>
		</div>
		<div className="p-3 bg-sky-500/10 text-sky-400 rounded-xl">
		<FiTrendingUp className="text-xl" />
		</div>
		</div>
		<h2 className="text-3xl lg:text-4xl font-extrabold text-theme-text tracking-tighter mt-2">
		${totalIdealProfit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
		</h2>
		</motion.div>

		<motion.div 
		initial={{ opacity: 0, y: 20 }}
		animate={{ opacity: 1, y: 0 }}
		transition={{ delay: 0.2 }}
		className="flex flex-col bg-theme-card p-6 rounded-3xl shadow-lg border border-theme-border/30"
		>
		<div className="flex justify-between items-start mb-2">
		<div className="flex flex-col gap-1">
		<span className="font-bold tracking-widest text-xs uppercase text-red-400">Cust. Debits</span>
		<span className="text-theme-text/40 text-[10px] uppercase">Total outstanding</span>
		</div>
		<div className="p-3 bg-red-500/10 text-red-400 rounded-xl">
		<FiDollarSign className="text-xl" />
		</div>
		</div>
		<h2 className="text-3xl lg:text-4xl font-extrabold text-theme-text tracking-tighter mt-2">
		${totalDebits.toLocaleString(undefined, { minimumFractionDigits: 2 })}
		</h2>
		</motion.div>

		{isAdmin && (
		<motion.div 
		initial={{ opacity: 0, y: 20 }}
		animate={{ opacity: 1, y: 0 }}
		transition={{ delay: 0.3 }}
		className="flex flex-col bg-theme-card p-6 rounded-3xl shadow-lg border border-theme-border/30"
		>
		<div className="flex justify-between items-start mb-2">
		<div className="flex flex-col gap-1">
		<span className="font-bold tracking-widest text-xs uppercase text-orange-400">Self Debits</span>
		<span className="text-theme-text/40 text-[10px] uppercase">To Suppliers</span>
		</div>
		<div className="p-3 bg-orange-500/10 text-orange-400 rounded-xl">
		<FiTrendingDown className="text-xl" />
		</div>
		</div>
		<h2 className="text-3xl lg:text-4xl font-extrabold text-theme-text tracking-tighter mt-2">
		${totalSelfDebit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
		</h2>
		</motion.div>
		)}
		</div>

		{/* Main Chart Section */}
		<motion.div 
		initial={{ opacity: 0, scale: 0.98 }}
		animate={{ opacity: 1, scale: 1 }}
		transition={{ delay: 0.4 }}
		className="w-full flex flex-col xl:flex-row gap-6 mt-4"
		>
		{/* Current Profit Chart (Changes to red if < 0) */}
		<div className="flex-1 min-w-0 h-[350px] bg-theme-card p-6 rounded-3xl shadow-xl flex flex-col border border-theme-border/30">
		<div className="flex items-center gap-3 mb-6">
		<div className="w-3 h-3 rounded-full bg-emerald-500"></div>
		<h3 className="text-lg font-bold tracking-wide">Current Profit</h3>
		</div>
		<div className="flex-1 w-full min-h-0">
		<ResponsiveContainer width="100%" height="100%">
		<AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
		<defs>
		<linearGradient id="splitColor" x1="0" y1="0" x2="0" y2="1">
		<stop offset={gradientOffset} stopColor="#10b981" stopOpacity={0.8}/>
		<stop offset={gradientOffset} stopColor="#ef4444" stopOpacity={0.8}/>
		</linearGradient>
		</defs>
		<CartesianGrid strokeDasharray="3 3" stroke="var(--borderCol)" vertical={false} />
		<XAxis dataKey="date" stroke="var(--fg)" opacity={0.5} tickLine={false} axisLine={false} />
		<YAxis stroke="var(--fg)" opacity={0.5} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
		<Tooltip 
		contentStyle={{ backgroundColor: 'var(--cardBg)', borderRadius: '12px', border: '1px solid var(--borderCol)', backdropFilter: 'blur(10px)' }}
		itemStyle={{ color: 'var(--fg)' }}
		/>
		<Area type="monotone" dataKey="currentProfit" stroke="url(#splitColor)" strokeWidth={3} fillOpacity={0.3} fill="url(#splitColor)" />
		</AreaChart>
		</ResponsiveContainer>
		</div>
		</div>

		{/* Ideal Profit Chart */}
		<div className="flex-1 min-w-0 h-[350px] bg-theme-card p-6 rounded-3xl shadow-xl flex flex-col border border-theme-border/30">
		<div className="flex items-center gap-3 mb-6">
		<div className="w-3 h-3 rounded-full bg-sky-500"></div>
		<h3 className="text-lg font-bold tracking-wide">Ideal Profit</h3>
		</div>
		<div className="flex-1 w-full min-h-0">
		<ResponsiveContainer width="100%" height="100%">
		<AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
		<defs>
		<linearGradient id="colorIdeal" x1="0" y1="0" x2="0" y2="1">
		<stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.6}/>
		<stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
		</linearGradient>
		</defs>
		<CartesianGrid strokeDasharray="3 3" stroke="var(--borderCol)" vertical={false} />
		<XAxis dataKey="date" stroke="var(--fg)" opacity={0.5} tickLine={false} axisLine={false} />
		<YAxis stroke="var(--fg)" opacity={0.5} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
		<Tooltip 
		contentStyle={{ backgroundColor: 'var(--cardBg)', borderRadius: '12px', border: '1px solid var(--borderCol)', backdropFilter: 'blur(10px)' }}
		itemStyle={{ color: 'var(--fg)' }}
		/>
		<Area type="monotone" dataKey="idealProfit" stroke="#0ea5e9" strokeWidth={3} fillOpacity={1} fill="url(#colorIdeal)" />
		</AreaChart>
		</ResponsiveContainer>
		</div>
		</div>
		</motion.div>

		{/* Notifications Modal */}
		<AnimatePresence>
		{showNotifications && (
			<div className="fixed inset-0 z-[100] flex items-center justify-end">
			<motion.div
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
			exit={{ opacity: 0 }}
			className="absolute inset-0 bg-black/60 backdrop-blur-sm"
			onClick={() => setShowNotifications(false)}
			/>
			<motion.div
			initial={{ x: "100%" }}
			animate={{ x: 0 }}
			exit={{ x: "100%" }}
			transition={{ type: "spring", damping: 25, stiffness: 200 }}
			className="bg-theme-background relative z-10 w-full max-w-md h-full shadow-2xl flex flex-col"
			>
			<div className="flex justify-between items-center bg-theme-background p-6 border-b border-theme-border/50 sticky top-0 z-20">
			<h3 className="text-2xl font-black tracking-tight flex items-center gap-3">
			<FiBell /> Notifications
			</h3>
			<button
			onClick={() => setShowNotifications(false)}
			className="p-2 bg-theme-card rounded-full text-theme-text/60 hover:text-theme-text hover:bg-theme-border"
			>
			<FiX />
			</button>
			</div>

			<div className="flex flex-col p-6 gap-8 overflow-y-auto w-full h-full pb-20">

			{notificationCount === 0 && (
				<div className="text-center font-bold text-theme-text/50 mt-10">
				All caught up! No notifications.
					</div>
			)}

			{/* Out of Store Transactions */}
			{outOfStoreTransactions.length > 0 && (
				<div className="flex flex-col gap-3">
				<div className="flex items-center gap-2 border-b border-theme-border/50 pb-2 mb-2">
				<FiAlertTriangle className="text-red-400 text-lg" />
				<h4 className="font-bold uppercase tracking-wider text-sm flex-1">Out of Store Sales</h4>
				<span className="bg-red-500/20 text-red-500 text-xs font-black px-2 py-0.5 rounded-full">{outOfStoreTransactions.length}</span>
				</div>
				{outOfStoreTransactions.map(tx => (
					<div key={tx._id} className="bg-red-500/10 rounded-xl p-3 border-l-4 border-red-500 flex flex-col gap-1 text-sm">
					<div className="flex justify-between">
					<span className="font-bold truncate max-w-[200px]">{customerMap[tx.customerId]}</span>
					<span className="font-bold text-red-400">${tx.totalPrice.toLocaleString()}</span>
					</div>
					<div className="text-theme-text/50 text-xs">
					{/* FIX: touched here */}
					{new Date(tx.createdAt || "").toLocaleDateString()} &middot; Sold beyond inventory
					</div>
					</div>
				))}
				</div>
			)}

			{/* Debits from Customers */}
			{debitTransactions.length > 0 && (
				<div className="flex flex-col gap-3">
				<div className="flex items-center gap-2 border-b border-theme-border/50 pb-2 mb-2">
				<FiDollarSign className="text-red-400 text-lg" />
				<h4 className="font-bold uppercase tracking-wider text-sm flex-1">Customer Debits</h4>
				<span className="bg-red-500/20 text-red-500 text-xs font-black px-2 py-0.5 rounded-full">{debitTransactions.length}</span>
				</div>
				{debitTransactions.map(tx => (
					<div key={tx._id} className="bg-theme-card rounded-xl p-3 border-l-4 border-red-500 flex flex-col gap-1 text-sm">
					<div className="flex justify-between">
					<span className="font-bold truncate max-w-[200px]">{customerMap[tx.customerId]}</span>
					<span className="font-bold text-red-400">${tx.debit.toLocaleString()}</span>
					</div>
					<div className="text-theme-text/50 text-xs">Due: {tx.shouldBePaidBeforeDate ? new Date(tx.shouldBePaidBeforeDate).toLocaleDateString() : 'N/A'}</div>
					</div>
				))}
				</div>
			)}

			{/* Debits to Suppliers */}
			{isAdmin && supplierDebits.length > 0 && (
				<div className="flex flex-col gap-3">
				<div className="flex items-center gap-2 border-b border-theme-border/50 pb-2 mb-2">
				<FiAlertCircle className="text-orange-400 text-lg" />
				<h4 className="font-bold uppercase tracking-wider text-sm flex-1">Supplier Payables</h4>
				<span className="bg-orange-500/20 text-orange-500 text-xs font-black px-2 py-0.5 rounded-full">{supplierDebits.length}</span>
				</div>
				{supplierDebits.map(pur => (
					<div key={pur._id} className="bg-theme-card rounded-xl p-3 border-l-4 border-orange-500 flex flex-col gap-1 text-sm">
					<div className="flex justify-between">
					<span className="font-bold truncate max-w-[200px]">{supplierMap[pur.supplierId]}</span>
					<span className="font-bold text-orange-400">${(pur.totalPrice - pur.paidPrice).toLocaleString()}</span>
					</div>
					<div className="text-theme-text/50 text-xs">Due: {pur.shouldBePaidBeforeDate ? new Date(pur.shouldBePaidBeforeDate).toLocaleDateString() : 'N/A'}</div>
					</div>
				))}
				</div>
			)}

			{/* Low Stock */}
			{lowStock.length > 0 && (
				<div className="flex flex-col gap-3">
				<div className="flex items-center gap-2 border-b border-theme-border/50 pb-2 mb-2">
				<FiPackage className="text-yellow-400 text-lg" />
				<h4 className="font-bold uppercase tracking-wider text-sm flex-1">Low Stock Warning</h4>
				<span className="bg-yellow-500/20 text-yellow-500 text-xs font-black px-2 py-0.5 rounded-full">{lowStock.length}</span>
				</div>
				{lowStock.map(item => (
					<div key={item.productId} className="bg-theme-card rounded-xl p-3 border-l-4 border-yellow-500 flex justify-between items-center text-sm">
					<span className="font-bold truncate">{item.name}</span>
					<span className="font-mono bg-theme-background px-2 py-1 rounded text-xs">{item.amount} units</span>
					</div>
				))}
				</div>
			)}

			{/* Unapproved Items */}
			{unapprovedItems.length > 0 && (
				<div className="flex flex-col gap-3">
				<div className="flex items-center gap-2 border-b border-theme-border/50 pb-2 mb-2">
				<FiCheckCircle className="text-sky-400 text-lg" />
				<h4 className="font-bold uppercase tracking-wider text-sm flex-1">Pending Approvals</h4>
				<span className="bg-sky-500/20 text-sky-500 text-xs font-black px-2 py-0.5 rounded-full">{unapprovedItems.length}</span>
				</div>
				{unapprovedItems.map(item => (
					<div key={item.productId} className="bg-theme-card rounded-xl p-3 border-l-4 border-sky-500 flex justify-between items-center text-sm">
					<span className="font-bold truncate">{item.name}</span>
					<span className="text-sky-400 italic text-xs">Awaiting Approval in Store</span>
					</div>
				))}
				</div>
			)}

			</div>
			</motion.div>
			</div>
		)}
		</AnimatePresence>

		{/* Add Store Modal */}
		<AnimatePresence>
			{isAdmin && showAddStore && (
				<div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						className="absolute inset-0 bg-black/60 backdrop-blur-sm"
						onClick={() => setShowAddStore(false)}
					/>
					<motion.div
						initial={{ opacity: 0, scale: 0.9, y: 20 }}
						animate={{ opacity: 1, scale: 1, y: 0 }}
						exit={{ opacity: 0, scale: 0.9, y: 20 }}
						className="bg-theme-background relative z-10 w-full max-w-md rounded-3xl p-6 shadow-2xl flex flex-col gap-5"
					>
						<div className="flex justify-between items-center">
							<h3 className="text-2xl font-bold tracking-tight">New Store</h3>
							<button
								onClick={() => setShowAddStore(false)}
								className="p-2 bg-theme-card rounded-full text-theme-text/60 hover:text-theme-text"
							>
								<FiX />
							</button>
						</div>
						<form onSubmit={handleCreateStore} className="flex flex-col gap-4">
							<div className="flex flex-col gap-2">
								<label className="text-sm font-semibold text-theme-text/70 uppercase">
									Store Name
								</label>
								<input
									type="text"
									required
									value={newStoreTitle}
									onChange={(e) => setNewStoreTitle(e.target.value)}
									placeholder="e.g. Downtown Branch"
									className="p-3 rounded-xl bg-theme-card outline-none text-theme-text border border-theme-border/30 focus:border-theme-accent"
								/>
							</div>
							{storeError && (
								<p className="text-red-400 text-sm font-medium">{storeError}</p>
							)}
							<button
								type="submit"
								disabled={savingStore || !newStoreTitle.trim()}
								className="flex items-center justify-center gap-2 px-6 py-3 bg-theme-accent text-theme-background rounded-full font-bold hover:opacity-90 disabled:opacity-50 transition-all"
							>
								{savingStore ? <CgSpinner className="animate-spin" /> : <FiPlus />}
								Create Store
							</button>
						</form>
					</motion.div>
				</div>
			)}
		</AnimatePresence>

		</div>
	);
}
