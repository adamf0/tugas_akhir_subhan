import { clsx } from "clsx";
import { twMerge } from "tailwind-merge"
import { geoService, ipService } from "@/Hooks/useGeo";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export async function getInformation() {
    const [geoRes, ipRes] = await Promise.all([
      geoService.getLocation(),
      ipService.getInfo()
    ]);

    // Keduanya harus sukses baru boleh merge & set
    if (!geoRes.success) throw geoRes.error;
    if (!ipRes.success) throw ipRes.error;

    return { ...geoRes.data, ...ipRes.data, time: new Date().toISOString().slice(0, 19).replace("T", " ")};
}