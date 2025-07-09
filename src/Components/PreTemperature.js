import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import useDatabase from "../Components/useDatabase";

const PreTemperature = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { profile } = location.state || {};
  const { db } = useDatabase();
  const [readings, setReadings] = useState([]);

  useEffect(() => {
    if (!db || !profile) return;

    // calculate age from DOB
    let age = 0;
    if (profile.dob) {
      const dob = new Date(profile.dob);
      const today = new Date();
      age = today.getFullYear() - dob.getFullYear();
      const m = today.getMonth() - dob.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
        age--;
      }
    }

    // normalize gender (in case of future gender‑specific tweaks)
    const gender = profile.gender?.toLowerCase();

    const stmt = db.prepare("SELECT * FROM Vitals WHERE profileName = ?");
    stmt.bind([profile.name]);

    const rows = [];
    while (stmt.step()) {
      const row = stmt.getAsObject();
      if (row.vitalName?.toLowerCase() === "temperature") {
        const value = parseFloat(row.value);
        // universal thresholds—could extend per age/gender if needed:
        const isAbnormal = isNaN(value) || value < 95 || value > 99.5;
        rows.push({ ...row, isAbnormal });
      }
    }
    stmt.free();

    setReadings(rows);
  }, [db, profile]);

  const handleReadingClick = (reading) => {
    navigate("/vitaldetail", {
      state: {
        profile,
        type: "Temperature",
        readings: [
          {
            date: reading.date,
            time: reading.time,
            value: reading.value,
            unit: reading.unit,
          },
        ],
      },
    });
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.heading}>Temperature History</h2>
      <h4 style={styles.subheading}>Profile: {profile?.name}</h4>

      {readings.length > 0 ? (
        <ul style={styles.list}>
          {readings.map((r, idx) => (
            <li
              key={idx}
              style={{
                ...styles.listItem,
                ...(r.isAbnormal ? styles.abnormalItem : {}),
                cursor: "pointer",
              }}
              onClick={() => handleReadingClick(r)}
            >
              <span style={styles.date}>
                {r.date} {r.time}
              </span>
              <span style={styles.value}>
                {r.value} {r.unit}
                {r.isAbnormal && (
                  <span
                    style={{ color: "red", marginLeft: "6px" }}
                    title="Abnormal"
                  >
                    ⚠️
                  </span>
                )}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p style={styles.noData}>No temperature records found.</p>
      )}

      <button
        style={styles.button}
        onClick={() => navigate("/temp", { state: { profile } })}
      >
        Add New Temperature Entry
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
    transition: "background 0.2s ease",
  },
  abnormalItem: {
    borderLeft: "6px solid red",
    backgroundColor: "#ffe5e5",
  },
  date: {
    color: "#666",
    fontSize: "14px",
  },
  value: {
    fontWeight: "bold",
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

export default PreTemperature;
