import React, { useState } from "react";
import { ethers } from "ethers";
import abi from "./abi.json";
import { coupons } from "./coupons";
import { useNavigate } from "react-router-dom";

const CONTRACT_ADDRESS = "0x67dADB7dE7fAB7Dfd5b38139989d699384B33F71";

export default function NftVoucher() {
  const [account, setAccount] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function connectWallet() {
    if (!window.ethereum) return alert("Please install MetaMask!");
    try {
      setStatus("Connecting wallet...");
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
      setAccount(accounts[0]);
      setStatus("✅ Wallet connected!");
    } catch (err) {
      setStatus("Failed to connect wallet.");
    }
  }

  async function mint(couponId) {
    if (!window.ethereum) return alert("Install MetaMask!");
    if (!account) return alert("Please connect your wallet first!");
    
    try {
      setLoading(true);
      setStatus("Preparing NFT mint...");
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, abi, signer);

      setStatus("🔄 Minting NFT... Confirm in MetaMask");
      const tx = await contract.mintCoupon(couponId);
      
      setStatus("⏳ Waiting for confirmation...");
      await tx.wait();

      setStatus(`✅ NFT Voucher #${couponId} minted successfully!`);
      setLoading(false);
      
      setTimeout(() => {
        navigate("/reward");
      }, 2000);
    } catch (err) {
      console.error(err);
      setStatus("❌ Mint failed. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f9fafb" }}>
      {/* Navbar */}
      <nav style={{
        background: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
        color: "white",
        padding: "20px 0",
        boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
        marginBottom: "40px"
      }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ margin: 0, fontSize: "1.5rem" }}>🎫 NFT Coupon Collection</h2>
          <span style={{ opacity: 0.9 }}>Mint Exclusive Vouchers</span>
        </div>
      </nav>

      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 20px 60px 20px" }}>
        {/* Header */}
        <div style={{
          background: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
          borderRadius: 16,
          padding: "40px 32px",
          color: "white",
          marginBottom: "40px",
          textAlign: "center"
        }}>
          <h1 style={{ margin: 0, fontSize: "2.5rem", marginBottom: "12px" }}>🎫 NFT Vouchers</h1>
          <p style={{ margin: 0, opacity: 0.9, fontSize: "1.125rem" }}>Mint exclusive limited edition coupons</p>
        </div>

        {/* Wallet Connection Section */}
        <div style={{
          background: "white",
          borderRadius: 12,
          padding: "24px",
          marginBottom: "40px",
          boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
          border: "1px solid #e5e7eb"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <h3 style={{ margin: "0 0 8px 0", color: "#1f2937" }}>Wallet Status</h3>
              <p style={{ margin: 0, color: "#6b7280", fontSize: "0.875rem" }}>
                {account ? `Connected: ${account.slice(0, 6)}...${account.slice(-4)}` : "Not connected"}
              </p>
            </div>
            <button 
              onClick={connectWallet}
              style={{
                padding: "12px 28px",
                background: account ? "#10b981" : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                color: "white",
                border: "none",
                borderRadius: 8,
                fontWeight: "600",
                cursor: "pointer",
                boxShadow: "0 4px 6px rgba(0,0,0,0.1)"
              }}
            >
              {account ? "✅ Connected" : "🔗 Connect Wallet"}
            </button>
          </div>
        </div>

        {/* Status Message */}
        {status && (
          <div style={{
            background: status.includes("✅") ? "#d1fae5" : status.includes("❌") ? "#fee2e2" : "#fef3c7",
            border: `2px solid ${status.includes("✅") ? "#a7f3d0" : status.includes("❌") ? "#fecaca" : "#fcd34d"}`,
            borderRadius: 8,
            padding: "16px 20px",
            marginBottom: "32px",
            color: status.includes("✅") ? "#065f46" : status.includes("❌") ? "#991b1b" : "#92400e",
            fontWeight: "600"
          }}>
            {status}
          </div>
        )}

        {/* Coupons Grid */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "24px",
          marginBottom: "40px"
        }}>
          {coupons.map((coupon) => (
            <div
              key={coupon.id}
              style={{
                background: "white",
                borderRadius: 12,
                overflow: "hidden",
                boxShadow: "0 4px 6px rgba(0,0,0,0.08)",
                border: "1px solid #e5e7eb",
                transition: "transform 0.3s ease, box-shadow 0.3s ease"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-4px)";
                e.currentTarget.style.boxShadow = "0 20px 25px rgba(245,87,108,0.15)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 4px 6px rgba(0,0,0,0.08)";
              }}
            >
              {/* Image */}
              <div style={{
                width: "100%",
                height: "200px",
                background: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "white",
                fontSize: "3rem"
              }}>
                <img 
                  src={coupon.img} 
                  alt={coupon.name}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover"
                  }}
                  onError={(e) => {
                    e.target.style.display = "none";
                  }}
                />
              </div>

              {/* Content */}
              <div style={{ padding: "24px" }}>
                <div style={{
                  background: "#f3f4f6",
                  display: "inline-block",
                  padding: "6px 12px",
                  borderRadius: "20px",
                  fontSize: "0.75rem",
                  fontWeight: "600",
                  color: "#6366f1",
                  marginBottom: "12px"
                }}>
                  Coupon #{coupon.id}
                </div>
                
                <h3 style={{ margin: "0 0 8px 0", color: "#1f2937", fontSize: "1.25rem" }}>
                  {coupon.name}
                </h3>
                
                <p style={{
                  margin: "0 0 20px 0",
                  color: "#6b7280",
                  fontSize: "0.875rem",
                  lineHeight: "1.6"
                }}>
                  {coupon.description}
                </p>

                <button
                  onClick={() => mint(coupon.id)}
                  disabled={loading || !account}
                  style={{
                    width: "100%",
                    padding: "12px 16px",
                    background: loading || !account ? "#d1d5db" : "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
                    color: "white",
                    border: "none",
                    borderRadius: 8,
                    fontWeight: "600",
                    cursor: loading || !account ? "not-allowed" : "pointer",
                    fontSize: "0.95rem",
                    boxShadow: loading || !account ? "none" : "0 4px 6px rgba(245,87,108,0.2)"
                  }}
                >
                  {loading ? "⏳ Minting..." : !account ? "Connect Wallet" : `🎫 Mint Coupon #${coupon.id}`}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Info Section */}
        <div style={{
          background: "#f0f9ff",
          border: "2px solid #bfdbfe",
          borderRadius: 12,
          padding: "32px"
        }}>
          <h3 style={{ margin: "0 0 20px 0", color: "#1e40af" }}>ℹ️ About NFT Vouchers</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "24px" }}>
            <div>
              <h4 style={{ margin: "0 0 8px 0", color: "#1e40af" }}>💎 Exclusive Benefits</h4>
              <p style={{ margin: 0, color: "#3b82f6", fontSize: "0.875rem", lineHeight: "1.6" }}>
                Unlock special discounts and early access to new products
              </p>
            </div>
            <div>
              <h4 style={{ margin: "0 0 8px 0", color: "#1e40af" }}>🔄 Tradeable</h4>
              <p style={{ margin: 0, color: "#3b82f6", fontSize: "0.875rem", lineHeight: "1.6" }}>
                Buy, sell, and trade your NFT vouchers on blockchain marketplaces
              </p>
            </div>
            <div>
              <h4 style={{ margin: "0 0 8px 0", color: "#1e40af" }}>✅ Authentic</h4>
              <p style={{ margin: 0, color: "#3b82f6", fontSize: "0.875rem", lineHeight: "1.6" }}>
                Each NFT is unique and verified on the blockchain
              </p>
            </div>
            <div>
              <h4 style={{ margin: "0 0 8px 0", color: "#1e40af" }}>⭐ Limited Edition</h4>
              <p style={{ margin: 0, color: "#3b82f6", fontSize: "0.875rem", lineHeight: "1.6" }}>
                Mint rare collectibles before they sell out
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}