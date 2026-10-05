"use client";
import { useContext, useEffect, useState } from "react";
import { InstallContext } from "../components/AppSetup";
export default function InstallButton() {
  const {prompt,clearPrompt}=useContext(InstallContext);
  const [installed, setInstalled] = useState(false);
  useEffect(() => {
    const mode = window.matchMedia("(display-mode: standalone)");
    const update = () => setInstalled(mode.matches || (navigator as Navigator & {standalone?:boolean}).standalone === true);
    const accepted = () => setInstalled(true);
    update(); mode.addEventListener("change", update);
    window.addEventListener("appinstalled", accepted);
    return () => {mode.removeEventListener("change", update);window.removeEventListener("appinstalled", accepted);};
  }, []);
  if (installed) return <p role="status">You’re using DutyPerks from your home screen.</p>;
  if (!prompt) return <p>Use your browser’s home-screen option below. Some browsers offer an Install button after you’ve visited the app.</p>;
  return <button onClick={async () => {const current=prompt;clearPrompt();try{await current.prompt();await current.userChoice;}catch{/* Browser-menu instructions remain available. */}}}>Install DutyPerks</button>;
}
