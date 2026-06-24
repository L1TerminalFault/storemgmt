"use client";

import { useState, useEffect } from "react";
import { CgSpinner } from "react-icons/cg";
import { FiFileText, FiAlertTriangle } from "react-icons/fi";
import Link from "next/link";
import { motion } from "framer-motion";
import { useStoreStore } from "@/lib/store";

type Tab = "all" | "outOfStore";

export default function TransactionsPage() {
	const transactions = useStoreStore((s) => s.transactions);
	const setTransactions = useStoreStore((s) => s.setTransactions);
	const customers = useStoreStore((s) => s.customers);
	const setCustomers = useStoreStore((s) => s.setCustomers);

	const [data, setData] = useState<any[]>([]);
	const [customerMap, setCustomerMap] = useState<Record<string, string>>({});
	const [loading, setLoading] = useState(true);
	const [activeTab, setActiveTab] = useState<Tab>("all");

	useEffect(() => {
		async function loadData() {
			let fetchedTransactions = transactions;
			let fetchedCustomers = customers;

			if (!fetchedTransactions || !fetchedCustomers) {
				const savedStoreId = localStorage.getItem("currentStoreId");
				const qs = savedStoreId ? `?storeId=${savedStoreId}` : "";
				const [txRes, custRes] = await Promise.all([
					fetch(`/api/transactions${qs}`),
					fetch("/api/customers"),
				]);
				fetchedTransactions = await txRes.json();
				fetchedCustomers = await custRes.json();

				setTransactions(fetchedTransactions || []);
				setCustomers(fetchedCustomers || []);
			}

			const cMap: Record<string, string> = {};
			if (fetchedCustomers) {
				fetchedCustomers.forEach((c: any) => {
					cMap[c._id] = c.name;
				});
			}

			setCustomerMap(cMap);
			setData(fetchedTransactions || []);
			setLoading(false);
		}
		loadData();
	}, [transactions, customers, setTransactions, setCustomers]);

	const outOfStoreData = data.filter((tx) => tx.isOutOfStore);
	const displayed = activeTab === "all" ? data : outOfStoreData;

	const tabs: { key: Tab; label: string; count: number }[] = [
		{ key: "all", label: "All", count: data.length },
		{ key: "outOfStore", label: "Out of Store", count: outOfStoreData.length },
	];

	return (
		<div className="w-full h-full flex flex-col gap-6 p-6 px-4 md:px-8 overflow-y-auto mb-[100px] scrollbar-hidden">
			<div className="flex flex-col gap-2 mb-2">
				<h2 className="text-3xl font-extrabold tracking-tight flex items-center gap-3">
					<FiFileText className="text-theme-accent" /> Transactions
				</h2>
				<p className="text-theme-text/50">
					{loading ? "Loading..." : `${data.length} transactions`}
					{!loading && outOfStoreData.length > 0 && (
						<span className="text-red-400 ml-2">
							&middot; {outOfStoreData.length} out of store
						</span>
					)}
				</p>
			</div>

			<div className="flex gap-2 p-1 bg-theme-card rounded-full w-fit">
				{tabs.map((tab) => (
					<button
						key={tab.key}
						onClick={() => setActiveTab(tab.key)}
						className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-medium transition-all duration-300 ${
							activeTab === tab.key
								? tab.key === "outOfStore"
									? "bg-red-500 text-white shadow-lg"
									: "bg-theme-accent text-white shadow-lg"
								: "text-theme-text/60 hover:text-theme-text"
						}`}
					>
						{tab.key === "outOfStore" && <FiAlertTriangle />}
						{tab.label}
						<span className="text-xs opacity-80">({tab.count})</span>
					</button>
				))}
			</div>

			{loading ? (
				<div className="flex flex-col w-full h-full items-center justify-center gap-4 text-theme-text/70 mt-20">
					<CgSpinner className="animate-spin text-4xl text-theme-accent" />
					<p className="animate-pulse">Loading Transactions...</p>
				</div>
			) : !displayed.length ? (
				<div className="w-full p-8 text-center border border-dashed border-theme-border rounded-xl text-theme-text/50">
					{activeTab === "outOfStore"
						? "No out-of-store transactions."
						: "No transactions found."}
				</div>
			) : (
				<div className="flex flex-col gap-3">
					{displayed.map((tx, idx) => {
						const isOos = tx.isOutOfStore;
						return (
							<motion.div
								key={tx._id}
								initial={{ opacity: 0, y: 12 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ delay: idx * 0.06, duration: 0.35 }}
							>
								<Link
									href={`/transactions/${tx._id}`}
									className={`flex items-center gap-4 p-4 rounded-2xl transition-all duration-300 cursor-pointer ${
										isOos
											? "bg-red-500/10 border border-red-500/25 hover:bg-red-500/15"
											: "bg-theme-card hover:bg-theme-card/80"
									}`}
								>
									<div className="flex flex-col flex-1 min-w-0">
										<span className="font-bold text-base truncate flex items-center gap-2">
											{customerMap[tx.customerId] || "Customer"}
											{isOos && (
												<span className="text-[10px] uppercase tracking-wider font-black text-red-400 bg-red-500/20 px-2 py-0.5 rounded-full">
													Out of Store
												</span>
											)}
										</span>
										<span className="text-xs text-theme-text/50 uppercase tracking-wide">
											{new Date(tx.createdAt).toLocaleDateString()}
										</span>
									</div>

									<div className="flex flex-col items-end shrink-0">
										<span
											className={`text-lg font-extrabold ${
												isOos ? "text-red-400" : "text-emerald-400"
											}`}
										>
											${tx.totalPrice.toLocaleString()}
										</span>
										<span className="text-[10px] text-theme-text/40 uppercase">
											Paid: ${tx.paidPrice.toLocaleString()}
										</span>
									</div>

									<div
										className={`px-3 py-1 rounded-full text-xs font-bold shrink-0 ${
											tx.paymentStatus === "Paid"
												? isOos
													? "bg-red-500/20 text-red-300"
													: "bg-emerald-500/20 text-emerald-400"
												: tx.paymentStatus === "Partial"
													? "bg-orange-500/20 text-orange-400"
													: "bg-red-500/20 text-red-400"
										}`}
									>
										{tx.paymentStatus}
									</div>
								</Link>
							</motion.div>
						);
					})}
				</div>
			)}
		</div>
	);
}
