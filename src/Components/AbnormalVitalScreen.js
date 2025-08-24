// // src/screens/AbnormalVitalsScreen.js
// import React, { useState, useEffect } from "react";
// import { useLocation } from "react-router-dom";
// import "../CSS/AbnormalVitalScreen.css";
// import useDatabase from "../Components/useDatabase";
// import {
//   LineChart,
//   Line,
//   XAxis,
//   YAxis,
//   CartesianGrid,
//   Tooltip,
//   ResponsiveContainer,
// } from "recharts";

// export default function AbnormalVitalScreen() {
//   const { state } = useLocation();
//   const { profile } = state || {};
//   const { db } = useDatabase();

//   const [searchName, setSearchName] = useState("");
//   const [rangeOption, setRangeOption] = useState("5m");
//   const [fromDate, setFromDate] = useState("");
//   const [toDate, setToDate] = useState("");
//   const [loaded, setLoaded] = useState(false);
//   const [abnormalVitals, setAbnormalVitals] = useState([]);

//   const defaultVitals = [
//     "Temperature",
//     "HeartRate",
//     "BreathingRate",
//     "BloodPressure",
//   ];
//   const formatDate = (d) => d.toISOString().split("T")[0];
//   const today = formatDate(new Date());

//   // initialize date filters
//   useEffect(() => {
//     setToDate(today);
//     adjustFromDate(rangeOption, today);
//   }, [rangeOption]);

//   const adjustFromDate = (opt, currTo) => {
//     const dt = new Date(currTo);
//     if (opt === "1m") dt.setMonth(dt.getMonth() - 1);
//     else if (opt === "5m") dt.setMonth(dt.getMonth() - 5);
//     setFromDate(formatDate(dt));
//   };

//   // reload when db/profile or dates change
//   useEffect(() => {
//     if (db && profile) loadAbnormals();
//   }, [db, profile, fromDate, toDate, searchName]);

//   const loadAbnormals = () => {
//     if (!db || !profile) return;
//     const vitals = searchName.trim() ? [searchName.trim()] : defaultVitals;
//     const results = [];

//     vitals.forEach((vName) => {
//       // 1) Pull all records in range
//       const stmt = db.prepare(`
//         SELECT id, vitalName, value, unit, date, time, minValue, maxValue
//           FROM Vitals
//          WHERE profileName = ?
//            AND vitalName   = ?
//            AND date BETWEEN ? AND ?
//          ORDER BY date DESC, time DESC
//       `);
//       stmt.bind([profile.name, vName, fromDate, toDate]);

//       const recs = [];
//       while (stmt.step()) {
//         recs.push(stmt.getAsObject());
//       }
//       stmt.free();

//       // 2) Filter in JS
//       let abnormal = [];
//       if (vName === "BloodPressure") {
//         abnormal = recs.filter((r) => {
//           const [sys, dia] = r.value.split("/").map(Number);
//           const [minSys, minDia] = String(r.minValue).split("/").map(Number);
//           const [maxSys, maxDia] = String(r.maxValue).split("/").map(Number);
//           return sys < minSys || sys > maxSys || dia < minDia || dia > maxDia;
//         });
//       } else {
//         abnormal = recs.filter((r) => {
//           const val = parseFloat(r.value);
//           const min = parseFloat(r.minValue);
//           const max = parseFloat(r.maxValue);
//           return !isNaN(val) && (val < min || val > max);
//         });
//       }

//       if (abnormal.length) {
//         results.push({ vitalName: vName, records: abnormal });
//       }
//     });

//     setAbnormalVitals(results);
//     setLoaded(true);
//   };

//   if (!profile) {
//     return (
//       <div className="no-profile">
//         <h2>No profile selected</h2>
//         <p>Please select a profile to view abnormal vitals.</p>
//       </div>
//     );
//   }

//   return (
//     <div className="abnormal-vitals-container">
//       <h2>Abnormal Vitals for {profile.name}</h2>

//       {/* Filters */}
//       <div className="filter-container">
//         <div className="filter-group">
//           <label>Vital Name:</label>
//           <input
//             type="text"
//             placeholder="e.g. Temperature"
//             value={searchName}
//             onChange={(e) => setSearchName(e.target.value)}
//           />
//         </div>
//         <div className="filter-group">
//           <label>Date Range:</label>
//           <select
//             value={rangeOption}
//             onChange={(e) => setRangeOption(e.target.value)}
//           >
//             <option value="1m">Last 1 Month</option>
//             <option value="5m">Last 5 Months</option>
//             <option value="custom">Custom</option>
//           </select>
//         </div>
//         <div className="filter-group">
//           <label>From:</label>
//           <input
//             type="date"
//             value={fromDate}
//             onChange={(e) => setFromDate(e.target.value)}
//             disabled={rangeOption !== "custom"}
//           />
//         </div>
//         <div className="filter-group">
//           <label>To:</label>
//           <input
//             type="date"
//             value={toDate}
//             onChange={(e) => {
//               setToDate(e.target.value);
//               if (rangeOption !== "custom")
//                 adjustFromDate(rangeOption, e.target.value);
//             }}
//             disabled={rangeOption !== "custom"}
//           />
//         </div>
//         <button onClick={loadAbnormals}>
//           {loaded ? "Refresh" : "Show Abnormal"}
//         </button>
//       </div>

//       {/* No results message */}
//       {loaded && abnormalVitals.length === 0 && (
//         <p className="no-results">No abnormal vital readings found.</p>
//       )}

//       {/* Results */}
//       {abnormalVitals.map(({ vitalName, records }) => (
//         <section key={vitalName} className="vital-section">
//           <h3>{vitalName}</h3>

//           {/* Chart */}
//           <div className="chart-wrapper">
//             <ResponsiveContainer width="100%" height={200}>
//               {vitalName === "BloodPressure" ? (
//                 (() => {
//                   // build an array: [{dateTime, systolic, diastolic}, …]
//                   const bpData = [...records]
//                     .sort(
//                       (a, b) =>
//                         new Date(`${a.date}T${a.time}`) -
//                         new Date(`${b.date}T${b.time}`)
//                     )
//                     .map((r) => {
//                       const [systolic, diastolic] = r.value
//                         .split("/")
//                         .map(Number);
//                       return {
//                         dateTime: new Date(`${r.date}T${r.time}`).getTime(),
//                         systolic,
//                         diastolic,
//                       };
//                     });

//                   return (
//                     <LineChart data={bpData}>
//                       <CartesianGrid strokeDasharray="3 3" />
//                       <XAxis
//                         dataKey="dateTime"
//                         tickFormatter={(ts) =>
//                           new Date(ts).toLocaleDateString()
//                         }
//                       />
//                       <YAxis domain={["auto", "auto"]} />
//                       <Tooltip
//                         labelFormatter={(ts) => new Date(ts).toLocaleString()}
//                       />
//                       <Line
//                         dataKey="systolic"
//                         dot={{ r: 3 }}
//                         stroke="#d32f2f"
//                       />
//                       <Line
//                         dataKey="diastolic"
//                         dot={{ r: 3 }}
//                         stroke="#1976d2"
//                       />
//                     </LineChart>
//                   );
//                 })()
//               ) : (
//                 <LineChart
//                   data={[...records]
//                     .sort(
//                       (a, b) =>
//                         new Date(`${a.date}T${a.time}`) -
//                         new Date(`${b.date}T${b.time}`)
//                     )
//                     .map((r) => ({
//                       dateTime: new Date(`${r.date}T${r.time}`).getTime(),
//                       value: parseFloat(r.value),
//                     }))}
//                 >
//                   <CartesianGrid strokeDasharray="3 3" />
//                   <XAxis
//                     dataKey="dateTime"
//                     tickFormatter={(ts) => new Date(ts).toLocaleDateString()}
//                   />
//                   <YAxis domain={["auto", "auto"]} />
//                   <Tooltip
//                     labelFormatter={(ts) => new Date(ts).toLocaleString()}
//                   />
//                   <Line dataKey="value" dot={{ r: 3 }} />
//                 </LineChart>
//               )}
//             </ResponsiveContainer>
//           </div>

//           {/* Table */}
//           <table className="vital-table">
//             <thead>
//               <tr>
//                 <th>Date</th>
//                 <th>Time</th>
//                 <th>Value ({records[0].unit})</th>
//                 <th>Normal Range</th>
//               </tr>
//             </thead>
//             <tbody>
//               {records.map((r) => (
//                 <tr key={r.id}>
//                   <td>{r.date}</td>
//                   <td>{r.time}</td>
//                   <td className="abnormal">{r.value}</td>
//                   <td>
//                     {r.minValue}–{r.maxValue}
//                   </td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         </section>
//       ))}
//     </div>
//   );
// }

// 2 ABNORMAL VALUE SHOW ACCORDING TO AGE AND GENDER
// src/screens/AbnormalVitalsScreen.js
// src/screens/AbnormalVitalsScreen.js
// src/screens/AbnormalVitalsScreen.js
import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import useDatabase from "../Components/useDatabase";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import "../CSS/AbnormalVitalScreen.css";

export default function AbnormalVitalsScreen() {
  const { state } = useLocation();
  const profile = state?.profile;
  const { db } = useDatabase();

  const [searchName, setSearchName] = useState("");
  const [rangeOption, setRangeOption] = useState("5m");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [abnormalVitals, setAbnormalVitals] = useState([]);

  const defaultVitals = [
    "Temperature",
    "HeartRate",
    "BreathingRate",
    "BloodPressure",
  ];
  const formatDate = (d) => d.toISOString().split("T")[0];
  const today = formatDate(new Date());

  // Set initial date range
  useEffect(() => {
    setToDate(today);
    const dt = new Date(today);
    if (rangeOption === "1m") dt.setMonth(dt.getMonth() - 1);
    else if (rangeOption === "5m") dt.setMonth(dt.getMonth() - 5);
    if (rangeOption !== "custom") setFromDate(formatDate(dt));
  }, [rangeOption, today]);

  // Load and filter abnormals
  const loadAbnormals = () => {
    if (!db || !profile) return;
    const vitalsToCheck = searchName.trim()
      ? [searchName.trim()]
      : defaultVitals;
    const results = [];

    vitalsToCheck.forEach((vName) => {
      const stmt = db.prepare(
        `SELECT id, vitalName, value, unit, date, time, minValue, maxValue
           FROM Vitals
          WHERE profileName = ?
            AND vitalName = ?
            AND date BETWEEN ? AND ?
          ORDER BY date DESC, time DESC`
      );
      stmt.bind([profile.name, vName, fromDate, toDate]);
      const recs = [];
      while (stmt.step()) recs.push(stmt.getAsObject());
      stmt.free();

      const abnormal = recs.filter((r) => {
        if (vName === "BloodPressure") {
          const [sys, dia] = r.value.split("/").map(Number);
          const [minSys, minDia] = String(r.minValue).split("/").map(Number);
          const [maxSys, maxDia] = String(r.maxValue).split("/").map(Number);
          return sys < minSys || sys > maxSys || dia < minDia || dia > maxDia;
        }
        const val = parseFloat(r.value);
        const min = parseFloat(r.minValue);
        const max = parseFloat(r.maxValue);
        return !isNaN(val) && (val < min || val > max);
      });

      if (abnormal.length) {
        results.push({ vitalName: vName, records: abnormal });
      }
    });

    setAbnormalVitals(results);
    setLoaded(true);
  };

  useEffect(() => {
    loadAbnormals();
  }, [db, profile, fromDate, toDate, searchName]);

  if (!profile) {
    return (
      <div className="no-profile">
        <h2>No profile selected</h2>
        <p>Please select a profile.</p>
      </div>
    );
  }

  return (
    <div className="abnormal-vitals-container">
      <h2>Abnormal Vitals for {profile.name}</h2>

      {/* Filters */}
      <div className="filter-container">
        <div className="filter-group">
          <label>Vital Name:</label>
          <input
            type="text"
            placeholder="e.g. BloodPressure"
            value={searchName}
            onChange={(e) => setSearchName(e.target.value)}
          />
        </div>
        <div className="filter-group">
          <label>Date Range:</label>
          <select
            value={rangeOption}
            onChange={(e) => setRangeOption(e.target.value)}
          >
            <option value="1m">Last 1 Month</option>
            <option value="5m">Last 5 Months</option>
            <option value="custom">Custom</option>
          </select>
        </div>
        <div className="filter-group">
          <label>From:</label>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            disabled={rangeOption !== "custom"}
          />
        </div>
        <div className="filter-group">
          <label>To:</label>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            disabled={rangeOption !== "custom"}
          />
        </div>
        <button onClick={loadAbnormals}>
          {loaded ? "Refresh" : "Show Abnormal"}
        </button>
      </div>

      {/* No results */}
      {loaded && abnormalVitals.length === 0 && (
        <p className="no-results">No abnormal vital readings found.</p>
      )}

      {/* Results */}
      {abnormalVitals.map(({ vitalName, records }) => (
        <section key={vitalName} className="vital-section">
          <h3>{vitalName}</h3>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height={200}>
              {vitalName === "BloodPressure" ? (
                (() => {
                  const bpData = [...records]
                    .sort(
                      (a, b) =>
                        new Date(`${a.date}T${a.time}`) -
                        new Date(`${b.date}T${b.time}`)
                    )
                    .map((r) => {
                      const [sys, dia] = r.value.split("/").map(Number);
                      return {
                        dateTime: new Date(`${r.date}T${r.time}`).getTime(),
                        systolic: sys,
                        diastolic: dia,
                      };
                    });

                  return (
                    <LineChart data={bpData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="dateTime"
                        tickFormatter={(ts) =>
                          new Date(ts).toLocaleDateString()
                        }
                      />
                      <YAxis domain={["auto", "auto"]} />
                      <Tooltip
                        labelFormatter={(ts) => new Date(ts).toLocaleString()}
                      />
                      <ReferenceLine stroke="red" strokeDasharray="3 3" />
                      <Line dataKey="systolic" dot={{ r: 3 }} />
                      <Line dataKey="diastolic" dot={{ r: 3 }} />
                    </LineChart>
                  );
                })()
              ) : (
                <LineChart
                  data={[...records]
                    .sort(
                      (a, b) =>
                        new Date(`${a.date}T${a.time}`) -
                        new Date(`${b.date}T${b.time}`)
                    )
                    .map((r) => ({
                      dateTime: new Date(`${r.date}T${r.time}`).getTime(),
                      value: parseFloat(r.value),
                    }))}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="dateTime"
                    tickFormatter={(ts) => new Date(ts).toLocaleDateString()}
                  />
                  <YAxis domain={["auto", "auto"]} />
                  <Tooltip
                    labelFormatter={(ts) => new Date(ts).toLocaleString()}
                  />
                  <Line dataKey="value" dot={{ r: 3 }} />
                </LineChart>
              )}
            </ResponsiveContainer>
          </div>

          <table className="vital-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Time</th>
                <th>Value ({records[0].unit})</th>
                <th>Normal Range</th>
              </tr>
            </thead>
            <tbody>
              {records.map((r) => (
                <tr key={r.id}>
                  <td>{r.date}</td>
                  <td>{r.time}</td>
                  <td className="abnormal">{r.value}</td>
                  <td>
                    {r.minValue}–{r.maxValue}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ))}
    </div>
  );
}
