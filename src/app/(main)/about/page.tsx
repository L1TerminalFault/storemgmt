"use client";

import { BsListNested } from "react-icons/bs";
import { FaCogs } from "react-icons/fa";
import { LuInfo } from "react-icons/lu";

export default function AboutPage() {
 return (
 <div className="md:p-10 p-3 pt-6 gap-8 h-full min-h-screen items-center w-full flex flex-col padding-bottom-safe">
 <div className="px-6 py-10 gap-9 text-lg bg-theme-card backdrop-blur-2xl //border border-theme-border rounded-[2rem] flex flex-col md:flex-row items-center shadow-lg w-full">
 <BsListNested className="shrink-0 text-theme-accent" size={50} />
 <div>
 <h2 className="text-2xl font-bold mb-2">StoreMgmt System</h2>
 <p className="text-theme-text/80 text-sm leading-relaxed">
 StoreMgmt helps you manage inventory, log supplier purchases, and process sales transactions. 
 It seamlessly handles underlying math calculations to ensure you always know your profit margins 
 and outstanding debit from clients.
 </p>
 </div>
 </div>
 
 <div className="bg-theme-card backdrop-blur-2xl gap-7 p-10 flex items-center rounded-3xl shadow-lg">
 <FaCogs className="shrink-0 text-theme-accent" size={50} />
 <div className="flex flex-col">
 <span className="text-xl font-bold">Configurable Settings</span>
 <span className="text-theme-text/70">Navigate to settings to change UI appearance, including custom backend imagery.</span>
 </div>
 </div>
 
 <div className="bg-theme-card gap-7 p-10 flex backdrop-blur-2xl items-center rounded-3xl shadow-lg">
 <LuInfo className="shrink-0 text-theme-accent" size={50} />
 <div className="flex flex-col">
 <span className="text-xl font-bold">Contact Support</span>
 <span className="text-theme-text/70">Please reach out for administrative permissions or if you notice discrepancies.</span>
 </div>
 </div>
 </div>
 );
}
