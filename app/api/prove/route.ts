const log = require("why-is-node-running");
import { NextResponse } from "next/server";
import { derDecode, proveMembership } from "babyjubjub-ecdsa";
import path from "path";

export async function POST(request: Request) {
  // setTimeout(function () {
  //   log(); // logs out active handles that are keeping node running
  // }, 5000);
  try {
    const bodyArrayBuffer = await request.arrayBuffer();
    const bodyString = new TextDecoder().decode(bodyArrayBuffer);
    const { signature, index, message, publicKeys } = JSON.parse(bodyString);

    const sig = derDecode(signature);
    const pubKeyIndex = Number(index);
    const msgHash = BigInt(message);
    const pathToCircuits = path.resolve(process.cwd(), "./app/api") + "/_";

    const proof = await proveMembership(
      sig,
      publicKeys,
      pubKeyIndex,
      msgHash,
      pathToCircuits
    );

    return new NextResponse(JSON.stringify(proof), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error(error);

    return new NextResponse(JSON.stringify({ error }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
