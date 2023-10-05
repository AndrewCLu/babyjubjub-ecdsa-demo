import { derDecode, proveMembership } from "babyjubjub-ecdsa";
import { NextApiRequest, NextApiResponse } from "next";
import path from "path";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const { signature, index, message, publicKeys } = req.body;

    const sig = derDecode(signature);
    const pubKeyIndex = Number(index);
    const msgHash = BigInt(message);
    const pathToCircuits = path.resolve(process.cwd(), "./public") + "/";

    const proof = await proveMembership(
      sig,
      publicKeys,
      pubKeyIndex,
      msgHash,
      pathToCircuits
    );

    res.status(200).json(proof);
  } catch (error) {
    console.error(error);

    res.status(500).json({ error });
  }
}
