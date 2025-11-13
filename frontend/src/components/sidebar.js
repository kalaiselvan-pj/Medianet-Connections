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
import {
  Dialog,
  DialogTitle,
  DialogActions,
  Button
} from "@mui/material";

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();
  const [isResortsOpen, setIsResortsOpen] = useState(false);
  const [isHitsOpen, setIsHitsOpen] = useState(false);
  const [openLogoutDialog, setOpenLogoutDialog] = useState(false);
  const [shake, setShake] = useState(false);

  const handleLogoutClick = () => {
    setOpenLogoutDialog(true);
  };

  const handleLogoutConfirm = () => {
    setOpenLogoutDialog(false);
    logout();
    navigate("/login", { replace: true });
  };

  const handleLogoutCancel = () => {
    setOpenLogoutDialog(false);
  };

  // helper to check if path is active
  const isActive = (path) => location.pathname === path;

  // Check if any resort-related route is active
  const isResortActive = () => {
    return isActive("/listview") || isActive("/resort-incidents") || isActive("/upload-streamer-config");
  };

  // Check if any hits-related route is active
  const isHitsActive = () => {
    return isActive("/bp-details") || isActive("/island-informations");
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

  // Check if user has access to any Resorts submenu items
  const hasResortsAccess = canAccess("resortList", "view") || canAccess("resortIncidents", "view") || canAccess("streamerConfig", "view");

  // Check if user has access to any HITS submenu items
  const hasHitsAccess = canAccess("bpDetails", "view") || canAccess("islandInformations", "view");

  return (
    <div className="sidebar">
      <div className="sidebar-content">
        <div className="menulist-sticky">
          <img src={medianetLogo} alt="Medianet Logo" className="mdn-logo" />
          <h2
            style={{
              textAlign: "center",
              marginBottom: "20px",
              marginTop: "6px",
              background: "linear-gradient(179deg, rgb(255 255 255 / 88%), rgb(192 192 192 / 35%)) text",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              fontWeight: "bold",
              fontSize: "23px"
            }}
          >
            Island Reports
          </h2>
        </div>

        <div className="menubar">
          <div className="dashboardbutton">
            {canAccess("dashboard", "view") && (
              <button onClick={() => navigate("/dashboard")} className={`lhs_button ${isActive("/dashboard") ? "active" : ""}`}>
                <DashboardIcon className="lhs-icons" /> Dashboard
              </button>
            )}

            {/* Resorts Dropdown Section - Only show if user has access to at least one Resorts item */}
            {hasResortsAccess && (
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
                    {canAccess("resortList", "view") && (
                      <button
                        onClick={() => navigate("/listview")}
                        className={`lhs_button submenu-button ${isActive("/listview") ? "active" : ""}`}
                      >
                        <ListIcon className="submenu-icon" />
                        Resorts List View
                      </button>
                    )}

                    {canAccess("resortIncidents", "view") && (
                      <button
                        onClick={() => navigate("/resort-incidents")}
                        className={`lhs_button submenu-button ${isActive("/resort-incidents") ? "active" : ""}`}
                      >
                        <ReportProblemIcon className="submenu-icon" />
                        Resort Incident Reports
                      </button>
                    )}

                    {canAccess("streamerConfig", "view") && (
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
            )}

            {/* HITS Dropdown Section - Only show if user has access to at least one HITS item */}
            {hasHitsAccess && (
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
                    {canAccess("bpDetails", "view") && (
                      <button
                        onClick={() => navigate("/bp-details")}
                        className={`lhs_button submenu-button ${isActive("/bp-details") ? "active" : ""}`}
                      >
                        <AssignmentIndIcon className="submenu-icon" />
                        BP Details
                      </button>
                    )}

                    {canAccess("islandInformations", "view") && (
                      <button
                        onClick={() => navigate("/island-informations")}
                        className={`lhs_button submenu-button ${isActive("/island-informations") ? "active" : ""}`}
                      >
                        <InfoIcon className="submenu-icon" />
                        Island Informations
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

            {canAccess("rbacManagement", "view") && (
              <button onClick={() => navigate("/rbac-management")} className={`lhs_button ${isActive("/rbac-management") ? "active" : ""}`}>
                <SecurityIcon className="lhs-icons" /> RBAC Management
              </button>
            )}
          </div>
        </div>

        <div className="logoutbutton">
          <button onClick={handleLogoutClick} className="logout-btn">
            <LogoutIcon style={{ fontSize: "20px" }} />
            Logout
          </button>
        </div>
      </div>

      {/* LOGOUT CONFIRMATION DIALOG */}
      <Dialog
        open={openLogoutDialog}
        onClose={(event, reason) => {
          if (reason === "backdropClick" || reason === "escapeKeyDown") {
            setShake(true);
            setTimeout(() => setShake(false), 500);
            return;
          }
          handleLogoutCancel();
        }}
        PaperProps={{ sx: { animation: shake ? "shake 0.5s" : "none" } }}
      >
        <style>{`
          @keyframes shake {
            0% { transform: translateX(0); }
            25% { transform: translateX(-8px); }
            50% { transform: translateX(8px); }
            75% { transform: translateX(-8px); }
            100% { transform: translateX(0); }
          }
        `}</style>
        <DialogTitle>Are you sure you want to logout?</DialogTitle>
        <DialogActions>
          <Button onClick={handleLogoutCancel} color="primary">Cancel</Button>
          <Button onClick={handleLogoutConfirm} color="error">Logout</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default Sidebar;