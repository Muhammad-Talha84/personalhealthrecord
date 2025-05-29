import React, { useEffect, useState } from "react";
import useDatabase from "../Components/useDatabase";
import { useLocation } from "react-router-dom";

export default function CompareScreen() {
  const { db } = useDatabase();

  const location = useLocation();

  const [profiles, setProfiles] = useState([]);
  const [testNames, setTestNames] = useState([]);

  // form state
  const [selectedProfiles, setSelectedProfiles] = useState(
    location.state?.baseProfile ? [location.state.baseProfile.name] : []
  );
  const [selectedTest, setSelectedTest] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  // comparison data
  const [comparisonRows, setComparisonRows] = useState([]);

  // 1) load all profiles for current user
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

  // 2) load distinct test names
  useEffect(() => {
    if (!db) return;
    const stmt = db.prepare("SELECT DISTINCT testName FROM LabReports");
    const out = [];
    while (stmt.step()) out.push(stmt.getAsObject().testName);
    stmt.free();
    setTestNames(out);
  }, [db]);

  // 3) when the user submits, fetch comparison data
  const handleCompare = () => {
    if (!db || !selectedTest || selectedProfiles.length < 1) return;

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

    // pivot by parameter/date into rows with one column per profile
    const pivot = {};
    rows.forEach((r) => {
      const key = `${r.parameter} | ${r.date}`;
      if (!pivot[key]) {
        pivot[key] = { parameter: r.parameter, date: r.date };
      }
      // check abnormal
      const num = parseFloat(r.result);
      const abnormal =
        !isNaN(num) &&
        ((r.minValue != null && num < r.minValue) ||
          (r.maxValue != null && num > r.maxValue));

      pivot[key][r.profileName] = {
        text: `${r.result} ${r.unit || ""}`,
        isAbnormal: abnormal,
      };
    });
    setComparisonRows(Object.values(pivot));
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>Compare Lab Test</h2>
      <div style={{ marginBottom: 16 }}>
        <label>
          Test&nbsp;
          <select
            value={selectedTest}
            onChange={(e) => setSelectedTest(e.target.value)}
          >
            <option value="">— choose a test —</option>
            {testNames.map((t) => (
              <option key={t}>{t}</option>
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
        <strong>Select Profiles:</strong>
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
            />
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

      {comparisonRows.length > 0 && (
        <table border="1" cellPadding="6" style={{ marginTop: 24 }}>
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
      )}
    </div>
  );
}
