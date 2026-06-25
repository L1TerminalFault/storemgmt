"use client";

import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import { useEffect } from "react";

import TitleBar from "@/components/TitleBar";
import NavBar from "@/components/NavBar";
import { useStoreStore } from "@/lib/store";

export default function MainLayout({
 children,
}: {
 children: Readonly<React.ReactNode>;
}) {
 const effectiveUser = useStoreStore((s) => s.effectiveUser);
 const setEffectiveUser = useStoreStore((s) => s.setEffectiveUser);

 useEffect(() => {
 let ignore = false;

 async function loadEffectiveUser() {
 if (effectiveUser !== undefined) return;

 try {
 const res = await fetch("/api/auth/effective-user");
 const data = await res.json();
 if (!ignore) setEffectiveUser(data ?? null);
 } catch {
 if (!ignore) setEffectiveUser({ role: "Sales" });
 }
 }

 loadEffectiveUser();

 return () => {
 ignore = true;
 };
 }, [effectiveUser, setEffectiveUser]);

 return (
 <ClerkProvider
 afterSignOutUrl="/home"
 appearance={{
 theme: dark,
 }}
 >
 <TitleBar />
 <div className="min-h-screen -z-90 flex w-full bg-gray-900/10">
 <div className="py-20 h-full pb-20 flex-1 flex w-full">{children}</div>
 </div>
 <NavBar />
 </ClerkProvider>
 );
}
