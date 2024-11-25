import { Resolver } from 'did-resolver';
import { getResolver } from 'web-did-resolver'; // or another DID method resolver
import DIDKeySet from "../types/did-keyset.js";

export const fetchPublicKeys = async (

): Promise<DIDKeySet[]> => {

    // Download the DID document
    const didResolver = new Resolver(getResolver());
    const didDocument = await didResolver.resolve("did:web:identity.integration.account.gov.uk");

    // Extract public keys from verification methods
    const publicKeys: DIDKeySet[] = didDocument.didDocument.assertionMethod
    .filter(method => {
      // Handle both string and object methods
      if (typeof method === "string") return false;
      return method && "publicKeyJwk" in method;
    })
    .map(method => ({
      id: (method as any).id,
      publicKeyJwk: (method as any).publicKeyJwk
    }));
    return publicKeys;
}