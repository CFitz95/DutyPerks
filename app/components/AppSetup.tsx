"use client";
import { createContext, useEffect, useState } from "react";
export interface InstallPrompt extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{outcome:"accepted"|"dismissed"}>;
}
export const InstallContext=createContext<{prompt:InstallPrompt|null;clearPrompt:()=>void}>({prompt:null,clearPrompt:()=>{}});
export default function AppSetup({children}:{children:React.ReactNode}) {
  const [prompt,setPrompt]=useState<InstallPrompt|null>(null);
  useEffect(() => {
    const available=(event:Event)=>{event.preventDefault();setPrompt(event as InstallPrompt);};
    const installed=()=>setPrompt(null);
    window.addEventListener("beforeinstallprompt",available);
    window.addEventListener("appinstalled",installed);
    if ("serviceWorker" in navigator && (window.isSecureContext || window.location.hostname === "localhost")) {
      navigator.serviceWorker.register("/sw.js", {scope:"/",updateViaCache:"none"}).catch(() => {
        // Installation instructions remain available if registration is unsupported.
      });
    }
    return ()=>{window.removeEventListener("beforeinstallprompt",available);window.removeEventListener("appinstalled",installed);};
  }, []);
  return <InstallContext.Provider value={{prompt,clearPrompt:()=>setPrompt(null)}}>{children}</InstallContext.Provider>;
}
