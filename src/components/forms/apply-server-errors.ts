import type { FieldValues, Path, UseFormSetError } from "react-hook-form";
import { isApiError } from "@/lib/api/client";

export function applyServerErrors<T extends FieldValues>(error: unknown, setError: UseFormSetError<T>) {
  if (!isApiError(error)) return "Something went wrong. Please try again.";
  const entries = Object.entries(error.fieldErrors ?? {});
  for (const [field, message] of entries) setError(field as Path<T>, { type: "server", message });
  return error.message;
}
