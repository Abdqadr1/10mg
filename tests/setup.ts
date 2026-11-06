import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterAll, afterEach, beforeAll, beforeEach } from "vitest";
import { resetDb, setClock } from "@/mocks/db";
import { generateSeed } from "@/mocks/seed";
import { server } from "@/mocks/server";
import { useAuthStore } from "@/stores/auth-store";

export const TEST_NOW = new Date("2026-06-15T10:00:00.000Z");

beforeAll(() => {
  setClock(() => TEST_NOW);
  server.listen({ onUnhandledFrame: "error" });
});

beforeEach(() => {
  resetDb(generateSeed(TEST_NOW));
  useAuthStore.setState({ sessions: {} });
});

afterEach(() => {
  cleanup();
  server.resetHandlers();
});

afterAll(() => server.close());
