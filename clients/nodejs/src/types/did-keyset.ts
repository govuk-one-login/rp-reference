import * as jose from 'jose';

export default interface DIDKeySet {
  id: string;
  publicKeyJwk: JsonWebKey;
}