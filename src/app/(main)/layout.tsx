"use client";

import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import {useEffect} from "react";
import {redirect} from "next/navigation";

import TitleBar from "@/components/TitleBar";
import NavBar from "@/components/NavBar";

export default function MainLayout({
 children,
}: {
 children: Readonly<React.ReactNode>;
}) {

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
