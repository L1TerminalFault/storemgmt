"use client";

import { useThemeStore, defaultThemes } from "@/lib/theme";
import Link from "next/link";
import { motion } from "framer-motion";

export default function SettingsPage() {
 const { currentTheme, setTheme, updateCustomColor, updateCustomBackgroundImage } = useThemeStore();

 const containerVariants = {
 hidden: { opacity: 0 },
 show: {
 opacity: 1,
 transition: { staggerChildren: 0.1 },
 },
 };

 const itemVariants = {
 hidden: { opacity: 0, y: 10 },
 show: { opacity: 1, y: 0 },
 };

 const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
 const file = e.target.files?.[0];
 if (file) {
 const reader = new FileReader();
 reader.onloadend = () => {
 updateCustomBackgroundImage(reader.result as string);
 };
 reader.readAsDataURL(file);
 }
 };

 const presetImages = [
 { name: "Neon Cyberpunk", url: "https://images.unsplash.com/photo-1555680202-c86f0e12f086?q=80&w=2000&auto=format&fit=crop" },
 { name: "Deep Space", url: "https://images.unsplash.com/photo-1462331940025-496dfbfc7564?q=80&w=2000&auto=format&fit=crop" },
 { name: "Aurora", url: "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?q=80&w=2000&auto=format&fit=crop" },
 { name: "Soft Geometry", url: "https://images.unsplash.com/photo-1557683316-973673baf926?q=80&w=2000&auto=format&fit=crop" },
 { name: "Dark Fluid", url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2000&auto=format&fit=crop" }
 ];

 return (
 <div className="md:p-10 p-3 pt-6 gap-8 h-full items-center justify-center/ w-full flex flex-col mb-[100px] overflow-y-auto scrollbar-hidden">
 <div className="z-10 px-3 w-full flex justify-between items-center max-w-4xl">
 <div className="text-2xl font-bold">Theme Settings</div>
 </div>

 <motion.div
 variants={containerVariants}
 initial="hidden"
 animate="show"
 className="flex flex-col w-full h-fit gap-8 max-w-4xl"
 >
 <motion.div variants={itemVariants} className="bg-theme-card backdrop-blur-2xl //border border-theme-border rounded-3xl p-6 flex flex-col gap-4 shadow-lg w-full">
 <div className="text-xl font-bold tracking-wide">Presets</div>
 <div className="text-theme-text/70 text-sm">Select a curated theme palette.</div>
 
 <div className="flex flex-wrap gap-4 mt-2">
 {defaultThemes.map((theme) => (
 <button
 key={theme.id}
 onClick={() => setTheme(theme)}
 style={{
 backgroundColor: theme.bg,
 color: theme.fg,
 border: currentTheme.id === theme.id ? `3px solid ${theme.accent}` : "3px solid transparent",
 boxShadow: currentTheme.id === theme.id ? `0 0 15px ${theme.accent}60` : "none"
 }}
 className={`py-3 px-6 rounded-full transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2 font-semibold`}
 >
 {currentTheme.id === theme.id && <div className="w-2.5 h-2.5 rounded-full bg-theme-text shadow-sm" />}
 {theme.name}
 </button>
 ))}
 </div>
 
 <div className="flex w-full mt-8 gap-8 pb-4 flex-col md:flex-row">
 <div className="flex flex-col gap-3 flex-1 bg-theme-background/30 p-5 rounded-2xl">
 <div className="text-sm font-semibold uppercase tracking-wider opacity-70">Custom Base Color</div>
 <div className="flex gap-4 items-center">
 <input 
 type="color" 
 value={currentTheme.bg.startsWith("#") ? currentTheme.bg : "#000000"} 
 onChange={(e) => updateCustomColor(e.target.value)}
 className="h-16 w-16 outline-none border-0 p-0 cursor-pointer overflow-hidden border-transparent bg-transparent rounded-lg active:scale-[0.98] transition-transform duration-300"
 />
 <div className="text-theme-text font-mono tracking-widest bg-theme-background/50 px-5 py-3 rounded-full text-lg shadow-inner">
 {currentTheme.bg.startsWith("#") ? currentTheme.bg : "Custom"}
 </div>
 </div>
 </div>

 <div className="flex flex-col gap-3 flex-1 bg-theme-background/30 p-5 rounded-2xl">
 <div className="text-sm font-semibold uppercase tracking-wider opacity-70">Background Image</div>
 <div className="flex flex-col gap-3">
 <input 
 type="file" 
 accept="image/*"
 onChange={handleImageUpload}
 className="text-theme-text/80 font-mono file:bg-theme-accent file:border-none file:text-theme-background file:px-5 file:py-2.5 file:font-bold file:rounded-full file:cursor-pointer hover:file:opacity-80 transition-all text-sm w-full active:scale-[0.98] transition-transform duration-300"
 />

 <div className="flex flex-wrap gap-3 mt-3">
 {presetImages.map(img => (
 <div 
 key={img.name} 
 onClick={() => updateCustomBackgroundImage(img.url)}
 className="w-16 h-16 rounded-xl bg-cover bg-center cursor-pointer border-4 hover:opacity-80 transition-all active:scale-95 shadow-lg active:scale-[0.98] transition-transform duration-300"
 style={{ 
 backgroundImage: `url(${img.url})`, 
 borderColor: currentTheme.bgImage === img.url ? currentTheme.accent : 'transparent' 
 }}
 title={img.name}
 />
 ))}
 </div>

 {currentTheme.bgImage && (
 <button 
 onClick={() => updateCustomColor(currentTheme.bg)} 
 className="text-sm text-red-500 font-semibold text-left hover:text-red-400 w-fit mt-3 px-4 py-2 bg-red-500/10 rounded-full transition-colors"
 >
 Remove background image
 </button>
 )}
 </div>
 </div>
 </div>
 </motion.div>

 <motion.div variants={itemVariants} className="bg-theme-card backdrop-blur-2xl //border border-theme-border rounded-3xl p-6 flex flex-col gap-4 shadow-lg w-full">
 <div className="text-xl font-bold tracking-wide">About</div>
 <div className="flex flex-col gap-4">
 <Link href="/about" className="py-4 px-6 bg-theme-background/50 hover:bg-theme-accent/20 hover:border-theme-accent rounded-2xl flex items-center justify-between transition-all w-full text-lg font-semibold">
 <span>System Information</span>
 <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
 </Link>
 </div>
 </motion.div>

 </motion.div>
 </div>
 );
}
