import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../App";
import "../styles/sideBar.css";
import DashboardIcon from "@mui/icons-material/Dashboard";
import ListIcon from "@mui/icons-material/List";
import ReportProblemIcon from "@mui/icons-material/ReportProblem";
import SecurityIcon from "@mui/icons-material/Security";
import LogoutIcon from '@mui/icons-material/Logout';
import { canAccess } from "../rbac/canAccess";


const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  // helper to check if path is active
  const isActive = (path) => location.pathname === path;



  return (
    <div className="sidebar">
      <div className="menubar" style={{ flexGrow: 1 }}>
        <div className="menulist">
          <h2 style={{ textAlign: "center", marginBottom: "30px" }}>Islands Connection</h2>
        </div>

        <div className="dashboardbutton">
          {canAccess("dashboard") && (
            <button onClick={() => navigate("/dashboard")} className={`lhs_button ${isActive("/dashboard") ? "active" : ""}`}>
              <DashboardIcon style={{ marginRight: "8px", fontSize: "20px" }} /> Dashboard
            </button>
          )}

          {canAccess("resortList") && (
            <button onClick={() => navigate("/listview")} className={`lhs_button ${isActive("/listview") ? "active" : ""}`}>
              <ListIcon style={{ marginRight: "8px", fontSize: "20px" }} /> Resorts List View
            </button>
          )}

          {canAccess("resortIncidents") && (
            <button onClick={() => navigate("/resort-incidents")} className={`lhs_button ${isActive("/resort-incidents") ? "active" : ""}`}>
              <ReportProblemIcon style={{ marginRight: "8px", fontSize: "20px" }} /> Resort Incident Reports
            </button>
          )}

          {canAccess("rbacManagement") && (
            <button onClick={() => navigate("/rbac-management")} className={`lhs_button ${isActive("/rbac-management") ? "active" : ""}`}>
              <SecurityIcon style={{ marginRight: "8px", fontSize: "20px" }} /> RBAC Management
            </button>
          )}
        </div>
      </div>

      <div className="logoutbutton">
        <button onClick={handleLogout} className="logout-btn">
          <LogoutIcon style={{ fontSize: "20px" }} />
          Logout
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
