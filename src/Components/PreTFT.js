import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import useDatabase from "../Components/useDatabase";

const PreTFT = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { profile } = location.state || {};
  const { db } = useDatabase();
  const [entries, setEntries] = useState([]);

  useEffect(() => {
    if (!db || !profile) return;

    try {
      const stmt = db.prepare(
        `SELECT parameter, result AS value, unit, date, time, minValue, maxValue
         FROM LabReports
         WHERE profileName = ? AND testName = 'TFT'`
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
          ([param, val]) =>
            isNaN(val) || val < e.min[param] || val > e.max[param]
        );
        return { ...e, isAbnormal };
      });

      setEntries(list);
    } catch (error) {
      console.error("Error fetching TFT entries:", error);
    }
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
        type: "TFT",
        readings,
      },
    });
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.heading}>Thyroid Function Test History</h2>
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
              <span style={styles.date}>
                {e.date} {e.time}
              </span>
              <span style={styles.summary}>
                T3: {e.values["T3"]} {e.units["T3"]} &nbsp;| T4:{" "}
                {e.values["T4"]} {e.units["T4"]} &nbsp;| TSH: {e.values["TSH"]}{" "}
                {e.units["TSH"]}
                {e.isAbnormal && (
                  <span style={styles.icon} title="Abnormal">
                    {" "}
                    ⚠️
                  </span>
                )}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p style={styles.noData}>No TFT records found.</p>
      )}

      <button
        style={styles.button}
        onClick={() => navigate("/thyroid", { state: { profile } })}
      >
        Add New TFT Entry
      </button>
    </div>
  );
};

const styles = {
  container: {
    padding: "40px 20px",
    backgroundColor: "#f0f2f5",
    minHeight: "100vh",
    fontFamily: "'Segoe UI', sans-serif",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  heading: {
    fontSize: "28px",
    fontWeight: "bold",
    color: "#333",
    marginBottom: "10px",
  },
  subheading: {
    fontSize: "18px",
    color: "#555",
    marginBottom: "20px",
  },
  list: {
    width: "100%",
    maxWidth: "500px",
    listStyle: "none",
    padding: 0,
    marginBottom: "30px",
  },
  listItem: {
    background: "#ffffff",
    borderRadius: "8px",
    padding: "15px",
    marginBottom: "10px",
    boxShadow: "0 4px 6px rgba(0,0,0,0.05)",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    fontSize: "16px",
    color: "#333",
    transition: "background 0.3s ease",
    cursor: "pointer",
  },
  abnormalItem: {
    borderLeft: "6px solid red",
    backgroundColor: "#ffe5e5",
  },
  date: {
    color: "#666",
    fontSize: "14px",
  },
  summary: {
    fontWeight: "bold",
    display: "flex",
    alignItems: "center",
  },
  icon: {
    marginLeft: "8px",
  },
  noData: {
    color: "gray",
    fontStyle: "italic",
    marginBottom: "20px",
  },
  button: {
    background: "#1976d2",
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

export default PreTFT;
