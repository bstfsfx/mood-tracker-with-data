import { app } from "../server/index.ts";
import { storage } from "../server/storage.ts";
import "../server/db.ts";

// Ensure demo data exists on each cold start (Vercel /tmp is ephemeral).
storage.seedDemoData().catch((err) => console.error("seed failed", err));

export default app;