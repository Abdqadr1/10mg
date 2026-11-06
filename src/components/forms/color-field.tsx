"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { isHexColor } from "@/lib/theme";
import { FormField, fieldA11y } from "./form-field";

interface ColorFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  hint?: string;
}

export function ColorField({ id, label, value, onChange, error, hint }: ColorFieldProps) {
  const [draft, setDraft] = useState(value);

  useEffect(() => setDraft(value), [value]);

  return (
    <FormField id={id} label={label} error={error} hint={hint}>
      <div className="flex items-center gap-2">
        <input
          type="color"
          aria-label={`${label} picker`}
          value={isHexColor(value) ? value : "#000000"}
          onChange={(event) => onChange(event.target.value)}
          className="size-10 shrink-0 cursor-pointer rounded-md border bg-transparent p-1"
        />
        <Input
          {...fieldA11y(id, error)}
          value={draft}
          maxLength={7}
          spellCheck={false}
          className="h-10 font-mono uppercase"
          onChange={(event) => {
            const next = event.target.value.startsWith("#") ? event.target.value : `#${event.target.value}`;
            setDraft(next);
            onChange(next.toLowerCase());
          }}
        />
      </div>
    </FormField>
  );
}
