import type { HTMLAttributes, InputHTMLAttributes, LabelHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const field = "w-full rounded-md border border-border bg-card px-3 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring";

export const Input = ({ className, ...p }: InputHTMLAttributes<HTMLInputElement>) => <input className={cn(field, className)} {...p} />;
export const Textarea = ({ className, ...p }: TextareaHTMLAttributes<HTMLTextAreaElement>) => <textarea className={cn(field, "min-h-28", className)} {...p} />;
export const Select = ({ className, ...p }: SelectHTMLAttributes<HTMLSelectElement>) => <select className={cn(field, className)} {...p} />;
export const Label = ({ className, ...p }: LabelHTMLAttributes<HTMLLabelElement>) => <label className={cn("mb-1 block text-sm font-medium", className)} {...p} />;
export const Card = ({ className, ...p }: HTMLAttributes<HTMLDivElement>) => <div className={cn("rounded-lg border border-border bg-card p-5", className)} {...p} />;
export const Badge = ({ className, ...p }: HTMLAttributes<HTMLSpanElement>) => (
  <span className={cn("inline-block rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground", className)} {...p} />
);
