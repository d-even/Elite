import React, { useEffect, useState } from "react";

const BACKEND = "http://localhost:3000";

export default function Merchant() {
  const [lastUid, setLastUid] = useState("");
  const [balance, setBalance] = useState(0);
  const [amount, setAmount] = useState("");
  const [cardPresent, setCardPresent] = useState(false);

  // Poll for scans and update card info
  const loadData = async () => {
    try {
      const res = await fetch(`${BACKEND}/scans`);
      const data = await res.json();
      const db = data.scans ? data : data; // support both
      const scansArr = db.scans || [];

      if (scansArr.length > 0) {
        const last = scansArr[scansArr.length - 1];
        setLastUid(last.uid);
        setCardPresent(true);

        const balRes = await fetch(`${BACKEND}/balance/${last.uid}`);
        const balData = await balRes.json();
        setBalance(Number(balData.balance || 0));
      } else {
        setLastUid("");
        setBalance(0);
        setCardPresent(false);
      }
    } catch (err) {
      console.error("Merchant load error:", err);
    }
  };

  useEffect(() => {
    loadData();
    const iv = setInterval(loadData, 1500);
    return () => clearInterval(iv);
  }, []);

  // Deduct flow
  const handleDeduct = async () => {
    if (!cardPresent) return alert("Please ask the user to tap their card.");

    if (!amount || Number(amount) <= 0) return alert("Enter valid amount.");

    // If >100 ask for PIN
    let pin = undefined;
    if (Number(amount) > 100) {
      pin = window.prompt("Amount > ₹100 — please enter user PIN:");
      if (!pin) return alert("PIN required for this transaction.");
    }

    // Call backend deduct
    const res = await fetch(`${BACKEND}/deduct`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ uid: lastUid, amount: Number(amount), pin })
    });

    const data = await res.json();

    if (data.error) {
      alert(data.error);
      return;
    }

    // If platform fee collected, backend returns fee
    const newBalance = data.newBalance;
    const fee = data.fee || 0;

    alert(`Payment successful. Fee: ₹${fee.toFixed(2)}. New balance: ₹${newBalance}`);
    setBalance(newBalance);
    setAmount("");
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f9fafb" }}>
      {/* Navbar */}
      <nav style={{
        background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
        color: "white",
        padding: "20px 0",
        boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
        marginBottom: "40px"
      }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ margin: 0, fontSize: "1.5rem" }}>🏪 Merchant Portal</h2>
          <span style={{ opacity: 0.9 }}>Payment System</span>
        </div>
      </nav>

      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 20px" }}>
        {/* Status Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "24px", marginBottom: "40px" }}>
          {/* Card Status */}
          <div style={{
            background: cardPresent ? "linear-gradient(135deg, #10b981 0%, #059669 100%)" : "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
            color: "white",
            padding: "32px 24px",
            borderRadius: 12,
            boxShadow: "0 10px 15px rgba(0,0,0,0.1)"
          }}>
            <p style={{ margin: 0, opacity: 0.9, marginBottom: "8px", fontSize: "0.875rem" }}>Card Status</p>
            <h3 style={{ margin: 0, fontSize: "1.5rem", color: "white" }}>
              {cardPresent ? "✅ Card Detected" : "❌ Awaiting Card"}
            </h3>
          </div>

          {/* Current Balance */}
          <div style={{
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            color: "white",
            padding: "32px 24px",
            borderRadius: 12,
            boxShadow: "0 10px 15px rgba(0,0,0,0.1)"
          }}>
            <p style={{ margin: 0, opacity: 0.9, marginBottom: "8px", fontSize: "0.875rem" }}>Card Balance</p>
            <h3 style={{ margin: 0, fontSize: "2.5rem", color: "white" }}>₹{balance}</h3>
          </div>

          {/* Card UID */}
          <div style={{
            background: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
            color: "white",
            padding: "32px 24px",
            borderRadius: 12,
            boxShadow: "0 10px 15px rgba(0,0,0,0.1)"
          }}>
            <p style={{ margin: 0, opacity: 0.9, marginBottom: "8px", fontSize: "0.875rem" }}>Card UID</p>
            <h4 style={{ margin: 0, fontSize: "1.25rem", color: "white", wordBreak: "break-all" }}>
              {lastUid || "Not scanned"}
            </h4>
          </div>
        </div>

        {/* Payment Section */}
        <div style={{
          background: "white",
          padding: "40px",
          borderRadius: 12,
          boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
          marginBottom: "40px"
        }}>
          <h3 style={{ marginTop: 0, marginBottom: "32px", color: "#1f2937" }}>💳 Collect Payment</h3>
          
          <div style={{
            background: cardPresent ? "#f0fdf4" : "#fef2f2",
            padding: "24px",
            borderRadius: 8,
            border: `2px solid ${cardPresent ? "#dcfce7" : "#fee2e2"}`,
            marginBottom: "32px"
          }}>
            <p style={{ margin: 0, color: cardPresent ? "#165e3c" : "#7f1d1d", fontWeight: "600" }}>
              {cardPresent ? "✅ Card is ready for payment" : "❌ Please ask customer to tap their card"}
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: "16px", alignItems: "end", marginBottom: "32px" }}>
            <div>
              <label style={{ display: "block", marginBottom: "12px", fontWeight: "600", color: "#374151", fontSize: "1.125rem" }}>
                Enter Amount (₹)
              </label>
              <input
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                disabled={!cardPresent}
                style={{
                  width: "100%",
                  padding: "16px",
                  fontSize: "1.125rem",
                  border: "2px solid #e5e7eb",
                  borderRadius: 8,
                  opacity: cardPresent ? 1 : 0.6
                }}
              />
            </div>
            <button
              onClick={handleDeduct}
              disabled={!cardPresent}
              style={{
                padding: "16px 40px",
                background: cardPresent ? "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)" : "#d1d5db",
                color: "white",
                border: "none",
                borderRadius: 8,
                fontWeight: "600",
                cursor: cardPresent ? "pointer" : "not-allowed",
                fontSize: "1rem",
                boxShadow: cardPresent ? "0 4px 6px rgba(0,0,0,0.1)" : "none"
              }}
            >
              💳 Deduct Payment
            </button>
          </div>

          {/* Transaction Info */}
          <div style={{
            background: "#f3f4f6",
            padding: "20px",
            borderRadius: 8,
            borderLeft: "4px solid #667eea"
          }}>
            <p style={{ margin: "0 0 12px 0", fontWeight: "600", color: "#374151" }}>📋 Transaction Info:</p>
            <ul style={{ margin: 0, paddingLeft: "20px", color: "#6b7280", lineHeight: "1.8" }}>
              <li>PIN required for transactions above ₹100</li>
              <li>Platform fee: 2% for amounts above ₹500</li>
              <li>Transactions are processed instantly</li>
              <li>Receipt will be generated automatically</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}








// import React, { useEffect, useState } from "react";

// const BACKEND = "http://localhost:3000";

// export default function Merchant() {
//   const [lastUid, setLastUid] = useState("");
//   const [balance, setBalance] = useState(0);
//   const [amount, setAmount] = useState("");
//   const [isCardPresent, setIsCardPresent] = useState(false);

//   // Fetch the latest scanned card
//   const loadData = async () => {
//     try {
//       const res = await fetch(`${BACKEND}/scans`);
//       const data = await res.json();

//       if (data.scans.length > 0) {
//         const latest = data.scans[data.scans.length - 1];
//         setLastUid(latest.uid);
//         setIsCardPresent(true);

//         const balRes = await fetch(`${BACKEND}/balance/${latest.uid}`);
//         const balData = await balRes.json();
//         setBalance(balData.balance);
//       } else {
//         setIsCardPresent(false);
//         setLastUid("");
//       }
//     } catch (err) {
//       console.error("Merchant error:", err);
//     }
//   };

//   useEffect(() => {
//     loadData();
//     const interval = setInterval(loadData, 1500);
//     return () => clearInterval(interval);
//   }, []);

//   // Deduct balance only when card is scanned
//   const deductBalance = async () => {
//     if (!isCardPresent) {
//       return alert("Please scan a card first!");
//     }
//     if (!amount) {
//       return alert("Enter amount to deduct!");
//     }

//     const res = await fetch(`${BACKEND}/deduct`, {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({ uid: lastUid, amount: Number(amount) })
//     });

//     const data = await res.json();

//     if (data.error) {
//       alert(data.error);
//       return;
//     }

//     alert("Amount deducted successfully!");
//     setBalance(data.newBalance);
//     setAmount("");
//   };

//   return (
//     <div style={{ padding: 30, fontFamily: "Arial" }}>
//       <h1>Merchant Payment Portal</h1>

//       <h2>
//         Card Status:{" "}
//         {isCardPresent ? (
//           <span style={{ color: "green" }}>Card Detected ✔</span>
//         ) : (
//           <span style={{ color: "red" }}>Waiting for Card…</span>
//         )}
//       </h2>

//       <h3>UID: {lastUid || "-"}</h3>
//       <h3>Balance: ₹{balance}</h3>

//       <input
//         type="number"
//         placeholder="Enter amount"
//         value={amount}
//         onChange={(e) => setAmount(e.target.value)}
//         style={{ padding: 10, marginRight: 10 }}
//       />

//       <button
//         onClick={deductBalance}
//         disabled={!isCardPresent}
//         style={{
//           padding: "10px 20px",
//           background: isCardPresent ? "red" : "gray",
//           color: "white",
//           border: "none",
//           cursor: isCardPresent ? "pointer" : "not-allowed"
//         }}
//       >
//         Deduct Amount
//       </button>

//       <p style={{ marginTop: 20 }}>
//         * Ask user to scan their card before payment is deducted.
//       </p>
//     </div>
//   );
// }
