import { createPrivateKey, createHash, createPublicKey } from "node:crypto";

export function readPublicKey(publicKey: string) {
  const armouredKey = `-----BEGIN PUBLIC KEY-----\n${publicKey}\n-----END PUBLIC KEY-----`;
  return createPublicKey(armouredKey);
};

export function readPrivateKey(privateKey: string) {
  //const trimmedKey: string = privateKey.replace("-----BEGIN PRIVATE KEY-----","").replace("-----END PRIVATE KEY-----","");
  return createPrivateKey({
    key: Buffer.from(privateKey, "base64"),
    type: "pkcs8",
    format: "der",
  });
};

export function hash(value: string) {
  return createHash("sha256").update(value).digest("base64url");
};