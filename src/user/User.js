import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../ThemeContext";

const BACKEND = "http://localhost:3000";

// Razorpay loader
function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.id = "razorpay-script";
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
}

export default function User() {
  const [scans, setScans] = useState([]);
  const [lastUid, setLastUid] = useState("");
  const [balance, setBalance] = useState(0);
  const [amount, setAmount] = useState("");
  const [email, setEmail] = useState("");
  const [pin, setPin] = useState("");
  const [totalSpent, setTotalSpent] = useState(0);
  const [notification, setNotification] = useState("");
  const navigate = useNavigate();
  const { colors } = useTheme();

  // Load DB / scans and update last UID + card info
  const loadData = async () => {
    try {
      const res = await fetch(`${BACKEND}/scans`);
      const data = await res.json(); // expecting earlier server to return the db OR { scans: [...] }
      // support both shapes:
      const db = data.scans ? data : data; // if data is db, fine. If data.scans exists, data is db too.
      const scansArr = db.scans || [];
      setScans(scansArr);

      if (scansArr.length > 0) {
        const last = scansArr[scansArr.length - 1];
        const uid = last.uid;
        setLastUid(uid);

        // Try to fetch balance endpoint which returns { uid, balance }
        const balRes = await fetch(`${BACKEND}/balance/${uid}`);
        const balData = await balRes.json();
        setBalance(Number(balData.balance || 0));

        // Try to read totalSpent from db.cards if /scans returned whole db
        if (db.cards && db.cards[uid]) {
          setTotalSpent(Number(db.cards[uid].totalSpent || 0));
          if (db.cards[uid].email && !email) setEmail(db.cards[uid].email);
        } else {
          // as fallback, fetch card info via a custom endpoint if you implement one
          setTotalSpent(0);
        }

        // If balance is zero, show notification (non-blocking)
        if (Number(balData.balance || 0) === 0) {
          setNotification("Your card balance is 0. Please top-up to use merchant services.");
        }
      } else {
        setLastUid("");
        setBalance(0);
        setTotalSpent(0);
      }
    } catch (err) {
      console.error("Load error:", err);
    }
  };

  useEffect(() => {
    loadData();
    const iv = setInterval(loadData, 1500);
    return () => clearInterval(iv);
    // eslint-disable-next-line
  }, []);

  // Register user (email + PIN) for current card
  const registerUser = async () => {
    if (!lastUid) return alert("Scan a card first to link user.");
    if (!email) return alert("Enter email.");
    if (!pin) return alert("Set a PIN.");

    await fetch(`${BACKEND}/register-user`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ uid: lastUid, email, pin })
    });

    alert("User linked to card.");
    loadData();
  };

  // Manual top-up: call backend /topup (no payment)
  const topUpManual = async () => {
    if (!lastUid) return alert("Scan a card first.");
    if (!amount || Number(amount) <= 0) return alert("Enter valid amount.");

    const res = await fetch(`${BACKEND}/topup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ uid: lastUid, amount: Number(amount) })
    });

    const data = await res.json();
    if (data.newBalance !== undefined) {
      setBalance(data.newBalance);
      alert("Top-up stored.");
      setAmount("");
      loadData();
    } else {
      alert("Top-up failed.");
    }
  };

  // Razorpay payment: after success, call /topup to store amount
  const handleRazorpay = async () => {
    if (!lastUid) return alert("Scan a card first.");
    if (!amount || Number(amount) <= 0) return alert("Enter valid amount.");

    const loaded = await loadRazorpayScript();
    if (!loaded) return alert("Razorpay failed to load.");

    // NOTE: Replace key with your Razorpay key. For production, generate order on server.
    const options = {
      key: "rzp_test_Rq4W4iPAoySwFt",
      amount: Number(amount) * 100,
      currency: "INR",
      name: "RFID Wallet Recharge",
      description: "Add money to wallet",
      handler: async function (response) {
        // On success, store in backend
        const res = await fetch(`${BACKEND}/topup`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ uid: lastUid, amount: Number(amount) })
        });
        const data = await res.json();
        if (data.newBalance !== undefined) {
          setBalance(data.newBalance);
          alert(`Payment success. New balance: ₹${data.newBalance}`);
          setAmount("");
          loadData();
        } else {
          alert("Top-up storage failed after payment.");
        }
      }
    };

    const rzp = new window.Razorpay(options);
    rzp.open();
  };

  // optional: go to reward
  const goToReward = () => {
    navigate("/reward");
  };

  return (
    <div style={{ minHeight: "100vh", background: colors.bg, transition: 'all 0.3s ease' }}>
      {/* Navbar */}
      <nav style={{
        background: colors.gradient1,
        color: "white",
        padding: "24px 0",
        boxShadow: colors.shadowLg,
        marginBottom: "48px",
        backdropFilter: 'blur(10px)'
      }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ fontSize: '2rem' }}>💳</div>
            <div>
              <h2 style={{ margin: 0, fontSize: "1.75rem", fontWeight: 700 }}>Elite Pay</h2>
              <p style={{ margin: 0, opacity: 0.9, fontSize: '0.875rem' }}>Wallet Dashboard</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button 
              onClick={() => navigate('/merchant')}
              style={{
                padding: '10px 20px',
                background: 'rgba(255,255,255,0.2)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.3)',
                borderRadius: '8px',
                color: 'white',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '0.875rem'
              }}
            >
              Merchant
            </button>
            <button 
              onClick={() => navigate('/reward')}
              style={{
                padding: '10px 20px',
                background: 'rgba(255,255,255,0.2)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.3)',
                borderRadius: '8px',
                color: 'white',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '0.875rem'
              }}
            >
              Rewards
            </button>
          </div>
        </div>
      </nav>

      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 24px 48px" }}>
        {/* Notification */}
        {notification && (
          <div className="slide-in" style={{
            padding: "18px 24px",
            marginBottom: 32,
            background: colors.warningLight,
            border: `2px solid ${colors.warning}`,
            borderRadius: 12,
            color: colors.text,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            boxShadow: colors.shadowMd
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '1.5rem' }}>⚠️</span>
              <span style={{ fontWeight: 500 }}>{notification}</span>
            </div>
            <button 
              onClick={() => setNotification("")}
              style={{
                padding: "10px 20px",
                background: colors.warning,
                border: "none",
                borderRadius: 8,
                cursor: "pointer",
                fontWeight: "600",
                color: "white",
                transition: 'all 0.3s ease'
              }}
            >
              Got it
            </button>
          </div>
        )}

        {/* Card Stats */}
        <div className="fade-in" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "24px", marginBottom: "48px" }}>
          {/* Balance Card */}
          <div style={{
            background: colors.gradient1,
            color: "white",
            padding: "36px 28px",
            borderRadius: 16,
            boxShadow: colors.shadowXl,
            position: 'relative',
            overflow: 'hidden',
            transition: 'transform 0.3s ease'
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <div style={{ position: 'absolute', top: '-20px', right: '-20px', fontSize: '5rem', opacity: 0.2 }}>💰</div>
            <p style={{ margin: 0, opacity: 0.9, marginBottom: "10px", fontSize: "0.875rem", fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px' }}>Current Balance</p>
            <h3 style={{ margin: 0, fontSize: "3rem", color: "white", fontWeight: 700 }}>₹{balance.toLocaleString()}</h3>
          </div>

          {/* Total Spent Card */}
          <div style={{
            background: colors.gradient2,
            color: "white",
            padding: "36px 28px",
            borderRadius: 16,
            boxShadow: colors.shadowXl,
            position: 'relative',
            overflow: 'hidden',
            transition: 'transform 0.3s ease'
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <div style={{ position: 'absolute', top: '-20px', right: '-20px', fontSize: '5rem', opacity: 0.2 }}>💳</div>
            <p style={{ margin: 0, opacity: 0.9, marginBottom: "10px", fontSize: "0.875rem", fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px' }}>Total Spent</p>
            <h3 style={{ margin: 0, fontSize: "3rem", color: "white", fontWeight: 700 }}>₹{totalSpent.toLocaleString()}</h3>
          </div>

          {/* UID Card */}
          <div style={{
            background: colors.gradient4,
            color: "white",
            padding: "36px 28px",
            borderRadius: 16,
            boxShadow: colors.shadowXl,
            position: 'relative',
            overflow: 'hidden',
            transition: 'transform 0.3s ease'
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <div style={{ position: 'absolute', top: '-20px', right: '-20px', fontSize: '5rem', opacity: 0.2 }}>🏷️</div>
            <p style={{ margin: 0, opacity: 0.9, marginBottom: "10px", fontSize: "0.875rem", fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px' }}>Card UID</p>
            <h4 style={{ margin: 0, fontSize: "1.25rem", color: "white", wordBreak: "break-all", fontWeight: 600 }}>{lastUid || "No card scanned"}</h4>
          </div>
        </div>

        {/* Top-up Section */}
        <div className="fade-in" style={{
          background: colors.card,
          padding: "36px",
          borderRadius: 16,
          boxShadow: colors.shadowLg,
          marginBottom: "48px",
          border: `1px solid ${colors.border}`
        }}>
          <h3 style={{ marginTop: 0, marginBottom: "28px", color: colors.text, fontSize: '1.75rem', fontWeight: 700 }}>💰 Add Funds</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr auto auto", gap: "16px", alignItems: "end" }}>
            <div>
              <label style={{ display: "block", marginBottom: "10px", fontWeight: "600", color: colors.textSecondary, fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Amount (₹)</label>
              <input
                type="number"
                placeholder="Enter amount to add..."
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                style={{ 
                  width: "100%", 
                  padding: "14px 16px", 
                  border: `2px solid ${colors.border}`, 
                  borderRadius: 10,
                  background: colors.inputBg,
                  color: colors.text,
                  fontSize: '1rem',
                  outline: 'none',
                  transition: 'all 0.3s'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = colors.primary;
                  e.target.style.boxShadow = `0 0 0 3px ${colors.primary}20`;
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = colors.border;
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>
            <button 
              onClick={topUpManual}
              className="ripple"
              style={{
                padding: "14px 28px",
                background: colors.gradient4,
                color: "white",
                border: "none",
                borderRadius: 10,
                fontWeight: "600",
                cursor: "pointer",
                boxShadow: colors.shadowMd,
                fontSize: '1rem',
                transition: 'all 0.3s',
                whiteSpace: 'nowrap'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = colors.shadowXl;
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = colors.shadowMd;
              }}
            >
              💵 Manual Top Up
            </button>
            <button 
              onClick={handleRazorpay}
              className="ripple"
              style={{
                padding: "14px 28px",
                background: colors.gradient1,
                color: "white",
                border: "none",
                borderRadius: 10,
                fontWeight: "600",
                cursor: "pointer",
                boxShadow: colors.shadowMd,
                fontSize: '1rem',
                transition: 'all 0.3s',
                whiteSpace: 'nowrap'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = colors.shadowXl;
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = colors.shadowMd;
              }}
            >
              💳 Razorpay
            </button>
          </div>
        </div>

        {/* User Registration Section */}
        <div style={{
          background: "white",
          padding: "32px",
          borderRadius: 12,
          boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
          marginBottom: "40px"
        }}>
          <h3 style={{ marginTop: 0, marginBottom: "24px", color: "#1f2937" }}>👤 Link User Profile</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: "16px", alignItems: "end" }}>
            <div>
              <label style={{ display: "block", marginBottom: "8px", fontWeight: "600", color: "#374151" }}>Email</label>
              <input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ width: "100%", padding: "12px 16px", border: "2px solid #e5e7eb", borderRadius: 8 }}
              />
            </div>
            <div>
              <label style={{ display: "block", marginBottom: "8px", fontWeight: "600", color: "#374151" }}>PIN</label>
              <input
                type="password"
                placeholder="Set a 4-digit PIN"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                style={{ width: "100%", padding: "12px 16px", border: "2px solid #e5e7eb", borderRadius: 8 }}
              />
            </div>
            <button 
              onClick={registerUser} 
              style={{
                padding: "12px 24px",
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                color: "white",
                border: "none",
                borderRadius: 8,
                fontWeight: "600",
                cursor: "pointer",
                boxShadow: "0 4px 6px rgba(0,0,0,0.1)"
              }}
            >
              Save User
            </button>
          </div>
        </div>

        
                
   

        {/* Rewards Section */}
        <div style={{
          background: "white",
          padding: "32px",
          borderRadius: 12,
          boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
          marginBottom: "40px",
          textAlign: "center"
        }}>
          <h3 style={{ marginTop: 0, marginBottom: "24px", color: "#1f2937" }}>🎁 Rewards Program</h3>
          {totalSpent >= 5000 ? (
            <div>
              <p style={{ color: "#059669", fontSize: "1.125rem", marginBottom: "20px", fontWeight: "600" }}>
                🎉 Congratulations! You've unlocked a reward!
              </p>
              <button 
                onClick={goToReward} 
                style={{
                  padding: "14px 32px",
                  background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                  color: "white",
                  border: "none",
                  borderRadius: 8,
                  fontWeight: "600",
                  cursor: "pointer",
                  fontSize: "1rem",
                  boxShadow: "0 4px 6px rgba(0,0,0,0.1)"
                }}
              >
                ✨ Claim Your Reward
              </button>
            </div>
          ) : (
            <div style={{ background: "#f0fdf4", padding: "24px", borderRadius: 8, border: "2px solid #dcfce7" }}>
              <p style={{ margin: 0, color: "#165e3c", fontWeight: "600", marginBottom: "12px" }}>
                Progress: ₹{totalSpent} / ₹5000
              </p>
              <div style={{
                width: "100%",
                height: "12px",
                background: "#dcfce7",
                borderRadius: "6px",
                overflow: "hidden",
                marginBottom: "12px"
              }}>
                <div style={{
                  height: "100%",
                  width: `${(totalSpent / 5000) * 100}%`,
                  background: "linear-gradient(90deg, #10b981 0%, #059669 100%)",
                  transition: "width 0.3s ease"
                }}></div>
              </div>
              <p style={{ margin: 0, color: "#6b7280", fontSize: "0.875rem" }}>
                Spend ₹{5000 - totalSpent} more to unlock your reward!
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
