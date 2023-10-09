"use client";

import React, { useState } from "react";
// @ts-ignore
import { buildPoseidonReference as buildPoseidon } from "circomlibjs";
import {
  batchProveMembership,
  batchVerifyMembership,
  derDecode,
  deserializeEcdsaMembershipProof,
  hexToBigInt,
  proveMembership,
  publicKeyFromString,
  serializeEcdsaMembershipProof,
  verifyMembership,
  recoverPubKeyIndexFromSignature,
} from "babyjubjub-ecdsa";

function App() {
  const [publicKeys, setPublicKeys] = useState<string[]>([
    "0411bcc3a7bc7d083b6c67fc7fd33a31bafdfcbf8883dbbf1ab6fc3eba321c39990662931714e04b3a3deb0c6102d9bf7a7ac56ba7d281afc07afa803e65d9b5ed",
    "041579f15c7250dda7e6da57f12cf1251bbdb8da1535597ffa472c74212b6a4a0108cfff1962eb72b41cb1164cfd50fb085a3e7792aafb03cdd946922e5dd723bc",
    "041052d6da0c3d7248e39e08912e2daa53c4e54cd9f2d96e3702fa15e77b199a501cd835bbddcc77134dc59dbbde2aa702183a68c90877906a31536eef972fac36",
  ]);
  const [newKey, setNewKey] = useState("");
  const [signatures, setSignatures] = useState<string[]>([
    "30440220036E3AD3E9358B8299A60150BB925DEF60519861DB29E6468366ABE441F04C71022003872AABF9BE3935EF255FDB847A09E1789990BE85C3C368589D7693D0E5B36F",
    "3044022001E82E797E53FB528D707B20513FC1B181A16315390DFC57FFCB477AC24A375E022004F7B2BCA543DEC95D6F82BC355C8E99F34DA07DE229B3A5D32999AB515F18E8",
    "30440220050AFA65DFD6E8709364DCF739FBAF2D6B436F84ADD5296BEE38BC65FA116912022001E8390CB9EF3688E2F319C0D08BB5DC11442BA9A93453660CD86B3728D0C106",
    "30440220014E817710DCA38B47415C0233C4FED1DA89D7195EC8F2FE1DEA9C72D378BC58022002E175D4810AB115BD7A52FB128BAF6319C2031FB991F665215564775CE8690D",
    "30440220017705D8D42EA7B179DCB1BB9ED1B37EB0F9A11DA2990E1B85C78D6C2132C46A0220021D258DFA097C255111C42DF04FC80572BE5E2173696FFF05A9B190A7C57FFA",
    "3044022001EA5ADC37063DC524E497A3A62D19A918519803FC7B041057D4CDD71579538C022003BD5A46DC348D1A1CA0AE424BF1011A517E2DA13562A083390F409E3C66B31B",
  ]);
  const [newSignature, setNewSignature] = useState("");
  const [messages, setMessages] = useState<string[]>([
    "abadbabeabadbabeabadbabeabadbabe",
    "abadbabeabadbabeabadbabeabadbabe",
    "abadbabeabadbabeabadbabeabadbabe",
    "abadbabeabadbabeabadbabeabadbabe",
    "abadbabeabadbabeabadbabeabadbabe",
    "abadbabeabadbabeabadbabeabadbabe",
  ]);
  const [newMessage, setNewMessage] = useState("");
  const [nullifierRandomness, setNullifierRandomness] = useState<number>(0);
  const [cachePoseidon, setCachePoseidon] = useState<boolean>(false);
  const [proofs, setProofs] = useState<string[]>();

  const getIndicesFromSignatures = () => {
    const pubKeyPoints = publicKeys.map(publicKeyFromString);

    return signatures.map((encodedSig, idx) => {
      const sig = derDecode(encodedSig);
      const msgHash = hexToBigInt(messages[idx]);

      return recoverPubKeyIndexFromSignature(sig, msgHash, pubKeyPoints);
    });
  };

  const handleAddKey = () => {
    setPublicKeys([...publicKeys, newKey]);
    setNewKey("");
  };

  const handleDeleteKey = (keyIndex: number) => {
    const updatedKeys = [...publicKeys];
    updatedKeys.splice(keyIndex, 1);
    setPublicKeys(updatedKeys);
  };

  const handleAddSignature = () => {
    setSignatures([...signatures, newSignature]);
    setNewSignature("");
  };

  const handleDeleteSignature = (signatureIndex: number) => {
    const updatedSignatures = [...signatures];
    updatedSignatures.splice(signatureIndex, 1);
    setSignatures(updatedSignatures);
  };

  const handleAddMessage = () => {
    setMessages([...messages, newMessage]);
    setNewMessage("");
  };

  const handleDeleteMessage = (messageIndex: number) => {
    const updatedMessages = [...messages];
    updatedMessages.splice(messageIndex, 1);
    setMessages(updatedMessages);
  };

  const handleClientGenerateProof = async () => {
    if (!publicKeys.length) {
      alert("Must add at least one public key!");
      return;
    }
    if (!signatures.length) {
      alert("Must enter a signature!");
      return;
    }
    if (!messages.length) {
      alert("Must enter a message!");
      return;
    }
    if (messages.length !== signatures.length) {
      alert("Number of messages must match number of signatures!");
      return;
    }

    console.time("Build Poseidon");
    const poseidon = cachePoseidon ? await buildPoseidon() : undefined;
    console.timeEnd("Build Poseidon");

    console.time("Client Membership Proof Generation");
    const sigs = signatures.map(derDecode);
    const pubKeyPoints = publicKeys.map(publicKeyFromString);
    const msgHashes = messages.map(hexToBigInt);
    const indices = getIndicesFromSignatures();

    if (signatures.length === 1) {
      const proof = await proveMembership(
        sigs[0],
        pubKeyPoints,
        indices[0],
        msgHashes[0],
        BigInt(nullifierRandomness),
        undefined,
        poseidon
      );

      setProofs([serializeEcdsaMembershipProof(proof)]);
    } else {
      const proofs = await batchProveMembership(
        sigs,
        pubKeyPoints,
        indices,
        msgHashes,
        BigInt(nullifierRandomness),
        undefined,
        poseidon
      );

      setProofs(proofs.map(serializeEcdsaMembershipProof));
    }
    console.timeEnd("Client Membership Proof Generation");
  };

  const handleBackendGenerateProof = async () => {
    if (!publicKeys.length) {
      alert("Must add at least one public key!");
      return;
    }
    if (!signatures.length) {
      alert("Must enter a signature!");
      return;
    }
    if (!messages.length) {
      alert("Must enter a message!");
      return;
    }
    if (messages.length !== signatures.length) {
      alert("Number of messages must match number of signatures!");
      return;
    }

    console.time("Server Membership Proof Generation");
    const indices = getIndicesFromSignatures();
    const response = await fetch("/api/prove", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        signatures,
        indices,
        messages,
        publicKeys,
        nullifierRandomness,
        cachePoseidon,
      }),
    });
    const json = await response.json();
    if (response.status === 200) {
      setProofs(json.proofs);
    } else {
      if (json.error) {
        console.error(json.error);
      }
    }
    console.timeEnd("Server Membership Proof Generation");
  };

  const handleClientVerifyProof = async () => {
    if (!proofs) {
      alert("Must generate a proof first!");
      return;
    }

    console.time("Build Poseidon");
    const poseidon = cachePoseidon ? await buildPoseidon() : undefined;
    console.timeEnd("Build Poseidon");

    console.time("Client Membership Proof Verification");
    const pubKeyPoints = publicKeys.map(publicKeyFromString);
    let verified: boolean;
    if (proofs.length === 1) {
      verified = await verifyMembership(
        deserializeEcdsaMembershipProof(proofs[0]),
        pubKeyPoints,
        BigInt(nullifierRandomness),
        undefined,
        poseidon
      );
    } else {
      verified = await batchVerifyMembership(
        proofs.map(deserializeEcdsaMembershipProof),
        pubKeyPoints,
        BigInt(nullifierRandomness),
        undefined,
        poseidon
      );
    }
    console.timeEnd("Client Membership Proof Verification");

    alert(`Verified: ${verified}`);
  };

  const handleBackendVerifyProof = async () => {
    if (!proofs) {
      alert("Must generate a proof first!");
      return;
    }

    console.time("Server Membership Proof Verification");
    const response = await fetch("/api/verify", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        proofStrings: proofs,
        publicKeys,
        nullifierRandomness,
        cachePoseidon,
      }),
    });
    const json = await response.json();
    if (response.status === 200) {
      const verified = json.verified;
      console.timeEnd("Server Membership Proof Verification");

      alert(`Verified: ${verified}`);
    } else {
      console.timeEnd("Server Membership Proof Verification");

      if (json.error) {
        console.error(json.error);
      }
    }
  };

  return (
    <div className="App p-8 bg-gray-100 min-h-screen">
      <h1 className="text-2xl font-bold mb-6">BabyJubJub ECDSA Demo</h1>

      <div className="mb-6">
        <button
          onClick={handleClientGenerateProof}
          className="bg-green-500 text-white px-4 py-2 rounded mr-2"
        >
          Generate Proof (Client)
        </button>
        <button
          onClick={handleBackendGenerateProof}
          className="bg-green-500 text-white px-4 py-2 rounded mr-2"
        >
          Generate Proof (Backend)
        </button>
        <button
          onClick={handleClientVerifyProof}
          className="bg-yellow-500 text-white px-4 py-2 rounded mr-2"
        >
          Verify Proof (Client)
        </button>
        <button
          onClick={handleBackendVerifyProof}
          className="bg-yellow-500 text-white px-4 py-2 rounded mr-2"
        >
          Verify Proof (Backend)
        </button>
      </div>

      <div className="mb-6">
        <h2 className="text-xl mb-2">Add a new public key</h2>
        <div className="flex">
          <input
            value={newKey}
            onChange={(e) => setNewKey(e.target.value)}
            placeholder="Enter a public key"
            className="p-2 border rounded mr-2 flex-grow"
          />
          <button
            onClick={handleAddKey}
            className="bg-blue-500 text-white px-4 py-2 rounded"
          >
            Add Key
          </button>
        </div>
      </div>

      <div className="mb-6">
        <h2 className="text-xl mb-2">Public Keys</h2>
        <ul className="bg-white p-4 rounded border">
          {publicKeys.map((key, idx) => (
            <li key={idx} className="flex justify-between items-center mb-2">
              {key}
              <button
                onClick={() => handleDeleteKey(idx)}
                className="bg-red-500 text-white px-2 py-1 rounded"
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className="mb-6">
        <h2 className="text-xl mb-2">Add a new signature</h2>
        <div className="flex">
          <input
            value={newSignature}
            onChange={(e) => setNewSignature(e.target.value)}
            placeholder="Enter a signature"
            className="p-2 border rounded mr-2 flex-grow"
          />
          <button
            onClick={handleAddSignature}
            className="bg-blue-500 text-white px-4 py-2 rounded"
          >
            Add Signature
          </button>
        </div>
      </div>

      <div className="mb-6">
        <h2 className="text-xl mb-2">Signatures</h2>
        <ul className="bg-white p-4 rounded border">
          {signatures.map((signature, idx) => (
            <li key={idx} className="flex justify-between items-center mb-2">
              {signature}
              <button
                onClick={() => handleDeleteSignature(idx)}
                className="bg-red-500 text-white px-2 py-1 rounded"
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className="mb-6">
        <h2 className="text-xl mb-2">Add a new message</h2>
        <div className="flex">
          <input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Enter a message"
            className="p-2 border rounded mr-2 flex-grow"
          />
          <button
            onClick={handleAddMessage}
            className="bg-blue-500 text-white px-4 py-2 rounded"
          >
            Add Message
          </button>
        </div>
      </div>

      <div className="mb-6">
        <h2 className="text-xl mb-2">Messages</h2>
        <ul className="bg-white p-4 rounded border">
          {messages.map((message, idx) => (
            <li key={idx} className="flex justify-between items-center mb-2">
              {message}
              <button
                onClick={() => handleDeleteMessage(idx)}
                className="bg-red-500 text-white px-2 py-1 rounded"
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <h2 className="text-xl mb-2">Proof Options</h2>
        <div className="mb-4">
          <h6 className="text-sm mb-2">Nullifier Randomness</h6>
          <input
            value={nullifierRandomness}
            type="number"
            onChange={(e) => setNullifierRandomness(Number(e.target.value))}
            placeholder="Enter nullifier randomness"
            className="p-2 border rounded w-full mb-2"
          />
          <h6 className="text-sm mb-2">Use Cached Poseidon Hash Function</h6>
          <button
            className="bg-white p-2 rounded border"
            onClick={() => setCachePoseidon(!cachePoseidon)}
          >
            {cachePoseidon ? "Enabled" : "Disabled"}
          </button>
        </div>

        <div className="mb-4">
          <h3 className="text-lg mb-2">Proof</h3>
          <div className="bg-white p-4 rounded border">{proofs}</div>
        </div>
      </div>
    </div>
  );
}

export default App;
