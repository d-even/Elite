import React from "react";
import { useNavigate } from "react-router-dom";

export default function Reward() {
  const navigate = useNavigate();

  const handleGetEth = () => {
    navigate("/eth");
  };

  const handleGetNftVoucher = () => {
    navigate("/nftVoucher");
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f9fafb" }}>
      {/* Navbar */}
      <nav style={{
        background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
        color: "white",
        padding: "20px 0",
        boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
        marginBottom: "40px"
      }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ margin: 0, fontSize: "1.5rem" }}>🎁 Rewards Center</h2>
          <span style={{ opacity: 0.9 }}>Exclusive Benefits</span>
        </div>
      </nav>

      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 20px 60px 20px" }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "60px" }}>
          <h1 style={{ fontSize: "3rem", color: "#1f2937", marginBottom: "16px" }}>🎉 Congratulations!</h1>
          <p style={{ fontSize: "1.25rem", color: "#6b7280", marginBottom: "12px" }}>
            You've unlocked exclusive rewards!
          </p>
          <p style={{ fontSize: "1rem", color: "#9ca3af" }}>
            Choose one of the amazing rewards below and claim your prize today.
          </p>
        </div>

        {/* Rewards Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "32px", marginBottom: "60px" }}>
          {/* ETH Reward Card */}
          <div style={{
            background: "white",
            borderRadius: 16,
            overflow: "hidden",
            boxShadow: "0 20px 25px rgba(0,0,0,0.08)",
            transition: "transform 0.3s ease, box-shadow 0.3s ease",
            border: "1px solid #e5e7eb"
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-8px)";
            e.currentTarget.style.boxShadow = "0 25px 50px rgba(102,126,234,0.2)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "0 20px 25px rgba(0,0,0,0.08)";
          }}
          >
            <div style={{
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              padding: "60px 24px",
              textAlign: "center",
              color: "white"
            }}>
              <div style={{ fontSize: "4rem", marginBottom: "16px" }}>🪙</div>
              <h3 style={{ margin: 0, fontSize: "1.75rem" }}>Ethereum Reward</h3>
              <p style={{ margin: "8px 0 0 0", opacity: 0.9 }}>0.001 ETH</p>
            </div>
            <div style={{ padding: "32px 24px" }}>
              <p style={{ color: "#6b7280", lineHeight: "1.6", marginBottom: "24px" }}>
                Receive real Ethereum directly to your digital wallet. A valuable cryptocurrency reward for your loyalty!
              </p>
              <div style={{ marginBottom: "24px" }}>
                <h4 style={{ margin: "0 0 12px 0", color: "#374151" }}>Benefits:</h4>
                <ul style={{ margin: 0, paddingLeft: "20px", color: "#6b7280", lineHeight: "1.8" }}>
                  <li>Instant transfer</li>
                  <li>Trade anytime</li>
                  <li>Secure wallet</li>
                </ul>
              </div>
              <button
                onClick={handleGetEth}
                style={{
                  width: "100%",
                  padding: "14px 24px",
                  background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  color: "white",
                  border: "none",
                  borderRadius: 8,
                  fontWeight: "600",
                  fontSize: "1rem",
                  cursor: "pointer",
                  boxShadow: "0 4px 6px rgba(102,126,234,0.3)",
                  transition: "transform 0.2s ease"
                }}
                onMouseEnter={(e) => e.target.style.transform = "scale(1.02)"}
                onMouseLeave={(e) => e.target.style.transform = "scale(1)"}
              >
                Claim ETH Reward
              </button>
            </div>
          </div>

          {/* NFT Voucher Card */}
          <div style={{
            background: "white",
            borderRadius: 16,
            overflow: "hidden",
            boxShadow: "0 20px 25px rgba(0,0,0,0.08)",
            transition: "transform 0.3s ease, box-shadow 0.3s ease",
            border: "1px solid #e5e7eb"
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-8px)";
            e.currentTarget.style.boxShadow = "0 25px 50px rgba(245,87,108,0.2)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "0 20px 25px rgba(0,0,0,0.08)";
          }}
          >
            <div style={{
              background: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
              padding: "60px 24px",
              textAlign: "center",
              color: "white"
            }}>
              <div style={{ fontSize: "4rem", marginBottom: "16px" }}>🎫</div>
              <h3 style={{ margin: 0, fontSize: "1.75rem" }}>NFT Voucher</h3>
              <p style={{ margin: "8px 0 0 0", opacity: 0.9 }}>Limited Edition</p>
            </div>
            <div style={{ padding: "32px 24px" }}>
              <p style={{ color: "#6b7280", lineHeight: "1.6", marginBottom: "24px" }}>
                Mint an exclusive NFT voucher with special benefits and trading potential on blockchain!
              </p>
              <div style={{ marginBottom: "24px" }}>
                <h4 style={{ margin: "0 0 12px 0", color: "#374151" }}>Benefits:</h4>
                <ul style={{ margin: 0, paddingLeft: "20px", color: "#6b7280", lineHeight: "1.8" }}>
                  <li>Exclusive discounts</li>
                  <li>Tradeable asset</li>
                  <li>Early access</li>
                </ul>
              </div>
              <button
                onClick={handleGetNftVoucher}
                style={{
                  width: "100%",
                  padding: "14px 24px",
                  background: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
                  color: "white",
                  border: "none",
                  borderRadius: 8,
                  fontWeight: "600",
                  fontSize: "1rem",
                  cursor: "pointer",
                  boxShadow: "0 4px 6px rgba(245,87,108,0.3)",
                  transition: "transform 0.2s ease"
                }}
                onMouseEnter={(e) => e.target.style.transform = "scale(1.02)"}
                onMouseLeave={(e) => e.target.style.transform = "scale(1)"}
              >
                Mint NFT Voucher
              </button>
            </div>
          </div>
        </div>

        {/* Info Section */}
        <div style={{
          background: "#f0f9ff",
          border: "2px solid #bfdbfe",
          borderRadius: 12,
          padding: "32px",
          textAlign: "center"
        }}>
          <h3 style={{ margin: "0 0 16px 0", color: "#1e40af" }}>ℹ️ How It Works</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "24px" }}>
            <div>
              <div style={{ fontSize: "2.5rem", marginBottom: "8px" }}>1️⃣</div>
              <p style={{ margin: 0, color: "#1e40af", fontWeight: "600" }}>Select Your Reward</p>
              <p style={{ margin: "8px 0 0 0", color: "#3b82f6", fontSize: "0.875rem" }}>Choose ETH or NFT</p>
            </div>
            <div>
              <div style={{ fontSize: "2.5rem", marginBottom: "8px" }}>2️⃣</div>
              <p style={{ margin: 0, color: "#1e40af", fontWeight: "600" }}>Connect Wallet</p>
              <p style={{ margin: "8px 0 0 0", color: "#3b82f6", fontSize: "0.875rem" }}>Provide wallet address</p>
            </div>
            <div>
              <div style={{ fontSize: "2.5rem", marginBottom: "8px" }}>3️⃣</div>
              <p style={{ margin: 0, color: "#1e40af", fontWeight: "600" }}>Claim Reward</p>
              <p style={{ margin: "8px 0 0 0", color: "#3b82f6", fontSize: "0.875rem" }}>Instant transfer</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
