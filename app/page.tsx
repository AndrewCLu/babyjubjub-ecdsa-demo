"use client";

import { derDecode, proveMembership, verifyMembership } from "babyjubjub-ecdsa";
import React, { useState } from "react";

function App() {
  const [publicKeys, setPublicKeys] = useState<string[]>([
    "041941f5abe4f903af965d707182b688bd1fa725fd2cbc648fc435feb42a3794593275a2e9b4ad4bc0d2f3ecc8d23e3cf89da889d7aa35ce33f132d87b5bb5c393",
    "049ae9f2ec6a4db43f0e081a436f885b0d3f5753a45b00d2f2e3da38956848c4ff0205d89e14a2e36976bfe033407dbce6b48261d84d201277de0c3b82f08ddb09",
    "041052d6da0c3d7248e39e08912e2daa53c4e54cd9f2d96e3702fa15e77b199a501cd835bbddcc77134dc59dbbde2aa702183a68c90877906a31536eef972fac36",
    "044d9d03f3266f24777ac488f04ec579e1c4bea984398c9b98d99a9e31bc75ef0f13a19471a7297a6f2bf0126ed93d4c55b6e98ec286203e3d761c61922e3a4cda",
  ]);
  const [newKey, setNewKey] = useState("");
  const [index, setIndex] = useState("2");
  const [signature, setSignature] = useState(
    "30440220017705D8D42EA7B179DCB1BB9ED1B37EB0F9A11DA2990E1B85C78D6C2132C46A0220021D258DFA097C255111C42DF04FC80572BE5E2173696FFF05A9B190A7C57FFA"
  );
  const [message, setMessage] = useState(
    "228200042270416259090871054572513508030"
  );
  const [proof, setProof] = useState<string>();

  const handleAddKey = () => {
    setPublicKeys([...publicKeys, newKey]);
    setNewKey("");
  };

  const handleDeleteKey = (keyIndex: number) => {
    const updatedKeys = [...publicKeys];
    updatedKeys.splice(keyIndex, 1);
    setPublicKeys(updatedKeys);
  };

  const handleClientGenerateProof = async () => {
    if (!publicKeys.length) {
      alert("Must add at least one public key!");
      return;
    }
    if (!index) {
      alert("Must enter a list index!");
      return;
    }
    if (!/^-?\d+$/.test(index)) {
      alert("Index must be a number!");
      return;
    }
    if (!signature) {
      alert("Must enter a signature!");
      return;
    }
    if (!message) {
      alert("Must enter a message!");
      return;
    }
    if (!/^-?\d+$/.test(message)) {
      alert("Message must be a number for now!");
      return;
    }

    alert("Generating proof...");

    console.time("Proof Generation");

    const sig = derDecode(signature);
    const pubKeyIndex = Number(index);
    const msgHash = BigInt(message);

    const proof = await proveMembership(sig, publicKeys, pubKeyIndex, msgHash);

    console.timeEnd("Proof Generation");

    alert("Proof generated!");

    setProof(JSON.stringify(proof));
  };

  const handleBackendGenerateProof = async () => {
    if (!publicKeys.length) {
      alert("Must add at least one public key!");
      return;
    }
    if (!index) {
      alert("Must enter a list index!");
      return;
    }
    if (!/^-?\d+$/.test(index)) {
      alert("Index must be a number!");
      return;
    }
    if (!signature) {
      alert("Must enter a signature!");
      return;
    }
    if (!message) {
      alert("Must enter a message!");
      return;
    }
    if (!/^-?\d+$/.test(message)) {
      alert("Message must be a number for now!");
      return;
    }

    alert("Generating proof...");

    console.time("Proof Generation");

    await fetch("/api/prove", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ signature, index, message, publicKeys }),
    }).then(async (response) => {
      const data = await response.json();
      if (response.status === 200) {
        setProof(JSON.stringify(data));
      } else {
        if (data.error) {
          console.error(data.error);
        }
      }
    });

    console.timeEnd("Proof Generation");

    alert("Proof generated!");

    setProof(JSON.stringify(proof));
  };

  const handleClientVerifyProof = async () => {
    if (!proof) {
      alert("Must generate a proof first!");
      return;
    }

    const zkp = JSON.parse(proof!);
    const verified = await verifyMembership(zkp);

    alert(`Verified: ${verified}`);
  };

  const handleBackendVerifyProof = async () => {
    if (!proof) {
      alert("Must generate a proof first!");
      return;
    }

    const zkp = JSON.parse(proof!);

    await fetch("/api/verify", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ zkp }),
    }).then(async (response) => {
      const data = await response.json();
      if (response.status === 200) {
        alert(`Verified: ${data.verified}`);
      } else {
        if (data.error) {
          console.error(data.error);
        }
      }
    });
  };

  return (
    <div className="App p-8 bg-gray-100 min-h-screen">
      <h1 className="text-2xl font-bold mb-6">BabyJubJub ECDSA Demo</h1>

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

      <div>
        <h2 className="text-xl mb-2">Submit Proof</h2>
        <div className="mb-4">
          <input
            value={index}
            onChange={(e) => setIndex(e.target.value)}
            placeholder="Enter list index"
            className="p-2 border rounded w-full mb-2"
          />
          <input
            value={signature}
            onChange={(e) => setSignature(e.target.value)}
            placeholder="Enter signature"
            className="p-2 border rounded w-full mb-2"
          />
          <input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Enter message"
            className="p-2 border rounded w-full"
          />
        </div>

        <div className="mb-4">
          <h3 className="text-lg mb-2">Proof</h3>
          <div className="bg-white p-4 rounded border">{proof}</div>
        </div>

        <div>
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
      </div>
    </div>
  );
}

export default App;
