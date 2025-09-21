import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../App";

const Sidebar = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <div
      style={{
        width: "18%",
        backgroundColor: "#1e476c",
        color: "white",
        display: "flex",
        flexDirection: "column",
        padding: "0px 20px 20px 20px",
        boxShadow: "2px 0 5px rgba(0,0,0,0.2)",
      }}
    >
      <div className="menubar" style={{ flexGrow: 1 }}>
        <div className="menulist">
          <h2 style={{ textAlign: "center", marginBottom: "30px" }}>Menu</h2>
        </div>
        <div className="dashboardbutton">
          <button
            onClick={() => navigate("/dashboard")}
            style={{
              border: "none",
              cursor: "pointer",
              color: "white",
              padding: "12px",
              borderRadius: "8px",
              backgroundColor: "#569fdfff",
              textAlign: "center",
              fontWeight: "bold",
              marginBottom: "10px",
              width: "97%",
            }}
          >
            Dashboard
          </button>
        </div>
        <div className="listbutton">
          <button
            onClick={() => navigate("/listview")}
            style={{
              border: "none",
              cursor: "pointer",
              color: "white",
              padding: "12px",
              borderRadius: "8px",
              backgroundColor: "#569fdfff",
              textAlign: "center",
              fontWeight: "bold",
              width: "97%",
            }}
          >
            List View
          </button>
        </div>
      </div>
      <div className="logoutbutton">
        <button
          onClick={handleLogout}
          style={{
            border: "none",
            cursor: "pointer",
            color: "white",
            padding: "10px",
            width: "100%",
            borderRadius: "8px",
            backgroundColor: "#e74c3c",
            textAlign: "center",
            fontWeight: "bold",
          }}
        >
          Logout
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
