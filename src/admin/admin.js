import { useEffect, useState } from "react";

export default function Admin() {
  const [fees, setFees] = useState([]);

  const loadFees = async () => {
    const res = await fetch("http://localhost:3000/fees");
    const data = await res.json();
    setFees(data);
  };

  useEffect(() => {
    loadFees();
  }, []);

  return (
    <div style={{ padding: 20 }}>
      <h1>Platform Fees Collected</h1>

      <table border="1" width="100%">
        <thead>
          <tr>
            <th>UID</th>
            <th>Email</th>
            <th>Fee Amount</th>
            <th>Time</th>
          </tr>
        </thead>
        <tbody>
          {fees.map((f, i) => (
            <tr key={i}>
              <td>{f.uid}</td>
              <td>{f.email}</td>
              <td>₹{f.fee}</td>
              <td>{new Date(f.time).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
