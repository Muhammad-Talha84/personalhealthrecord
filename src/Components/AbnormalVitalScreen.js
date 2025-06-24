// src/screens/AbnormalVitalsScreen.js
import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import useDatabase from "../Components/useDatabase";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function AbnormalVitalScreen() {
  const { state } = useLocation();
  const { profile } = state || {};
  const { db } = useDatabase();

  // filter state
  const [searchName, setSearchName] = useState("");
  const [rangeOption, setRangeOption] = useState("5m"); // '1m', '5m', 'custom'
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [loaded, setLoaded] = useState(false);

  // results: [{ vitalName, records: [ { id, date, time, value, unit, minValue, maxValue } ] }]
  const [abnormalVitals, setAbnormalVitals] = useState([]);

  const defaultVitals = [
    "Temperature",
    "HeartRate",
    "PulseRate",
    "BloodPressure",
  ];
  const formatDate = (d) => d.toISOString().split("T")[0];
  const today = formatDate(new Date());

  // initialize dates
  useEffect(() => {
    setToDate(today);
    adjustFromDate(rangeOption, today);
  }, [rangeOption]);

  const adjustFromDate = (opt, currTo) => {
    const dt = new Date(currTo);
    if (opt === "1m") dt.setMonth(dt.getMonth() - 1);
    else if (opt === "5m") dt.setMonth(dt.getMonth() - 5);
    setFromDate(formatDate(dt));
  };
  useEffect(() => {
    if (db && profile) loadAbnormals();
  }, [db, profile, fromDate, toDate]);

  const loadAbnormals = () => {
    if (!db || !profile) return;

    const vitals = searchName.trim() ? [searchName.trim()] : defaultVitals;
    const results = [];

    vitals.forEach((vName) => {
      const stmt = db.prepare(
        `SELECT id, vitalName, value, unit, date, time, minValue, maxValue
         FROM Vitals
         WHERE profileName = ?
           AND vitalName = ?
           AND (value < minValue OR value > maxValue)
           AND date BETWEEN ? AND ?
         ORDER BY date DESC, time DESC`
      );
      stmt.bind([profile.name, vName, fromDate, toDate]);

      const recs = [];
      while (stmt.step()) {
        recs.push(stmt.getAsObject());
      }
      stmt.free();

      if (recs.length) results.push({ vitalName: vName, records: recs });
    });

    setAbnormalVitals(results);
    setLoaded(true);
  };

  if (!profile) {
    return (
      <div className="no-profile">
        <h2>No profile selected</h2>
        <p>Please select a profile to view abnormal vitals.</p>
      </div>
    );
  }

  return (
    <div className="abnormal-vitals-container">
      <h2>Abnormal Vitals for {profile.name}</h2>

      {/* Filters */}
      <div className="filter-container">
        <div className="filter-group">
          <label htmlFor="searchName">Vital Name:</label>
          <input
            id="searchName"
            type="text"
            placeholder="e.g. Temperature"
            value={searchName}
            onChange={(e) => setSearchName(e.target.value)}
          />
        </div>

        <div className="filter-group">
          <label htmlFor="rangeOption">Date Range:</label>
          <select
            id="rangeOption"
            value={rangeOption}
            onChange={(e) => setRangeOption(e.target.value)}
          >
            <option value="1m">Last 1 Month</option>
            <option value="5m">Last 5 Months</option>
            <option value="custom">Custom</option>
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="fromDate">From:</label>
          <input
            id="fromDate"
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            disabled={rangeOption !== "custom"}
          />
        </div>

        <div className="filter-group">
          <label htmlFor="toDate">To:</label>
          <input
            id="toDate"
            type="date"
            value={toDate}
            onChange={(e) => {
              setToDate(e.target.value);
              if (rangeOption !== "custom")
                adjustFromDate(rangeOption, e.target.value);
            }}
            disabled={rangeOption !== "custom"}
          />
        </div>

        <button className="load-btn" onClick={loadAbnormals}>
          {loaded ? "Refresh" : "Show Abnormal"}
        </button>
      </div>

      {/* Results */}
      {loaded && abnormalVitals.length === 0 && (
        <p className="no-results">No abnormal vital readings found.</p>
      )}

      {abnormalVitals.map(({ vitalName, records }) => (
        <section key={vitalName} className="vital-section">
          <h3>{vitalName}</h3>

          {/* Graph */}
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height={200}>
              <LineChart
                data={records.map((r) => ({
                  dateTime: new Date(`${r.date}T${r.time}`).getTime(),
                  value: r.value,
                }))}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="dateTime"
                  tickFormatter={(ts) => new Date(ts).toLocaleDateString()}
                />
                <YAxis domain={["auto", "auto"]} />
                <Tooltip
                  labelFormatter={(ts) => new Date(ts).toLocaleString()}
                />
                <Line dataKey="value" stroke="#d32f2f" dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Table */}
          <table className="vital-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Time</th>
                <th>Value ({records[0]?.unit})</th>
                <th>Normal Range</th>
              </tr>
            </thead>
            <tbody>
              {records.map((r) => (
                <tr key={r.id}>
                  <td>{r.date}</td>
                  <td>{r.time}</td>
                  <td className="abnormal">{r.value}</td>
                  <td>
                    {r.minValue}–{r.maxValue}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ))}
    </div>
  );
}
