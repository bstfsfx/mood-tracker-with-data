import { app } from "../../server/index.ts";
import { storage } from "../../server/storage.ts";
import "../../server/db.ts";

storage.seedDemoData().catch((err) => console.error("seed failed", err));

export default app;