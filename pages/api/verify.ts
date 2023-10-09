// @ts-ignore
import { buildPoseidonReference as buildPoseidon } from "circomlibjs";
import {
  batchVerifyMembership,
  deserializeEcdsaMembershipProof,
  publicKeyFromString,
  verifyMembership,
} from "babyjubjub-ecdsa";
import { NextApiRequest, NextApiResponse } from "next";
import path from "path";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const { proofStrings, publicKeys, nullifierRandomness, cachePoseidon } =
      req.body;

    const proofs = proofStrings.map(deserializeEcdsaMembershipProof);
    const pubKeyPoints = publicKeys.map(publicKeyFromString);
    const pathToCircuits = path.resolve(process.cwd(), "./public") + "/";
    const poseidon = cachePoseidon ? await buildPoseidon() : undefined;

    let verified: boolean;
    if (proofs.length === 1) {
      verified = await verifyMembership(
        proofs[0],
        pubKeyPoints,
        BigInt(nullifierRandomness),
        pathToCircuits,
        poseidon
      );
    } else {
      verified = await batchVerifyMembership(
        proofs,
        pubKeyPoints,
        BigInt(nullifierRandomness),
        pathToCircuits,
        poseidon
      );
    }

    res.status(200).json({ verified });
  } catch (error) {
    console.error(error);

    res.status(500).json({ error });
  }
}
