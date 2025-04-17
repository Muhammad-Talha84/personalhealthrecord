import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "../CSS/ProfileDetail.css";
import { AiOutlineArrowLeft } from "react-icons/ai";

import useDatabase from "../Components/useDatabase";
import {
  CartesianGrid,
  Line,
  LineChart,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

const ProfileDetailScreen = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { profile } = location.state || {};
  const { db } = useDatabase();

  const [vitals, setVitals] = useState([]);
  const [labReports, setLabReports] = useState([]);

  // For charting
  const [selectedVitalType, setSelectedVitalType] = useState(null);
  const [chartData, setChartData] = useState([]);

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

  // New: navigate to the VitalDetailScreen
  const handleViewVital = (vital) => {
    // Build the readings array for this type:
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
      // Send to your BloodPressure screen
      navigate("/bp", {
        state: { profile, data: readings },
      });
    } else {
      // Generic vitals go to VitalDetail
      navigate("/vitaldetail", {
        state: { profile, type: vital.vitalName, readings },
      });
    }
  };

  // Navigate to detail view
  const goToReportDetail = (report) => {
    navigate("/reportsdetail", { state: { profile, report } });
  };
  // Group labReports by testName
  // Group labReports by testName and date (or date and time if needed)
  const groupedReports = labReports.reduce((acc, report) => {
    // Create a composite key using testName and date.
    // You can add time as well if needed: `${report.testName}-${report.date}-${report.time}`
    const key = `${report.testName}-${report.date}`;
    if (!acc[key]) {
      acc[key] = {
        testName: report.testName,
        date: report.date,
        time: report.time, // You might only need one of these if all entries for that key share the same time
        reports: [],
      };
    }
    acc[key].reports.push(report);
    return acc;
  }, {});

  return (
    <div className="profiledetailContainer">
      {/* Profile Details */}
      <div className="details">
        <h2>Profile Details</h2>
        {profile ? (
          <>
            <p>
              <strong>Name:</strong> {profile.name}
            </p>
            <p>
              <strong>Relation:</strong> {profile.relation}
            </p>
            <p>
              <strong>Gender:</strong> {profile.gender}
            </p>
            <p>
              <strong>DOB:</strong> {profile.dob}
            </p>
            <p>
              <strong>Blood Group:</strong> {profile.bloodGroup}
            </p>
            <p>
              <strong>Height:</strong> {profile.height}
            </p>
            <p>
              <strong>Weight:</strong> {profile.weight}
            </p>
          </>
        ) : (
          <p>No Profile Selected</p>
        )}
      </div>

      {/* Vitals & Lab Reports */}
      <div className="dataSections">
        {/* Vitals */}
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

          {/* Dynamic Vital Chart */}
          {selectedVitalType && chartData.length > 0 && (
            <div className="vitalChart">
              <h3>{selectedVitalType} Trend</h3>
              <LineChart width={600} height={300} data={chartData}>
                <XAxis
                  dataKey="dateTime"
                  tick={{ fontSize: 10 }}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis
                  label={{
                    value: selectedVitalType,
                    angle: -90,
                    position: "insideLeft",
                  }}
                />
                <CartesianGrid stroke="#eee" strokeDasharray="5 5" />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#8884d8"
                  dot={{ r: 3 }}
                />
              </LineChart>
            </div>
          )}
        </div>

        {/* Lab Reports */}
        <div className="labReportsSection">
          <h3>Lab Reports</h3>
          {Object.keys(groupedReports).length > 0 ? (
            <div className="labReportsList">
              {Object.entries(groupedReports).map(([groupKey, groupData]) => (
                <div
                  key={groupKey}
                  className="labReportItem"
                  style={{
                    cursor: "pointer",
                    marginBottom: "1rem",
                    border: "1px solid #ddd",
                    padding: "10px",
                  }}
                  onClick={() => goToReportDetail(groupData)}
                >
                  <p>
                    <strong>{groupData.testName}</strong> <br />
                    <small>
                      Date: {groupData.date}{" "}
                      {groupData.time && `| Time: ${groupData.time}`}
                    </small>
                  </p>
                  {groupData.reports.map((report) => (
                    <p
                      key={report.id || report.parameter}
                      style={{ margin: "2px 0", fontSize: "0.9rem" }}
                    >
                      {report.parameter}: {report.result} {report.unit || ""}
                    </p>
                  ))}
                </div>
              ))}
            </div>
          ) : (
            <p style={{ textAlign: "center", color: "gray" }}>
              No Lab Reports Added
            </p>
          )}

          <button
            onClick={() => navigate("/addreport", { state: { profile } })}
          >
            Add Lab Report
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfileDetailScreen;
