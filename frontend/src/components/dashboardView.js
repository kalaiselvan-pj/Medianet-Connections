import React, { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  ResponsiveContainer,
  PieChart,
  Pie,
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
  const [categoryData, setCategoryData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activePieIndex, setActivePieIndex] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`${process.env.REACT_APP_LOCALHOST}/statistics/getAllResorts`);
        if (!res.ok) throw new Error("Failed to fetch data");
        const json = await res.json();

        const groupedByCategory = json.reduce((acc, item) => {
          const key = item.category || "Unknown";
          acc[key] = (acc[key] || 0) + 1;
          return acc;
        }, {});

        const chartData = Object.entries(groupedByCategory).map(([key, count]) => ({
          name: key.length > 10 ? key.substring(0, 10) + "..." : key,
          fullName: key,
          value: count,
        }));

        setData(chartData);
        setCategoryData(json);
      } catch (err) {
        console.error("Error loading data:", err);
        setData([]);
        setCategoryData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const getDistributionStats = () => {
    const stats = {
      streamer: 0,
      iptv: 0,
      analog: 0,
      hybrid: 0
    };

    categoryData.forEach(item => {
      const model = item.distribution_model?.toLowerCase() || '';
      if (model.includes('streamer')) stats.streamer++;
      else if (model.includes('iptv')) stats.iptv++;
      else if (model.includes('analog')) stats.analog++;
      else if (model.includes('hybrid')) stats.hybrid++;
    });

    return stats;
  };

  const distributionStats = getDistributionStats();
  const totalResorts = data.reduce((sum, item) => sum + item.value, 0);

  // Custom tooltip for pie chart
  const CustomPieTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const percent = ((data.value / totalResorts) * 100).toFixed(1);
      return (
        <div style={{
          backgroundColor: '#fff',
          padding: '8px',
          border: '1px solid #ccc',
          borderRadius: '4px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        }}>
          <p style={{ margin: '0 0 4px 0', fontWeight: 'bold', color: '#333' }}>
            {data.fullName}
          </p>
          <p style={{ margin: '0', color: '#666' }}>
            Resorts: <strong>{data.value}</strong>
          </p>
          <p style={{ margin: '0', color: '#666' }}>
            Percentage: <strong>{percent}%</strong>
          </p>
        </div>
      );
    }
    return null;
  };

  const handlePieEnter = (_, index) => {
    setActivePieIndex(index);
  };

  const handlePieLeave = () => {
    setActivePieIndex(null);
  };

  if (loading) return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      fontSize: '14px',
      color: '#666'
    }}>
      Loading...
    </div>
  );

  if (!data.length) return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '92vh',
      fontSize: '14px',
      color: '#666'
    }}>
      No data available
    </div>
  );

  return (
    <div
      style={{
        // padding: "12px",
        backgroundColor: "#f8f9fa",
        height: "92vh",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        gap: "12px",
      }}
    >
      {/* Header - Resort Analytics */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: "12px 16px",
        backgroundColor: "#fff",
        borderRadius: "6px",
        boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
        height: "42px"
      }}>
        <div>
          <h1 style={{
            margin: 0,
            color: "#1a1a1a",
            fontSize: "17px",
            fontWeight: "600"
          }}>
            Resort Analytics
          </h1>
          <p style={{
            margin: "2px 0 0 0",
            color: "#666",
            fontSize: "13px"
          }}>
            Complete overview
          </p>
        </div>
        <div style={{
          display: 'flex',
          gap: '20px',
          alignItems: 'center'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{
              fontSize: "13px",
              color: "#666",
              marginBottom: "2px",
              fontWeight: 500
            }}>
              Categories
            </div>
            <div style={{
              fontSize: "18px",
              fontWeight: "700",
              color: "#569fdfff"
            }}>
              {data.length}
            </div>
          </div>
          <div style={{
            width: '1px',
            height: '20px',
            backgroundColor: '#e0e0e0'
          }}></div>
          <div style={{ textAlign: 'center' }}>
            <div style={{
              fontSize: "13px",
              color: "#666",
              marginBottom: "2px",
              fontWeight: 500
            }}>
              Total Resorts
            </div>
            <div style={{
              fontSize: "18px",
              fontWeight: "700",
              color: "#569fdfff"
            }}>
              {totalResorts}
            </div>
          </div>
        </div>
      </div>

      {/* Middle Section - Charts Side by Side */}
      <div style={{
        display: "flex",
        gap: "12px",
        flex: 1,
        minHeight: 0,
      }}>
        {/* Bar Chart - Left */}
        <div
          style={{
            flex: 1.2, // Slightly reduced to make more space for pie chart
            backgroundColor: "#fff",
            borderRadius: "6px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            padding: "12px",
            display: "flex",
            flexDirection: "column",
            minWidth: 0,
          }}
        >
          <h3 style={{
            margin: "0 0 12px 0",
            color: "#333",
            fontSize: "14px",
          }}>
            Resorts by Category
          </h3>
          <div style={{ flex: 1, minHeight: 0 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data}
                margin={{ top: 5, right: 5, left: 0, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="1 2" stroke="#f0f0f0" vertical={false} />
                <XAxis
                  dataKey="name"
                  fontSize="13px"
                  tick={{ fill: '#666' }}
                  interval={0}
                  height={35}
                />
                <YAxis
                  fontSize="12px"
                  tick={{ fill: '#666' }}
                  width={25}
                />
                <Tooltip
                  formatter={(value) => [value, 'Resorts']}
                  labelFormatter={(value, payload) => {
                    const item = payload?.[0]?.payload;
                    return item?.fullName || value;
                  }}
                  contentStyle={{
                    borderRadius: "4px",
                    border: "none",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                    fontSize: "14px",
                    padding: "4px 6px"
                  }}
                />
                <Bar
                  dataKey="value"
                  radius={[2, 2, 0, 0]}
                  barSize={20}
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie Chart - Right - Bigger Circle */}
        <div
          style={{
            flex: 1, // Increased flex to give more space
            backgroundColor: "#fff",
            borderRadius: "6px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            padding: "12px",
            display: "flex",
            flexDirection: "column",
            minWidth: 0,
          }}
        >
          <h3 style={{
            margin: "0 0 12px 0",
            color: "#333",
            fontSize: "14px",
          }}>
            Distribution
          </h3>
          <div style={{
            flex: 1,
            minHeight: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px 0' // Added padding to give more vertical space
          }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={50} // Increased from 35
                  outerRadius={90} // Increased from 70
                  paddingAngle={1}
                  dataKey="value"
                  onMouseEnter={handlePieEnter}
                  onMouseLeave={handlePieLeave}
                >
                  {data.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                      stroke={index === activePieIndex ? "#000" : "#fff"}
                      strokeWidth={index === activePieIndex ? 2 : 1}
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomPieTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div style={{
            display: 'flex',
            gap: '40px',
            fontSize: '12px',
            marginTop: '8px'
          }}>
            {data.slice(0, 4).map((item, index) => (
              <div key={index} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <div style={{
                  width: '12px',
                  height: '12px',
                  backgroundColor: COLORS[index % COLORS.length],
                  borderRadius: '2px'
                }}></div>
                <span style={{ color: '#666', fontSize: "14px" }}>{item.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Section - Distribution Models */}
      <div
        style={{
          backgroundColor: "#fff",
          borderRadius: "6px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          padding: "12px",
          height: "90px",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <h3 style={{
          margin: "0 0 12px 0",
          color: "#333",
          fontSize: "14px",
        }}>
          Distribution Models
        </h3>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr 1fr",
            gap: "12px",
            flex: 1,
          }}
        >
          {[
            { key: "streamer", label: "Streamer", color: "#1976d2" },
            { key: "iptv", label: "IPTV", color: "#388e3c" },
            { key: "analog", label: "Analog", color: "#f57c00" },
            { key: "hybrid", label: "Hybrid", color: "#c2185b" },
          ].map((model) => (
            <div
              key={model.key}
              style={{
                backgroundColor: "#fafafa",
                borderRadius: "4px",
                padding: "12px",
                borderLeft: `3px solid ${model.color}`,
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div
                  style={{
                    fontSize: "15px",
                    color: "#666",
                    fontWeight: "600",
                  }}
                >
                  {model.label}
                </div>
                <div
                  style={{
                    fontSize: "18px",
                    fontWeight: "700",
                    color: model.color,
                    lineHeight: "1",
                  }}
                >
                  {distributionStats[model.key]}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DashboardView;