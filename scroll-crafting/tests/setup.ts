import { beforeAll, afterAll, vi } from "vitest";
import path from "path";
import { fileURLToPath } from "url";

// Convert ESM __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Set project root for tests
process.env.PROJECT_ROOT = path.resolve(__dirname, "..");

beforeAll(() => {
  // Mock console.error to catch test errors
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterAll(() => {
  vi.restoreAllMocks();
});
