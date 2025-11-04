import React, { createContext, useState, useContext, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Login from "./components/login";
import ResetPassword from "./components/resetPassword";
import DashboardView from "./components/dashboardView";
import ListView from "./components/listView";
import DashboardLayout from "./components/dashboardLayout";
import Toaster from "./components/common/toaster";
import IncidentReports from "./components/incident-reports"
import Rbac from "./components/rbac";
import StreamerConfig from "./components/streamer-config";
import BpDetails from "./components/hits/bpDetails";
import IslandInformation from "./components/hits/islandInformation";


// Create Auth Context
const AuthContext = createContext();

// Custom hook to use auth context
export const useAuth = () => {
  return useContext(AuthContext);
};

// Auth Provider component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in on app load
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");

    if (token && userData) {
      setUser(JSON.parse(userData));
    }

    setLoading(false);
  }, []);

  const login = (userData, token) => {
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(userData));
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  };

  const value = {
    user,
    login,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

// Protected Route component
const ProtectedRoute = ({ children }) => {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" replace />;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* default landing → login */}
          <Route path="/" element={<Navigate to="/login" replace />} />

          <Route path="/login" element={<Login />} />
          <Route path="/login/reset-password/:token" element={<ResetPassword />} />

          {/* All protected pages share the Sidebar */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <DashboardView />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/listview"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <ListView />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/resort-incidents"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <IncidentReports />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/rbac-management"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <Rbac />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/upload-streamer-config"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <StreamerConfig />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/bp-details"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <BpDetails />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/island-information"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <IslandInformation />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          {/* optional: handle unknown paths */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
        <Toaster />
      </Router>
    </AuthProvider>
  );
}

export default App;