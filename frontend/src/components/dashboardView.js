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

const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, value }) => {
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) / 2;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text
      x={x}
      y={y}
      fill="white"
      textAnchor="middle"
      dominantBaseline="central"
      fontWeight="bold"
    >
      {value}
    </text>
  );
};

const DashboardView = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("http://localhost:5000/statistics/getAllResorts"); // your endpoint
        if (!res.ok) throw new Error("Failed to fetch data");
        const json = await res.json();

        // Transform API response into chart-friendly format
        // Count resorts per category
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

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", height: "100vh", overflow: "scroll" }}>
      {/* Bar Chart */}
      <h3>Bar Chart Connections</h3>
      <div style={{ display: "flex", justifyContent: "center", textAlign: "center" }}>
        <BarChart
          width={700}
          height={400}
          data={data}
          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="resort_name" />
          <YAxis />
          <Tooltip />
          <Legend />
          {/* <Bar dataKey="Resorts" fill="#569fdfff" barSize={140} /> */}
          <Bar dataKey="Resorts" fill="#569fdfff" barSize={140}>
            {/* 👇 This shows the value above each bar */}
            <LabelList dataKey="Resorts" position="top" />
          </Bar>
        </BarChart>
      </div>

      {/* Pie Chart + Data List */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
        <h3>Pie Chart Connections</h3>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: "-2rem" }}>
          <div><PieChart width={400} height={400}>
            <Pie
              data={data}
              cx={200}
              cy={200}
              outerRadius={120}
              fill="#569fdfff"
              dataKey="Resorts"
              label={renderCustomLabel}
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
            </Pie>
            <Tooltip />
          </PieChart>
          </div>
          <div style={{ marginTop: "10rem" }}>
            <ul
              style={{
                listStyle: "none",
                padding: 0,
                display: "flex",
                flexDirection: "column",
                gap: "10px",
              }}
            >
              {data.map((item, index) => (
                <li
                  key={index}
                  onClick={() => setActiveIndex(index)}
                  style={{
                    cursor: "pointer",
                    fontWeight: index === activeIndex ? "bold" : "normal",
                    color: COLORS[index % COLORS.length],
                    textDecoration: index === activeIndex ? "underline" : "none",
                  }}
                >
                  {item.resort_name}: {item.Resorts}
                </li>
              ))}
            </ul>
          </div>
        </div>

      </div>
    </div>
  );
};

export default DashboardView;
