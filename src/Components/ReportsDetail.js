// // src/Components/ReportsDetail.js
// import React, { useMemo, useState } from "react";
// import { useLocation } from "react-router-dom";
// import {
//   ResponsiveContainer,
//   LineChart,
//   Line,
//   XAxis,
//   YAxis,
//   CartesianGrid,
//   Tooltip,
//   Legend,
// } from "recharts";

// export default function ReportsDetail() {
//   const { state } = useLocation();
//   const profile = state?.profile;
//   const report = state?.report;
//   const labReports = state?.labReports || [];

//   // --- HOOKS MUST RUN FIRST ---
//   const testName = report?.testName || "";

//   // 1) All entries for this test
//   const allThisTest = useMemo(
//     () => labReports.filter((r) => r.testName === testName),
//     [labReports, testName]
//   );

//   // 2) Distinct parameters
//   const parameters = useMemo(
//     () => Array.from(new Set(allThisTest.map((r) => r.parameter))),
//     [allThisTest]
//   );

//   // 3) Date range and parameter selection
//   const [fromDate, setFromDate] = useState("");
//   const [toDate, setToDate] = useState("");
//   const [selectedParam, setSelectedParam] = useState(parameters[0] || "");
//   // const handleMonthlyClick = () => {
//   //   const months = prompt("Enter number of months (e.g., 1 or 4):");
//   //   const monthsInt = parseInt(months);
//   //   if (!isNaN(monthsInt) && monthsInt > 0) {
//   //     const now = new Date();
//   //     const past = new Date();
//   //     past.setMonth(now.getMonth() - monthsInt);
//   //     setFromDate(past.toISOString().split("T")[0]);
//   //     setToDate(now.toISOString().split("T")[0]);
//   //   }
//   // };
//   // 4) Chart data with optional custom date filtering
//   const chartData = useMemo(() => {
//     if (!profile || !selectedParam) return [];

//     // Filter entries for user and parameter, then sort chronologically
//     const entries = allThisTest
//       .filter(
//         (r) => r.profileName === profile.name && r.parameter === selectedParam
//       )
//       .sort((a, b) => new Date(a.date) - new Date(b.date));

//     // Apply date filters if provided
//     let filtered = entries;
//     if (fromDate) {
//       const from = new Date(fromDate);
//       filtered = filtered.filter((r) => new Date(r.date) >= from);
//     }
//     if (toDate) {
//       const to = new Date(toDate);
//       filtered = filtered.filter((r) => new Date(r.date) <= to);
//     }

//     // Decide which data to show: full filtered range or last 4 when no explicit range
//     const dataToUse = fromDate || toDate ? filtered : filtered.slice(-4);

//     return dataToUse.map((r) => ({
//       date: r.date,
//       value: parseFloat(r.result),
//     }));
//   }, [allThisTest, profile?.name, selectedParam, fromDate, toDate]);
//   // --- END OF HOOKS ---

//   // Now guard for missing state
//   if (!profile || !report) {
//     return (
//       <div style={{ padding: 20 }}>
//         <h2>Oops, report not found</h2>
//         <p>Make sure you clicked a report from the previous screen.</p>
//       </div>
//     );
//   }

//   const { date, time } = report;

//   return (
//     <div style={{ padding: 20, maxWidth: 600, margin: "0 auto" }}>
//       {/* Header */}
//       <h2 style={{ textAlign: "center" }}>{testName}</h2>
//       <div style={{ textAlign: "center", marginBottom: 20 }}>
//         <p>
//           <strong>Name:</strong> {profile.name}
//         </p>
//         <p>
//           <strong>Test Date:</strong> {date}
//         </p>
//         <p>
//           <strong>Test Time:</strong> {time}
//         </p>
//       </div>

//       {/* Parameter & Date Range selector */}
//       <div style={{ marginBottom: 20, textAlign: "center" }}>
//         <label>
//           Plot parameter:&nbsp;
//           <select
//             value={selectedParam}
//             onChange={(e) => setSelectedParam(e.target.value)}
//           >
//             {parameters.map((p) => (
//               <option key={p} value={p}>
//                 {p}
//               </option>
//             ))}
//           </select>
//         </label>
//         <label style={{ marginLeft: 16 }}>
//           From{" "}
//           <input
//             type="date"
//             value={fromDate}
//             onChange={(e) => setFromDate(e.target.value)}
//           />
//         </label>
//         <label style={{ marginLeft: 16 }}>
//           To{" "}
//           <input
//             type="date"
//             value={toDate}
//             onChange={(e) => setToDate(e.target.value)}
//           />
//         </label>
//         {/* <button onClick={handleMonthlyClick} style={{ marginLeft: 16 }}>
//           Monthly Range
//         </button> */}
//       </div>

//       {/* Chart */}
//       {chartData.length > 0 ? (
//         <ResponsiveContainer width="100%" height={300}>
//           <LineChart data={chartData}>
//             <CartesianGrid strokeDasharray="3 3" />
//             <XAxis dataKey="date" />
//             <YAxis allowDecimals={false} />
//             <Tooltip />
//             <Legend />
//             <Line
//               type="monotone"
//               dataKey="value"
//               name={selectedParam}
//               stroke="#8884d8"
//               strokeWidth={2}
//               dot={{ r: 4 }}
//             />
//           </LineChart>
//         </ResponsiveContainer>
//       ) : (
//         <p style={{ textAlign: "center", color: "gray" }}>
//           No {selectedParam} data.
//         </p>
//       )}

//       {/* Table snapshot of this test date */}
//       <table
//         style={{ width: "100%", marginTop: 30, borderCollapse: "collapse" }}
//       >
//         <thead>
//           <tr style={{ backgroundColor: "#f0f0f0" }}>
//             <th style={{ padding: 8, textAlign: "left" }}>Test</th>
//             <th style={{ padding: 8 }}>Result</th>
//             <th style={{ padding: 8 }}>Unit</th>
//             <th style={{ padding: 8 }}>Ref. Value</th>
//           </tr>
//         </thead>
//         <tbody>
//           {report.reports.map((entry, idx) => {
//             const num = parseFloat(entry.result);
//             const abnormal =
//               num < parseFloat(entry.minValue) ||
//               num > parseFloat(entry.maxValue);
//             return (
//               <tr key={idx} style={{ backgroundColor: "#e8f4fc" }}>
//                 <td style={{ padding: 8 }}>{entry.parameter}</td>
//                 <td
//                   style={{
//                     padding: 8,
//                     color: abnormal ? "red" : "black",
//                     fontWeight: abnormal ? "bold" : "normal",
//                   }}
//                 >
//                   {entry.result}
//                 </td>
//                 <td style={{ padding: 8 }}>{entry.unit}</td>
//                 <td style={{ padding: 8 }}>
//                   {entry.minValue} – {entry.maxValue}
//                 </td>
//               </tr>
//             );
//           })}
//         </tbody>
//       </table>
//     </div>
//   );
// }

// 1
//upper wala code b theek ha usma query nai ha state sa handle ha nechy walay ma query ha sql.js ki
// src/Components/ReportsDetail.js
import React, { useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import useDatabase from "../Components/useDatabase"; // ← import your hook
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

export default function ReportsDetail() {
  const { state } = useLocation();
  const profile = state?.profile;
  const report = state?.report;
  const { db } = useDatabase(); // ← grab the DB instance

  // --- HOOKS MUST RUN FIRST ---
  const testName = report?.testName || "";

  // 1) All entries for this test, fetched from sql.js
  const allThisTest = useMemo(() => {
    if (!db || !profile || !testName) return [];
    const stmt = db.prepare(
      `SELECT *
         FROM LabReports
        WHERE profileName = ?
          AND testName = ?
        ORDER BY date, time`
    );
    stmt.bind([profile.name, testName]);

    const rows = [];
    while (stmt.step()) {
      rows.push(stmt.getAsObject());
    }
    stmt.free();
    return rows;
  }, [db, profile?.name, testName]);

  // 2) Distinct parameters
  const parameters = useMemo(
    () => Array.from(new Set(allThisTest.map((r) => r.parameter))),
    [allThisTest]
  );

  // 3) Date range and parameter selection
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [selectedParam, setSelectedParam] = useState(parameters[0] || "");

  // 4) Chart data with optional custom date filtering
  const chartData = useMemo(() => {
    if (!profile || !selectedParam) return [];

    // Filter entries for user and parameter, then sort chronologically
    const entries = allThisTest
      .filter(
        (r) => r.profileName === profile.name && r.parameter === selectedParam
      )
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    // Apply date filters if provided
    let filtered = entries;
    if (fromDate) {
      const from = new Date(fromDate);
      filtered = filtered.filter((r) => new Date(r.date) >= from);
    }
    if (toDate) {
      const to = new Date(toDate);
      filtered = filtered.filter((r) => new Date(r.date) <= to);
    }

    // Decide which data to show: full filtered range or last 4 when no explicit range
    const dataToUse = fromDate || toDate ? filtered : filtered.slice(-4);

    return dataToUse.map((r) => ({
      date: r.date,
      value: parseFloat(r.result),
    }));
  }, [allThisTest, profile?.name, selectedParam, fromDate, toDate]);
  // --- END OF HOOKS ---

  // Now guard for missing state
  if (!profile || !report) {
    return (
      <div style={{ padding: 20 }}>
        <h2>Oops, report not found</h2>
        <p>Make sure you clicked a report from the previous screen.</p>
      </div>
    );
  }

  const { date, time } = report;

  return (
    <div style={{ padding: 20, maxWidth: 600, margin: "0 auto" }}>
      {/* Header */}
      <h2 style={{ textAlign: "center" }}>{testName}</h2>
      <div style={{ textAlign: "center", marginBottom: 20 }}>
        <p>
          <strong>Name:</strong> {profile.name}
        </p>
        <p>
          <strong>Test Date:</strong> {date}
        </p>
        <p>
          <strong>Test Time:</strong> {time}
        </p>
      </div>

      {/* Parameter & Date Range selector */}
      <div style={{ marginBottom: 20, textAlign: "center" }}>
        <label>
          Plot parameter:&nbsp;
          <select
            value={selectedParam}
            onChange={(e) => setSelectedParam(e.target.value)}
          >
            {parameters.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </label>
        <label style={{ marginLeft: 16 }}>
          From{" "}
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
          />
        </label>
        <label style={{ marginLeft: 16 }}>
          To{" "}
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
          />
        </label>
      </div>

      {/* Chart */}
      {chartData.length > 0 ? (
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Legend />
            <Line
              type="monotone"
              dataKey="value"
              name={selectedParam}
              stroke="#8884d8"
              strokeWidth={2}
              dot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <p style={{ textAlign: "center", color: "gray" }}>
          No {selectedParam} data.
        </p>
      )}

      {/* Table snapshot of this test date */}
      <table
        style={{ width: "100%", marginTop: 30, borderCollapse: "collapse" }}
      >
        <thead>
          <tr style={{ backgroundColor: "#f0f0f0" }}>
            <th style={{ padding: 8, textAlign: "left" }}>Test</th>
            <th style={{ padding: 8 }}>Result</th>
            <th style={{ padding: 8 }}>Unit</th>
            <th style={{ padding: 8 }}>Ref. Value</th>
          </tr>
        </thead>
        <tbody>
          {allThisTest
            .filter((r) => r.date === date)
            .map((entry, idx) => {
              const num = parseFloat(entry.result);
              const abnormal =
                num < parseFloat(entry.minValue) ||
                num > parseFloat(entry.maxValue);
              return (
                <tr key={idx} style={{ backgroundColor: "#e8f4fc" }}>
                  <td style={{ padding: 8 }}>{entry.parameter}</td>
                  <td
                    style={{
                      padding: 8,
                      color: abnormal ? "red" : "black",
                      fontWeight: abnormal ? "bold" : "normal",
                    }}
                  >
                    {entry.result}
                  </td>
                  <td style={{ padding: 8 }}>{entry.unit}</td>
                  <td style={{ padding: 8 }}>
                    {entry.minValue} – {entry.maxValue}
                  </td>
                </tr>
              );
            })}
        </tbody>
      </table>
    </div>
  );
}
// 2  ya tabular form ma reportSHOW KARTI HA JASY DIRECTOR KI PDF FORM MA SHOW HORI THI
// ReportsDetail.js
// import React from "react";
// import { useLocation } from "react-router-dom";

// export default function ReportsDetail() {
//   const { state } = useLocation();

//   const { profile, testName, dateMap } = state || {};

//   if (!dateMap || !testName) {
//     return (
//       <div style={{ padding: 20 }}>
//         <h2>Oops, report not found</h2>
//         <p>Make sure you clicked a test from the previous screen.</p>
//       </div>
//     );
//   }

//   // 1) collect and sort all dates
//   const dates = Object.keys(dateMap).sort((a, b) => new Date(a) - new Date(b));

//   // 2) collect *all* parameters across all dates
//   const allParams = Array.from(
//     new Set(dates.flatMap((date) => dateMap[date].map((r) => r.parameter)))
//   );

//   return (
//     <div style={{ padding: 20, maxWidth: 800, margin: "auto" }}>
//       <h2 style={{ textAlign: "center" }}>{testName}</h2>
//       <p style={{ textAlign: "center" }}>
//         <strong>Name:</strong> {profile.name}
//       </p>

//       <table
//         style={{
//           width: "100%",
//           borderCollapse: "collapse",
//           marginTop: 20,
//         }}
//       >
//         <thead>
//           <tr style={{ backgroundColor: "#f0f0f0" }}>
//             <th style={{ padding: 8 }}>Parameter</th>
//             {dates.map((date) => (
//               <th key={date} style={{ padding: 8 }}>
//                 {date}
//               </th>
//             ))}
//             <th style={{ padding: 8 }}>Ref. Range</th>
//           </tr>
//         </thead>
//         <tbody>
//           {allParams.map((param) => {
//             // find the reference range (assume it's same across dates)
//             const anyRpt = dates
//               .map((d) => dateMap[d].find((r) => r.parameter === param))
//               .find(Boolean);
//             const refRange = anyRpt
//               ? `${anyRpt.minValue}–${anyRpt.maxValue}`
//               : "";

//             return (
//               <tr key={param}>
//                 <td style={{ padding: 8 }}>{param}</td>

//                 {dates.map((date) => {
//                   const rpt = dateMap[date].find((r) => r.parameter === param);
//                   const val = rpt ? rpt.result : "-";
//                   const unit = rpt ? rpt.unit : "";

//                   // mark abnormal if outside range
//                   let style = {};
//                   if (rpt) {
//                     const num = parseFloat(rpt.result);
//                     const lo = parseFloat(rpt.minValue);
//                     const hi = parseFloat(rpt.maxValue);
//                     if (num < lo || num > hi) {
//                       style = { backgroundColor: "#ffe6e6", color: "red" };
//                     }
//                   }

//                   return (
//                     <td key={date} style={{ padding: 8, ...style }}>
//                       {val} {unit}
//                     </td>
//                   );
//                 })}

//                 <td style={{ padding: 8 }}>{refRange}</td>
//               </tr>
//             );
//           })}
//         </tbody>
//       </table>
//     </div>
//   );
// }

// src/Components/ReportsDetail.js
// src/Components/ReportsDetail.js
// src/Components/ReportsDetail.js
// import React, { useMemo, useState } from "react";
// import { useLocation } from "react-router-dom";
// import useDatabase from "../Components/useDatabase";
// import {
//   ResponsiveContainer,
//   LineChart,
//   Line,
//   Scatter,
//   XAxis,
//   YAxis,
//   CartesianGrid,
//   Tooltip,
//   Legend,
// } from "recharts";

// export default function ReportsDetail() {
//   const { state } = useLocation();
//   const profile = state?.profile;
//   const report = state?.report;
//   const { db } = useDatabase(); // ← pull in your sql.js DB

//   // 1) Fetch ALL readings for this profile+test via SQL
//   const allThisTest = useMemo(() => {
//     if (!db || !profile || !report) return [];
//     const stmt = db.prepare(
//       `SELECT * FROM LabReports
//          WHERE profileName = ? AND testName = ?
//          ORDER BY date`
//     );
//     stmt.bind([profile.name, report.testName]);
//     const rows = [];
//     while (stmt.step()) rows.push(stmt.getAsObject());
//     stmt.free();
//     return rows;
//   }, [db, profile, report]);

//   // 2) Fetch ONLY abnormal readings
//   const abnormalReadings = useMemo(() => {
//     if (!db || !profile || !report) return [];
//     const stmt = db.prepare(
//       `SELECT date, parameter, result
//          FROM LabReports
//         WHERE profileName = ?
//           AND testName = ?
//           AND (CAST(result AS REAL) < minValue OR CAST(result AS REAL) > maxValue)`
//     );
//     stmt.bind([profile.name, report.testName]);
//     const rows = [];
//     while (stmt.step()) rows.push(stmt.getAsObject());
//     stmt.free();
//     return rows;
//   }, [db, profile, report]);

//   // 3) Derive unique parameters & dates
//   const parameters = useMemo(
//     () => Array.from(new Set(allThisTest.map((r) => r.parameter))),
//     [allThisTest]
//   );
//   const dates = useMemo(() => {
//     const uniq = Array.from(new Set(allThisTest.map((r) => r.date)));
//     return uniq.sort((a, b) => new Date(a) - new Date(b));
//   }, [allThisTest]);

//   // 4) Build chartData for the line series
//   const chartData = useMemo(() => {
//     return dates.map((date) => {
//       const point = { date };
//       parameters.forEach((param) => {
//         const entry = allThisTest.find(
//           (r) => r.date === date && r.parameter === param
//         );
//         point[param] = entry ? parseFloat(entry.result) : null;
//       });
//       return point;
//     });
//   }, [dates, parameters, allThisTest]);

//   // 5) Early-return guard
//   if (!profile || !report) {
//     return (
//       <div style={{ padding: 20 }}>
//         <h2>Oops, report not found</h2>
//         <p>Make sure you clicked a report from the previous screen.</p>
//       </div>
//     );
//   }

//   const { testName, date, time } = report;

//   return (
//     <div style={{ padding: 20, maxWidth: 900, margin: "0 auto" }}>
//       <h2 style={{ textAlign: "center" }}>{testName} Trends</h2>
//       <p style={{ textAlign: "center" }}>
//         Name: <strong>{profile.name}</strong> | Test Date:{" "}
//         <strong>{date}</strong> {time && `| Time: ${time}`}
//       </p>

//       <ResponsiveContainer width="100%" height={350}>
//         <LineChart data={chartData}>
//           <CartesianGrid strokeDasharray="3 3" />
//           <XAxis dataKey="date" />
//           <YAxis />
//           <Tooltip />
//           <Legend />

//           {/* one solid line per parameter */}
//           {parameters.map((param) => (
//             <Line
//               key={param}
//               type="monotone"
//               dataKey={param}
//               name={param}
//               strokeWidth={2}
//               dot={false}
//             />
//           ))}

//           {/* one red dashed scatter per parameter’s abnormal points */}
//           {parameters.map((param) => {
//             const data = abnormalReadings
//               .filter((r) => r.parameter === param)
//               .map((r) => ({ date: r.date, [param]: parseFloat(r.result) }));
//             return (
//               <Scatter
//                 key={param + "-abn"}
//                 data={data}
//                 name={`${param} (abnormal)`}
//                 line={{ stroke: "red", strokeDasharray: "5 5" }}
//                 fill="red"
//               />
//             );
//           })}
//         </LineChart>
//       </ResponsiveContainer>

//       {/* snapshot table for that single report date */}
//       <table
//         style={{ width: "100%", marginTop: 30, borderCollapse: "collapse" }}
//       >
//         <thead>
//           <tr style={{ backgroundColor: "#f0f0f0" }}>
//             <th style={{ padding: 8, textAlign: "left" }}>Test</th>
//             <th style={{ padding: 8 }}>Result</th>
//             <th style={{ padding: 8 }}>Unit</th>
//             <th style={{ padding: 8 }}>Ref. Value</th>
//           </tr>
//         </thead>
//         <tbody>
//           {allThisTest
//             .filter((r) => r.date === date)
//             .map((entry, idx) => {
//               const num = parseFloat(entry.result);
//               const abnormal =
//                 num < parseFloat(entry.minValue) ||
//                 num > parseFloat(entry.maxValue);
//               return (
//                 <tr
//                   key={idx}
//                   style={{
//                     backgroundColor: abnormal ? "#ffe6e6" : "#e8f4fc",
//                   }}
//                 >
//                   <td style={{ padding: 8 }}>{entry.parameter}</td>
//                   <td
//                     style={{
//                       padding: 8,
//                       color: abnormal ? "red" : "black",
//                       fontWeight: abnormal ? "bold" : "normal",
//                     }}
//                   >
//                     {entry.result}
//                   </td>
//                   <td style={{ padding: 8 }}>{entry.unit}</td>
//                   <td style={{ padding: 8 }}>
//                     {entry.minValue} – {entry.maxValue}
//                   </td>
//                 </tr>
//               );
//             })}
//         </tbody>
//       </table>
//     </div>
//   );
// }

// agar seperate screen ma show karana hwa nechy wala code work karay ga
// import React, { useEffect, useState, useMemo } from "react";
// import { useLocation, useNavigate } from "react-router-dom";
// import useDatabase from "../Components/useDatabase";
// import {
//   ResponsiveContainer,
//   LineChart,
//   Line,
//   XAxis,
//   YAxis,
//   CartesianGrid,
//   Tooltip,
//   Legend,
// } from "recharts";
// import "../CSS/ReportsDetail.css";

// export default function ReportsDetail() {
//   const { state } = useLocation();
//   const navigate = useNavigate();
//   const { profile, report } = state || {};
//   const { db } = useDatabase();
//   const [labReports, setLabReports] = useState([]);

//   // Fetch all reports for this testName
//   useEffect(() => {
//     if (!db || !profile || !report) return;
//     const stmt = db.prepare(
//       "SELECT * FROM LabReports WHERE profileName = ? AND testName = ?"
//     );
//     stmt.bind([profile.name, report.testName]);
//     const rows = [];
//     while (stmt.step()) rows.push(stmt.getAsObject());
//     stmt.free();
//     setLabReports(rows);
//   }, [db, profile, report]);

//   // Prepare chart data: group by date and parameter values
//   const chartData = useMemo(() => {
//     if (!labReports.length) return [];
//     // Unique dates sorted
//     const dates = Array.from(new Set(labReports.map((r) => r.date))).sort(
//       (a, b) => new Date(a) - new Date(b)
//     );

//     // Unique parameters
//     const params = Array.from(new Set(labReports.map((r) => r.parameter)));

//     // Build data array: [{ date, param1: value, param2: value, ... }, ...]
//     return dates.map((date) => {
//       const entry = { date };
//       params.forEach((param) => {
//         const rec = labReports.find(
//           (r) => r.date === date && r.parameter === param
//         );
//         entry[param] = rec ? Number(rec.result) : null;
//       });
//       return entry;
//     });
//   }, [labReports]);

//   // Colors palette
//   const COLORS = ["#8884d8", "#82ca9d", "#ffc658", "#ff7300", "#0088FE"];

//   return (
//     <div className="reports-detail-container">
//       <h2>{report?.testName} Trend</h2>
//       <button onClick={() => navigate(-1)}>Back</button>

//       {chartData.length > 0 ? (
//         <div className="chart-wrapper">
//           <ResponsiveContainer width="100%" height={400}>
//             <LineChart
//               data={chartData}
//               margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
//             >
//               <CartesianGrid strokeDasharray="3 3" />
//               <XAxis dataKey="date" />
//               <YAxis />
//               <Tooltip />
//               <Legend />
//               {Object.keys(chartData[0])
//                 .filter((key) => key !== "date")
//                 .map((param, idx) => (
//                   <Line
//                     key={param}
//                     type="monotone"
//                     dataKey={param}
//                     name={param}
//                     stroke={COLORS[idx % COLORS.length]}
//                     strokeWidth={2}
//                     dot={{ r: 3 }}
//                   />
//                 ))}
//             </LineChart>
//           </ResponsiveContainer>
//         </div>
//       ) : (
//         <p>No data available for {report?.testName}</p>
//       )}
//     </div>
//   );
// }
