import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../App";
import "../styles/sideBar.css";
import DashboardIcon from "@mui/icons-material/Dashboard";
import ListIcon from "@mui/icons-material/List";
import ReportProblemIcon from "@mui/icons-material/ReportProblem";
import SecurityIcon from "@mui/icons-material/Security";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import LogoutIcon from '@mui/icons-material/Logout';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import BusinessCenterIcon from '@mui/icons-material/BusinessCenter';
import InfoIcon from '@mui/icons-material/Info';
import { canAccess } from "../rbac/canAccess";
import medianetLogo from "../assets/medianet_transparent_logo.png";
import BusinessIcon from '@mui/icons-material/Business';
import AssignmentIndIcon from '@mui/icons-material/AssignmentInd';

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();
  const [isResortsOpen, setIsResortsOpen] = useState(false);
  const [isHitsOpen, setIsHitsOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  // helper to check if path is active
  const isActive = (path) => location.pathname === path;

  // Check if any resort-related route is active
  const isResortActive = () => {
    return isActive("/listview") || isActive("/resort-incidents") || isActive("/upload-streamer-config");
  };

  // Check if any hits-related route is active
  const isHitsActive = () => {
    return isActive("/bp-details") || isActive("/island-information");
  };

  const toggleResorts = () => {
    setIsResortsOpen(!isResortsOpen);
  };

  const toggleHits = () => {
    setIsHitsOpen(!isHitsOpen);
  };

  // Close resorts dropdown when navigating away from resort pages
  useEffect(() => {
    if (!isResortActive()) {
      setIsResortsOpen(false);
    }
  }, [location.pathname]);

  // Close hits dropdown when navigating away from hits pages
  useEffect(() => {
    if (!isHitsActive()) {
      setIsHitsOpen(false);
    }
  }, [location.pathname]);

  return (
    <div className="sidebar">
      <div className="sidebar-content">
        <div className="menulist-sticky">
          <img src={medianetLogo} alt="Medianet Logo" className="mdn-logo" />
          <h2 style={{ textAlign: "center", marginBottom: "20px", marginTop: "6px" }}>Islands Connection</h2>
        </div>

        <div className="menubar">
          <div className="dashboardbutton">
            {canAccess("dashboard") && (
              <button onClick={() => navigate("/dashboard")} className={`lhs_button ${isActive("/dashboard") ? "active" : ""}`}>
                <DashboardIcon className="lhs-icons" /> Dashboard
              </button>
            )}

            {/* Resorts Dropdown Section */}
            <div className="resorts-dropdown">
              <button
                onClick={toggleResorts}
                className={`lhs_button resorts-main-button ${isResortActive() ? "active" : ""}`}
              >
                <span style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
                  <span style={{ display: "flex", alignItems: "center" }}>
                    <BusinessIcon className="lhs-icons" /> Resorts
                  </span>
                  {isResortsOpen ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                </span>
              </button>

              {isResortsOpen && (
                <div className="resorts-submenu">
                  {canAccess("resortList") && (
                    <button
                      onClick={() => navigate("/listview")}
                      className={`lhs_button submenu-button ${isActive("/listview") ? "active" : ""}`}
                    >
                      <ListIcon className="submenu-icon" />
                      Resorts List View
                    </button>
                  )}

                  {canAccess("resortIncidents") && (
                    <button
                      onClick={() => navigate("/resort-incidents")}
                      className={`lhs_button submenu-button ${isActive("/resort-incidents") ? "active" : ""}`}
                    >
                      <ReportProblemIcon className="submenu-icon" />
                      Resort Incident Reports
                    </button>
                  )}

                  {canAccess("streamerConfig") && (
                    <button
                      onClick={() => navigate("/upload-streamer-config")}
                      className={`lhs_button submenu-button ${isActive("/upload-streamer-config") ? "active" : ""}`}
                    >
                      <CloudUploadIcon className="submenu-icon" />
                      Streamer Configuration
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Hits Dropdown Section */}
            <div className="hits-dropdown">
              <button
                onClick={toggleHits}
                className={`lhs_button hits-main-button ${isHitsActive() ? "active" : ""}`}
              >
                <span style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
                  <span style={{ display: "flex", alignItems: "center" }}>
                    <BusinessCenterIcon className="lhs-icons" /> HITS
                  </span>
                  {isHitsOpen ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                </span>
              </button>

              {isHitsOpen && (
                <div className="hits-submenu">
                  <button
                    onClick={() => navigate("/bp-details")}
                    className={`lhs_button submenu-button ${isActive("/bp-details") ? "active" : ""}`}
                  >
                    <AssignmentIndIcon className="submenu-icon" />
                    BP Details
                  </button>

                  <button
                    onClick={() => navigate("/island-information")}
                    className={`lhs_button submenu-button ${isActive("/island-information") ? "active" : ""}`}
                  >
                    <InfoIcon className="submenu-icon" />
                    Island Information
                  </button>
                </div>
              )}
            </div>

            {canAccess("rbacManagement") && (
              <button onClick={() => navigate("/rbac-management")} className={`lhs_button ${isActive("/rbac-management") ? "active" : ""}`}>
                <SecurityIcon className="lhs-icons" /> RBAC Management
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
    </div>
  );
};

export default Sidebar;