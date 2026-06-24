"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { motion } from "framer-motion";
import { FiUsers, FiTrash2, FiUserPlus } from "react-icons/fi";
import { CgSpinner } from "react-icons/cg";
import Link from "next/link";
import { useStoreStore } from "@/lib/store";
import { isAdmin } from "@/lib/utils";

type StaffMember = {
	email: string;
	userId: string;
	storeId: string;
	name?: string;
};

export default function StaffSettingsPage() {
	const { user, isLoaded } = useUser();
	const availableStores = useStoreStore((s) => s.availableStores);
	const setAvailableStores = useStoreStore((s) => s.setAvailableStores);

	const [staff, setStaff] = useState<StaffMember[]>([]);
	const [email, setEmail] = useState("");
	const [storeId, setStoreId] = useState("");
	const [loading, setLoading] = useState(true);
	const [submitting, setSubmitting] = useState(false);
	const [error, setError] = useState("");
	const [success, setSuccess] = useState("");

	const userIsAdmin = isAdmin(user);

	useEffect(() => {
		if (!isLoaded) return;
		if (!userIsAdmin) {
			setLoading(false);
			return;
		}

		async function load() {
			try {
				const [staffRes, storesRes] = await Promise.all([
					fetch("/api/staff"),
					availableStores ? Promise.resolve(null) : fetch("/api/stores"),
				]);

				if (staffRes.ok) {
					setStaff(await staffRes.json());
				}

				if (storesRes) {
					const stores = await storesRes.json();
					setAvailableStores(stores);
					if (stores.length > 0) {
						setStoreId((prev) => prev || stores[0]._id);
					}
				} else if (availableStores?.length) {
					setStoreId((prev) => prev || availableStores[0]._id || "");
				}
			} catch {
				setError("Failed to load staff data");
			} finally {
				setLoading(false);
			}
		}

		load();
	}, [isLoaded, userIsAdmin, availableStores, setAvailableStores]);

	const handleAssign = async (e: React.FormEvent) => {
		e.preventDefault();
		setError("");
		setSuccess("");
		setSubmitting(true);

		try {
			const res = await fetch("/api/staff", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ email, storeId }),
			});
			const data = await res.json();

			if (!res.ok) {
				setError(data.error || "Failed to assign user");
				return;
			}

			setStaff((prev) => [
				...prev.filter((s) => s.userId !== data.assignment.userId),
				data.assignment,
			]);
			setEmail("");
			setSuccess(`Assigned ${data.assignment.email} successfully`);
		} catch {
			setError("Failed to assign user");
		} finally {
			setSubmitting(false);
		}
	};

	const handleRemove = async (userId: string) => {
		setError("");
		setSuccess("");

		try {
			const res = await fetch(`/api/staff?userId=${userId}`, { method: "DELETE" });
			if (!res.ok) {
				const data = await res.json();
				setError(data.error || "Failed to remove user");
				return;
			}

			setStaff((prev) => prev.filter((s) => s.userId !== userId));
			setSuccess("Staff member removed");
		} catch {
			setError("Failed to remove user");
		}
	};

	const storeName = (id: string) =>
		availableStores?.find((s) => s._id === id)?.title || id;

	if (!isLoaded || loading) {
		return (
			<div className="w-full h-full flex items-center justify-center p-6">
				<CgSpinner className="animate-spin text-4xl text-theme-accent" />
			</div>
		);
	}

	if (!userIsAdmin) {
		return (
			<div className="md:p-10 p-3 pt-6 w-full flex flex-col items-center gap-4 mb-[100px]">
				<p className="text-theme-text/60">Only admins can manage staff assignments.</p>
				<Link href="/settings" className="text-theme-accent hover:underline">
					Back to Settings
				</Link>
			</div>
		);
	}

	return (
		<div className="md:p-10 p-3 pt-6 gap-8 h-full w-full flex flex-col mb-[100px] overflow-y-auto scrollbar-hidden">
			<div className="z-10 px-3 w-full flex justify-between items-center max-w-4xl mx-auto">
				<div>
					<Link href="/home" className="text-theme-text/50 text-sm hover:text-theme-accent">
						← Back
					</Link>
					<div className="text-2xl font-bold mt-1 flex items-center gap-2">
						<FiUsers /> Team Management
					</div>
				</div>
			</div>

			<motion.div
				initial={{ opacity: 0, y: 10 }}
				animate={{ opacity: 1, y: 0 }}
				className="flex flex-col w-full gap-6 max-w-4xl mx-auto"
			>
				<div className="bg-theme-card backdrop-blur-2xl rounded-3xl p-6 flex flex-col gap-4 shadow-lg">
					<div className="text-xl font-bold tracking-wide">Assign Sales User</div>
					<p className="text-theme-text/70 text-sm">
						Enter the email of a user who has already signed up. They will get access to the selected store under your admin account.
					</p>

					<form onSubmit={handleAssign} className="flex flex-col gap-4">
						<input
							type="email"
							required
							placeholder="user@example.com"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							className="bg-theme-background/50 px-4 py-3 rounded-2xl outline-none border border-theme-border/30 focus:border-theme-accent"
						/>
						<select
							required
							value={storeId}
							onChange={(e) => setStoreId(e.target.value)}
							className="bg-theme-background/50 px-4 py-3 rounded-2xl outline-none border border-theme-border/30 focus:border-theme-accent"
						>
							{(availableStores || []).map((store) => (
								<option key={store._id} value={store._id}>
									{store.title}
								</option>
							))}
						</select>
						<button
							type="submit"
							disabled={submitting}
							className="flex items-center justify-center gap-2 bg-theme-accent text-theme-background font-bold py-3 px-6 rounded-full hover:opacity-90 transition-all disabled:opacity-50"
						>
							{submitting ? <CgSpinner className="animate-spin" /> : <FiUserPlus />}
							Assign to Store
						</button>
					</form>

					{error && <p className="text-red-400 text-sm font-medium">{error}</p>}
					{success && <p className="text-emerald-400 text-sm font-medium">{success}</p>}
				</div>

				<div className="bg-theme-card backdrop-blur-2xl rounded-3xl p-6 flex flex-col gap-4 shadow-lg">
					<div className="text-xl font-bold tracking-wide">Current Staff</div>

					{staff.length === 0 ? (
						<p className="text-theme-text/50 text-sm">No sales users assigned yet.</p>
					) : (
						<div className="flex flex-col gap-3">
							{staff.map((member) => (
								<div
									key={member.userId}
									className="flex items-center justify-between bg-theme-background/30 p-4 rounded-2xl"
								>
									<div className="flex flex-col gap-0.5">
										<span className="font-semibold">{member.name || member.email}</span>
										<span className="text-theme-text/50 text-sm">{member.email}</span>
										<span className="text-theme-accent text-xs font-medium">
											Store: {storeName(member.storeId)}
										</span>
									</div>
									<button
										onClick={() => handleRemove(member.userId)}
										className="p-2 text-red-400 hover:bg-red-500/10 rounded-full transition-colors"
										title="Remove staff member"
									>
										<FiTrash2 />
									</button>
								</div>
							))}
						</div>
					)}
				</div>
			</motion.div>
		</div>
	);
}
