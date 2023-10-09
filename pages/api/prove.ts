// @ts-ignore
import { buildPoseidonReference as buildPoseidon } from "circomlibjs";
import {
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
      signature,
      index,
      message,
      publicKeys,
      nullifierRandomness,
      cachePoseidon,
    } = req.body;

    const sig = derDecode(signature);
    const publicKeyPoints = publicKeys.map(publicKeyFromString);
    const msgHash = hexToBigInt(message);
    const pathToCircuits = path.resolve(process.cwd(), "./public") + "/";
    const poseidon = cachePoseidon ? await buildPoseidon() : undefined;

    const proof = await proveMembership(
      sig,
      publicKeyPoints,
      index,
      msgHash,
      BigInt(nullifierRandomness),
      pathToCircuits,
      poseidon
    );

    res.status(200).json({ proof: serializeEcdsaMembershipProof(proof) });
  } catch (error) {
    console.error(error);

    res.status(500).json({ error });
  }
}
