// src/Components/ReportsDetail.js
import React, { useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

export default function ReportsDetail() {
  const { state } = useLocation();
  const profile = state?.profile;
  const report = state?.report;
  const labReports = state?.labReports || [];

  // --- HOOKS MUST RUN FIRST ---
  const testName = report?.testName || "";

  // 1) All entries for this test
  const allThisTest = useMemo(
    () => labReports.filter((r) => r.testName === testName),
    [labReports, testName]
  );

  // 2) Distinct parameters
  const parameters = useMemo(
    () => Array.from(new Set(allThisTest.map((r) => r.parameter))),
    [allThisTest]
  );

  // 3) Date range and parameter selection
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [selectedParam, setSelectedParam] = useState(parameters[0] || "");
  // const handleMonthlyClick = () => {
  //   const months = prompt("Enter number of months (e.g., 1 or 4):");
  //   const monthsInt = parseInt(months);
  //   if (!isNaN(monthsInt) && monthsInt > 0) {
  //     const now = new Date();
  //     const past = new Date();
  //     past.setMonth(now.getMonth() - monthsInt);
  //     setFromDate(past.toISOString().split("T")[0]);
  //     setToDate(now.toISOString().split("T")[0]);
  //   }
  // };
  // 4) Chart data with optional custom date filtering
  const chartData = useMemo(() => {
    if (!profile || !selectedParam) return [];

    // Filter entries for user and parameter, then sort chronologically
    const entries = allThisTest
      .filter(
        (r) => r.profileName === profile.name && r.parameter === selectedParam
      )
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    // Apply date filters if provided
    let filtered = entries;
    if (fromDate) {
      const from = new Date(fromDate);
      filtered = filtered.filter((r) => new Date(r.date) >= from);
    }
    if (toDate) {
      const to = new Date(toDate);
      filtered = filtered.filter((r) => new Date(r.date) <= to);
    }

    // Decide which data to show: full filtered range or last 4 when no explicit range
    const dataToUse = fromDate || toDate ? filtered : filtered.slice(-4);

    return dataToUse.map((r) => ({
      date: r.date,
      value: parseFloat(r.result),
    }));
  }, [allThisTest, profile?.name, selectedParam, fromDate, toDate]);
  // --- END OF HOOKS ---

  // Now guard for missing state
  if (!profile || !report) {
    return (
      <div style={{ padding: 20 }}>
        <h2>Oops, report not found</h2>
        <p>Make sure you clicked a report from the previous screen.</p>
      </div>
    );
  }

  const { date, time } = report;

  return (
    <div style={{ padding: 20, maxWidth: 600, margin: "0 auto" }}>
      {/* Header */}
      <h2 style={{ textAlign: "center" }}>{testName}</h2>
      <div style={{ textAlign: "center", marginBottom: 20 }}>
        <p>
          <strong>Name:</strong> {profile.name}
        </p>
        <p>
          <strong>Test Date:</strong> {date}
        </p>
        <p>
          <strong>Test Time:</strong> {time}
        </p>
      </div>

      {/* Parameter & Date Range selector */}
      <div style={{ marginBottom: 20, textAlign: "center" }}>
        <label>
          Plot parameter:&nbsp;
          <select
            value={selectedParam}
            onChange={(e) => setSelectedParam(e.target.value)}
          >
            {parameters.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </label>
        <label style={{ marginLeft: 16 }}>
          From{" "}
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
          />
        </label>
        <label style={{ marginLeft: 16 }}>
          To{" "}
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
          />
        </label>
        {/* <button onClick={handleMonthlyClick} style={{ marginLeft: 16 }}>
          Monthly Range
        </button> */}
      </div>

      {/* Chart */}
      {chartData.length > 0 ? (
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Legend />
            <Line
              type="monotone"
              dataKey="value"
              name={selectedParam}
              stroke="#8884d8"
              strokeWidth={2}
              dot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <p style={{ textAlign: "center", color: "gray" }}>
          No {selectedParam} data.
        </p>
      )}

      {/* Table snapshot of this test date */}
      <table
        style={{ width: "100%", marginTop: 30, borderCollapse: "collapse" }}
      >
        <thead>
          <tr style={{ backgroundColor: "#f0f0f0" }}>
            <th style={{ padding: 8, textAlign: "left" }}>Test</th>
            <th style={{ padding: 8 }}>Result</th>
            <th style={{ padding: 8 }}>Unit</th>
            <th style={{ padding: 8 }}>Ref. Value</th>
          </tr>
        </thead>
        <tbody>
          {report.reports.map((entry, idx) => {
            const num = parseFloat(entry.result);
            const abnormal =
              num < parseFloat(entry.minValue) ||
              num > parseFloat(entry.maxValue);
            return (
              <tr key={idx} style={{ backgroundColor: "#e8f4fc" }}>
                <td style={{ padding: 8 }}>{entry.parameter}</td>
                <td
                  style={{
                    padding: 8,
                    color: abnormal ? "red" : "black",
                    fontWeight: abnormal ? "bold" : "normal",
                  }}
                >
                  {entry.result}
                </td>
                <td style={{ padding: 8 }}>{entry.unit}</td>
                <td style={{ padding: 8 }}>
                  {entry.minValue} – {entry.maxValue}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
