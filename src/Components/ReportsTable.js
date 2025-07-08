// Updated ReportsTable.js
import React, { useEffect } from "react";
import { useLocation } from "react-router-dom";

export default function ReportsTable() {
  const location = useLocation();
  const { profile, report } = location.state || {};
  const rows = report?.reports || [];

  // Debug log
  useEffect(() => {
    console.log("ReportsTable location.state:", location.state);
  }, [location.state]);

  if (!profile || rows.length === 0) {
    return (
      <div style={{ padding: 20 }}>
        <h2>No report selected or no data available</h2>
      </div>
    );
  }

  const { testName, date, time } = report;

  return (
    <div style={{ padding: 20, maxWidth: 700, margin: "0 auto" }}>
      <h2 style={{ textAlign: "center" }}>{testName}</h2>
      <p style={{ textAlign: "center" }}>
        {profile.name} — {date} {time && `| ${time}`}
      </p>

      <table
        style={{
          width: "100%",
          marginTop: 20,
          borderCollapse: "collapse",
          border: "1px solid #ddd",
        }}
      >
        <thead>
          <tr style={{ background: "#f7f7f7" }}>
            <th style={{ padding: 8, textAlign: "left" }}>Parameter</th>
            <th style={{ padding: 8 }}>Result</th>
            <th style={{ padding: 8 }}>Unit</th>
            <th style={{ padding: 8 }}>Reference</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => {
            const val = parseFloat(r.result);
            const isAbnormal =
              (r.minValue && val < parseFloat(r.minValue)) ||
              (r.maxValue && val > parseFloat(r.maxValue));
            return (
              <tr key={i} style={{ background: i % 2 ? "#fff" : "#f0faff" }}>
                <td style={{ padding: 8 }}>{r.parameter}</td>
                <td
                  style={{
                    padding: 8,
                    color: isAbnormal ? "red" : "inherit",
                    fontWeight: isAbnormal ? "bold" : "normal",
                  }}
                >
                  {r.result}
                </td>
                <td style={{ padding: 8 }}>{r.unit}</td>
                <td style={{ padding: 8 }}>
                  {r.minValue || "-"} – {r.maxValue || "-"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
