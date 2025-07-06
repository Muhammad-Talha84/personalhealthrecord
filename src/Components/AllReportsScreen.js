import React, { useEffect, useState, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import useDatabase from "../Components/useDatabase";
import "../CSS/AllReportsScreen.css";

const AllReportsScreen = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { profile } = location.state || {};
  const { db } = useDatabase();

  const [labReports, setLabReports] = useState([]);
  const [showAllDates, setShowAllDates] = useState(false);

  // Fetch LabReports
  useEffect(() => {
    if (!db || !profile) return;
    const stmt = db.prepare("SELECT * FROM LabReports WHERE profileName = ?");
    stmt.bind([profile.name]);
    const rows = [];
    while (stmt.step()) rows.push(stmt.getAsObject());
    stmt.free();
    setLabReports(rows);
  }, [db, profile]);

  // Group reports by testName → date
  const reportsByTest = useMemo(
    () =>
      labReports.reduce((acc, r) => {
        if (!acc[r.testName]) acc[r.testName] = {};
        if (!acc[r.testName][r.date]) acc[r.testName][r.date] = [];
        acc[r.testName][r.date].push(r);
        return acc;
      }, {}),
    [labReports]
  );

  // Latest for each test
  const latestByTest = useMemo(
    () =>
      Object.entries(reportsByTest).map(([testName, dateGroups]) => {
        const latestDate = Object.keys(dateGroups).sort(
          (a, b) => new Date(b) - new Date(a)
        )[0];
        return { testName, date: latestDate, reports: dateGroups[latestDate] };
      }),
    [reportsByTest]
  );

  return (
    <div className="all-reports-container">
      <h1>All Lab Reports</h1>
      {profile && <h2>{profile.name}'s Reports</h2>}

      <div className="toggle-buttons">
        <button onClick={() => setShowAllDates(false)}>Latest Only</button>
        <button onClick={() => setShowAllDates(true)}>Show All Dates</button>
      </div>

      <div className="reports-grid">
        {showAllDates
          ? Object.entries(reportsByTest).map(([testName, dateGroups]) => (
              <div key={testName} className="report-card">
                <h3>{testName}</h3>
                {Object.entries(dateGroups)
                  .sort(([d1], [d2]) => new Date(d2) - new Date(d1))
                  .map(([date, reports]) => (
                    <div key={date} className="report-group">
                      <h4>{date}</h4>
                      {reports.map((r) => (
                        <p key={r.id || r.parameter}>
                          {r.parameter}: {r.result} {r.unit || ""}
                        </p>
                      ))}
                    </div>
                  ))}
              </div>
            ))
          : latestByTest.map(({ testName, date, reports }) => (
              <div key={testName} className="report-card">
                <h3>
                  {testName} <small>({date})</small>
                </h3>
                {reports.map((r) => (
                  <p key={r.id || r.parameter}>
                    {r.parameter}: {r.result} {r.unit || ""}
                  </p>
                ))}
              </div>
            ))}
      </div>

      <div className="actions">
        <button onClick={() => navigate(-1)}>Back</button>
        <button onClick={() => navigate("/addreport", { state: { profile } })}>
          Add Lab Report
        </button>
      </div>
    </div>
  );
};

export default AllReportsScreen;
