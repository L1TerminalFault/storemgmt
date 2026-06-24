"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { CgSpinner } from "react-icons/cg";
import { FiArrowLeft, FiFileText, FiCheckCircle } from "react-icons/fi";
import { FaTableList as Table } from "react-icons/fa6";
import { TbLayoutList as UI } from "react-icons/tb";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

export default function TransactionDetailPage() {
	const params = useParams();
	const txId = params.id as string;

	const [transaction, setTransaction] = useState<any>(null);
	const [customerMap, setCustomerMap] = useState<Record<string, string>>({});
	const [productsMap, setProductsMap] = useState<Record<string, any>>({});
	const [loading, setLoading] = useState(true);
	const [listType, setListType] = useState<string>("ui");
	const [settingPaid, setSettingPaid] = useState(false);

	useEffect(() => {
		async function loadData() {
			const [txRes, custRes, prodRes] = await Promise.all([
				fetch("/api/transactions"),
				fetch("/api/customers"),
				fetch("/api/products"),
			]);
			const txData = await txRes.json();
			const custData = await custRes.json();
			const prodData = await prodRes.json();

			const cMap: Record<string, string> = {};
			custData.forEach((c: any) => {
				cMap[c._id] = c.name;
			});

			const pMap: Record<string, any> = {};
			prodData.forEach((p: any) => {
				pMap[p._id] = p;
			});

			const found = txData.find((t: any) => t._id === txId);
			setTransaction(found || null);
			setCustomerMap(cMap);
			setProductsMap(pMap);
			setLoading(false);
		}
		loadData();
	}, [txId]);

	const handleSetPaid = async () => {
		if (!transaction) return;
		setSettingPaid(true);

		const updatedTx = {
			...transaction,
			paidPrice: transaction.totalPrice,
			paymentStatus: "Paid"
		};

		await fetch("/api/transactions", {
			method: "PUT",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(updatedTx),
		});

		setTransaction(updatedTx);
		setSettingPaid(false);
	};

	if (loading) {
		return (
			<div className="w-full h-full flex flex-col items-center justify-center text-theme-text opacity-70">
				<CgSpinner className="animate-spin text-4xl mb-4 text-theme-accent" />
				<p className="animate-pulse">Loading Transaction...</p>
			</div>
		);
	}

	if (!transaction) {
		return (
			<div className="w-full h-full flex flex-col items-center justify-center gap-4 text-theme-text/50">
				<p className="text-lg">Transaction not found.</p>
				<Link
					href="/transactions"
					className="flex items-center gap-2 text-theme-accent hover:underline"
				>
					<FiArrowLeft /> Back to Transactions
				</Link>
			</div>
		);
	}

	const customerName =
		customerMap[transaction.customerId] || "Unknown Customer";

	return (
		<div className="w-full h-full flex flex-col gap-6 p-6 px-4 md:px-8 overflow-y-auto mb-[100px] scrollbar-hidden">
			{/* Back link */}
			<Link
				href="/transactions"
				className="flex items-center gap-2 text-theme-text/50 hover:text-theme-accent transition-colors w-fit"
			>
				<FiArrowLeft /> Back to Transactions
			</Link>

			{/* Header */}
			<div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-2">
				<div className="flex flex-col gap-2">
					<h2 className="text-3xl font-extrabold tracking-tight flex items-center gap-3">
						<FiFileText className="text-theme-accent" /> Transaction Detail
					</h2>
					<p className="text-theme-text/50">#{transaction._id}</p>
				</div>
				{/* View Toggle */}
				<div className="flex gap-2 p-1 bg-theme-background/30 rounded-full w-fit mb-1 border border-theme-border/30">
					<div
						onClick={() => setListType("ui")}
						className={`${listType === "ui" ? "shadow-lg bg-theme-accent text-white font-bold" : "text-theme-text/60 hover:text-theme-text"} p-3 rounded-full transition-all cursor-pointer`}
						title="Card UI View"
					>
						<UI className="size-5" />
					</div>
					<div
						onClick={() => setListType("table")}
						className={`${listType === "table" ? "shadow-lg bg-theme-accent text-white font-bold" : "text-theme-text/60 hover:text-theme-text"} p-3 rounded-full transition-all cursor-pointer`}
						title="Table Summary View"
					>
						<Table className="size-5" />
					</div>
				</div>
			</div>

			<AnimatePresence mode="wait">
				{listType === "ui" ? (
					<motion.div
						key="ui"
						initial={{ opacity: 0, y: 10 }}
						animate={{ opacity: 1, y: 0 }}
						exit={{ opacity: 0, y: -10 }}
						transition={{ duration: 0.2 }}
						className="flex flex-col gap-6"
					>
						{/* Transaction Summary Card */}
						<div className="bg-theme-card rounded-3xl p-6 shadow-xl backdrop-blur-xl border border-theme-border/50">
							<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 pb-6 border-b border-theme-border/50">
								<div className="flex flex-col gap-1">
									<span className="text-theme-text/50 text-sm font-semibold uppercase tracking-wider">Customer</span>
									<span className="text-2xl font-black">{customerName}</span>
								</div>
								{transaction.paymentStatus !== "Paid" && (
									<button
										onClick={handleSetPaid}
										disabled={settingPaid}
										className="flex items-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-white rounded-full font-bold transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)] disabled:opacity-50"
									>
										{settingPaid ? <CgSpinner className="animate-spin text-xl" /> : <FiCheckCircle className="text-xl" />}
										Set as Paid
									</button>
								)}
							</div>
							
							<div className="grid grid-cols-2 md:grid-cols-4 gap-6">
								<div className="flex flex-col gap-1">
									<span className="text-xs text-theme-text/50 uppercase tracking-wide font-bold">
										Date
									</span>
									<span className="text-base font-bold">
										{new Date(transaction.createdAt).toLocaleDateString()}
									</span>
								</div>
								<div className="flex flex-col gap-1">
									<span className="text-xs text-theme-text/50 uppercase tracking-wide font-bold">
										Status
									</span>
									<span
										className={`text-base font-bold ${
											transaction.paymentStatus === "Paid"
												? "text-emerald-400"
												: transaction.paymentStatus === "Partial"
													? "text-orange-400"
													: "text-red-400"
										}`}
									>
										{transaction.paymentStatus}
									</span>
								</div>
								<div className="flex flex-col gap-1">
									<span className="text-xs text-theme-text/50 uppercase tracking-wide font-bold">
										Deadline
									</span>
									<span className="text-base font-bold">
										{transaction.shouldBePaidBeforeDate ? new Date(transaction.shouldBePaidBeforeDate).toLocaleDateString() : "N/A"}
									</span>
								</div>
								<div className="flex flex-col gap-1">
									<span className="text-xs text-theme-text/50 uppercase tracking-wide font-bold">
										Out of Store
									</span>
									<span className="text-base font-bold">
										{transaction.isOutOfStore ? "Yes" : "No"}
									</span>
								</div>
							</div>

							{(transaction.comment || transaction.totalPrice !== undefined) && (
								<div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6 pt-6 border-t border-theme-border/50">
									<div className="flex flex-col gap-1">
										<span className="text-xs text-theme-text/50 uppercase tracking-wide font-bold">
											Comment
										</span>
										<span className="text-base italic text-theme-text/80 break-words">
											{transaction.comment || "—"}
										</span>
									</div>
									<div className="flex flex-col gap-1 md:items-end">
										<span className="text-xs text-theme-text/50 uppercase tracking-wide font-bold">
											Financials
										</span>
										<div className="flex items-center gap-3">
											<span className="text-2xl font-extrabold text-theme-text">
												${transaction.totalPrice.toLocaleString()}
											</span>
											<span className="text-xs px-2 py-1 bg-theme-background rounded-md text-theme-text/60">
												Paid: ${transaction.paidPrice.toLocaleString()}
											</span>
										</div>
									</div>
								</div>
							)}
						</div>

						{/* Products List */}
						<h3 className="text-xl font-bold mt-2 ml-1">
							Products ({transaction.products.length})
						</h3>
						<div className="flex flex-col gap-3">
							{transaction.products.map((p: any, idx: number) => {
								const product = productsMap[p.productId];
								const name =
									product?.name ?? `Product #${p.productId}`;
								return (
									<motion.div
										key={idx}
										initial={{ opacity: 0, y: 12 }}
										animate={{ opacity: 1, y: 0 }}
										transition={{
											delay: idx * 0.06,
											duration: 0.35,
										}}
										className="flex items-center gap-4 p-4 bg-theme-card rounded-2xl"
									>
										<div className="flex flex-col flex-1 min-w-0">
											<span className="font-bold text-base truncate">
												{name}
											</span>
											<span className="text-xs text-theme-text/50">
												Qty: {p.amount}
											</span>
										</div>
										<div className="flex flex-col items-end shrink-0 gap-0.5">
											<span className="text-base font-bold text-emerald-400">
												${p.unitPrice.toLocaleString()}
											</span>
											<span className="text-[10px] text-theme-text/40 uppercase">
												sell price
											</span>
										</div>
										<div className="flex flex-col items-end shrink-0 gap-0.5">
											<span className="text-base font-bold text-orange-400">
												${p.unitBuyingPrice.toLocaleString()}
											</span>
											<span className="text-[10px] text-theme-text/40 uppercase">
												buy price
											</span>
										</div>
									</motion.div>
								);
							})}
						</div>
					</motion.div>
				) : (
					<motion.div
						key="table"
						initial={{ opacity: 0, scale: 0.98 }}
						animate={{ opacity: 1, scale: 1 }}
						exit={{ opacity: 0, scale: 0.98 }}
						transition={{ duration: 0.2 }}
						className="bg-theme-card rounded-3xl p-6 shadow-xl backdrop-blur-xl border border-theme-border/50 overflow-hidden flex flex-col gap-6"
					>
						{/* Table mode now acts as a complete overview ticket */}
						<div className="flex items-center justify-between border-b border-theme-border/50 pb-4">
							<h3 className="text-2xl font-black">Invoice / Summary</h3>
							<div className="text-right">
								<div className="text-sm text-theme-text/50 font-mono">{new Date(transaction.createdAt).toLocaleDateString()}</div>
								<div className="font-mono text-xs text-theme-text/30">ID: {transaction._id}</div>
							</div>
						</div>

						<div className="grid grid-cols-2 gap-4">
							<div className="flex flex-col gap-1">
								<span className="text-xs text-theme-text/50 uppercase tracking-widest">Bill To</span>
								<span className="font-bold text-lg">{customerName}</span>
							</div>
							<div className="flex flex-col gap-1 items-end">
								<span className="text-xs text-theme-text/50 uppercase tracking-widest">Status / Action</span>
								{transaction.paymentStatus !== "Paid" ? (
									<button
										onClick={handleSetPaid}
										disabled={settingPaid}
										className="flex items-center gap-2 px-3 py-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 rounded-lg text-sm font-bold transition-all disabled:opacity-50 mt-1"
									>
										{settingPaid ? <CgSpinner className="animate-spin" /> : <FiCheckCircle/>} Set as Paid
									</button>
								) : (
									<span className="font-bold text-lg text-emerald-400 mt-1">{transaction.paymentStatus}</span>
								)}
							</div>
						</div>
						
						{transaction.comment && (
							<div className="bg-theme-background/50 p-3 rounded-lg border border-theme-border border-dashed text-sm">
								<span className="font-bold text-theme-text/70 uppercase text-xs block mb-1">Notes</span>
								{transaction.comment}
							</div>
						)}

						<div className="w-full overflow-x-auto mt-2">
							<table className="w-full text-left border-collapse min-w-[600px]">
								<thead>
									<tr className="text-theme-text/70 border-b-2 border-theme-border uppercase tracking-widest text-xs">
										<th className="p-3">Product</th>
										<th className="p-3 text-right">Qty</th>
										<th className="p-3 text-right">Cost (Buy)</th>
										<th className="p-3 text-right">Price (Sell)</th>
										<th className="p-3 text-right">Line Total</th>
										<th className="p-3 text-right">Profit</th>
									</tr>
								</thead>
								<tbody>
									{transaction.products.map(
										(p: any, idx: number) => {
											const product = productsMap[p.productId];
											const name =
												product?.name ??
												`Product #${p.productId}`;
											return (
												<tr
													key={idx}
													className={`${idx % 2 ? "" : "bg-theme-accent/5"} border-b border-theme-border/50 hover:bg-theme-accent/10 transition-colors font-mono text-sm`}
												>
													<td className="p-3 font-bold font-sans">
														{name}
													</td>
													<td className="p-3 text-right">
														{p.amount}
													</td>
													<td className="p-3 text-right text-theme-text/60">
														${p.unitBuyingPrice.toLocaleString()}
													</td>
													<td className="p-3 text-right">
														${p.unitPrice.toLocaleString()}
													</td>
													<td className="p-3 text-right font-bold">
														${(p.unitPrice * p.amount).toLocaleString()}
													</td>
													<td className="p-3 text-right text-emerald-400">
														${((p.unitPrice - p.unitBuyingPrice) * p.amount).toLocaleString()}
													</td>
												</tr>
											);
										},
									)}
								</tbody>
							</table>
						</div>

						<div className="flex flex-col items-end gap-1 mt-4 pt-4 border-t-2 border-theme-border">
							<div className="flex items-center justify-between w-64 text-sm text-theme-text/70">
								<span>Subtotal (Paid)</span>
								<span>${transaction.paidPrice.toLocaleString()}</span>
							</div>
							<div className="flex items-center justify-between w-64 font-black text-xl mt-2">
								<span>TOTAL</span>
								<span>${transaction.totalPrice.toLocaleString()}</span>
							</div>
							{transaction.totalPrice - transaction.paidPrice > 0 && (
								<div className="flex items-center justify-between w-64 text-red-400 font-bold mt-1">
									<span>Balance Due</span>
									<span>${(transaction.totalPrice - transaction.paidPrice).toLocaleString()}</span>
								</div>
							)}
						</div>
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
}
