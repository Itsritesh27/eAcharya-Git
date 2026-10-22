"use client";

import { Input, Label } from "@/components/ui/input";

/** Text-backed number field: the student can type freely, and each tool decides how to parse the string. */
export function NumberField({
  id,
  label,
  value,
  onChange,
  hint,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  hint?: string;
}) {
  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        inputMode="decimal"
        autoComplete="off"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-describedby={hint ? `${id}-hint` : undefined}
      />
      {hint && (
        <p id={`${id}-hint`} className="mt-1 text-xs text-forest-600">
          {hint}
        </p>
      )}
    </div>
  );
}

/** Empty or non-numeric text becomes NaN so the maths layer rejects it instead of silently treating it as zero. */
export function toNumber(text: string): number {
  const trimmed = text.trim();
  return trimmed === "" ? Number.NaN : Number(trimmed);
}

export function formatNumber(value: number, digits = 2): string {
  return new Intl.NumberFormat("en-IN", { maximumFractionDigits: digits }).format(value);
}
