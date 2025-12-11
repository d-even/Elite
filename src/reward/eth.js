// import { useEffect, useState } from "react";
// import { BrowserProvider, Contract, formatEther, parseEther } from "ethers";
// import { CONTRACT_ADDRESS, CONTRACT_ABI } from "./contractConfig";


// function Eth() {
//   const [account, setAccount] = useState("");
//   const [networkOk, setNetworkOk] = useState(false);
//   const [amount, setAmount] = useState("");
//   const [recipient, setRecipient] = useState("");
//   const [status, setStatus] = useState("");
//   const [contractBalance, setContractBalance] = useState("0");

//   async function getProvider() {
//     if (!window.ethereum) {
//       throw new Error("MetaMask not found");
//     }
//     const provider = new BrowserProvider(window.ethereum);
//     return provider;
//   }

//   async function refreshContractBalance() {
//     try {
//       const provider = await getProvider();
//       const balWei = await provider.getBalance(CONTRACT_ADDRESS);
//       setContractBalance(formatEther(balWei));
//     } catch (err) {
//       console.error(err);
//     }
//   }

//   async function connectWallet() {
//     try {
//       setStatus("Connecting wallet…");
//       const provider = await getProvider();

//       const accounts = await provider.send("eth_requestAccounts", []);
//       const acc = accounts[0];
//       setAccount(acc);

//       const net = await provider.getNetwork();
//       // Amoy chainId = 80002
//       if (Number(net.chainId) !== 80002) {
//         setNetworkOk(false);
//         setStatus("Wrong network. Please switch MetaMask to Polygon Amoy.");
//       } else {
//         setNetworkOk(true);
//         setStatus("Wallet connected. Network: Amoy.");
//         await refreshContractBalance();
//       }
//     } catch (err) {
//       console.error(err);
//       setStatus("Failed to connect wallet.");
//     }
//   }

//   async function sendFromContract() {
//     try {
//       if (!amount || Number(amount) <= 0) {
//         setStatus("Enter a valid amount in POL.");
//         return;
//       }
//       if (!recipient || !recipient.startsWith("0x") || recipient.length !== 42) {
//         setStatus("Enter a valid recipient wallet address.");
//         return;
//       }

//       setStatus("Preparing transaction…");

//       const provider = await getProvider();
//       const signer = await provider.getSigner();
//       const fromAddr = await signer.getAddress();

//       const contract = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
//       const owner = await contract.owner();
//       if (owner.toLowerCase() !== fromAddr.toLowerCase()) {
//         setStatus("Only the contract owner can send rewards.");
//         return;
//       }

//       const amountWei = parseEther(amount); // POL → wei

//       setStatus("Sending transaction from contract… Confirm in MetaMask.");
//       const tx = await contract.sendReward(recipient, amountWei);
//       setStatus(
//         `Tx sent: ${tx.hash.slice(0, 12)}… Waiting for confirmation…`
//       );

//       await tx.wait();
//       setStatus("✅ Transfer complete!");
//       await refreshContractBalance();
//     } catch (err) {
//       console.error(err);
//       if (err?.info?.error?.message) {
//         setStatus(`Error: ${err.info.error.message}`);
//       } else {
//         setStatus(`Error: ${err.message}`);
//       }
//     }
//   }

//   useEffect(() => {
//     (async () => {
//       if (!window.ethereum) return;
//       try {
//         const provider = new BrowserProvider(window.ethereum);
//         const accounts = await provider.listAccounts();
//         if (accounts.length > 0) {
//           setAccount(accounts[0].address);
//           const net = await provider.getNetwork();
//           if (Number(net.chainId) === 80002) {
//             setNetworkOk(true);
//             await refreshContractBalance();
//           }
//         }
//       } catch (e) {
//         console.warn(e);
//       }
//     })();
//   }, []);

//   return (
//     <div style={{ minHeight: "100vh", background: "#f9fafb" }}>
//       {/* Navbar */}
//       <nav style={{
//         background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
//         color: "white",
//         padding: "20px 0",
//         boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
//         marginBottom: "40px"
//       }}>
//         <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
//           <h2 style={{ margin: 0, fontSize: "1.5rem" }}>🪙 ETH Reward Claim</h2>
//           <span style={{ opacity: 0.9 }}>Polygon Amoy Network</span>
//         </div>
//       </nav>

//       <div style={{ maxWidth: "800px", margin: "0 auto", padding: "0 20px 60px 20px" }}>
//         {/* Main Card */}
//         <div style={{
//           background: "white",
//           borderRadius: 16,
//           boxShadow: "0 20px 25px rgba(0,0,0,0.08)",
//           overflow: "hidden",
//           border: "1px solid #e5e7eb"
//         }}>
//           {/* Header */}
//           <div style={{
//             background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
//             padding: "40px 32px",
//             textAlign: "center",
//             color: "white"
//           }}>
//             <div style={{ fontSize: "3.5rem", marginBottom: "16px" }}>🪙</div>
//             <h1 style={{ margin: 0, fontSize: "2rem", marginBottom: "8px" }}>Claim Your ETH Reward</h1>
//             <p style={{ margin: 0, opacity: 0.9 }}>Receive POL tokens on Polygon Amoy</p>
//           </div>

//           {/* Content */}
//           <div style={{ padding: "40px 32px" }}>
//             {/* Reward Amount */}
//             <div style={{
//               background: "#f0fdf4",
//               border: "2px solid #dcfce7",
//               borderRadius: 12,
//               padding: "24px",
//               marginBottom: "32px",
//               textAlign: "center"
//             }}>
//               <p style={{ margin: 0, color: "#6b7280", fontSize: "0.875rem", marginBottom: "8px" }}>REWARD AMOUNT</p>
//               <h2 style={{ margin: 0, fontSize: "2.5rem", color: "#059669" }}>0.001 POL</h2>
//             </div>

//             {/* Wallet Connection */}
//             <div style={{ marginBottom: "32px" }}>
//               <h3 style={{ margin: "0 0 16px 0", color: "#1f2937", fontSize: "1.125rem" }}>Step 1: Connect Wallet</h3>
//               <button 
//                 onClick={connectWallet}
//                 style={{
//                   width: "100%",
//                   padding: "14px 24px",
//                   background: account ? "#10b981" : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
//                   color: "white",
//                   border: "none",
//                   borderRadius: 8,
//                   fontWeight: "600",
//                   fontSize: "1rem",
//                   cursor: "pointer",
//                   boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
//                   transition: "all 0.3s ease"
//                 }}
//               >
//                 {account ? "✅ Wallet Connected" : "🔗 Connect MetaMask"}
//               </button>
              
//               {account && (
//                 <div style={{
//                   background: "#f0fdf4",
//                   border: "1px solid #dcfce7",
//                   borderRadius: 8,
//                   padding: "16px",
//                   marginTop: "12px",
//                   color: "#059669",
//                   fontSize: "0.875rem"
//                 }}>
//                   <strong>Connected:</strong> {account.slice(0, 6)}...{account.slice(-4)}
//                 </div>
//               )}
//             </div>

//             {/* Network Status */}
//             <div style={{
//               background: networkOk ? "#f0fdf4" : "#fef2f2",
//               border: `1px solid ${networkOk ? "#dcfce7" : "#fee2e2"}`,
//               borderRadius: 8,
//               padding: "16px",
//               marginBottom: "32px",
//               color: networkOk ? "#059669" : "#dc2626",
//               fontSize: "0.875rem"
//             }}>
//               <strong>Network:</strong> {networkOk ? "✅ Polygon Amoy Connected" : "❌ Wrong Network"}
//             </div>

//             {/* Contract Balance */}
//             <div style={{
//               background: "#eff6ff",
//               border: "2px solid #bfdbfe",
//               borderRadius: 12,
//               padding: "24px",
//               marginBottom: "32px",
//               textAlign: "center"
//             }}>
//               <p style={{ margin: 0, color: "#0369a1", fontSize: "0.875rem", marginBottom: "8px" }}>CONTRACT BALANCE</p>
//               <h3 style={{ margin: 0, fontSize: "1.75rem", color: "#0284c7" }}>{contractBalance} POL</h3>
//             </div>

//             {/* Recipient Address */}
//             <div style={{ marginBottom: "32px" }}>
//               <h3 style={{ margin: "0 0 12px 0", color: "#1f2937", fontSize: "1.125rem" }}>Step 2: Recipient Address</h3>
//               <label style={{ display: "block", marginBottom: "8px", fontWeight: "600", color: "#374151", fontSize: "0.875rem" }}>
//                 Wallet Address (0x...)
//               </label>
//               <input
//                 type="text"
//                 value={recipient}
//                 onChange={(e) => setRecipient(e.target.value.trim())}
//                 placeholder="0x..."
//                 style={{
//                   width: "100%",
//                   padding: "12px 16px",
//                   border: "2px solid #e5e7eb",
//                   borderRadius: 8,
//                   fontSize: "1rem",
//                   fontFamily: "monospace",
//                   marginBottom: "12px"
//                 }}
//               />
//               <p style={{ margin: 0, color: "#9ca3af", fontSize: "0.875rem" }}>
//                 ℹ️ Must be a valid Ethereum address starting with 0x
//               </p>
//             </div>

//             {/* Amount Input */}
//             <div style={{ marginBottom: "32px" }}>
//               <h3 style={{ margin: "0 0 12px 0", color: "#1f2937", fontSize: "1.125rem" }}>Step 3: Amount</h3>
//               <label style={{ display: "block", marginBottom: "8px", fontWeight: "600", color: "#374151", fontSize: "0.875rem" }}>
//                 Amount (POL)
//               </label>
//               <input
//                 type="number"
//                 min="0"
//                 step="0.0001"
//                 value={amount}
//                 onChange={(e) => setAmount(e.target.value)}
//                 placeholder="0.001"
//                 style={{
//                   width: "100%",
//                   padding: "12px 16px",
//                   border: "2px solid #e5e7eb",
//                   borderRadius: 8,
//                   fontSize: "1rem",
//                   marginBottom: "12px"
//                 }}
//               />
//               <p style={{ margin: 0, color: "#9ca3af", fontSize: "0.875rem" }}>
//                 Default: 0.001 POL (confirm in MetaMask)
//               </p>
//             </div>

//             {/* Status */}
//             {status && (
//               <div style={{
//                 background: status.includes("✅") ? "#d1fae5" : status.includes("Error") ? "#fee2e2" : "#fef3c7",
//                 border: `1px solid ${status.includes("✅") ? "#a7f3d0" : status.includes("Error") ? "#fecaca" : "#fcd34d"}`,
//                 borderRadius: 8,
//                 padding: "16px",
//                 marginBottom: "24px",
//                 color: status.includes("✅") ? "#065f46" : status.includes("Error") ? "#991b1b" : "#92400e",
//                 fontSize: "0.875rem"
//               }}>
//                 {status}
//               </div>
//             )}

//             {/* Send Button */}
//             <button 
//               onClick={sendFromContract}
//               disabled={!account || !networkOk}
//               style={{
//                 width: "100%",
//                 padding: "16px 24px",
//                 background: account && networkOk ? "linear-gradient(135deg, #10b981 0%, #059669 100%)" : "#d1d5db",
//                 color: "white",
//                 border: "none",
//                 borderRadius: 8,
//                 fontWeight: "600",
//                 fontSize: "1.125rem",
//                 cursor: account && networkOk ? "pointer" : "not-allowed",
//                 boxShadow: account && networkOk ? "0 4px 6px rgba(16,185,129,0.3)" : "none",
//                 transition: "all 0.3s ease"
//               }}
//             >
//               {account && networkOk ? "✨ Claim ETH Reward" : "⏳ Connect wallet first"}
//             </button>
//           </div>
//         </div>

//         {/* Info Box */}
//         <div style={{
//           background: "#f0f9ff",
//           border: "2px solid #bfdbfe",
//           borderRadius: 12,
//           padding: "24px",
//           marginTop: "32px"
//         }}>
          
//         </div>
//       </div>
//     </div>
//   );
// }

// export default Eth;



import React, { useState } from "react";
import { ethers } from "ethers";
import axios from "axios";
const CONTRACT_ADDRESS = "0xb615B2a9af47b438D0A3F1fc51Cabf861F97D32C";

const ABI = [
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "receiver",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "amountWei",
				"type": "uint256"
			}
		],
		"name": "payFromContract",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "receiver",
				"type": "address"
			}
		],
		"name": "sendEth",
		"outputs": [],
		"stateMutability": "payable",
		"type": "function"
	},
	{
		"inputs": [],
		"stateMutability": "nonpayable",
		"type": "constructor"
	},
	{
		"stateMutability": "payable",
		"type": "receive"
	},
	{
		"inputs": [],
		"name": "getBalance",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "owner",
		"outputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"stateMutability": "view",
		"type": "function"
	}
];

function Eth() {
  const [receiver, setReceiver] = useState("");
  const [amount, setAmount] = useState("");
  const [contractBalance, setContractBalance] = useState("0");
  const [priceUSD, setPriceUSD] = useState(null);
  const [priceINR, setPriceINR] = useState(null);
  const [status, setStatus] = useState("");

  // ------------------------
  // FETCH LIVE ETH PRICE
  // ------------------------
  async function fetchEthPrice() {
    try {
      setStatus("Fetching live ETH price...");

      const response = await axios.get(
        "https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd,inr"
      );

      setPriceUSD(response.data.ethereum.usd);
      setPriceINR(response.data.ethereum.inr);

      setStatus("Live ETH price fetched!");
    } catch (err) {
      console.error(err);
      setStatus("Error fetching ETH price");
    }
  }

  // ------------------------
  // SEND ETH FROM CONTRACT
  // ------------------------
  async function sendFromContract() {
    try {
      if (!window.ethereum) return alert("Please install MetaMask");

      if (!receiver || !amount) {
        return alert("Enter receiver address and amount");
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);

      const amountWei = ethers.parseEther(amount);

      setStatus("Sending ETH from contract...");

      const tx = await contract.payFromContract(receiver, amountWei);
      await tx.wait();

      setStatus("🎉 ETH successfully sent!");

    } catch (err) {
      console.error(err);
      setStatus("Error: " + err.message);
    }
  }

  // ------------------------
  // FETCH CONTRACT BALANCE
  // ------------------------
  async function getContractBalance() {
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, provider);

      const balWei = await contract.getBalance();
      const balEth = ethers.formatEther(balWei);

      setContractBalance(balEth);
      setStatus("Contract balance updated!");
    } catch (err) {
      console.error(err);
      setStatus("Error fetching contract balance");
    }
  }

  // ------------------------
  // UI
  // ------------------------
  return (
    <div style={{ padding: 20 }}>
      <h1>ETH Payment Dashboard</h1>

      {/* LIVE ETH PRICE SECTION */}
      <button onClick={fetchEthPrice}>Fetch Live ETH Price</button>

      {priceUSD && (
        <div style={{ marginTop: 10 }}>
          <p>ETH Price (USD): <b>${priceUSD}</b></p>
          <p>ETH Price (INR): <b>₹{priceINR}</b></p>
        </div>
      )}

      <hr />

      {/* SEND ETH FROM CONTRACT */}
      <h2>Send ETH From Contract</h2>

      <input
        type="text"
        placeholder="Receiver Wallet Address"
        value={receiver}
        onChange={(e) => setReceiver(e.target.value)}
        style={{ width: "350px", marginBottom: 10 }}
      /><br />

      <input
        type="text"
        placeholder="Amount (ETH)"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        style={{ width: "350px", marginBottom: 10 }}
      /><br />

      <button onClick={sendFromContract}>Send ETH</button>

      <hr />

      {/* CONTRACT BALANCE */}
      <h2>Contract Balance</h2>

      <button onClick={getContractBalance}>Check Contract Balance</button>
      <p>{contractBalance} ETH</p>

      {/* STATUS MESSAGE */}
      <p style={{ marginTop: 20 }}><b>{status}</b></p>
    </div>
  );
}

export default Eth;
