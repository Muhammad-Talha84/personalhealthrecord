import React, { useState, useEffect } from "react";
import useDatabase from "../Components/useDatabase";
import { useLocation, useNavigate } from "react-router-dom";

// Define available tests and their parameters
const testParameters = {
  RFT: ["Urea", "Creatinine", "Uric Acid"],
  LFT: [
    "ALT",
    "AST",
    "Alkaline Phosphatase",
    "Total Bilirubin",
    "Direct Bilirubin",
    "Indirect Bilirubin",
  ],
  "Blood CP": ["Hemoglobin", "RBC Count", "WBC Count", "Platelets"],
  "Thyroid Function Test": ["T3", "T4", "TSH"],
  "LIPID PROFILE": ["Total Cholesterol", "HDL", "LDL", "Triglycerides"],
  Electrolytes: ["Sodium", "Potassium", "Chloride", "Bicarbonate"],
};

const AddReportForm = () => {
  const { db, saveDatabase } = useDatabase();
  const location = useLocation();
  const navigate = useNavigate();
  const profile = location.state?.profile || {};

  const [selectedTest, setSelectedTest] = useState("");
  const [results, setResults] = useState({});
  const [unit, setUnit] = useState("");
  const [locationInput, setLocationInput] = useState("");
  const [dateTime, setDateTime] = useState({ date: "", time: "" });

  // Initialize date/time to now using vanilla JS
  useEffect(() => {
    const now = new Date();
    const iso = now.toISOString();
    setDateTime({
      date: iso.slice(0, 10), // YYYY-MM-DD
      time: iso.slice(11, 16), // HH:MM
    });
  }, []);

  // Reset results when test changes
  useEffect(() => {
    if (selectedTest) {
      const params = testParameters[selectedTest] || [];
      const initial = {};
      params.forEach((p) => {
        initial[p] = "";
      });
      setResults(initial);
    } else {
      setResults({});
    }
  }, [selectedTest]);

  const handleResultChange = (param, value) => {
    setResults((prev) => ({ ...prev, [param]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedTest) {
      alert("Please select a test");
      return;
    }
    if (!db) {
      alert("Database not ready");
      return;
    }
    try {
      db.exec("BEGIN TRANSACTION;");
      const stmt = db.prepare(`INSERT INTO LabReports
        (profileName, testName, parameter, result, unit, referenceValue, date, time, minValue, maxValue, location)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
      `);
      Object.entries(results).forEach(([param, res]) => {
        stmt.run([
          profile.name || profile.profileName || "Unknown",
          selectedTest,
          param,
          res,
          unit,
          "", // referenceValue placeholder
          dateTime.date,
          dateTime.time,
          null,
          null,
          locationInput,
        ]);
      });
      stmt.free();
      db.exec("COMMIT;");
      saveDatabase();
      alert("Lab report saved successfully!");
      navigate("/reports");
    } catch (err) {
      db.exec("ROLLBACK;");
      console.error(err);
      alert("Error saving report: " + err.message);
    }
  };

  return (
    <div style={{ maxWidth: 600, margin: "0 auto", padding: 24 }}>
      <h2>Add Lab Report</h2>
      <form onSubmit={handleSubmit}>
        <label>
          Select Test:
          <select
            value={selectedTest}
            onChange={(e) => setSelectedTest(e.target.value)}
            required
            style={{ marginLeft: 8 }}
          >
            <option value="">-- Select --</option>
            {Object.keys(testParameters).map((test) => (
              <option key={test} value={test}>
                {test}
              </option>
            ))}
          </select>
        </label>

        {selectedTest && (
          <div style={{ marginTop: 16 }}>
            <h3>Parameters</h3>
            {testParameters[selectedTest].map((param) => (
              <div key={param} style={{ marginBottom: 12 }}>
                <label>
                  {param}:
                  <input
                    type="text"
                    value={results[param]}
                    onChange={(e) => handleResultChange(param, e.target.value)}
                    style={{ marginLeft: 8, width: 120 }}
                    required
                  />
                </label>
              </div>
            ))}

            <div style={{ marginBottom: 12 }}>
              <label>
                Unit:
                <input
                  type="text"
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  style={{ marginLeft: 8, width: 120 }}
                />
              </label>
            </div>

            <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
              <label>
                Date:
                <input
                  type="date"
                  value={dateTime.date}
                  onChange={(e) =>
                    setDateTime((prev) => ({ ...prev, date: e.target.value }))
                  }
                  style={{ marginLeft: 8 }}
                  required
                />
              </label>
              <label>
                Time:
                <input
                  type="time"
                  value={dateTime.time}
                  onChange={(e) =>
                    setDateTime((prev) => ({ ...prev, time: e.target.value }))
                  }
                  style={{ marginLeft: 8 }}
                  required
                />
              </label>
            </div>

            <div style={{ marginBottom: 24 }}>
              <label>
                Location:
                <input
                  type="text"
                  value={locationInput}
                  onChange={(e) => setLocationInput(e.target.value)}
                  style={{ marginLeft: 8, width: 200 }}
                />
              </label>
            </div>

            <button type="submit" style={{ padding: "8px 24px", fontSize: 16 }}>
              Save Report
            </button>
          </div>
        )}
      </form>
    </div>
  );
};

export default AddReportForm;
