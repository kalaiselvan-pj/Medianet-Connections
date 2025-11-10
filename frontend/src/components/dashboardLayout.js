import React from "react";
import Sidebar from "./sidebar";

export default function DashboardLayout({ children }) {
  return (
    <div style={{ display: "flex", flexDirection: "row", height: "100vh", overflow: "hidden" }}>
      <Sidebar />
      <div
        style={{
          padding: "20px",
          width: "78%",
          backgroundColor: "#f8f8f8"
        }}
      >
        {children}
      </div>
    </div>
  );
}
