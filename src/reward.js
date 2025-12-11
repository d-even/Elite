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
    <div style={{ padding: 40, fontFamily: "Arial", textAlign: "center" }}>
      <h1>🎉 Congratulations!</h1>
      <h2>You unlocked your reward!</h2>
      <p style={{ marginBottom: 30 }}>Choose your reward below:</p>

      <div style={{ display: "flex", gap: 20, justifyContent: "center", marginBottom: 20 }}>
        <button
          onClick={handleGetEth}
          style={{
            padding: "15px 30px",
            fontSize: "16px",
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            color: "#fff",
            border: "none",
            borderRadius: 8,
            cursor: "pointer",
            fontWeight: "bold",
            boxShadow: "0 4px 6px rgba(0,0,0,0.1)"
          }}
        >
          🪙 Get ETH
        </button>

        <button
          onClick={handleGetNftVoucher}
          style={{
            padding: "15px 30px",
            fontSize: "16px",
            background: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
            color: "#fff",
            border: "none",
            borderRadius: 8,
            cursor: "pointer",
            fontWeight: "bold",
            boxShadow: "0 4px 6px rgba(0,0,0,0.1)"
          }}
        >
          🎫 NFT Voucher
        </button>
      </div>
    </div>
  );
}
