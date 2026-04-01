import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function truncateAddress(addr: string): string {
  return addr.length > 15 ? `${addr.slice(0, 7)}…${addr.slice(-4)}` : addr
}
