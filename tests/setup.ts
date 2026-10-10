import "@testing-library/jest-dom/vitest";
import { config } from "dotenv";

// Next.js loads .env.local itself in dev/build; Vitest does not, so the
// live eval suite (EVAL_LIVE=1) needs this to see GEMINI_API_KEY.
config({ path: ".env.local" });
