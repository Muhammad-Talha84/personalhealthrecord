// CompareScreen.jsx
import React, { useEffect, useState, useMemo } from "react";
import useDatabase from "../Components/useDatabase";
import { useLocation } from "react-router-dom";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from "recharts";

// Simple palette for distinguishing profiles
const COLORS = ["#8884d8", "#82ca9d", "#ff7300", "#ff0000", "#00aaff"];

export default function CompareScreen() {
  const { db } = useDatabase();
  const location = useLocation();

  const [profiles, setProfiles] = useState([]);
  const [testNames, setTestNames] = useState([]);

  // Form state
  const [selectedProfiles, setSelectedProfiles] = useState(
    location.state?.baseProfile ? [location.state.baseProfile.name] : []
  );
  const [selectedTest, setSelectedTest] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  // Data rows
  const [comparisonRows, setComparisonRows] = useState([]);
  const [parameters, setParameters] = useState([]);
  const [selectedParameter, setSelectedParameter] = useState("");

  // Load profiles
  useEffect(() => {
    if (!db) return;
    const email = localStorage.getItem("currentUserEmail");
    const stmt = db.prepare("SELECT * FROM profiles WHERE userEmail = ?");
    stmt.bind([email]);
    const out = [];
    while (stmt.step()) out.push(stmt.getAsObject());
    stmt.free();
    setProfiles(out);
  }, [db]);

  // Load tests
  useEffect(() => {
    if (!db) return;
    const stmt = db.prepare("SELECT DISTINCT testName FROM LabReports");
    const out = [];
    while (stmt.step()) out.push(stmt.getAsObject().testName);
    stmt.free();
    setTestNames(out);
  }, [db]);

  // Compare handler
  const handleCompare = () => {
    if (
      !db ||
      !selectedTest ||
      selectedProfiles.length < 2 ||
      !fromDate ||
      !toDate
    ) {
      alert("Select at least 2 profiles, a test, and a date range.");
      return;
    }
    const placeholders = selectedProfiles.map(() => "?").join(",");
    const sql = `
      SELECT profileName, parameter, result, unit, date,
             minValue, maxValue
      FROM LabReports
      WHERE testName = ?
        AND profileName IN (${placeholders})
        AND date BETWEEN ? AND ?
      ORDER BY date, profileName
    `;
    const stmt = db.prepare(sql);
    stmt.bind([selectedTest, ...selectedProfiles, fromDate, toDate]);
    const rows = [];
    while (stmt.step()) rows.push(stmt.getAsObject());
    stmt.free();

    const pivot = {};
    rows.forEach((r) => {
      const key = `${r.parameter} | ${r.date}`;
      if (!pivot[key]) pivot[key] = { parameter: r.parameter, date: r.date };
      const num = parseFloat(r.result);
      const abnormal =
        !isNaN(num) &&
        ((r.minValue != null && num < r.minValue) ||
          (r.maxValue != null && num > r.maxValue));
      pivot[key][r.profileName] = {
        value: num,
        unit: r.unit,
        isAbnormal: abnormal,
      };
    });
    const arr = Object.values(pivot);
    setComparisonRows(arr);
    const distinctParams = Array.from(new Set(arr.map((r) => r.parameter)));
    setParameters(distinctParams);
    setSelectedParameter("");
  };

  // Build chart data for selected parameter
  const chartData = useMemo(() => {
    if (!selectedParameter) return [];
    return comparisonRows
      .filter((r) => r.parameter === selectedParameter)
      .map((r) => {
        const pt = { date: r.date };
        selectedProfiles.forEach((name) => {
          pt[name] = r[name]?.value ?? null;
        });
        return pt;
      });
  }, [comparisonRows, selectedParameter, selectedProfiles]);

  return (
    <div style={{ padding: 20 }}>
      <h2>Compare Lab Test</h2>

      <div style={{ marginBottom: 16 }}>
        <label>
          Test{" "}
          <select
            value={selectedTest}
            onChange={(e) => {
              setSelectedTest(e.target.value);
              setParameters([]);
              setSelectedParameter("");
            }}
          >
            <option value="">— choose a test —</option>
            {testNames.map((t) => (
              <option key={t} value={t}>
                {t}
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
      </div>

      <div style={{ marginBottom: 16 }}>
        <strong>Select Profiles (min 2):</strong>
        {profiles.map((p) => (
          <label key={p.id} style={{ marginLeft: 8 }}>
            <input
              type="checkbox"
              value={p.name}
              checked={selectedProfiles.includes(p.name)}
              onChange={(e) => {
                const name = e.target.value;
                setSelectedProfiles((prev) =>
                  prev.includes(name)
                    ? prev.filter((x) => x !== name)
                    : [...prev, name]
                );
              }}
            />{" "}
            {p.name} ({p.relation})
          </label>
        ))}
      </div>

      <button
        onClick={handleCompare}
        disabled={
          !selectedTest || selectedProfiles.length < 2 || !fromDate || !toDate
        }
      >
        Run Comparison
      </button>

      {parameters.length > 0 && (
        <div style={{ marginTop: 20 }}>
          <label>
            Parameter to Graph{" "}
            <select
              value={selectedParameter}
              onChange={(e) => setSelectedParameter(e.target.value)}
            >
              <option value="">— choose parameter —</option>
              {parameters.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </label>
        </div>
      )}

      {/* Chart */}
      {chartData.length > 0 && (
        <div style={{ marginTop: 32, width: "100%", height: 400 }}>
          <ResponsiveContainer>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              {selectedProfiles.map((name, idx) => (
                <Line
                  key={name}
                  type="monotone"
                  dataKey={name}
                  name={name}
                  stroke={COLORS[idx % COLORS.length]}
                  strokeWidth={2}
                  dot={{ r: 4 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Table of values */}
      {selectedParameter && comparisonRows.length > 0 && (
        <div style={{ marginTop: 32, overflowX: "auto" }}>
          <table
            border="1"
            cellPadding="6"
            style={{ borderCollapse: "collapse", minWidth: 600 }}
          >
            <thead>
              <tr>
                <th>Date</th>
                {selectedProfiles.map((name) => (
                  <th key={name}>{name}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {comparisonRows
                .filter((r) => r.parameter === selectedParameter)
                .map((row, i) => (
                  <tr key={i}>
                    <td>{row.date}</td>
                    {selectedProfiles.map((name) => {
                      const cell = row[name] || {
                        value: "—",
                        unit: "",
                        isAbnormal: false,
                      };
                      return (
                        <td
                          key={name}
                          style={{
                            backgroundColor: cell.isAbnormal
                              ? "#f8d7d7"
                              : undefined,
                            color: cell.isAbnormal ? "#a00" : undefined,
                            fontWeight: cell.isAbnormal ? "bold" : undefined,
                          }}
                        >
                          {cell.value !== "—"
                            ? `${cell.value} ${cell.unit}`
                            : "—"}
                        </td>
                      );
                    })}
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
