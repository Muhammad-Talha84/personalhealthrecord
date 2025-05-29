import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import useDatabase from "../Components/useDatabase";

const BloodPressureGraph = () => {
  const { state } = useLocation();
  const profile = state?.profile;
  const { db } = useDatabase();

  // View state
  const [view, setView] = useState("All");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");

  // Filtered SQL data
  const [chartData, setChartData] = useState([]);

  // helper for formatting
  const formatDateTime = (ms) => {
    const d = new Date(ms);
    return d.toLocaleString("en-US", {
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  // Reload data whenever filters or DB change
  useEffect(() => {
    if (!db || !profile) return;

    // Compute date range strings
    const today = new Date();
    const endStr = today.toISOString().split("T")[0];
    let startStr;

    switch (view) {
      case "Daily":
        startStr = endStr;
        break;
      case "Weekly":
        const wk = new Date(today);
        wk.setDate(wk.getDate() - 6);
        startStr = wk.toISOString().split("T")[0];
        break;
      case "Monthly":
        const mo = new Date(today);
        mo.setMonth(mo.getMonth() - 1);
        startStr = mo.toISOString().split("T")[0];
        break;
      case "Custom":
        startStr = customStartDate;
        break;
      case "All":
      default:
        startStr = "0000-01-01";
        break;
    }

    const query = `
      SELECT date, time, value AS bp, unit
      FROM Vitals
      WHERE profileName = ?
        AND vitalName = 'BloodPressure'
        AND date BETWEEN ? AND ?
      ORDER BY date, time`;

    const stmt = db.prepare(query);
    stmt.bind([profile.name, startStr, endStr]);

    const rows = [];
    while (stmt.step()) {
      const { date, time, bp } = stmt.getAsObject();
      const [systolic, diastolic] = bp.split("/").map(Number);
      // parse as local Date
      const [y, m, d] = date.split("-").map(Number);
      let [t, mod] = time.split(" ");
      let [h, min] = t.split(":").map(Number);
      if (mod === "PM" && h < 12) h += 12;
      if (mod === "AM" && h === 12) h = 0;
      const dt = new Date(y, m - 1, d, h, min).getTime();
      rows.push({ systolic, diastolic, dateTime: dt });
    }
    stmt.free();

    setChartData(rows);
  }, [db, profile, view, customStartDate, customEndDate]);

  // ticks at data points
  const ticks = chartData.map((d) => d.dateTime);

  return (
    <div style={{ width: "100%", height: 350 }}>
      <h2>Blood Pressure Over Time</h2>
      <div style={{ marginBottom: 16 }}>
        {["All", "Daily", "Weekly", "Monthly", "Custom"].map((v) => (
          <button
            key={v}
            onClick={() => setView(v)}
            style={{
              marginRight: 8,
              padding: "6px 12px",
              background: view === v ? "#007bff" : "#fff",
              color: view === v ? "#fff" : "#000",
              border: "1px solid #ccc",
              borderRadius: 4,
            }}
          >
            {v}
          </button>
        ))}
      </div>
      {view === "Custom" && (
        <div style={{ marginBottom: 16 }}>
          <label style={{ marginRight: 8 }}>
            Start:
            <input
              type="date"
              value={customStartDate}
              onChange={(e) => setCustomStartDate(e.target.value)}
              style={{ marginLeft: 4 }}
            />
          </label>
          <label>
            End:
            <input
              type="date"
              value={customEndDate}
              onChange={(e) => setCustomEndDate(e.target.value)}
              style={{ marginLeft: 4 }}
            />
          </label>
        </div>
      )}
      <ResponsiveContainer>
        <LineChart
          data={chartData}
          margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
        >
          <CartesianGrid horizontal vertical={false} strokeDasharray="3 3" />
          <XAxis
            dataKey="dateTime"
            type="number"
            scale="time"
            domain={["dataMin", "dataMax"]}
            ticks={ticks}
            tickFormatter={formatDateTime}
            interval={0}
            angle={-45}
            textAnchor="end"
            height={60}
          />
          <YAxis
            domain={[
              (min) => Math.floor(min / 10) * 10,
              (max) => Math.ceil(max / 10) * 10 + 10,
            ]}
          />
          <Tooltip
            labelFormatter={formatDateTime}
            formatter={(val, name) => [
              val,
              name.charAt(0).toUpperCase() + name.slice(1),
            ]}
          />
          <Line
            type="linear"
            dataKey="systolic"
            stroke="#007bff"
            dot={{ r: 4 }}
          />
          <Line
            type="linear"
            dataKey="diastolic"
            stroke="#dc3545"
            dot={{ r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default BloodPressureGraph;
