import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { getDateLocale, getFormattingContext } from "@/lib/formatting-context";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency?: string) {
  const code = currency ?? getFormattingContext().currency;
  if (code === "INR") {
    if (amount >= 10000000) {
      return `₹${(amount / 10000000).toFixed(1)} Cr`;
    }
    if (amount >= 100000) {
      return `₹${(amount / 100000).toFixed(1)} L`;
    }
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: code,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatNumber(value: number) {
  return new Intl.NumberFormat("en-IN").format(value);
}

export function formatDate(date: string | Date) {
  const { dateFormat, timezone } = getFormattingContext();
  return new Intl.DateTimeFormat(getDateLocale(dateFormat), {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: timezone,
  }).format(new Date(date));
}

export function formatDateTime(date: string | Date) {
  const { dateFormat, timezone } = getFormattingContext();
  return new Intl.DateTimeFormat(getDateLocale(dateFormat), {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: timezone,
  }).format(new Date(date));
}

export function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}
