import React from "react";
import { useLocation, useNavigate } from "react-router-dom";

export default function ReportsDetail() {
  const { state } = useLocation();
  const navigate = useNavigate();

  // The grouped report object containing testName and an array of reports
  const reportGroup = state?.report;

  if (!reportGroup) {
    return (
      <div style={{ padding: 20 }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            fontSize: "1rem",
          }}
        >
          ← Back
        </button>
        <h2>Oops, report not found</h2>
        <p>
          It looks like there’s no report data to show. Make sure you clicked a
          report from the previous screen (don’t reload this page directly).
        </p>
      </div>
    );
  }

  // Destructure the grouped report: testName + array of individual parameters
  const { testName, date, time, reports } = reportGroup;

  // Assume each item in `reports` shares the same profileName, date, and time
  const { profileName } = reports[0];

  return (
    <div
      style={{
        padding: "20px",
        maxWidth: "500px",
        margin: "0 auto",
        backgroundColor: "#fff",
        borderRadius: "8px",
      }}
    >
      {/* Test Name as heading */}
      <h2 style={{ margin: "0 0 10px 0", textAlign: "center" }}>{testName}</h2>

      {/* Patient / Profile Info */}
      <div style={{ textAlign: "center", marginBottom: "20px" }}>
        <p style={{ margin: "4px 0" }}>
          <strong>Name:</strong> {profileName}
        </p>
        <p style={{ margin: "4px 0" }}>
          <strong>Test Date:</strong> {date}
        </p>
        <p style={{ margin: "4px 0" }}>
          <strong>Test Time:</strong> {time}
        </p>
      </div>

      {/* Table-like structure for results */}
      {reports.length > 0 ? (
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
          }}
        >
          <thead>
            <tr
              style={{
                backgroundColor: "#f0f0f0",
                textAlign: "left",
              }}
            >
              <th
                style={{
                  padding: "8px",
                  fontWeight: "bold",
                  borderTopLeftRadius: "4px",
                }}
              >
                Test
              </th>
              <th style={{ padding: "8px", fontWeight: "bold" }}>Result</th>
              <th style={{ padding: "8px", fontWeight: "bold" }}>Unit</th>
              <th
                style={{
                  padding: "8px",
                  fontWeight: "bold",
                  borderTopRightRadius: "4px",
                }}
              >
                Ref. Value
              </th>
            </tr>
          </thead>
          <tbody>
            {reports.map((entry, index) => {
              const resultNum = parseFloat(entry.result);
              const minNum = parseFloat(entry.minValue);
              const maxNum = parseFloat(entry.maxValue);
              const isAbnormal = resultNum < minNum || resultNum > maxNum;

              // Alternate background color or use the same color for each row
              const rowStyle = {
                backgroundColor: "#e8f4fc", // Light blue as per your screenshot
              };

              return (
                <tr key={entry.id || index} style={rowStyle}>
                  <td style={{ padding: "8px" }}>{entry.parameter}</td>
                  <td
                    style={{
                      padding: "8px",
                      color: isAbnormal ? "red" : "black",
                      fontWeight: isAbnormal ? "bold" : "normal",
                    }}
                  >
                    {entry.result}
                  </td>
                  <td style={{ padding: "8px" }}>{entry.unit}</td>
                  <td style={{ padding: "8px" }}>
                    {entry.minValue} - {entry.maxValue}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      ) : (
        <p>No test results available.</p>
      )}
    </div>
  );
}
