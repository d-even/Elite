import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "./ThemeContext";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
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
      <AuthProvider>
        <Router>
          <Routes>
            {/* Protected Landing page */}
            <Route path="/" element={
              <ProtectedRoute>
                <Landing />
              </ProtectedRoute>
            } />
            
            {/* Protected Main app pages with navbar */}
            <Route path="/user" element={
              <ProtectedRoute>
                <LayoutWrapper><User /></LayoutWrapper>
              </ProtectedRoute>
            } />
            <Route path="/limits" element={
              <ProtectedRoute>
                <LayoutWrapper><UseLimits /></LayoutWrapper>
              </ProtectedRoute>
            } />
            <Route path="/merchant" element={
              <ProtectedRoute>
                <LayoutWrapper><Merchant /></LayoutWrapper>
              </ProtectedRoute>
            } />
            <Route path="/admin" element={
              <ProtectedRoute>
                <LayoutWrapper><Admin /></LayoutWrapper>
              </ProtectedRoute>
            } />
            <Route path="/reward" element={
              <ProtectedRoute>
                <LayoutWrapper><Reward /></LayoutWrapper>
              </ProtectedRoute>
            } />
            <Route path="/eth" element={
              <ProtectedRoute>
                <LayoutWrapper><Eth /></LayoutWrapper>
              </ProtectedRoute>
            } />
            <Route path="/nftVoucher" element={
              <ProtectedRoute>
                <LayoutWrapper><NftVoucher /></LayoutWrapper>
              </ProtectedRoute>
            } />
            
            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}








