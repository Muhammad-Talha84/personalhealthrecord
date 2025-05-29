// ReportsDetail.js
import React from "react";
import { useLocation } from "react-router-dom";

export default function ReportsDetail() {
  const { state } = useLocation();

  const { profile, testName, dateMap } = state || {};

  if (!dateMap || !testName) {
    return (
      <div style={{ padding: 20 }}>
        <h2>Oops, report not found</h2>
        <p>Make sure you clicked a test from the previous screen.</p>
      </div>
    );
  }

  // 1) collect and sort all dates
  const dates = Object.keys(dateMap).sort((a, b) => new Date(a) - new Date(b));

  // 2) collect *all* parameters across all dates
  const allParams = Array.from(
    new Set(dates.flatMap((date) => dateMap[date].map((r) => r.parameter)))
  );

  return (
    <div style={{ padding: 20, maxWidth: 800, margin: "auto" }}>
      <h2 style={{ textAlign: "center" }}>{testName}</h2>
      <p style={{ textAlign: "center" }}>
        <strong>Name:</strong> {profile.name}
      </p>

      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          marginTop: 20,
        }}
      >
        <thead>
          <tr style={{ backgroundColor: "#f0f0f0" }}>
            <th style={{ padding: 8 }}>Parameter</th>
            {dates.map((date) => (
              <th key={date} style={{ padding: 8 }}>
                {date}
              </th>
            ))}
            <th style={{ padding: 8 }}>Ref. Range</th>
          </tr>
        </thead>
        <tbody>
          {allParams.map((param) => {
            // find the reference range (assume it's same across dates)
            const anyRpt = dates
              .map((d) => dateMap[d].find((r) => r.parameter === param))
              .find(Boolean);
            const refRange = anyRpt
              ? `${anyRpt.minValue}–${anyRpt.maxValue}`
              : "";

            return (
              <tr key={param}>
                <td style={{ padding: 8 }}>{param}</td>

                {dates.map((date) => {
                  const rpt = dateMap[date].find((r) => r.parameter === param);
                  const val = rpt ? rpt.result : "-";
                  const unit = rpt ? rpt.unit : "";

                  // mark abnormal if outside range
                  let style = {};
                  if (rpt) {
                    const num = parseFloat(rpt.result);
                    const lo = parseFloat(rpt.minValue);
                    const hi = parseFloat(rpt.maxValue);
                    if (num < lo || num > hi) {
                      style = { backgroundColor: "#ffe6e6", color: "red" };
                    }
                  }

                  return (
                    <td key={date} style={{ padding: 8, ...style }}>
                      {val} {unit}
                    </td>
                  );
                })}

                <td style={{ padding: 8 }}>{refRange}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
