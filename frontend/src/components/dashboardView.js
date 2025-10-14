import React, { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  LabelList,
  ResponsiveContainer,
} from "recharts";

const COLORS = [
  "#569fdfff",
  "#638499ff",
  "#f38585ff",
  "#6b77e7ff",
  "#c0c25eff",
  "#71d1e9ff",
  "#34d87bff",
  "#e97fdb65",
];

const DashboardView = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("http://localhost:5000/statistics/getAllResorts");
        if (!res.ok) throw new Error("Failed to fetch data");
        const json = await res.json();

        // Group resorts by category or name
        const grouped = json.reduce((acc, item) => {
          const key = item.category || item.resort_name || "Unknown";
          acc[key] = (acc[key] || 0) + 1;
          return acc;
        }, {});

        const chartData = Object.entries(grouped).map(([key, count]) => ({
          resort_name: key,
          Resorts: count,
        }));

        setData(chartData);
      } catch (err) {
        console.error("Error loading data:", err);
        setData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) return <p style={{ textAlign: "center" }}>Loading charts…</p>;
  if (!data.length) return <p style={{ textAlign: "center" }}>No data available</p>;

  // Total count for percentage calculation
  const totalResorts = data.reduce((sum, item) => sum + item.Resorts, 0);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        height: "100vh",
        overflow: "scroll",
        backgroundColor: "#f8f9fa",
      }}
    >
      <h3>Bar Chart Connections</h3>
      {/* ===== Bar Chart Section ===== */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          padding: "20px",
          backgroundColor: "#fff",
          borderRadius: "15px",
          boxShadow: "0 4px 15px rgba(0, 0, 0, 0.1)",
          width: "fit-content",
          margin: "20px auto",
        }}
      >
        <BarChart width={700} height={400} data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="resort_name" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="Resorts" fill="#569fdfff" barSize={140}>
            <LabelList dataKey="Resorts" position="top" />
          </Bar>
        </BarChart>
      </div>

      {/* ===== Pie Chart Section ===== */}
      <h3 style={{ textAlign: "center", color: "#333", marginBottom: "1rem", fontWeight: "bold" }}>
        Pie Chart Connections
      </h3>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          backgroundColor: "#fff",
          borderRadius: "15px",
          boxShadow: "0 4px 15px rgba(0, 0, 0, 0.1)",
          padding: "20px 40px",
          width: "fit-content",
          margin: "20px auto",
          // gap: "3rem",
        }}
      >
        {/* Pie Chart */}
        <div>
          <ResponsiveContainer width={400} height={400}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                outerRadius={120}
                dataKey="Resorts"
                labelLine={false}
                onClick={(_, index) => setActiveIndex(index)}
              >
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                    stroke={index === activeIndex ? "#000" : "#fff"}
                    strokeWidth={index === activeIndex ? 3 : 1}
                  />
                ))}

                {/* ✅ React LabelList with Resort Name + Percentage */}
                <LabelList
                  position="inside"
                  content={({ x, y, value, index }) => {
                    const name = data[index]?.resort_name || "";
                    const percent = ((value / totalResorts) * 100).toFixed(0);
                    return (
                      <text
                        x={x}
                        y={y}
                        fill="#fff"
                        textAnchor="middle"
                        dominantBaseline="central"
                        style={{
                          fontWeight: "bold",
                          fontSize: "13px",
                          opacity: index === activeIndex ? 1 : 0.9,
                        }}
                      >
                        {`${name} (${percent}%)`}
                      </text>
                    );
                  }}
                />
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Legend (Clickable List) */}
        <div style={{ marginTop: "2rem" }}>
          <ul
            style={{
              listStyle: "none",
              padding: 0,
              display: "flex",
              flexDirection: "column",
              gap: "10px",
              margin: 0,
            }}
          >
            {data.map((item, index) => {
              const percent = ((item.Resorts / totalResorts) * 100).toFixed(0);
              return (
                <li
                  key={index}
                  onClick={() => setActiveIndex(index)}
                  style={{
                    cursor: "pointer",
                    fontWeight: index === activeIndex ? "bold" : "normal",
                    color: COLORS[index % COLORS.length],
                    textDecoration: index === activeIndex ? "underline" : "none",
                    fontSize: "16px",
                  }}
                >
                  {item.resort_name}: {item.Resorts} ({percent}%)
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default DashboardView;
