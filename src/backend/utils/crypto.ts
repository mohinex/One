import crypto from "crypto";

const ALGORITHM = "aes-256-cbc";

function getSecretKey(): Buffer {
  const encKey = process.env.ENCRYPTION_KEY || "0123456789abcdef0123456789abcdef"; // fallback 32-chars
  // Ensure the key is exactly 32 bytes for aes-256
  return Buffer.from(encKey.substring(0, 32).padEnd(32, "0"), "utf8");
}

export function encrypt(text: string): string {
  try {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(ALGORITHM, getSecretKey(), iv);
    let encrypted = cipher.update(text, "utf8", "hex");
    encrypted += cipher.final("hex");
    return `${iv.toString("hex")}:${encrypted}`;
  } catch (err: any) {
    console.error("Encryption failed:", err.message);
    throw new Error("Encryption failed: " + err.message);
  }
}

export function decrypt(hash: string): string {
  try {
    if (!hash || !hash.includes(":")) return hash;
    const [ivHex, encryptedText] = hash.split(":");
    const iv = Buffer.from(ivHex, "hex");
    const decipher = crypto.createDecipheriv(ALGORITHM, getSecretKey(), iv);
    let decrypted = decipher.update(encryptedText, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  } catch (err: any) {
    console.error("Decryption failed. Returning raw hash value as fallback.", err.message);
    return hash; // return safe fallback
  }
}

export function maskSecret(secret: string): string {
  if (!secret) return "";
  if (secret.length <= 8) return "********";
  return `${secret.substring(0, 4)}...${secret.substring(secret.length - 4)}`;
}
