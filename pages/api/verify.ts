// @ts-ignore
import { buildPoseidonReference as buildPoseidon } from "circomlibjs";
import {
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
    const { proofString, publicKeys, nullifierRandomness, cachePoseidon } =
      req.body;

    const proof = deserializeEcdsaMembershipProof(proofString);
    const publicKeyPoints = publicKeys.map(publicKeyFromString);
    const pathToCircuits = path.resolve(process.cwd(), "./public") + "/";
    const poseidon = cachePoseidon ? await buildPoseidon() : undefined;

    const verified = await verifyMembership(
      proof,
      publicKeyPoints,
      BigInt(nullifierRandomness),
      pathToCircuits,
      poseidon
    );

    res.status(200).json({ verified });
  } catch (error) {
    console.error(error);

    res.status(500).json({ error });
  }
}
