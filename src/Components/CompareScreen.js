// CompareScreen.jsx
import React, { useEffect, useState, useMemo } from "react";
import useDatabase from "../Components/useDatabase";
import { useLocation } from "react-router-dom";

// Be sure you have Recharts installed: `npm install recharts`
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

  // Pivoted comparison rows
  const [comparisonRows, setComparisonRows] = useState([]);

  // Distinct parameters for the selected test
  const [parameters, setParameters] = useState([]);
  const [selectedParameter, setSelectedParameter] = useState("");

  // ─── 1) Load all profiles for current user ───────────────────────────────────
  useEffect(() => {
    if (!db) return;
    const email = localStorage.getItem("currentUserEmail");
    const stmt = db.prepare("SELECT * FROM profiles WHERE userEmail = ?");
    stmt.bind([email]);
    const out = [];
    while (stmt.step()) {
      out.push(stmt.getAsObject());
    }
    stmt.free();
    setProfiles(out);
  }, [db]);

  // ─── 2) Load distinct test names ─────────────────────────────────────────────
  useEffect(() => {
    if (!db) return;
    const stmt = db.prepare("SELECT DISTINCT testName FROM LabReports");
    const out = [];
    while (stmt.step()) {
      out.push(stmt.getAsObject().testName);
    }
    stmt.free();
    setTestNames(out);
  }, [db]);

  // ─── 3) Fetch & pivot when “Run Comparison” is clicked ───────────────────────
  const handleCompare = () => {
    if (
      !db ||
      !selectedTest ||
      selectedProfiles.length !== 2 || // enforce exactly two profiles
      !fromDate ||
      !toDate
    )
      return;

    // Build SQL with placeholders for each selected profile
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
    stmt.bind([
      selectedTest,
      ...selectedProfiles, // e.g. ["Alice", "Bob"]
      fromDate,
      toDate,
    ]);

    const rows = [];
    while (stmt.step()) {
      rows.push(stmt.getAsObject());
    }
    stmt.free();

    // Pivot into { "parameter | date": { parameter, date, [profileName]: { text, isAbnormal } } }
    const pivot = {};
    rows.forEach((r) => {
      const key = `${r.parameter} | ${r.date}`;
      if (!pivot[key]) {
        pivot[key] = { parameter: r.parameter, date: r.date };
      }
      const num = parseFloat(r.result);
      const abnormal =
        !isNaN(num) &&
        ((r.minValue != null && num < r.minValue) ||
          (r.maxValue != null && num > r.maxValue));

      pivot[key][r.profileName] = {
        text: `${r.result} ${r.unit || ""}`.trim(),
        isAbnormal: abnormal,
      };
    });

    const pivotedArray = Object.values(pivot);
    setComparisonRows(pivotedArray);

    // Extract all distinct parameters for dropdown
    const distinctParams = Array.from(
      new Set(pivotedArray.map((row) => row.parameter))
    );
    setParameters(distinctParams);
    setSelectedParameter("");
  };

  // ─── 4) Build “chartData” for the chosen parameter ────────────────────────────
  // chartData: [ { date: "...", Alice: 12.5, Bob: 13.1 }, … ]
  const chartData = useMemo(() => {
    if (!selectedParameter || comparisonRows.length === 0) return [];

    // Only keep rows matching the selected parameter
    const filteredRows = comparisonRows.filter(
      (row) => row.parameter === selectedParameter
    );

    return filteredRows.map((row) => {
      const obj = { date: row.date };
      selectedProfiles.forEach((profileName) => {
        const cell = row[profileName];
        if (cell && cell.text) {
          // parse the numeric portion (“120 mg/dL” → 120)
          const [numStr] = cell.text.split(" ");
          const num = parseFloat(numStr);
          obj[profileName] = isNaN(num) ? null : num;
        } else {
          obj[profileName] = null;
        }
      });
      return obj;
    });
  }, [comparisonRows, selectedParameter, selectedProfiles]);

  // ─── 5) Split chartData into two separate arrays—one per profile ─────────────
  //  For exactly two profiles:
  const [p1, p2] = selectedProfiles;
  const chartData1 = useMemo(() => {
    if (!p1) return [];
    return chartData.map((row) => ({
      date: row.date,
      [p1]: row[p1],
    }));
  }, [chartData, p1]);

  const chartData2 = useMemo(() => {
    if (!p2) return [];
    return chartData.map((row) => ({
      date: row.date,
      [p2]: row[p2],
    }));
  }, [chartData, p2]);

  return (
    <div style={{ padding: 20 }}>
      <h2>Compare Lab Test</h2>

      {/* ─── Form Controls ────────────────────────────────────────────────────── */}
      <div style={{ marginBottom: 16 }}>
        <label>
          Test&nbsp;
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
          From&nbsp;
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
          />
        </label>

        <label style={{ marginLeft: 16 }}>
          To&nbsp;
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
          />
        </label>
      </div>

      <div style={{ marginBottom: 16 }}>
        <strong>Select Exactly Two Profiles:</strong>
        {profiles.map((p) => (
          <label key={p.id} style={{ marginLeft: 8 }}>
            <input
              type="checkbox"
              value={p.name}
              checked={selectedProfiles.includes(p.name)}
              onChange={(e) => {
                const name = e.target.value;
                setSelectedProfiles((prev) => {
                  if (prev.includes(name)) {
                    return prev.filter((x) => x !== name);
                  } else if (prev.length < 2) {
                    return [...prev, name];
                  } else {
                    // if there are already 2, do nothing (enforce exactly 2)
                    return prev;
                  }
                });
              }}
            />
            {p.name} ({p.relation})
          </label>
        ))}
        <div style={{ fontSize: "0.9rem", color: "#555", marginTop: 4 }}>
          {selectedProfiles.length} profile selected (must be 2)
        </div>
      </div>

      <button
        onClick={handleCompare}
        disabled={
          !selectedTest || selectedProfiles.length !== 2 || !fromDate || !toDate
        }
      >
        Run Comparison
      </button>

      {/* ─── Parameter Dropdown ────────────────────────────────────────────────── */}
      {parameters.length > 0 && (
        <div style={{ marginTop: 20 }}>
          <label>
            Parameter to Graph:&nbsp;
            <select
              value={selectedParameter}
              onChange={(e) => setSelectedParameter(e.target.value)}
            >
              <option value="">— choose a parameter —</option>
              {parameters.map((param) => (
                <option key={param} value={param}>
                  {param}
                </option>
              ))}
            </select>
          </label>
        </div>
      )}

      {/* ─── If a parameter is selected, show two side-by-side charts ───────────── */}
      {selectedParameter && chartData.length > 0 && (
        <div
          style={{
            display: "flex",
            gap: 20,
            marginTop: 40,
            flexWrap: "wrap",
          }}
        >
          {/* ── Chart for Profile #1 ── */}
          <div style={{ flex: 1, minWidth: 250, height: 300 }}>
            <h4 style={{ textAlign: "center" }}>
              {p1} – {selectedParameter}
            </h4>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData1}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey={p1}
                  name={p1}
                  stroke="#8884d8"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* ── Chart for Profile #2 ── */}
          <div style={{ flex: 1, minWidth: 250, height: 300 }}>
            <h4 style={{ textAlign: "center" }}>
              {p2} – {selectedParameter}
            </h4>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData2}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey={p2}
                  name={p2}
                  stroke="#82ca9d"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* ─── If a parameter is selected but no data points exist ───────────────── */}
      {selectedParameter && chartData.length === 0 && (
        <p style={{ marginTop: 20, color: "gray" }}>
          No data points available for “{selectedParameter}” in the selected
          date range.
        </p>
      )}

      {/* ─── (Optional) Combined Chart with Both Profiles on One Graph ───────────── */}
      {/*
      {selectedParameter && chartData.length > 0 && (
        <div style={{ marginTop: 40, width: "100%", height: 350 }}>
          <h3 style={{ textAlign: "center" }}>
            {selectedTest} – {selectedParameter} (Combined)
          </h3>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{ top: 20, right: 30, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey={p1}
                name={p1}
                stroke="#8884d8"
                strokeWidth={2}
                dot={{ r: 4 }}
              />
              <Line
                type="monotone"
                dataKey={p2}
                name={p2}
                stroke="#82ca9d"
                strokeWidth={2}
                dot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
      */}

      {/* ─── (Optional) Raw Comparison Table ─────────────────────────────────────── */}
      {comparisonRows.length > 0 && (
        <div
          style={{
            marginTop: 32,
            maxWidth: "100%",
            overflowX: "auto",
          }}
        >
          <table border="1" cellPadding="6" style={{ minWidth: 600 }}>
            <thead>
              <tr>
                <th>Parameter</th>
                <th>Date</th>
                {selectedProfiles.map((name) => (
                  <th key={name}>{name}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {comparisonRows.map((row, i) => (
                <tr key={i}>
                  <td>{row.parameter}</td>
                  <td>{row.date}</td>
                  {selectedProfiles.map((name) => {
                    const cell = row[name] || { text: "–", isAbnormal: false };
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
                        {cell.text}
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
