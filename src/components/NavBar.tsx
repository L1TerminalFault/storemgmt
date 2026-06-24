"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, SVGProps, ReactNode } from "react";
import {
	FiHome,
	FiShoppingBag,
	FiUsers,
	FiFileText,
	FiSettings,
	FiUser,
} from "react-icons/fi";
import { useUser } from "@clerk/nextjs";

import { isAdmin } from "@/lib/utils";

type Route = {
	name: string;
	href: string;
	icon: (props: SVGProps<SVGSVGElement>) => ReactNode;
};

const routesAdmin: Route[] = [
	{ name: "Home", href: "/home", icon: (p) => <FiHome {...p} /> },
	{ name: "Store", href: "/store", icon: (p) => <FiShoppingBag {...p} /> },
	{ name: "Staff", href: "/settings/staff", icon: (p) => <FiUsers {...p} /> },
	{ name: "Transactions", href: "/transactions", icon: (p) => <FiFileText {...p} /> },
	{ name: "Settings", href: "/settings", icon: (p) => <FiSettings {...p} /> },
];

const routesSales: Route[] = [
	{ name: "Home", href: "/home", icon: (p) => <FiHome {...p} /> },
	{ name: "Customers", href: "/customers", icon: (p) => <FiUser {...p} /> },
	{ name: "Store", href: "/store", icon: (p) => <FiShoppingBag {...p} /> },
	{ name: "Transactions", href: "/transactions", icon: (p) => <FiFileText {...p} /> },
	{ name: "Settings", href: "/settings", icon: (p) => <FiSettings {...p} /> },
];

export default function NavBar() {
	const pathname = usePathname();
	const router = useRouter();
	const { user } = useUser();
	const [routes, setRoutes] = useState(routesSales);

	useEffect(() => {
		setRoutes(isAdmin(user) ? routesAdmin : routesSales);
	}, [user]);

	const isActive = (href: string) => {
		if (href === "/settings/staff") return pathname.startsWith("/settings/staff");
		if (href === "/settings") return pathname === "/settings";
		return pathname.startsWith(href);
	};

	return (
		<div className="fixed bottom-0 left-0 right-0 z-30 w-full">
			<div className="flex w-full items-stretch border-t border-theme-border/40 bg-theme-card/80 backdrop-blur-xl shadow-[0_-4px_24px_rgba(0,0,0,0.25)]">
				{routes.map((route) => {
					const active = isActive(route.href);
					return (
						<button
							key={route.href}
							type="button"
							onClick={() => router.push(route.href)}
							className={`relative flex flex-1 flex-col items-center justify-center gap-1 py-3 px-1 transition-all duration-200 ${
								active
									? "text-theme-accent bg-theme-accent/10"
									: "text-theme-text/45 hover:text-theme-text/80 hover:bg-theme-background/30"
							}`}
						>
							{active && (
								<span className="absolute top-0 left-1/2 -translate-x-1/2 h-0.5 w-8 rounded-full bg-theme-accent" />
							)}
							<route.icon className="text-xl" />
							<span className="text-[10px] md:text-xs font-semibold tracking-wide">
								{route.name}
							</span>
						</button>
					);
				})}
			</div>
		</div>
	);
}
