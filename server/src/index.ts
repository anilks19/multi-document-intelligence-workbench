import { createApp } from "./app.js";
import { config } from "./config.js";
import { getDb } from "./db/connection.js";

// Ensure SQLite is ready before accepting traffic
getDb();

const app = createApp();

app.listen(config.port, () => {
  console.log(
    `[server] Multi-Document Intelligence Workbench API listening on http://localhost:${config.port}`,
  );
  console.log(`[server] database=${config.dbPath}`);
});
