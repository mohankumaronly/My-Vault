import { createApp } from "./app";
import { env } from "./config/env";
import { prisma } from "./config/prisma";
import { sessionService } from "./modules/session/session.service";
import { bootstrapVault } from "./modules/vault/vault.bootstrap";
async function main() {
const app = createApp();
// Verify DB connectivity before accepting traffic.
try {
await prisma.$connect();
} catch (err) {
console.error("Failed to connect to the database:", err);
process.exit(1);
}
// Provision / verify the vault from MASTER_KEY in .env (self-hosted model).
// If MASTER_KEY is configured but provisioning fails, refuse to start.
try {
const vaultReady = await bootstrapVault();
if (vaultReady) {
console.log("Self-hosted vault is ready (MASTER_KEY loaded from .env).");
} else {
console.warn("Starting without a self-hosted vault (no MASTER_KEY configured).");
}
} catch (err) {
console.error("Vault bootstrap failed:", err);
process.exit(1);
}
// Best-effort expired-session cleanup (runs once at startup + hourly).
sessionService.cleanupExpired().catch(() => undefined);
setInterval(() => sessionService.cleanupExpired().catch(() => undefined), 60 * 60 * 1000).unref();
const server = app.listen(env.PORT, () => {
console.log("My-Vault API listening on http://localhost:" + env.PORT + "/api/v1");
console.log("   Environment: " + env.NODE_ENV + " - CORS: " + env.CLIENT_ORIGIN);
if (env.TEST_MODE === "true") {
console.log("   TEST_MODE is enabled - test API key bypasses CSRF.");
}
});
const shutdown = async (signal: string) => {
console.log(signal + " received - shutting down gracefully...");
server.close(async () => {
await prisma.$disconnect().catch(() => undefined);
process.exit(0);
});
setTimeout(() => process.exit(1), 10_000).unref();
};
process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));
}
main().catch((err) => {
console.error("Fatal startup error:", err);
process.exit(1);
});