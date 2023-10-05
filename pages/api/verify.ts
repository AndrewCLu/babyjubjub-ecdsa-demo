import { verifyMembership } from "babyjubjub-ecdsa";
import { NextApiRequest, NextApiResponse } from "next";
import path from "path";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const { zkp } = req.body;
    const pathToCircuits = path.resolve(process.cwd(), "./public") + "/";

    const verified = await verifyMembership(zkp, pathToCircuits);

    res.status(200).json({ verified });
  } catch (error) {
    console.error(error);

    res.status(500).json({ error });
  }
}
