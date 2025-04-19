// src/components/AbnormalReports.js
import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import useDatabase from "../Components/useDatabase";
import "../CSS/AbnormalReports.css";

export default function AbnormalReports() {
  const { state } = useLocation();
  const { profile } = state || {};
  const { db } = useDatabase();

  // filter state
  const [searchName, setSearchName] = useState("");
  const [rangeOption, setRangeOption] = useState("5m"); // '1m', '5m', 'custom'
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [abnormalReports, setAbnormalReports] = useState([]);
  const [loaded, setLoaded] = useState(false);

  const defaultTests = ["BloodCP", "LFT", "TFT"];
  const formatDate = (d) => d.toISOString().split("T")[0];
  const today = formatDate(new Date());

  // initialize date range
  useEffect(() => {
    setToDate(today);
    updateFromDate(rangeOption, today);
  }, [rangeOption]);

  // helper to adjust fromDate based on option
  const updateFromDate = (option, currentTo) => {
    const d = new Date(currentTo);
    if (option === "1m") {
      d.setMonth(d.getMonth() - 1);
    } else if (option === "5m") {
      d.setMonth(d.getMonth() - 5);
    }
    setFromDate(formatDate(d));
  };

  const loadAbnormals = () => {
    if (!db || !profile) return;

    const tests = searchName.trim() ? [searchName.trim()] : defaultTests;
    const results = [];

    tests.forEach((testName) => {
      const stmt = db.prepare(
        `SELECT * FROM LabReports
         WHERE profileName = ?
           AND testName = ?
           AND (CAST(result AS REAL) < minValue OR CAST(result AS REAL) > maxValue)
           AND date BETWEEN ? AND ?
         ORDER BY date DESC, time DESC`
      );
      stmt.bind([profile.name, testName, fromDate, toDate]);

      const records = [];
      while (stmt.step()) records.push(stmt.getAsObject());
      stmt.free();

      if (records.length) results.push({ testName, records });
    });

    setAbnormalReports(results);
    setLoaded(true);
  };

  if (!profile) {
    return (
      <div className="no-profile">
        <h2>No profile selected</h2>
        <p>Please select a profile to view reports.</p>
      </div>
    );
  }

  return (
    <div className="abnormal-container">
      <h2>Abnormal Lab Results</h2>

      {/* Filters */}
      <div className="filter-container">
        <div className="filter-group">
          <label htmlFor="searchName">Test Name:</label>
          <input
            id="searchName"
            type="text"
            placeholder="e.g. LFT"
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
                updateFromDate(rangeOption, e.target.value);
            }}
            disabled={rangeOption !== "custom"}
          />
        </div>
        <button className="load-btn" onClick={loadAbnormals}>
          {loaded ? "Refresh" : "Show Abnormal"}
        </button>
      </div>

      {/* Results */}
      {loaded && abnormalReports.length === 0 && (
        <p className="no-results">No abnormal results found.</p>
      )}

      {abnormalReports.map(({ testName, records }) => (
        <section key={testName} className="report-section">
          <h3>{testName}</h3>
          {records.map((r) => (
            <div key={r.id} className="report-card">
              <div className="report-header">
                <span>Date: {r.date}</span>
                <span>Time: {r.time}</span>
              </div>
              <table className="report-table">
                <thead>
                  <tr>
                    <th>Parameter</th>
                    <th>Result</th>
                    <th>Unit</th>
                    <th>Reference</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>{r.parameter}</td>
                    <td
                      className={
                        parseFloat(r.result) < r.minValue ||
                        parseFloat(r.result) > r.maxValue
                          ? "abnormal"
                          : ""
                      }
                    >
                      {r.result}
                    </td>
                    <td>{r.unit}</td>
                    <td>
                      {r.minValue}–{r.maxValue}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          ))}
        </section>
      ))}
    </div>
  );
}
