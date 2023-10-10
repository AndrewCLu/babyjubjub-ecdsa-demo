// @ts-ignore
import { buildPoseidonReference as buildPoseidon } from "circomlibjs";
import {
  batchProveMembership,
  derDecode,
  hexToBigInt,
  proveMembership,
  publicKeyFromString,
  serializeMembershipProof,
} from "babyjubjub-ecdsa";
import { NextApiRequest, NextApiResponse } from "next";
import path from "path";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const {
      signatures,
      indices,
      messages,
      publicKeys,
      sigNullifierRandomness,
      pubKeyNullifierRandomness,
      cachePoseidon,
    } = req.body;

    const sigs = signatures.map(derDecode);
    const pubKeyPoints = publicKeys.map(publicKeyFromString);
    const msgHashes = messages.map(hexToBigInt);
    const pathToCircuits = path.resolve(process.cwd(), "./public") + "/";
    const poseidon = cachePoseidon ? await buildPoseidon() : undefined;

    if (sigs.length === 1) {
      const proof = await proveMembership({
        sig: sigs[0],
        pubKeys: pubKeyPoints,
        index: indices[0],
        msgHash: msgHashes[0],
        sigNullifierRandomness: BigInt(sigNullifierRandomness),
        pubKeyNullifierRandomness: BigInt(pubKeyNullifierRandomness),
        pathToCircuits,
        hashFn: poseidon,
      });

      res.status(200).json({ proofs: [serializeMembershipProof(proof)] });
    } else {
      const proofs = await batchProveMembership({
        sigs,
        pubKeys: pubKeyPoints,
        indices,
        msgHashes,
        sigNullifierRandomness: BigInt(sigNullifierRandomness),
        pubKeyNullifierRandomness: BigInt(pubKeyNullifierRandomness),
        pathToCircuits,
        hashFn: poseidon,
      });

      res.status(200).json({ proofs: proofs.map(serializeMembershipProof) });
    }
  } catch (error) {
    console.error(error);

    res.status(500).json({ error });
  }
}
