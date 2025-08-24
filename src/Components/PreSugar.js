import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import useDatabase from "../Components/useDatabase";

const PreSugar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { profile } = location.state || {};
  const { db } = useDatabase();
  const [glucoseReadings, setGlucoseReadings] = useState([]);

  useEffect(() => {
    if (!db || !profile) return;

    try {
      // Calculate age
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

      const gender = profile.gender?.toLowerCase(); // "male" or "female"

      const stmt = db.prepare("SELECT * FROM Vitals WHERE profileName = ?");
      stmt.bind([profile.name]);

      const rows = [];
      while (stmt.step()) {
        const row = stmt.getAsObject();
        if (row.vitalName?.toLowerCase() === "glucose") {
          const value = parseFloat(row.value);
          const type = row.type?.toLowerCase(); // "fasting" or "regular"

          // Determine abnormal range based on type, gender, age
          let thresholdHigh = 0;
          let thresholdLow = 0;

          if (type === "fasting") {
            if (gender === "female" && age >= 50) {
              thresholdLow = 70;
              thresholdHigh = 110;
            } else if (gender === "male" && age < 40) {
              thresholdLow = 70;
              thresholdHigh = 100;
            } else {
              thresholdLow = 70;
              thresholdHigh = 105;
            }
          } else {
            // regular (non-fasting)
            if (gender === "female" && age >= 50) {
              thresholdLow = 90;
              thresholdHigh = 140;
            } else if (gender === "male" && age < 40) {
              thresholdLow = 90;
              thresholdHigh = 130;
            } else {
              thresholdLow = 90;
              thresholdHigh = 135;
            }
          }

          const isAbnormal =
            isNaN(value) || value < thresholdLow || value > thresholdHigh;

          rows.push({ ...row, isAbnormal });
        }
      }

      stmt.free();
      setGlucoseReadings(rows);
    } catch (error) {
      console.error("Error fetching glucose readings:", error);
    }
  }, [db, profile]);

  const handleReadingClick = (reading) => {
    navigate("/sugar", {
      state: {
        profile,
        type: "Glucose",
        readings: [
          {
            date: reading.date,
            time: reading.time,
            value: reading.value,
            unit: reading.unit,
            type: reading.type,
          },
        ],
      },
    });
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.heading}>Blood Glucose History</h2>
      <h4 style={styles.subheading}>Profile: {profile?.name}</h4>

      {glucoseReadings.length > 0 ? (
        <ul style={styles.list}>
          {glucoseReadings.map((r, idx) => (
            <li
              key={idx}
              onClick={() => handleReadingClick(r)}
              style={{
                ...styles.listItem,
                ...(r.isAbnormal ? styles.abnormalItem : {}),
              }}
            >
              <span style={styles.date}>
                {r.date} {r.time} ({r.type})
              </span>
              <span style={styles.value}>
                {r.value} {r.unit}{" "}
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
        <p style={styles.noData}>No blood glucose records found.</p>
      )}

      <button
        style={styles.button}
        onClick={() => navigate("/sugar", { state: { profile } })}
      >
        Add New Glucose Entry
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

export default PreSugar;
