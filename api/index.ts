import { app } from "../server/index";
import { storage } from "../server/storage";
import "./db";

// Ensure demo data exists on each cold start (Vercel /tmp is ephemeral).
storage.seedDemoData().catch((err) => console.error("seed failed", err));

export default app;