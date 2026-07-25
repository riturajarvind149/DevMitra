const crypto = require("crypto");

const ALGORITHM = "aes-256-gcm";
const ENCRYPTION_KEY = process.env.TOKEN_ENCRYPTION_KEY || process.env.JWT_SECRET || "devmitra_default_32byte_key_spec!!";

// Ensure key is exactly 32 bytes for aes-256-gcm
function getKey() {
  return crypto.createHash("sha256").update(ENCRYPTION_KEY).digest();
}

function encryptToken(text) {
  if (!text) return null;
  const iv = crypto.randomBytes(12);
  const key = getKey();
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  const authTag = cipher.getAuthTag().toString("hex");

  return `${iv.toString("hex")}:${authTag}:${encrypted}`;
}

function decryptToken(encryptedText) {
  if (!encryptedText) return null;
  try {
    const parts = encryptedText.split(":");
    if (parts.length !== 3) return null;

    const iv = Buffer.from(parts[0], "hex");
    const authTag = Buffer.from(parts[1], "hex");
    const encrypted = parts[2];
    const key = getKey();

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  } catch (error) {
    console.error("Failed to decrypt access token:", error.message);
    return null;
  }
}

module.exports = {
  encryptToken,
  decryptToken,
};
