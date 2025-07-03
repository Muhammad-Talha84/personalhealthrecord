import React, { useEffect, useState, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "../CSS/ProfileDetail.css";

import useDatabase from "../Components/useDatabase";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

const ProfileDetailScreen = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { profile } = location.state || {};
  const { db } = useDatabase();

  // Raw data
  const [vitals, setVitals] = useState([]);
  const [labReports, setLabReports] = useState([]);

  // LabReports filters
  const [filterDate, setFilterDate] = useState("");
  const [showMostRecent, setShowMostRecent] = useState(false);

  // Vitals filters
  const [filterDateVitals, setFilterDateVitals] = useState("");
  const [showMostRecentVitals, setShowMostRecentVitals] = useState(false);

  // Selected vital for chart / navigation
  const [selectedVitalType, setSelectedVitalType] = useState(null);

  // Fetch Vitals from DB
  useEffect(() => {
    if (!db || !profile) return;
    const stmt = db.prepare("SELECT * FROM Vitals WHERE profileName = ?");
    stmt.bind([profile.name]);
    const rows = [];
    while (stmt.step()) rows.push(stmt.getAsObject());
    stmt.free();
    setVitals(rows);
  }, [db, profile]);

  // Fetch LabReports from DB
  useEffect(() => {
    if (!db || !profile) return;
    const stmt = db.prepare("SELECT * FROM LabReports WHERE profileName = ?");
    stmt.bind([profile.name]);
    const rows = [];
    while (stmt.step()) rows.push(stmt.getAsObject());
    stmt.free();
    setLabReports(rows);
  }, [db, profile]);

  // Group LabReports by testName + date
  const groupedReports = useMemo(() => {
    return labReports.reduce((acc, report) => {
      const key = `${report.testName}-${report.date}`;
      if (!acc[key]) {
        acc[key] = {
          testName: report.testName,
          date: report.date,
          time: report.time,
          reports: [],
        };
      }
      acc[key].reports.push(report);
      return acc;
    }, {});
  }, [labReports]);

  // Apply LabReports filters
  const filteredGroupedReports = useMemo(() => {
    const entries = Object.entries(groupedReports);
    if (filterDate) {
      return Object.fromEntries(
        entries.filter(([, grp]) => grp.date === filterDate)
      );
    }
    if (showMostRecent) {
      const dates = entries.map(([, grp]) => grp.date);
      if (!dates.length) return {};
      const latest = dates.sort((a, b) => new Date(b) - new Date(a))[0];
      return Object.fromEntries(
        entries.filter(([, grp]) => grp.date === latest)
      );
    }
    return groupedReports;
  }, [groupedReports, filterDate, showMostRecent]);

  // Apply Vitals filters
  const filteredVitals = useMemo(() => {
    if (filterDateVitals) {
      return vitals.filter((v) => v.date === filterDateVitals);
    }
    if (showMostRecentVitals) {
      if (!vitals.length) return [];
      const latest = vitals
        .map((v) => v.date)
        .sort((a, b) => new Date(b) - new Date(a))[0];
      return vitals.filter((v) => v.date === latest);
    }
    return vitals;
  }, [vitals, filterDateVitals, showMostRecentVitals]);

  // Prepare data for the line chart of the selected vital
  const chartData = useMemo(() => {
    if (!selectedVitalType) return [];
    return filteredVitals
      .filter((v) => v.vitalName === selectedVitalType)
      .map((v) => ({
        datetime: `${v.date} ${v.time}`,
        value: Number(v.value),
      }))
      .sort(
        (a, b) =>
          new Date(a.datetime).getTime() - new Date(b.datetime).getTime()
      );
  }, [filteredVitals, selectedVitalType]);

  // Navigate to Lab Report detail
  const goToReportDetail = (grp) => {
    navigate("/reportsdetail", { state: { profile, report: grp, labReports } });
  };

  // Navigate to Vital detail or BP screen
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
      {/* Profile Header */}
      <div className="details">
        <h1 style={{ textAlign: "center" }}>PERSONAL HEALTH RECORD</h1>
        <h2>Profile Details</h2>
        {profile ? (
          <>
            <div className="profile-grid">
              {[
                ["Name", profile.name],
                ["Relation", profile.relation],
                ["Gender", profile.gender],
                ["DOB", profile.dob],
                ["Blood Group", profile.bloodGroup],
                ["Height", profile.height],
                ["Weight", profile.weight],
              ].map(([label, val]) => (
                <div key={label} className="profile-item">
                  <strong>{label}:</strong> {val}
                </div>
              ))}
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
          {/* Vitals Filters */}
          <div className="vitalsFilter" style={{ marginBottom: "1rem" }}>
            <input
              type="date"
              value={filterDateVitals}
              onChange={(e) => {
                setFilterDateVitals(e.target.value);
                setShowMostRecentVitals(false);
                setSelectedVitalType(null);
              }}
            />
            <button
              onClick={() => {
                setShowMostRecentVitals(false);
                setSelectedVitalType(null);
              }}
            >
              Search
            </button>
            <button
              onClick={() => {
                setShowMostRecentVitals(true);
                setFilterDateVitals("");
                setSelectedVitalType(null);
              }}
            >
              Most Recent
            </button>
            <button
              onClick={() => {
                setFilterDateVitals("");
                setShowMostRecentVitals(false);
                setSelectedVitalType(null);
              }}
            >
              Show All
            </button>
          </div>

          {/* Vitals List */}
          {filteredVitals.length > 0 ? (
            <div className="vitalsList">
              {filteredVitals.map((v, idx) => (
                <div
                  key={idx}
                  className={`vitalItem ${
                    selectedVitalType === v.vitalName ? "selected" : ""
                  }`}
                  onClick={() => {
                    setSelectedVitalType(v.vitalName);
                    handleViewVital(v);
                  }}
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
              No Vitals Found
            </p>
          )}

          {/* Vitals Chart */}
          {selectedVitalType && chartData.length > 0 && (
            <div
              className="vitalsChart"
              style={{ height: 300, marginTop: "2rem" }}
            >
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="datetime" />
                  <YAxis />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="value"
                    name={selectedVitalType}
                    stroke="#8884d8"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Vitals Actions */}
          <div style={{ marginTop: "1rem", display: "flex", gap: "10px" }}>
            <button
              onClick={() => navigate("/addvital", { state: { profile } })}
            >
              Add Vital
            </button>
            <button
              onClick={() =>
                navigate("/compvital", { state: { baseProfile: profile } })
              }
            >
              Compare Vitals with Family
            </button>
            <button
              onClick={() => navigate("/abnorVital", { state: { profile } })}
            >
              View Abnormal Vitals
            </button>
            <button
              onClick={() => navigate("/allvital", { state: { profile } })}
            >
              View All Vitals
            </button>
          </div>
        </div>

        {/* Lab Reports Section */}
        <div className="labReportsSection">
          <h3>Lab Reports</h3>

          {/* Lab Reports Filters */}
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

          {/* Lab Reports List */}
          {Object.keys(filteredGroupedReports).length > 0 ? (
            <div className="labReportsList">
              {Object.entries(filteredGroupedReports).map(([key, grp]) => (
                <div
                  key={key}
                  className="labReportItem"
                  style={{
                    cursor: "pointer",
                    marginBottom: "1rem",
                    border: "1px solid #ddd",
                    padding: "10px",
                  }}
                  onClick={() => goToReportDetail(grp)}
                >
                  <p>
                    <strong>{grp.testName}</strong>
                    <br />
                    <small>
                      Date: {grp.date} {grp.time && `| Time: ${grp.time}`}
                    </small>
                  </p>
                  {grp.reports.map((r) => (
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
          )}

          {/* Lab Reports Actions */}
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
