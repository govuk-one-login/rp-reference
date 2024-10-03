import { createPrivateKey, createPublicKey, KeyObject } from 'node:crypto';

export const readPublicKey = (publicKey: string): KeyObject | undefined => {
    if (!publicKey) {
        return;
    }
    const armouredKey = `-----BEGIN PUBLIC KEY-----\n${publicKey}\n-----END PUBLIC KEY-----`;
    return createPublicKey(armouredKey);
};

export const readPrivateKey = (privateKey: string) => createPrivateKey({
    key: Buffer.from(privateKey, "base64"),
    type: "pkcs8",
    format: "der",
});