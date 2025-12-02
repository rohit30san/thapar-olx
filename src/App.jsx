import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext.jsx";

import Navbar from "./components/Navbar.jsx";

import Home from "./pages/Home.jsx";
import Login from "./pages/Login.jsx";
import Signup from "./pages/Signup.jsx";
import NewListing from "./pages/NewListing.jsx";
import ListingDetail from "./pages/ListingDetail.jsx";
import ChatPage from "./pages/ChatPage.jsx";
import Profile from "./pages/Profile.jsx";
import VerifyEmail from "./pages/VerifyEmail.jsx";
import AdminDashboard from "./pages/AdminDashboard.jsx";
import SellerProfile from "./pages/SellerProfile.jsx";
import ReportSeller from "./pages/ReportSeller.jsx";
import Messages from "./pages/Messages.jsx";
import Deals from "./pages/Deals.jsx";
import AdminReports from "./pages/AdminReports.jsx";

function PrivateRoute({ children, requireVerified = false }) {
  const { currentUser } = useAuth();
  if (!currentUser) return <Navigate to="/login" replace />;

  if (requireVerified && !currentUser.emailVerified) {
    return <Navigate to="/verify-email" replace />;
  }

  return children;
}

export default function App() {
  return (
    // Full-page background image (Thapar)
    <div
      className="min-h-screen bg-cover bg-center bg-fixed"
      style={{
        backgroundImage:
          "url('https://www.thapar.edu/images/phocagallery/Thapar_Uni/2.jpg')", // change if you want another pic
      }}
    >
      {/* Soft overlay so content stays readable */}
      <div className="min-h-screen bg-[#fff7f7]/85 flex flex-col">
        {/* Full-width navbar */}
        <Navbar />

        {/* Centered content area */}
        <main className="flex-1 w-full max-w-5xl mx-auto px-4 pb-10 pt-4">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/verify-email" element={<VerifyEmail />} />
            <Route path="/user/:uid" element={<SellerProfile />} />

            <Route
              path="/messages"
              element={
                <PrivateRoute requireVerified={true}>
                  <Messages />
                </PrivateRoute>
              }
            />

            <Route
              path="/admin/reports"
              element={
                <PrivateRoute requireVerified={true}>
                  <AdminReports />
                </PrivateRoute>
              }
            />

            <Route
              path="/deals"
              element={
                <PrivateRoute requireVerified={true}>
                  <Deals />
                </PrivateRoute>
              }
            />

            <Route
              path="/new"
              element={
                <PrivateRoute requireVerified={true}>
                  <NewListing />
                </PrivateRoute>
              }
            />

            <Route
              path="/report-seller/:sellerId"
              element={
                <PrivateRoute requireVerified={true}>
                  <ReportSeller />
                </PrivateRoute>
              }
            />

            <Route
              path="/admin"
              element={
                <PrivateRoute requireVerified={true}>
                  <AdminDashboard />
                </PrivateRoute>
              }
            />

            <Route path="/listing/:id" element={<ListingDetail />} />

            <Route
              path="/chat/:conversationId"
              element={
                <PrivateRoute requireVerified={true}>
                  <ChatPage />
                </PrivateRoute>
              }
            />

            <Route
              path="/profile"
              element={
                <PrivateRoute requireVerified={true}>
                  <Profile />
                </PrivateRoute>
              }
            />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}
