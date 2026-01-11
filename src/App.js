import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "./ThemeContext";
import Landing from "./components/Landing";
import Layout from "./components/Layout";
import User from "./user/User";
import UseLimits from "./user/UseLimits";
import Merchant from "./merchant/Merchant";
import Admin from "./admin/admin";
import Reward from "./reward/reward";
import Eth from "./reward/eth";
import NftVoucher from "./reward/nftVoucher";


const LayoutWrapper = ({ children }) => (
  <Layout>{children}</Layout>
);

export default function App() {
  return (
    <ThemeProvider>
      <Router>
        <Routes>
          {/* Landing page without navbar */}
          <Route path="/" element={<Landing />} />
          
          {/* Main app pages with navbar */}
          <Route path="/user" element={<LayoutWrapper><User /></LayoutWrapper>} />
          <Route path="/limits" element={<LayoutWrapper><UseLimits /></LayoutWrapper>} />
          <Route path="/merchant" element={<LayoutWrapper><Merchant /></LayoutWrapper>} />
          <Route path="/admin" element={<LayoutWrapper><Admin /></LayoutWrapper>} />
          <Route path="/reward" element={<LayoutWrapper><Reward /></LayoutWrapper>} />
          <Route path="/eth" element={<LayoutWrapper><Eth /></LayoutWrapper>} />
          <Route path="/nftVoucher" element={<LayoutWrapper><NftVoucher /></LayoutWrapper>} />
          
          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}
