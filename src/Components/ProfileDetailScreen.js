import React, { useEffect, useState, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "../CSS/ProfileDetail.css";

import useDatabase from "../Components/useDatabase";

const ProfileDetailScreen = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { profile } = location.state || {};
  const { db } = useDatabase();

  const [vitals, setVitals] = useState([]);
  const [labReports, setLabReports] = useState([]);

  // New: filters for lab reports
  const [filterDate, setFilterDate] = useState("");
  const [showMostRecent, setShowMostRecent] = useState(false);

  // For charting
  const [selectedVitalType, setSelectedVitalType] = useState(null);
  // For expanding test to show its parameters
  const [expandedTest, setExpandedTest] = useState(null);

  // Toggle open/closed for a test block
  const handleToggleTest = (testName) => {
    setExpandedTest(expandedTest === testName ? null : testName);
  };
  const goToGraph = (testName, parameter) => {
    navigate("/graph", {
      state: {
        profileName: profile.name,
        testName,
        parameter,
      },
    });
  };

  // Fetch Vitals
  useEffect(() => {
    if (!db || !profile) return;
    try {
      const stmt = db.prepare("SELECT * FROM Vitals WHERE profileName = ?");
      stmt.bind([profile.name]);
      const rows = [];
      while (stmt.step()) {
        rows.push(stmt.getAsObject());
      }
      stmt.free();
      setVitals(rows);
    } catch (err) {
      console.error("Error fetching vitals:", err);
    }
  }, [db, profile]);

  // Fetch Lab Reports
  useEffect(() => {
    if (!db || !profile) return;
    try {
      const stmt = db.prepare("SELECT * FROM LabReports WHERE profileName = ?");
      stmt.bind([profile.name]);
      const rows = [];
      while (stmt.step()) {
        rows.push(stmt.getAsObject());
      }
      stmt.free();
      setLabReports(rows);
    } catch (err) {
      console.error("Error fetching lab reports:", err);
    }
  }, [db, profile]);

  // Group Lab Reports by testName and date
  // const groupedReports = useMemo(() => {
  //   return labReports.reduce((acc, report) => {
  //     const key = `${report.testName}-${report.date}`;
  //     if (!acc[key]) {
  //       acc[key] = {
  //         testName: report.testName,
  //         date: report.date,
  //         time: report.time,
  //         reports: [],
  //       };
  //     }
  //     acc[key].reports.push(report);
  //     return acc;
  //   }, {});
  // }, [labReports]);
  // NEW: group by testName → date → [reports]
  // TESTING
  // Group & filter
  const reportsByTest = useMemo(() => {
    // 1) apply date filter
    let filtered = labReports;
    if (filterDate) {
      filtered = labReports.filter((r) => r.date === filterDate);
    } else if (showMostRecent) {
      const dates = Array.from(new Set(labReports.map((r) => r.date)));
      if (dates.length) {
        const latest = dates.sort((a, b) => new Date(b) - new Date(a))[0];
        filtered = labReports.filter((r) => r.date === latest);
      }
    }

    // 2) group by testName → date
    return filtered.reduce((byTest, rpt) => {
      const { testName, date } = rpt;
      byTest[testName] = byTest[testName] || {};
      byTest[testName][date] = byTest[testName][date] || [];
      byTest[testName][date].push(rpt);
      return byTest;
    }, {});
  }, [labReports, filterDate, showMostRecent]);
  // Filtered reports based on date or most recent
  // const filteredGroupedReports = useMemo(() => {
  //   const entries = Object.entries(groupedReports);
  //   if (filterDate) {
  //     return Object.fromEntries(
  //       entries.filter(([, group]) => group.date === filterDate)
  //     );
  //   }
  //   if (showMostRecent) {
  //     const dates = entries.map(([, g]) => g.date);
  //     if (dates.length === 0) return {};
  //     const latest = dates.sort((a, b) => new Date(b) - new Date(a))[0];
  //     return Object.fromEntries(entries.filter(([, g]) => g.date === latest));
  //   }
  //   return groupedReports;
  // }, [groupedReports, filterDate, showMostRecent]);

  // Navigate to detail view
  const goToReportDetail = (report) => {
    navigate("/reportsdetail", { state: { profile, report } });
  };

  // Handle vital detail navigation
  const handleViewVital = (vital) => {
    const readings = vitals
      .filter((v) => v.vitalName === vital.vitalName && v.date && v.time)
      .map((v) => ({
        date: v.date,
        time: v.time,
        value: v.value,
        unit: v.unit,
      }))
      .sort(
        (a, b) =>
          new Date(`${a.date} ${a.time}`) - new Date(`${b.date} ${b.time}`)
      );
    if (vital.vitalName.toLowerCase() === "bloodpressure") {
      navigate("/bp", { state: { profile, data: readings } });
    } else {
      navigate("/vitaldetail", {
        state: { profile, type: vital.vitalName, readings },
      });
    }
  };

  return (
    <div className="profiledetailContainer">
      {/* Profile Details */}
      <div className="details">
        <h1 style={{ textAlign: "center" }}>PERSONAL HEALTH RECORD</h1>
        <h2>Profile Details</h2>

        {profile ? (
          <>
            <div className="profile-grid">
              <div className="profile-item">
                <strong>Name:</strong> {profile.name}
              </div>
              <div className="profile-item">
                <strong>Relation:</strong> {profile.relation}
              </div>
              <div className="profile-item">
                <strong>Gender:</strong> {profile.gender}
              </div>
              <div className="profile-item">
                <strong>DOB:</strong> {profile.dob}
              </div>
              <div className="profile-item">
                <strong>Blood Group:</strong> {profile.bloodGroup}
              </div>
              <div className="profile-item">
                <strong>Height:</strong> {profile.height}
              </div>
              <div className="profile-item">
                <strong>Weight:</strong> {profile.weight}
              </div>
            </div>

            <button
              className="abnormalButton"
              onClick={() => navigate("/abnormal", { state: { profile } })}
            >
              View Abnormal Reports
            </button>
          </>
        ) : (
          <p>No Profile Selected</p>
        )}
      </div>

      {/* Vitals & Lab Reports */}
      <div className="dataSections">
        {/* Vitals Section */}
        <div className="vitalsSection">
          <h3>Vitals</h3>
          {vitals.length > 0 ? (
            <div className="vitalsList">
              {vitals.map((v, idx) => (
                <div
                  key={idx}
                  className={`vitalItem ${
                    selectedVitalType === v.vitalName ? "selected" : ""
                  }`}
                  onClick={() => handleViewVital(v)}
                  style={{ cursor: "pointer" }}
                >
                  <p>
                    <strong>{v.vitalName}</strong>: {v.value} {v.unit} {v.date}{" "}
                    {v.time}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ textAlign: "center", color: "gray" }}>
              No Vitals Added
            </p>
          )}
          <button onClick={() => navigate("/addvital", { state: { profile } })}>
            Add Vital
          </button>
          <button
            onClick={() => navigate("/abnorVital", { state: { profile } })}
          >
            View Abnormal Vitals
          </button>
          <button
            onClick={() =>
              navigate("/compvital", { state: { baseProfile: profile } })
            }
          >
            Compare Vitals with Family
          </button>
        </div>

        {/* Lab Reports Section */}
        <div className="labReportsSection">
          <h3>Lab Reports</h3>

          {/* Filter Controls */}
          <div className="labReportsFilter" style={{ marginBottom: "1rem" }}>
            <input
              type="date"
              value={filterDate}
              onChange={(e) => {
                setFilterDate(e.target.value);
                setShowMostRecent(false);
              }}
            />
            <button onClick={() => setShowMostRecent(false)}>Search</button>
            <button
              onClick={() => {
                setShowMostRecent(true);
                setFilterDate("");
              }}
            >
              Most Recent
            </button>
            <button
              onClick={() => {
                setFilterDate("");
                setShowMostRecent(false);
              }}
            >
              Show All
            </button>
          </div>
          {/* for graph */}
          <div className="labReportsList">
            {Object.entries(reportsByTest).map(([testName, dateMap]) => {
              // collect unique parameters across dates
              const params = Array.from(
                new Set(
                  Object.values(dateMap) // gives array of all report-arrays for each date
                    .flat() // flattens into one big array of report objects
                    .map((r) => r.parameter) // picks out the `parameter` field
                )
              );

              return (
                <div key={testName} className="testBlock">
                  <div
                    className="labReportItem"
                    onClick={() => handleToggleTest(testName)}
                    style={{
                      cursor: "pointer",
                      border: "1px solid #ddd",
                      padding: "8px",
                    }}
                  >
                    <p>
                      <strong>{testName}</strong>
                    </p>
                    <small>
                      Dates: {Object.keys(dateMap).sort().join(", ")}
                    </small>
                  </div>

                  {expandedTest === testName && (
                    <div
                      className="parameterList"
                      style={{ marginLeft: "1rem", marginTop: "4px" }}
                    >
                      {params.map((param) => (
                        <div
                          key={param}
                          className="parameterItem"
                          onClick={() => goToGraph(testName, param)}
                          style={{ cursor: "pointer", padding: "4px" }}
                        >
                          {param}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* {Object.keys(filteredGroupedReports).length > 0 ? (
            <div className="labReportsList">
              {Object.entries(filteredGroupedReports).map(([key, data]) => (
                <div
                  key={key}
                  className="labReportItem"
                  style={{
                    cursor: "pointer",
                    marginBottom: "1rem",
                    border: "1px solid #ddd",
                    padding: "10px",
                  }}
                  onClick={() => goToReportDetail(data)}
                >
                  <p>
                    <strong>{data.testName}</strong>
                    <br />
                    <small>
                      Date: {data.date} {data.time && `| Time: ${data.time}`}
                    </small>
                  </p>
                  {data.reports.map((r) => (
                    <p
                      key={r.id || r.parameter}
                      style={{ margin: "2px 0", fontSize: "0.9rem" }}
                    >
                      {r.parameter}: {r.result} {r.unit || ""}
                    </p>
                  ))}
                </div>
              ))}
            </div>
          ) : (
            <p style={{ textAlign: "center", color: "gray" }}>
              No Lab Reports Found
            </p>
          )} */}
          {/* TESTING */}
          {Object.entries(reportsByTest).map(([testName, dateMap]) => (
            <div
              key={testName}
              className="labReportItem"
              onClick={() =>
                navigate("/reportsdetail", {
                  state: { profile, testName, dateMap },
                })
              }
            >
              <p>
                <strong>{testName}</strong>
                <br />
                <small>Dates: {Object.keys(dateMap).sort().join(", ")}</small>
              </p>
            </div>
          ))}

          {/* Buttons Section */}
          <div style={{ marginTop: "1rem", display: "flex", gap: "10px" }}>
            <button
              onClick={() =>
                navigate("/compare", { state: { baseProfile: profile } })
              }
            >
              Compare Tests
            </button>

            <button
              onClick={() => navigate("/addreport", { state: { profile } })}
            >
              Add Lab Report
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileDetailScreen;
