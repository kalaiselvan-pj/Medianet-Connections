import React from "react";
import Sidebar from "./sidebar";

export default function DashboardLayout({ children }) {
  return (
    <div style={{ display: "flex", flexDirection: "row", justifyContent: "space-between", height: "100vh", overflow: "hidden" }}>
      <Sidebar />
      <div
        style={{
          padding: "20px",
          width: "80%",
          backgroundColor: "aliceblue"
        }}
      >
        {children}
      </div>
    </div>
  );
}
