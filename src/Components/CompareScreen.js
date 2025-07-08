// // CompareScreen.jsx
// import React, { useEffect, useState, useMemo } from "react";
// import useDatabase from "../Components/useDatabase";
// import { useLocation } from "react-router-dom";
// import {
//   ResponsiveContainer,
//   LineChart,
//   Line,
//   XAxis,
//   YAxis,
//   Tooltip,
//   Legend,
//   CartesianGrid,
// } from "recharts";

// // Simple palette for distinguishing profiles
// const COLORS = ["#8884d8", "#82ca9d", "#ff7300", "#ff0000", "#00aaff"];

// export default function CompareScreen() {
//   const { db } = useDatabase();
//   const location = useLocation();

//   const [profiles, setProfiles] = useState([]);
//   const [testNames, setTestNames] = useState([]);

//   // Form state
//   const [selectedProfiles, setSelectedProfiles] = useState(
//     location.state?.baseProfile ? [location.state.baseProfile.name] : []
//   );
//   const [selectedTest, setSelectedTest] = useState("");
//   const [fromDate, setFromDate] = useState("");
//   const [toDate, setToDate] = useState("");

//   // Data rows
//   const [comparisonRows, setComparisonRows] = useState([]);
//   const [parameters, setParameters] = useState([]);
//   const [selectedParameter, setSelectedParameter] = useState("");

//   // Load profiles
//   useEffect(() => {
//     if (!db) return;
//     const email = localStorage.getItem("currentUserEmail");
//     const stmt = db.prepare("SELECT * FROM profiles WHERE userEmail = ?");
//     stmt.bind([email]);
//     const out = [];
//     while (stmt.step()) out.push(stmt.getAsObject());
//     stmt.free();
//     setProfiles(out);
//   }, [db]);

//   // Load tests
//   useEffect(() => {
//     if (!db) return;
//     const stmt = db.prepare("SELECT DISTINCT testName FROM LabReports");
//     const out = [];
//     while (stmt.step()) out.push(stmt.getAsObject().testName);
//     stmt.free();
//     setTestNames(out);
//   }, [db]);

//   // Compare handler
//   const handleCompare = () => {
//     if (
//       !db ||
//       !selectedTest ||
//       selectedProfiles.length < 2 ||
//       !fromDate ||
//       !toDate
//     ) {
//       alert("Select at least 2 profiles, a test, and a date range.");
//       return;
//     }
//     const placeholders = selectedProfiles.map(() => "?").join(",");
//     const sql = `
//       SELECT profileName, parameter, result, unit, date,
//              minValue, maxValue
//       FROM LabReports
//       WHERE testName = ?
//         AND profileName IN (${placeholders})
//         AND date BETWEEN ? AND ?
//       ORDER BY date, profileName
//     `;
//     const stmt = db.prepare(sql);
//     stmt.bind([selectedTest, ...selectedProfiles, fromDate, toDate]);
//     const rows = [];
//     while (stmt.step()) rows.push(stmt.getAsObject());
//     stmt.free();

//     const pivot = {};
//     rows.forEach((r) => {
//       const key = `${r.parameter} | ${r.date}`;
//       if (!pivot[key]) pivot[key] = { parameter: r.parameter, date: r.date };
//       const num = parseFloat(r.result);
//       const abnormal =
//         !isNaN(num) &&
//         ((r.minValue != null && num < r.minValue) ||
//           (r.maxValue != null && num > r.maxValue));
//       pivot[key][r.profileName] = {
//         value: num,
//         unit: r.unit,
//         isAbnormal: abnormal,
//       };
//     });
//     const arr = Object.values(pivot);
//     setComparisonRows(arr);
//     const distinctParams = Array.from(new Set(arr.map((r) => r.parameter)));
//     setParameters(distinctParams);
//     setSelectedParameter("");
//   };

//   // Build chart data for selected parameter
//   const chartData = useMemo(() => {
//     if (!selectedParameter) return [];
//     return comparisonRows
//       .filter((r) => r.parameter === selectedParameter)
//       .map((r) => {
//         const pt = { date: r.date };
//         selectedProfiles.forEach((name) => {
//           pt[name] = r[name]?.value ?? null;
//         });
//         return pt;
//       });
//   }, [comparisonRows, selectedParameter, selectedProfiles]);

//   return (
//     <div style={{ padding: 20 }}>
//       <h2>Compare Lab Test</h2>

//       <div style={{ marginBottom: 16 }}>
//         <label>
//           Test{" "}
//           <select
//             value={selectedTest}
//             onChange={(e) => {
//               setSelectedTest(e.target.value);
//               setParameters([]);
//               setSelectedParameter("");
//             }}
//           >
//             <option value="">— choose a test —</option>
//             {testNames.map((t) => (
//               <option key={t} value={t}>
//                 {t}
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
//       </div>

//       <div style={{ marginBottom: 16 }}>
//         <strong>Select Profiles (min 2):</strong>
//         {profiles.map((p) => (
//           <label key={p.id} style={{ marginLeft: 8 }}>
//             <input
//               type="checkbox"
//               value={p.name}
//               checked={selectedProfiles.includes(p.name)}
//               onChange={(e) => {
//                 const name = e.target.value;
//                 setSelectedProfiles((prev) =>
//                   prev.includes(name)
//                     ? prev.filter((x) => x !== name)
//                     : [...prev, name]
//                 );
//               }}
//             />{" "}
//             {p.name} ({p.relation})
//           </label>
//         ))}
//       </div>

//       <button
//         onClick={handleCompare}
//         disabled={
//           !selectedTest || selectedProfiles.length < 2 || !fromDate || !toDate
//         }
//       >
//         Run Comparison
//       </button>

//       {parameters.length > 0 && (
//         <div style={{ marginTop: 20 }}>
//           <label>
//             Parameter to Graph{" "}
//             <select
//               value={selectedParameter}
//               onChange={(e) => setSelectedParameter(e.target.value)}
//             >
//               <option value="">— choose parameter —</option>
//               {parameters.map((p) => (
//                 <option key={p} value={p}>
//                   {p}
//                 </option>
//               ))}
//             </select>
//           </label>
//         </div>
//       )}

//       {/* Chart */}
//       {chartData.length > 0 && (
//         <div style={{ marginTop: 32, width: "100%", height: 400 }}>
//           <ResponsiveContainer>
//             <LineChart data={chartData}>
//               <CartesianGrid strokeDasharray="3 3" />
//               <XAxis dataKey="date" />
//               <YAxis />
//               <Tooltip />
//               <Legend />
//               {selectedProfiles.map((name, idx) => (
//                 <Line
//                   key={name}
//                   type="monotone"
//                   dataKey={name}
//                   name={name}
//                   stroke={COLORS[idx % COLORS.length]}
//                   strokeWidth={2}
//                   dot={{ r: 4 }}
//                 />
//               ))}
//             </LineChart>
//           </ResponsiveContainer>
//         </div>
//       )}

//       {/* Table of values */}
//       {selectedParameter && comparisonRows.length > 0 && (
//         <div style={{ marginTop: 32, overflowX: "auto" }}>
//           <table
//             border="1"
//             cellPadding="6"
//             style={{ borderCollapse: "collapse", minWidth: 600 }}
//           >
//             <thead>
//               <tr>
//                 <th>Date</th>
//                 {selectedProfiles.map((name) => (
//                   <th key={name}>{name}</th>
//                 ))}
//               </tr>
//             </thead>
//             <tbody>
//               {comparisonRows
//                 .filter((r) => r.parameter === selectedParameter)
//                 .map((row, i) => (
//                   <tr key={i}>
//                     <td>{row.date}</td>
//                     {selectedProfiles.map((name) => {
//                       const cell = row[name] || {
//                         value: "—",
//                         unit: "",
//                         isAbnormal: false,
//                       };
//                       return (
//                         <td
//                           key={name}
//                           style={{
//                             backgroundColor: cell.isAbnormal
//                               ? "#f8d7d7"
//                               : undefined,
//                             color: cell.isAbnormal ? "#a00" : undefined,
//                             fontWeight: cell.isAbnormal ? "bold" : undefined,
//                           }}
//                         >
//                           {cell.value !== "—"
//                             ? `${cell.value} ${cell.unit}`
//                             : "—"}
//                         </td>
//                       );
//                     })}
//                   </tr>
//                 ))}
//             </tbody>
//           </table>
//         </div>
//       )}
//     </div>
//   );
// }

//uper wala code b theek ha
// import React, { useEffect, useState, useMemo } from "react";
// import useDatabase from "../Components/useDatabase";
// import { useLocation } from "react-router-dom";
// import {
//   ResponsiveContainer,
//   LineChart,
//   Line,
//   XAxis,
//   YAxis,
//   Tooltip,
//   Legend,
//   CartesianGrid,
// } from "recharts";

// // Simple palette for distinguishing profiles
// const COLORS = ["#8884d8", "#82ca9d", "#ff7300", "#ff0000", "#00aaff"];

// export default function CompareScreen() {
//   const { db } = useDatabase();
//   const location = useLocation();

//   const [profiles, setProfiles] = useState([]);
//   const [testNames, setTestNames] = useState([]);

//   // Form state
//   const [selectedProfiles, setSelectedProfiles] = useState(
//     location.state?.baseProfile ? [location.state.baseProfile.name] : []
//   );
//   const [selectedTest, setSelectedTest] = useState("");
//   const [fromDate, setFromDate] = useState("");
//   const [toDate, setToDate] = useState("");

//   // Data rows
//   const [comparisonRows, setComparisonRows] = useState([]);
//   const [parameters, setParameters] = useState([]);
//   const [selectedParameter, setSelectedParameter] = useState("");

//   // Load profiles
//   useEffect(() => {
//     if (!db) return;
//     const email = localStorage.getItem("currentUserEmail");
//     const stmt = db.prepare("SELECT * FROM profiles WHERE userEmail = ?");
//     stmt.bind([email]);
//     const out = [];
//     while (stmt.step()) out.push(stmt.getAsObject());
//     stmt.free();
//     setProfiles(out);
//   }, [db]);

//   // Load tests
//   useEffect(() => {
//     if (!db) return;
//     const stmt = db.prepare("SELECT DISTINCT testName FROM LabReports");
//     const out = [];
//     while (stmt.step()) out.push(stmt.getAsObject().testName);
//     stmt.free();
//     setTestNames(out);
//   }, [db]);

//   // Compare handler
//   const handleCompare = () => {
//     if (
//       !db ||
//       !selectedTest ||
//       selectedProfiles.length !== 2 || // require exactly two
//       !fromDate ||
//       !toDate
//     ) {
//       alert("Select exactly 2 profiles, a test, and a date range.");
//       return;
//     }

//     const placeholders = selectedProfiles.map(() => "?").join(",");
//     const sql = `
//       SELECT date,
//              parameter,
//              profileName,
//              CAST(result AS REAL) AS value,
//              unit,
//              minValue,
//              maxValue
//       FROM LabReports
//       WHERE testName = ?
//         AND profileName IN (${placeholders})
//         AND date BETWEEN ? AND ?
//       ORDER BY date;
//     `;
//     const stmt = db.prepare(sql);
//     stmt.bind([selectedTest, ...selectedProfiles, fromDate, toDate]);

//     const rows = [];
//     while (stmt.step()) {
//       const r = stmt.getAsObject();
//       rows.push({
//         date: r.date,
//         parameter: r.parameter,
//         profileName: r.profileName,
//         value: r.value,
//         unit: r.unit,
//         isAbnormal:
//           (r.minValue != null && r.value < r.minValue) ||
//           (r.maxValue != null && r.value > r.maxValue),
//       });
//     }
//     stmt.free();

//     setComparisonRows(rows);
//     setParameters(Array.from(new Set(rows.map((r) => r.parameter))));
//     setSelectedParameter("");
//   };

//   // Build chart data for selected parameter
//   const chartData = useMemo(() => {
//     if (!selectedParameter) return [];
//     const filtered = comparisonRows.filter(
//       (r) => r.parameter === selectedParameter
//     );
//     return Object.values(
//       filtered.reduce((acc, { date, profileName, value }) => {
//         if (!acc[date]) acc[date] = { date };
//         acc[date][profileName] = value;
//         return acc;
//       }, {})
//     );
//   }, [comparisonRows, selectedParameter]);

//   return (
//     <div style={{ padding: 20 }}>
//       <h2>Compare Lab Test</h2>

//       <div style={{ marginBottom: 16 }}>
//         <label>
//           Test{" "}
//           <select
//             value={selectedTest}
//             onChange={(e) => {
//               setSelectedTest(e.target.value);
//               setParameters([]);
//               setSelectedParameter("");
//             }}
//           >
//             <option value="">— choose a test —</option>
//             {testNames.map((t) => (
//               <option key={t} value={t}>
//                 {t}
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
//       </div>

//       <div style={{ marginBottom: 16 }}>
//         <strong>Select Profiles (max 2):</strong>
//         {profiles.map((p) => (
//           <label key={p.id} style={{ marginLeft: 8 }}>
//             <input
//               type="checkbox"
//               value={p.name}
//               checked={selectedProfiles.includes(p.name)}
//               disabled={
//                 !selectedProfiles.includes(p.name) &&
//                 selectedProfiles.length >= 2
//               }
//               onChange={(e) => {
//                 const name = e.target.value;
//                 setSelectedProfiles((prev) =>
//                   prev.includes(name)
//                     ? prev.filter((x) => x !== name)
//                     : [...prev, name]
//                 );
//               }}
//             />{" "}
//             {p.name} ({p.relation})
//           </label>
//         ))}
//       </div>

//       <button
//         onClick={handleCompare}
//         disabled={
//           !selectedTest || selectedProfiles.length !== 2 || !fromDate || !toDate
//         }
//       >
//         Run Comparison
//       </button>

//       {parameters.length > 0 && (
//         <div style={{ marginTop: 20 }}>
//           <label>
//             Parameter to Graph{" "}
//             <select
//               value={selectedParameter}
//               onChange={(e) => setSelectedParameter(e.target.value)}
//             >
//               <option value="">— choose parameter —</option>
//               {parameters.map((p) => (
//                 <option key={p} value={p}>
//                   {p}
//                 </option>
//               ))}
//             </select>
//           </label>
//         </div>
//       )}

//       {/* Chart */}
//       {chartData.length > 0 && selectedProfiles.length === 2 ? (
//         <div style={{ display: "flex", gap: 16, marginTop: 32 }}>
//           {selectedProfiles.map((name, idx) => {
//             const singleData = chartData.map((pt) => ({
//               date: pt.date,
//               value: pt[name] ?? null,
//             }));
//             return (
//               <div key={name} style={{ flex: 1, height: 300 }}>
//                 <h4 style={{ textAlign: "center" }}>{name}</h4>
//                 <ResponsiveContainer>
//                   <LineChart data={singleData}>
//                     <CartesianGrid strokeDasharray="3 3" />
//                     <XAxis dataKey="date" />
//                     <YAxis />
//                     <Tooltip />
//                     <Line
//                       type="monotone"
//                       dataKey="value"
//                       stroke={COLORS[idx % COLORS.length]}
//                       strokeWidth={2}
//                       dot={{ r: 3 }}
//                     />
//                   </LineChart>
//                 </ResponsiveContainer>
//               </div>
//             );
//           })}
//         </div>
//       ) : (
//         chartData.length > 0 && (
//           <div style={{ marginTop: 32, width: "100%", height: 400 }}>
//             <ResponsiveContainer>
//               <LineChart data={chartData}>
//                 <CartesianGrid strokeDasharray="3 3" />
//                 <XAxis dataKey="date" />
//                 <YAxis />
//                 <Tooltip />
//                 <Legend />
//                 {selectedProfiles.map((name, idx) => (
//                   <Line
//                     key={name}
//                     type="monotone"
//                     dataKey={name}
//                     name={name}
//                     stroke={COLORS[idx % COLORS.length]}
//                     strokeWidth={2}
//                     dot={{ r: 4 }}
//                   />
//                 ))}
//               </LineChart>
//             </ResponsiveContainer>
//           </div>
//         )
//       )}

//       {/* Table of values */}
//       {selectedParameter && comparisonRows.length > 0 && (
//         <div style={{ marginTop: 32, overflowX: "auto" }}>
//           <table
//             border="1"
//             cellPadding="6"
//             style={{ borderCollapse: "collapse", minWidth: 600 }}
//           >
//             <thead>
//               <tr>
//                 <th>Date</th>
//                 {selectedProfiles.map((name) => (
//                   <th key={name}>{name}</th>
//                 ))}
//               </tr>
//             </thead>
//             <tbody>
//               {selectedParameter &&
//                 comparisonRows.length > 0 &&
//                 // group by date
//                 comparisonRows
//                   .filter((r) => r.parameter === selectedParameter)
//                   .reduce((acc, row) => {
//                     let bucket = acc.find((d) => d.date === row.date);
//                     if (!bucket) {
//                       bucket = { date: row.date };
//                       acc.push(bucket);
//                     }
//                     bucket[row.profileName] = {
//                       value: row.value,
//                       unit: row.unit,
//                       isAbnormal: row.isAbnormal,
//                     };
//                     return acc;
//                   }, [])
//                   .map((row, i) => (
//                     <tr key={i}>
//                       <td>{row.date}</td>
//                       {selectedProfiles.map((name) => {
//                         const cell = row[name] || {
//                           value: "—",
//                           unit: "",
//                           isAbnormal: false,
//                         };
//                         return (
//                           <td
//                             key={name}
//                             style={{
//                               backgroundColor: cell.isAbnormal
//                                 ? "#f8d7d7"
//                                 : undefined,
//                               color: cell.isAbnormal ? "#a00" : undefined,
//                               fontWeight: cell.isAbnormal ? "bold" : undefined,
//                             }}
//                           >
//                             {cell.value !== "—"
//                               ? `${cell.value} ${cell.unit}`
//                               : "—"}
//                           </td>
//                         );
//                       })}
//                     </tr>
//                   ))}
//             </tbody>
//           </table>
//         </div>
//       )}
//     </div>
//   );
// }

// Compare with max 2 profiles |
import React, { useEffect, useState, useMemo } from "react";
import useDatabase from "../Components/useDatabase";
import { useLocation } from "react-router-dom";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from "recharts";

// Simple palette for distinguishing profiles
const COLORS = ["#8884d8", "#82ca9d", "#ff7300", "#ff0000", "#00aaff"];

export default function CompareScreen() {
  const { db } = useDatabase();
  const location = useLocation();

  const [profiles, setProfiles] = useState([]);
  const [testNames, setTestNames] = useState([]);

  // Form state
  const [selectedProfiles, setSelectedProfiles] = useState(
    location.state?.baseProfile ? [location.state.baseProfile.name] : []
  );
  const [selectedTest, setSelectedTest] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  // Data rows and parameters
  const [comparisonRows, setComparisonRows] = useState([]);
  const [parameters, setParameters] = useState([]);
  const [selectedParameter, setSelectedParameter] = useState("");

  // Load profiles
  useEffect(() => {
    if (!db) return;
    const email = localStorage.getItem("currentUserEmail");
    const stmt = db.prepare("SELECT * FROM profiles WHERE userEmail = ?");
    stmt.bind([email]);
    const out = [];
    while (stmt.step()) out.push(stmt.getAsObject());
    stmt.free();
    setProfiles(out);
  }, [db]);

  // Load tests
  useEffect(() => {
    if (!db) return;
    const stmt = db.prepare("SELECT DISTINCT testName FROM LabReports");
    const out = [];
    while (stmt.step()) out.push(stmt.getAsObject().testName);
    stmt.free();
    setTestNames(out);
  }, [db]);

  // Compare handler
  const handleCompare = () => {
    if (
      !db ||
      !selectedTest ||
      selectedProfiles.length !== 2 ||
      !fromDate ||
      !toDate
    ) {
      alert("Select exactly 2 profiles, a test, and a date range.");
      return;
    }

    // Build SQL placeholders for 2 profiles
    const placeholders = selectedProfiles.map(() => "?").join(",");
    const sql = `
      SELECT profileName, parameter, result, unit, date,
             minValue, maxValue
      FROM LabReports
      WHERE testName = ?
        AND profileName IN (${placeholders})
        AND date BETWEEN ? AND ?
      ORDER BY date, profileName
    `;
    const stmt = db.prepare(sql);
    stmt.bind([selectedTest, ...selectedProfiles, fromDate, toDate]);
    const rows = [];
    while (stmt.step()) rows.push(stmt.getAsObject());
    stmt.free();

    // Pivot data by parameter and date
    const pivot = {};
    rows.forEach((r) => {
      const key = `${r.parameter} | ${r.date}`;
      if (!pivot[key]) pivot[key] = { parameter: r.parameter, date: r.date };
      const num = parseFloat(r.result);
      const abnormal =
        !isNaN(num) &&
        ((r.minValue != null && num < r.minValue) ||
          (r.maxValue != null && num > r.maxValue));
      pivot[key][r.profileName] = {
        value: num,
        unit: r.unit,
        isAbnormal: abnormal,
      };
    });

    const arr = Object.values(pivot);
    setComparisonRows(arr);
    const distinctParams = Array.from(new Set(arr.map((r) => r.parameter)));
    setParameters(distinctParams);
    setSelectedParameter("");
  };

  // Build chart data for selected parameter
  const chartData = useMemo(() => {
    if (!selectedParameter) return [];
    return comparisonRows
      .filter((r) => r.parameter === selectedParameter)
      .map((r) => {
        const pt = { date: r.date };
        selectedProfiles.forEach((name) => {
          pt[name] = r[name]?.value ?? null;
        });
        return pt;
      });
  }, [comparisonRows, selectedParameter, selectedProfiles]);

  return (
    <div style={{ padding: 20 }}>
      <h2>Compare Lab Test</h2>

      {/* Test and date inputs */}
      <div style={{ marginBottom: 16 }}>
        <label>
          Test{" "}
          <select
            value={selectedTest}
            onChange={(e) => {
              setSelectedTest(e.target.value);
              setParameters([]);
              setSelectedParameter("");
            }}
          >
            <option value="">— choose a test —</option>
            {testNames.map((t) => (
              <option key={t} value={t}>
                {t}
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

      {/* Profile selectors (exactly 2) */}
      <div style={{ marginBottom: 16 }}>
        <strong>Select Profiles (exactly 2):</strong>
        {profiles.map((p) => {
          const isChecked = selectedProfiles.includes(p.name);
          const disableMore = !isChecked && selectedProfiles.length >= 2;
          return (
            <label
              key={p.id}
              style={{ marginLeft: 8, opacity: disableMore ? 0.5 : 1 }}
            >
              <input
                type="checkbox"
                value={p.name}
                checked={isChecked}
                disabled={disableMore}
                onChange={() => {
                  const name = p.name;
                  setSelectedProfiles((prev) =>
                    prev.includes(name)
                      ? prev.filter((x) => x !== name)
                      : prev.length < 2
                      ? [...prev, name]
                      : prev
                  );
                }}
              />{" "}
              {p.name} ({p.relation})
            </label>
          );
        })}
      </div>

      <button
        onClick={handleCompare}
        disabled={
          !selectedTest || selectedProfiles.length !== 2 || !fromDate || !toDate
        }
      >
        Run Comparison
      </button>

      {/* Parameter selector */}
      {parameters.length > 0 && (
        <div style={{ marginTop: 20 }}>
          <label>
            Parameter to Graph{" "}
            <select
              value={selectedParameter}
              onChange={(e) => setSelectedParameter(e.target.value)}
            >
              <option value="">— choose parameter —</option>
              {parameters.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </label>
        </div>
      )}

      {/* Chart */}
      {chartData.length > 0 && (
        <div style={{ marginTop: 32, width: "100%", height: 400 }}>
          <ResponsiveContainer>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              {selectedProfiles.map((name, idx) => (
                <Line
                  key={name}
                  type="monotone"
                  dataKey={name}
                  name={name}
                  stroke={COLORS[idx % COLORS.length]}
                  strokeWidth={2}
                  dot={{ r: 4 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Table of values */}
      {selectedParameter && comparisonRows.length > 0 && (
        <div style={{ marginTop: 32, overflowX: "auto" }}>
          <table
            border="1"
            cellPadding="6"
            style={{ borderCollapse: "collapse", minWidth: 600 }}
          >
            <thead>
              <tr>
                <th>Date</th>
                {selectedProfiles.map((name) => (
                  <th key={name}>{name}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {comparisonRows
                .filter((r) => r.parameter === selectedParameter)
                .map((row, i) => (
                  <tr key={i}>
                    <td>{row.date}</td>
                    {selectedProfiles.map((name) => {
                      const cell = row[name] || {
                        value: "—",
                        unit: "",
                        isAbnormal: false,
                      };
                      return (
                        <td
                          key={name}
                          style={{
                            backgroundColor: cell.isAbnormal
                              ? "#f8d7d7"
                              : undefined,
                            color: cell.isAbnormal ? "#a00" : undefined,
                            fontWeight: cell.isAbnormal ? "bold" : undefined,
                          }}
                        >
                          {cell.value !== "—"
                            ? `${cell.value} ${cell.unit}`
                            : "—"}
                        </td>
                      );
                    })}
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// this code is only for max 3 profiles
// import React, { useEffect, useState, useMemo } from "react";
// import useDatabase from "../Components/useDatabase";
// import { useLocation } from "react-router-dom";
// import {
//   ResponsiveContainer,
//   LineChart,
//   Line,
//   XAxis,
//   YAxis,
//   Tooltip,
//   Legend,
//   CartesianGrid,
// } from "recharts";

// // Simple palette for distinguishing profiles
// const COLORS = ["#8884d8", "#82ca9d", "#ff7300", "#ff0000", "#00aaff"];

// export default function CompareScreen() {
//   const { db } = useDatabase();
//   const location = useLocation();

//   const [profiles, setProfiles] = useState([]);
//   const [testNames, setTestNames] = useState([]);

//   // Form state
//   const [selectedProfiles, setSelectedProfiles] = useState(
//     location.state?.baseProfile ? [location.state.baseProfile.name] : []
//   );
//   const [selectedTest, setSelectedTest] = useState("");
//   const [fromDate, setFromDate] = useState("");
//   const [toDate, setToDate] = useState("");

//   // Data rows and parameters
//   const [comparisonRows, setComparisonRows] = useState([]);
//   const [parameters, setParameters] = useState([]);
//   const [selectedParameter, setSelectedParameter] = useState("");

//   // Load profiles
//   useEffect(() => {
//     if (!db) return;
//     const email = localStorage.getItem("currentUserEmail");
//     const stmt = db.prepare("SELECT * FROM profiles WHERE userEmail = ?");
//     stmt.bind([email]);
//     const out = [];
//     while (stmt.step()) out.push(stmt.getAsObject());
//     stmt.free();
//     setProfiles(out);
//   }, [db]);

//   // Load tests
//   useEffect(() => {
//     if (!db) return;
//     const stmt = db.prepare("SELECT DISTINCT testName FROM LabReports");
//     const out = [];
//     while (stmt.step()) out.push(stmt.getAsObject().testName);
//     stmt.free();
//     setTestNames(out);
//   }, [db]);

//   // Compare handler
//   const handleCompare = () => {
//     if (
//       !db ||
//       !selectedTest ||
//       selectedProfiles.length !== 3 ||
//       !fromDate ||
//       !toDate
//     ) {
//       alert("Select exactly 3 profiles, a test, and a date range.");
//       return;
//     }

//     // Build SQL placeholders for selected profiles
//     const placeholders = selectedProfiles.map(() => "?").join(",");
//     const sql = `
//       SELECT profileName, parameter, result, unit, date,
//              minValue, maxValue
//       FROM LabReports
//       WHERE testName = ?
//         AND profileName IN (${placeholders})
//         AND date BETWEEN ? AND ?
//       ORDER BY date, profileName
//     `;
//     const stmt = db.prepare(sql);
//     stmt.bind([selectedTest, ...selectedProfiles, fromDate, toDate]);
//     const rows = [];
//     while (stmt.step()) rows.push(stmt.getAsObject());
//     stmt.free();

//     // Pivot data by parameter and date
//     const pivot = {};
//     rows.forEach((r) => {
//       const key = `${r.parameter} | ${r.date}`;
//       if (!pivot[key]) pivot[key] = { parameter: r.parameter, date: r.date };
//       const num = parseFloat(r.result);
//       const abnormal =
//         !isNaN(num) &&
//         ((r.minValue != null && num < r.minValue) ||
//           (r.maxValue != null && num > r.maxValue));
//       pivot[key][r.profileName] = {
//         value: num,
//         unit: r.unit,
//         isAbnormal: abnormal,
//       };
//     });

//     const arr = Object.values(pivot);
//     setComparisonRows(arr);
//     const distinctParams = Array.from(new Set(arr.map((r) => r.parameter)));
//     setParameters(distinctParams);
//     setSelectedParameter("");
//   };

//   // Build chart data for selected parameter
//   const chartData = useMemo(() => {
//     if (!selectedParameter) return [];
//     return comparisonRows
//       .filter((r) => r.parameter === selectedParameter)
//       .map((r) => {
//         const pt = { date: r.date };
//         selectedProfiles.forEach((name) => {
//           pt[name] = r[name]?.value ?? null;
//         });
//         return pt;
//       });
//   }, [comparisonRows, selectedParameter, selectedProfiles]);

//   return (
//     <div style={{ padding: 20 }}>
//       <h2>Compare Lab Test</h2>

//       {/* Test and date inputs */}
//       <div style={{ marginBottom: 16 }}>
//         <label>
//           Test{' '}
//           <select
//             value={selectedTest}
//             onChange={(e) => {
//               setSelectedTest(e.target.value);
//               setParameters([]);
//               setSelectedParameter("");
//             }}
//           >
//             <option value="">— choose a test —</option>
//             {testNames.map((t) => (
//               <option key={t} value={t}>
//                 {t}
//               </option>
//             ))}
//           </select>
//         </label>
//         <label style={{ marginLeft: 16 }}>
//           From{' '}
//           <input
//             type="date"
//             value={fromDate}
//             onChange={(e) => setFromDate(e.target.value)}
//           />
//         </label>
//         <label style={{ marginLeft: 16 }}>
//           To{' '}
//           <input
//             type="date"
//             value={toDate}
//             onChange={(e) => setToDate(e.target.value)}
//           />
//         </label>
//       </div>

//       {/* Profile selectors (exactly 3) */}
//       <div style={{ marginBottom: 16 }}>
//         <strong>Select Profiles (exactly 3):</strong>
//         {profiles.map((p) => {
//           const isChecked = selectedProfiles.includes(p.name);
//           const disableMore = !isChecked && selectedProfiles.length >= 3;
//           return (
//             <label
//               key={p.id}
//               style={{ marginLeft: 8, opacity: disableMore ? 0.5 : 1 }}
//             >
//               <input
//                 type="checkbox"
//                 value={p.name}
//                 checked={isChecked}
//                 disabled={disableMore}
//                 onChange={() => {
//                   const name = p.name;
//                   setSelectedProfiles((prev) =>
//                     prev.includes(name)
//                       ? prev.filter((x) => x !== name)
//                       : prev.length < 3
//                       ? [...prev, name]
//                       : prev
//                   );
//                 }}
//               />{' '}
//               {p.name} ({p.relation})
//             </label>
//           );
//         })}
//       </div>

//       <button
//         onClick={handleCompare}
//         disabled={
//           !selectedTest ||
//           selectedProfiles.length !== 3 ||
//           !fromDate ||
//           !toDate
//         }
//       >
//         Run Comparison
//       </button>

//       {/* Parameter selector */}
//       {parameters.length > 0 && (
//         <div style={{ marginTop: 20 }}>
//           <label>
//             Parameter to Graph{' '}
//             <select
//               value={selectedParameter}
//               onChange={(e) => setSelectedParameter(e.target.value)}
//             >
//               <option value="">— choose parameter —</option>
//               {parameters.map((p) => (
//                 <option key={p} value={p}>
//                   {p}
//                 </option>
//               ))}
//             </select>
//           </label>
//         </div>
//       )}

//       {/* Chart */}
//       {chartData.length > 0 && (
//         <div style={{ marginTop: 32, width: "100%", height: 400 }}>
//           <ResponsiveContainer>
//             <LineChart data={chartData}>
//               <CartesianGrid strokeDasharray="3 3" />
//               <XAxis dataKey="date" />
//               <YAxis />
//               <Tooltip />
//               <Legend />
//               {selectedProfiles.map((name, idx) => (
//                 <Line
//                   key={name}
//                   type="monotone"
//                   dataKey={name}
//                   name={name}
//                   stroke={COLORS[idx % COLORS.length]}
//                   strokeWidth={2}
//                   dot={{ r: 4 }}
//                 />
//               ))}
//             </LineChart>
//           </ResponsiveContainer>
//         </div>
//       )}

//       {/* Table of values */}
//       {selectedParameter && comparisonRows.length > 0 && (
//         <div style={{ marginTop: 32, overflowX: "auto" }}>
//           <table
//             border="1"
//             cellPadding="6"
//             style={{ borderCollapse: "collapse", minWidth: 600 }}
//           >
//             <thead>
//               <tr>
//                 <th>Date</th>
//                 {selectedProfiles.map((name) => (
//                   <th key={name}>{name}</th>
//                 ))}
//               </tr>
//             </thead>
//             <tbody>
//               {comparisonRows
//                 .filter((r) => r.parameter === selectedParameter)
//                 .map((row, i) => (
//                   <tr key={i}>
//                     <td>{row.date}</td>
//                     {selectedProfiles.map((name) => {
//                       const cell = row[name] || {
//                         value: "—",
//                         unit: "",
//                         isAbnormal: false,
//                       };
//                       return (
//                         <td
//                           key={name}
//                           style={{
//                             backgroundColor: cell.isAbnormal
//                               ? "#f8d7d7"
//                               : undefined,
//                             color: cell.isAbnormal ? "#a00" : undefined,
//                             fontWeight: cell.isAbnormal ? "bold" : undefined,
//                           }}
//                         >
//                           {cell.value !== "—"
//                             ? `${cell.value} ${cell.unit}`
//                             : "—"}
//                         </td>
//                       );
//                     })}
//                   </tr>
//                 ))}
//             </tbody>
//           </table>
//         </div>
//       )}
//     </div>
//   );
// }
