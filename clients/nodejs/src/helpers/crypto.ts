import { createPublicKey } from "node:crypto";

export function readPublicKey(publicKey: string) {
    const armouredKey = `-----BEGIN PUBLIC KEY-----\n${publicKey}\n-----END PUBLIC KEY-----`;
    return createPublicKey(armouredKey);
  };