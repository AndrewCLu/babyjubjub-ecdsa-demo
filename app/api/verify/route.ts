const log = require("why-is-node-running");
import { NextResponse } from "next/server";
import { verifyMembership } from "babyjubjub-ecdsa";
import path from "path";

export async function POST(request: Request) {
  // setTimeout(function () {
  //   log(); // logs out active handles that are keeping node running
  // }, 5000);
  try {
    const bodyArrayBuffer = await request.arrayBuffer();
    const bodyString = new TextDecoder().decode(bodyArrayBuffer);
    const { zkp } = JSON.parse(bodyString);
    const pathToCircuits =
      path.resolve(process.cwd(), "./app/api/verify") + "/";

    const verified = await verifyMembership(zkp, pathToCircuits);

    return new NextResponse(JSON.stringify({ verified }), {
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
