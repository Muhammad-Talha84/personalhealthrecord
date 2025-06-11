import React, { useEffect, useState, useMemo } from "react";
import useDatabase from "./useDatabase";
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

export default function CompareVitals() {
  const { db } = useDatabase();
  const location = useLocation();

  // ── Form State ─────────────────────────────────────────────────────────────
  const [profiles, setProfiles] = useState([]);
  const [selectedProfiles, setSelectedProfiles] = useState(
    location.state?.baseProfile ? [location.state.baseProfile.name] : []
  );
  const [vitalTypes, setVitalTypes] = useState([]);
  const [selectedVital, setSelectedVital] = useState("");
  // NEW: pick systolic or diastolic
  const [bpComponent, setBpComponent] = useState("systolic");

  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  // ── Pivoted comparison rows ─────────────────────────────────────────────────
  const [comparisonRows, setComparisonRows] = useState([]);

  // ── 1) Load profiles ────────────────────────────────────────────────────────
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

  // ── 2) Load distinct vitals ────────────────────────────────────────────────
  useEffect(() => {
    if (!db) return;
    const stmt = db.prepare(
      "SELECT DISTINCT vitalName, minValue, maxValue FROM Vitals"
    );
    const out = [];
    while (stmt.step()) {
      out.push(stmt.getAsObject());
    }
    stmt.free();
    setVitalTypes(out);
  }, [db]);

  // ── 3) Fetch & pivot on “Run Comparison” ───────────────────────────────────
  const handleCompare = () => {
    if (
      !db ||
      !selectedVital ||
      selectedProfiles.length < 1 ||
      !fromDate ||
      !toDate
    ) {
      alert("Please select at least one profile, a vital, and a date range.");
      return;
    }

    const placeholders = selectedProfiles.map(() => "?").join(",");
    const sql = `
      SELECT profileName, date, time, value, unit, minValue, maxValue
      FROM Vitals
      WHERE vitalName = ?
        AND profileName IN (${placeholders})
        AND date BETWEEN ? AND ?
      ORDER BY date, profileName
    `;
    const stmt = db.prepare(sql);
    stmt.bind([selectedVital, ...selectedProfiles, fromDate, toDate]);

    const rows = [];
    while (stmt.step()) rows.push(stmt.getAsObject());
    stmt.free();

    const pivot = {};
    rows.forEach((r) => {
      // parse out systolic/diastolic if BP
      let num;
      if (selectedVital.toLowerCase() === "bloodpressure") {
        const parts = r.value.split("/").map((x) => parseFloat(x));
        num = bpComponent === "diastolic" ? parts[1] : parts[0];
      } else {
        num = parseFloat(r.value);
      }

      const abnormal =
        !isNaN(num) &&
        ((r.minValue != null && num < r.minValue) ||
          (r.maxValue != null && num > r.maxValue));

      if (!pivot[r.date]) pivot[r.date] = { date: r.date };
      pivot[r.date][r.profileName] = {
        value: num,
        unit: r.unit,
        isAbnormal: abnormal,
      };
    });

    setComparisonRows(Object.values(pivot));
  };

  // ── 4) Build chartData array ───────────────────────────────────────────────
  const chartData = useMemo(() => {
    return comparisonRows.map((row) => {
      const o = { date: row.date };
      selectedProfiles.forEach((name) => {
        o[name] = row[name]?.value ?? null;
      });
      return o;
    });
  }, [comparisonRows, selectedProfiles]);

  const [p1, p2] = selectedProfiles;
  const chartData1 = useMemo(
    () => chartData.map((r) => ({ date: r.date, [p1]: r[p1] })),
    [chartData, p1]
  );
  const chartData2 = useMemo(
    () => chartData.map((r) => ({ date: r.date, [p2]: r[p2] })),
    [chartData, p2]
  );

  return (
    <div style={{ padding: 20, fontFamily: "Arial, sans-serif" }}>
      <h2 style={{ textAlign: "center" }}>Compare Vitals</h2>

      {/* ── Form Controls ───────────────────────────────────────────────────── */}
      <div style={{ marginBottom: 16 }}>
        <label>
          Vital&nbsp;
          <select
            value={selectedVital}
            onChange={(e) => setSelectedVital(e.target.value)}
          >
            <option value="">— choose vital —</option>
            {vitalTypes.map(({ vitalName }) => (
              <option key={vitalName} value={vitalName}>
                {vitalName}
              </option>
            ))}
          </select>
        </label>

        {/* NEW: systolic/diastolic toggle */}
        {selectedVital.toLowerCase() === "bloodpressure" && (
          <span style={{ marginLeft: 16 }}>
            <label>
              <input
                type="radio"
                name="bpComp"
                value="systolic"
                checked={bpComponent === "systolic"}
                onChange={() => setBpComponent("systolic")}
              />{" "}
              Systolic
            </label>
            <label style={{ marginLeft: 12 }}>
              <input
                type="radio"
                name="bpComp"
                value="diastolic"
                checked={bpComponent === "diastolic"}
                onChange={() => setBpComponent("diastolic")}
              />{" "}
              Diastolic
            </label>
          </span>
        )}

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

      {/* ── Profile Checkboxes ───────────────────────────────────────────────── */}
      <div style={{ marginBottom: 16 }}>
        <strong>Select Profiles (max 2):</strong>
        {profiles.map((p) => (
          <label
            key={p.id}
            style={{
              marginLeft: 8,
              opacity:
                !selectedProfiles.includes(p.name) &&
                selectedProfiles.length >= 2
                  ? 0.5
                  : 1,
            }}
          >
            <input
              type="checkbox"
              value={p.name}
              checked={selectedProfiles.includes(p.name)}
              disabled={
                !selectedProfiles.includes(p.name) &&
                selectedProfiles.length >= 2
              }
              onChange={(e) => {
                const name = e.target.value;
                setSelectedProfiles((prev) =>
                  prev.includes(name)
                    ? prev.filter((x) => x !== name)
                    : prev.length < 2
                    ? [...prev, name]
                    : prev
                );
              }}
            />
            {p.name} ({p.relation})
          </label>
        ))}
        <div style={{ fontSize: "0.9rem", color: "#555", marginTop: 4 }}>
          {selectedProfiles.length} selected (max 2)
        </div>
      </div>

      <button
        onClick={handleCompare}
        disabled={
          !selectedVital || selectedProfiles.length < 1 || !fromDate || !toDate
        }
      >
        Run Comparison
      </button>

      {/* ── Side-by-Side Charts ──────────────────────────────────────────────── */}
      {selectedProfiles.length === 2 && chartData.length > 0 && (
        <div
          style={{ display: "flex", gap: 20, marginTop: 32, flexWrap: "wrap" }}
        >
          {[
            [p1, chartData1],
            [p2, chartData2],
          ].map(([prof, data]) => (
            <div key={prof} style={{ flex: 1, minWidth: 250, height: 300 }}>
              <h4 style={{ textAlign: "center" }}>
                {prof} – {selectedVital}
                {selectedVital.toLowerCase() === "bloodpressure"
                  ? ` (${bpComponent})`
                  : ""}
              </h4>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey={prof}
                    name={prof}
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ))}
        </div>
      )}

      {/* ── Raw Comparison Table ──────────────────────────────────────────────── */}
      {comparisonRows.length > 0 && (
        <div style={{ overflowX: "auto", marginTop: 32 }}>
          <table border="1" cellPadding="6" style={{ minWidth: 600 }}>
            <thead>
              <tr>
                <th>Date</th>
                {selectedProfiles.map((name) => (
                  <th key={name}>
                    {name}
                    {selectedVital.toLowerCase() === "bloodpressure"
                      ? ` (${bpComponent})`
                      : ""}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {comparisonRows.map((row, i) => (
                <tr key={i}>
                  <td>{row.date}</td>
                  {selectedProfiles.map((name) => {
                    const cell = row[name] || {
                      value: "–",
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
                        {cell.value !== "–"
                          ? `${cell.value} ${cell.unit || ""}`
                          : "–"}
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
