// @ts-ignore
import { buildPoseidonReference as buildPoseidon } from "circomlibjs";
import {
  batchProveMembership,
  derDecode,
  hexToBigInt,
  proveMembership,
  publicKeyFromString,
  serializeEcdsaMembershipProof,
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
      nullifierRandomness,
      cachePoseidon,
    } = req.body;

    const sigs = signatures.map(derDecode);
    const pubKeyPoints = publicKeys.map(publicKeyFromString);
    const msgHashes = messages.map(hexToBigInt);
    const pathToCircuits = path.resolve(process.cwd(), "./public") + "/";
    const poseidon = cachePoseidon ? await buildPoseidon() : undefined;

    if (sigs.length === 1) {
      const proof = await proveMembership(
        sigs[0],
        pubKeyPoints,
        indices[0],
        msgHashes[0],
        BigInt(nullifierRandomness),
        pathToCircuits,
        poseidon
      );

      res.status(200).json({ proofs: [serializeEcdsaMembershipProof(proof)] });
    } else {
      const proofs = await batchProveMembership(
        sigs,
        pubKeyPoints,
        indices,
        msgHashes,
        BigInt(nullifierRandomness),
        pathToCircuits,
        poseidon
      );

      res
        .status(200)
        .json({ proofs: proofs.map(serializeEcdsaMembershipProof) });
    }
  } catch (error) {
    console.error(error);

    res.status(500).json({ error });
  }
}
