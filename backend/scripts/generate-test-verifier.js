/**
 * Generates a valid test envelope for the My-Vault Postman collection.
 *
 * Usage:
 *   node scripts/generate-test-verifier.js [masterKey]
 *
 * It prints:
 *   - authVerifier  (base64)  → paste into the Postman collection variable
 *   - the full JSON body for POST /vault/setup (with a freshly wrapped DEK)
 *
 * NOTE: The wrapped DEK is a real AES-256-GCM wrapping of a random DEK using a
 * KEK derived from the provided master key, so the running frontend would be
 * able to unlock a vault created from this output with the same master key.
 * This is ONLY for API testing — never use it for a real vault.
 */
const crypto = require("node:crypto");
const argon2 = require("argon2");

async function main() {
  const masterKey = process.argv[2] || "correct horse battery staple test";

  // 1. Random 16-byte salt.
  const salt = crypto.randomBytes(16);
  const saltB64 = salt.toString("base64");

  // 2. Argon2id derive 64 bytes: [0..31] = KEK, [32..63] = auth verifier.
  const derived = await argon2.hash(masterKey, {
    type: argon2.argon2id,
    salt,
    memoryCost: 65536,
    timeCost: 3,
    parallelism: 4,
    hashLength: 64,
    raw: true,
  });
  const bytes = Buffer.from(derived);
  const kek = bytes.subarray(0, 32);
  const authVerifier = bytes.subarray(32, 64);

  // 3. Wrap a random 256-bit DEK with the KEK using AES-256-GCM.
  const dek = crypto.randomBytes(32);
  const nonce = crypto.randomBytes(12);
  // AAD binds the wrapped key to the (public) salt + version.
  const aad = Buffer.from(`vaultkey:${saltB64}:v1`, "utf8");
  const cipher = crypto.createCipheriv("aes-256-gcm", kek, nonce);
  cipher.setAAD(aad);
  const wrapped = Buffer.concat([cipher.update(dek), cipher.final()]);
  // crypto.createCipheriv GCM returns 16-byte tag appended separately.
  const authTag = cipher.getAuthTag();
  const ciphertext = Buffer.concat([wrapped, authTag]);

  const setupBody = {
    kdfAlgorithm: "ARGON2ID",
    kdfParameters: {
      memoryKiB: 65536,
      iterations: 3,
      parallelism: 4,
      outputLength: 64,
    },
    salt: saltB64,
    keyEncryptionAlgo: "AES-256-GCM",
    wrappedVaultKey: ciphertext.toString("base64"),
    keyNonce: nonce.toString("base64"),
    authVerifier: authVerifier.toString("base64"),
    encryptionVersion: 1,
  };

  console.log("\n── My-Vault test verifier ──────────────────────────────\n");
  console.log("Master key used :", masterKey);
  console.log("authVerifier    :", setupBody.authVerifier);
  console.log("\nPOST /vault/setup body:\n");
  console.log(JSON.stringify(setupBody, null, 2));
  console.log("\n───────────────────────────────────────────────────────\n");
  console.log("1. Paste the authVerifier into the Postman collection variable `authVerifier`.");
  console.log("2. Run POST /vault/setup with the JSON body above (only if GET /vault/metadata is 404).\n");
}

main().catch((err) => {
  console.error("Failed to generate test verifier:", err);
  process.exit(1);
});
