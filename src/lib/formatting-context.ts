import type { OrgDateFormat } from "@/store/organization";

export interface FormattingContext {
  currency: string;
  dateFormat: OrgDateFormat;
  timezone: string;
}

const defaultContext: FormattingContext = {
  currency: "INR",
  dateFormat: "DD/MM/YYYY",
  timezone: "Asia/Kolkata",
};

let formattingContext: FormattingContext = defaultContext;

export function setFormattingContext(context: Partial<FormattingContext>) {
  formattingContext = { ...formattingContext, ...context };
}

export function getFormattingContext(): FormattingContext {
  return formattingContext;
}

export function getDateLocale(dateFormat: OrgDateFormat) {
  if (dateFormat === "MM/DD/YYYY") return "en-US";
  if (dateFormat === "YYYY-MM-DD") return "en-CA";
  return "en-GB";
}
