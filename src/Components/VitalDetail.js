import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function VitalDetail() {
  const { state } = useLocation();
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [type, setType] = useState("");
  const [rawReadings, setRawReadings] = useState([]);
  const [readings, setReadings] = useState([]);
  // Default view mode for displaying chart or table.
  const [viewMode, setViewMode] = useState("graph");

  // Initialize from location.state
  useEffect(() => {
    if (state?.profile && state?.type && Array.isArray(state?.readings)) {
      setProfile(state.profile);
      setType(state.type);
      setRawReadings(state.readings);
    }
  }, [state]);

  // Transform rawReadings → readings
  useEffect(() => {
    if (!rawReadings.length) return;
    const transformed = rawReadings
      .map((r) => {
        const dt = new Date(`${r.date} ${r.time}`);
        return {
          ...r,
          dateTime: dt.getTime(),
          dateLabel: dt.toLocaleString(),
          value: Number(r.value),
        };
      })
      .sort((a, b) => a.dateTime - b.dateTime);

    setReadings(transformed);
  }, [rawReadings]);

  // Guard: if data is missing, show a friendly error message.
  if (!profile || !type || readings.length === 0) {
    return (
      <div style={{ padding: 20 }}>
        <button onClick={() => navigate(-1)}>← Back</button>
        <h2>Oops, data not found</h2>
        <p>
          It looks like we don’t have the readings to show your{" "}
          <strong>{type || "vital"}</strong> details. Make sure you clicked the
          item from the Profile screen (don’t reload this page directly).
        </p>
      </div>
    );
  }

  return (
    <div className="vitalDetailContainer">
      <button onClick={() => navigate(-1)}>← Back</button>
      <h2>
        {type} Details for {profile.name}
      </h2>

      <div className="viewToggle">
        <button
          onClick={() => setViewMode("graph")}
          className={viewMode === "graph" ? "active" : ""}
        >
          Graph
        </button>
        <button
          onClick={() => setViewMode("table")}
          className={viewMode === "table" ? "active" : ""}
        >
          Table
        </button>
      </div>

      {viewMode === "graph" ? (
        <div style={{ width: "100%", height: 400 }}>
          <ResponsiveContainer>
            <LineChart
              data={readings}
              margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
            >
              <CartesianGrid stroke="#ccc" strokeDasharray="3 3" />
              <XAxis
                dataKey="dateTime"
                // Format the timestamp to show date and time like "Oct 05, 3:07 PM"
                tickFormatter={(ts) =>
                  new Date(ts).toLocaleString("en-US", {
                    month: "short",
                    day: "2-digit",
                    hour: "numeric",
                    minute: "numeric",
                  })
                }
                tick={{ fontSize: 12 }}
                angle={-45}
                textAnchor="end"
                interval={0}
                height={60}
              />
              <YAxis
                // Fixed Y-axis range to match the desired appearance (e.g., from 95°F to 104°F)
                domain={["auto", "auto"]}
                tick={{ fontSize: 12 }}
                label={{
                  value: `${type} (°F)`,
                  angle: -90,
                  position: "insideLeft",
                  style: { fontSize: 12 },
                }}
              />
              <Tooltip
                labelFormatter={(ts) => new Date(ts).toLocaleString()}
                formatter={(val) => [`${val} °F`, type]}
              />
              <Line
                dataKey="value"
                stroke="#2196F3"
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <table className="vitalTable">
          <thead>
            <tr>
              <th>Date &amp; Time</th>
              <th>
                Value {readings[0].unit ? `(${readings[0].unit})` : "(°F)"}
              </th>
            </tr>
          </thead>
          <tbody>
            {readings.map((r, i) => (
              <tr key={i}>
                <td>{r.dateLabel}</td>
                <td>{r.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
