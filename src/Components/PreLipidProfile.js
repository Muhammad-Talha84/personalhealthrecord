import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import useDatabase from "../Components/useDatabase";

const PreLipidProfile = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { profile } = location.state || {};
  const { db } = useDatabase();
  const [entries, setEntries] = useState([]);

  useEffect(() => {
    if (!db || !profile) return;

    const stmt = db.prepare(
      `SELECT parameter, result AS value, unit, date, time, minValue, maxValue
       FROM LabReports
       WHERE profileName = ? AND testName = 'LipidProfile'`
    );
    stmt.bind([profile.name]);

    const raw = [];
    while (stmt.step()) {
      raw.push(stmt.getAsObject());
    }
    stmt.free();

    const grouped = raw.reduce((acc, r) => {
      const key = `${r.date} ${r.time}`;
      if (!acc[key]) {
        acc[key] = {
          date: r.date,
          time: r.time,
          values: {},
          units: {},
          min: {},
          max: {},
        };
      }
      acc[key].values[r.parameter] = parseFloat(r.value);
      acc[key].units[r.parameter] = r.unit;
      acc[key].min[r.parameter] = parseFloat(r.minValue);
      acc[key].max[r.parameter] = parseFloat(r.maxValue);
      return acc;
    }, {});

    const list = Object.values(grouped).map((e) => {
      const isAbnormal = Object.entries(e.values).some(
        ([param, val]) => isNaN(val) || val < e.min[param] || val > e.max[param]
      );
      return { ...e, isAbnormal };
    });

    setEntries(list);
  }, [db, profile]);

  const handleClick = (entry) => {
    const readings = Object.entries(entry.values).map(([parameter, value]) => ({
      parameter,
      value,
      unit: entry.units[parameter],
      date: entry.date,
      time: entry.time,
    }));
    navigate("/reportsdetail", {
      state: {
        profile,
        type: "LipidProfile",
        readings,
      },
    });
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.heading}>Lipid Profile Test History</h2>
      <h4 style={styles.subheading}>Profile: {profile?.name}</h4>

      {entries.length > 0 ? (
        <ul style={styles.list}>
          {entries.map((e, idx) => (
            <li
              key={idx}
              style={{
                ...styles.listItem,
                ...(e.isAbnormal ? styles.abnormalItem : {}),
                cursor: "pointer",
              }}
              onClick={() => handleClick(e)}
            >
              <div style={styles.row}>
                <span style={styles.date}>
                  {e.date} {e.time}
                </span>
                <span style={styles.summary}>
                  {Object.entries(e.values)
                    .map(([param, val]) => `${param}: ${val} ${e.units[param]}`)
                    .join("  |  ")}
                </span>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p style={styles.noData}>No Lipid Profile records found.</p>
      )}

      <button
        style={styles.button}
        onClick={() => navigate("/lipid", { state: { profile } })}
      >
        Add New Lipid Profile Entry
      </button>
    </div>
  );
};

const styles = {
  container: {
    padding: "40px 20px",
    backgroundColor: "#ffffff",
    minHeight: "100vh",
    fontFamily: "'Segoe UI', sans-serif",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  heading: {
    fontSize: "28px",
    fontWeight: "bold",
    color: "#1976d2",
    marginBottom: "10px",
  },
  subheading: {
    fontSize: "18px",
    color: "#424242",
    marginBottom: "20px",
  },
  list: {
    width: "100%",
    maxWidth: "600px",
    listStyle: "none",
    padding: 0,
    marginBottom: "30px",
  },
  listItem: {
    background: "#f9f9f9",
    borderRadius: "8px",
    padding: "15px",
    marginBottom: "10px",
    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
    transition: "background 0.2s ease",
  },
  row: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  date: {
    color: "#616161",
    fontSize: "14px",
    fontWeight: "500",
  },
  summary: {
    fontSize: "16px",
    color: "#212121",
    fontWeight: "500",
  },
  abnormalItem: {
    borderLeft: "6px solid #c62828",
    backgroundColor: "#ffebee",
  },
  noData: {
    color: "#9e9e9e",
    fontStyle: "italic",
    marginBottom: "20px",
  },
  button: {
    background: "#388e3c",
    color: "white",
    padding: "12px 20px",
    border: "none",
    borderRadius: "8px",
    fontSize: "16px",
    fontWeight: "500",
    cursor: "pointer",
    transition: "background 0.3s ease",
  },
};

export default PreLipidProfile;
