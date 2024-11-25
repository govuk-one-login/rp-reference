import { createPublicKey } from "node:crypto";

export function readPublicKey(publicKey: string) {
    const armouredKey = `-----BEGIN PUBLIC KEY-----\n${publicKey}\n-----END PUBLIC KEY-----`;
    return createPublicKey(armouredKey);
};

interface JWTHeader {
  kid?: string;
  alg: string;
  typ: string;
}

export function getKidFromToken(token: string): string | undefined {
  try {
    // Split the token into parts
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid JWT format');
    }

    // Decode the header (first part)
    const header = Buffer.from(parts[0], 'base64url').toString('utf-8');
    const parsed = JSON.parse(header) as JWTHeader;

    return parsed.kid;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to parse JWT header: ${error.message}`);
    }
    throw error;
  }
}