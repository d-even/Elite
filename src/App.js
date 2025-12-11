
// import React, { useEffect, useState } from "react";

// const BACKEND = "http://172.23.150.217:3000";

// // Razorpay loader (your function)
// function loadRazorpayScript() {
//   return new Promise((resolve) => {
//     if (window.Razorpay) return resolve(true);
//     const s = document.createElement("script");
//     s.src = "https://checkout.razorpay.com/v1/checkout.js";
//     s.id = "razorpay-script";
//     s.onload = () => resolve(true);
//     s.onerror = () => resolve(false);
//     document.body.appendChild(s);
//   });
// }

// export default function App() {
//   const [scans, setScans] = useState([]);
//   const [lastUid, setLastUid] = useState("");
//   const [balance, setBalance] = useState(0);
//   const [amount, setAmount] = useState("");

//   // New states for user info
//   const [email, setEmail] = useState("");
//   const [pin, setPin] = useState("");

//   // Load scan history + latest UID + balance
//   const loadData = async () => {
//     const res = await fetch(`${BACKEND}/scans`);
//     const data = await res.json();

//     setScans(data.scans);

//     if (data.scans.length > 0) {
//       const uid = data.scans[data.scans.length - 1].uid;
//       setLastUid(uid);

//       const balRes = await fetch(`${BACKEND}/balance/${uid}`);
//       const balData = await balRes.json();
//       setBalance(balData.balance);
//     }
//   };

//   useEffect(() => {
//     loadData();
//     const interval = setInterval(loadData, 1500);
//     return () => clearInterval(interval);
//   }, []);

//   // Existing top-up function (unchanged)
//   const topUp = async () => {
//     if (!lastUid) {
//       alert("Scan a card first");
//       return;
//     }

//     const res = await fetch(`${BACKEND}/topup`, {
//       method: "POST",
//       headers: {"Content-Type": "application/json"},
//       body: JSON.stringify({ uid: lastUid, amount: Number(amount) })
//     });

//     const data = await res.json();
//     setBalance(data.newBalance);
//     alert("Top-up successful");
//     setAmount("");
//   };

//   // New: Save user email + pin for this card
//   const registerUser = async () => {
//     if (!lastUid) return alert("Scan a card first");

//     const res = await fetch(`${BACKEND}/register-user`, {
//       method: "POST",
//       headers: {"Content-Type": "application/json"},
//       body: JSON.stringify({ uid: lastUid, email, pin })
//     });

//     await res.json();
//     alert("User linked with card!");
//   };

//   // New: Razorpay button
//   const handleRazorpayPayment = async () => {
//     if (!amount) return alert("Enter an amount");

//     const loaded = await loadRazorpayScript();
//     if (!loaded) {
//       alert("Failed to load Razorpay script");
//       return;
//     }

//     const options = {
//       key:  "rzp_test_Rq4W4iPAoySwFt", // replace with your real Razorpay TEST key

//       amount: amount * 100,
//       currency: "INR",
//       name: "RFID Wallet Recharge",
//       description: "Top-up Payment",
//       handler: function (response) {
//         alert("Payment Successful ✔\nPayment ID: " + response.razorpay_payment_id);

//         // After payment → use existing topUp function
//         topUp();
//       }
//     };

//     const paymentObject = new window.Razorpay(options);
//     paymentObject.open();
//   };

//   return (
//     <div style={{ padding: 30, fontFamily: "Arial" }}>
//       <h1>RFID Card Recharge System</h1>

//       <h2>Last Scanned UID: {lastUid || "-"}</h2>
//       <h3>Current Balance: ₹{balance}</h3>

//       {/* ------------------ TOPUP UI ------------------ */}
//       <div style={{ marginTop: 20 }}>
//         <input
//           type="number"
//           placeholder="Enter amount"
//           value={amount}
//           onChange={(e) => setAmount(e.target.value)}
//           style={{ padding: 10, marginRight: 10 }}
//         />

//         <button
//           onClick={topUp}
//           style={{
//             padding: "10px 20px",
//             background: "green",
//             color: "white",
//             border: "none",
//             cursor: "pointer"
//           }}
//         >
//           Top Up
//         </button>

//         <button
//           onClick={handleRazorpayPayment}
//           style={{
//             padding: "10px 20px",
//             background: "orange",
//             color: "white",
//             border: "none",
//             cursor: "pointer",
//             marginLeft: 10
//           }}
//         >
//           Pay with Razorpay
//         </button>
//       </div>

//       {/* ------------------ USER LINKING SECTION ------------------ */}
//       <h2 style={{ marginTop: 40 }}>Link User to this Card</h2>

//       <input
//         type="email"
//         placeholder="Enter user email"
//         value={email}
//         onChange={(e) => setEmail(e.target.value)}
//         style={{ padding: 10, marginRight: 10 }}
//       />

//       <input
//         type="password"
//         placeholder="Set PIN"
//         value={pin}
//         onChange={(e) => setPin(e.target.value)}
//         style={{ padding: 10, marginRight: 10 }}
//       />

//       <button
//         onClick={registerUser}
//         style={{
//           padding: "10px 20px",
//           background: "blue",
//           color: "white",
//           border: "none",
//           cursor: "pointer"
//         }}
//       >
//         Save User
//       </button>

//       {/* ------------------ SCAN HISTORY TABLE ------------------ */}
//       <h2 style={{ marginTop: 40 }}>Scan History</h2>

//       <table border="1" width="100%" cellPadding="10">
//         <thead>
//           <tr>
//             <th>UID</th>
//             <th>Time</th>
//           </tr>
//         </thead>
//         <tbody>
//           {scans.map((s, i) => (
//             <tr key={i}>
//               <td>{s.uid}</td>
//               <td>{new Date(s.time).toLocaleString()}</td>
//             </tr>
//           ))}
//         </tbody>
//       </table>
//     </div>
//   );
// }

import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "./ThemeContext";
import ThemeToggle from "./ThemeToggle";
import User from "./user/User";
import Merchant from "./merchant/Merchant";
import Admin from "./admin/admin";
import Reward from "./reward/reward";
import Eth from "./reward/eth";
import NftVoucher from "./reward/nftVoucher";

export default function App() {
  return (
    <ThemeProvider>
      <Router>
        <div style={{ minHeight: '100vh', background: 'var(--bg)', transition: 'background 0.3s ease' }}>
          <Routes>
            <Route path="/" element={<Navigate to="/user" />} />
            <Route path="/user" element={<User />} />
            <Route path="/merchant" element={<Merchant />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/reward" element={<Reward />} />
            <Route path="/eth" element={<Eth />} />
            <Route path="/nftVoucher" element={<NftVoucher />} />
          </Routes>
          <ThemeToggle />
        </div>
      </Router>
    </ThemeProvider>
  );
}
