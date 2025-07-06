// // CompareVitals.jsx
// import React, { useEffect, useState, useMemo } from "react";
// import useDatabase from "./useDatabase";
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

// // A simple color palette for chart lines
// const COLORS = [
//   "#8884d8", // purple
//   "#82ca9d", // green
//   "#ff7300", // orange
//   "#ff0000", // red
//   "#00aaff", // blue
//   "#aa00ff", // magenta
//   "#ffdd00", // yellow
// ];

// export default function CompareVitals() {
//   const { db } = useDatabase();
//   const location = useLocation();

//   const [profiles, setProfiles] = useState([]);
//   const [selectedProfiles, setSelectedProfiles] = useState(
//     location.state?.baseProfile ? [location.state.baseProfile.name] : []
//   );
//   const [vitalTypes, setVitalTypes] = useState([]);
//   const [selectedVital, setSelectedVital] = useState("");
//   const [bpComponent, setBpComponent] = useState("systolic");
//   const [fromDate, setFromDate] = useState("");
//   const [toDate, setToDate] = useState("");
//   const [comparisonRows, setComparisonRows] = useState([]);

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

//   // Load vital types
//   useEffect(() => {
//     if (!db) return;
//     const stmt = db.prepare(
//       "SELECT DISTINCT vitalName, minValue, maxValue FROM Vitals"
//     );
//     const out = [];
//     while (stmt.step()) out.push(stmt.getAsObject());
//     stmt.free();
//     setVitalTypes(out);
//   }, [db]);

//   // Compare handler
//   const handleCompare = () => {
//     if (
//       !db ||
//       !selectedVital ||
//       selectedProfiles.length < 2 ||
//       !fromDate ||
//       !toDate
//     ) {
//       alert("Select at least 2 profiles, a vital, and date range.");
//       return;
//     }
//     const placeholders = selectedProfiles.map(() => "?").join(",");
//     const sql = `
//       SELECT profileName, date, time, value, unit, minValue, maxValue
//       FROM Vitals
//       WHERE vitalName = ?
//         AND profileName IN (${placeholders})
//         AND date BETWEEN ? AND ?
//       ORDER BY date, profileName
//     `;
//     const stmt = db.prepare(sql);
//     stmt.bind([selectedVital, ...selectedProfiles, fromDate, toDate]);

//     const rows = [];
//     while (stmt.step()) rows.push(stmt.getAsObject());
//     stmt.free();

//     const pivot = {};
//     rows.forEach((r) => {
//       let num = parseFloat(r.value);
//       if (selectedVital.toLowerCase() === "bloodpressure") {
//         const [sys, dia] = r.value.split("/").map(parseFloat);
//         num = bpComponent === "diastolic" ? dia : sys;
//       }
//       const abnormal =
//         !isNaN(num) &&
//         ((r.minValue != null && num < r.minValue) ||
//           (r.maxValue != null && num > r.maxValue));

//       if (!pivot[r.date]) pivot[r.date] = { date: r.date };
//       pivot[r.date][r.profileName] = {
//         value: num,
//         unit: r.unit,
//         isAbnormal: abnormal,
//       };
//     });

//     setComparisonRows(Object.values(pivot));
//   };

//   // Build chart data
//   const chartData = useMemo(
//     () =>
//       comparisonRows.map((row) => {
//         const point = { date: row.date };
//         selectedProfiles.forEach((name) => {
//           point[name] = row[name]?.value ?? null;
//         });
//         return point;
//       }),
//     [comparisonRows, selectedProfiles]
//   );

//   return (
//     <div style={{ padding: 20, fontFamily: "Arial, sans-serif" }}>
//       <h2 style={{ textAlign: "center" }}>Compare Vitals</h2>

//       {/* Controls */}
//       <div style={{ marginBottom: 16 }}>
//         <label>
//           Vital{" "}
//           <select
//             value={selectedVital}
//             onChange={(e) => setSelectedVital(e.target.value)}
//           >
//             <option value="">— choose vital —</option>
//             {vitalTypes.map(({ vitalName }) => (
//               <option key={vitalName} value={vitalName}>
//                 {vitalName}
//               </option>
//             ))}
//           </select>
//         </label>

//         {selectedVital.toLowerCase() === "bloodpressure" && (
//           <span style={{ marginLeft: 16 }}>
//             <label>
//               <input
//                 type="radio"
//                 name="bpComp"
//                 value="systolic"
//                 checked={bpComponent === "systolic"}
//                 onChange={() => setBpComponent("systolic")}
//               />{" "}
//               Systolic
//             </label>
//             <label style={{ marginLeft: 12 }}>
//               <input
//                 type="radio"
//                 name="bpComp"
//                 value="diastolic"
//                 checked={bpComponent === "diastolic"}
//                 onChange={() => setBpComponent("diastolic")}
//               />{" "}
//               Diastolic
//             </label>
//           </span>
//         )}

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

//       {/* Profile selection */}
//       <div style={{ marginBottom: 16 }}>
//         <strong>Select Profiles:</strong>
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
//           !selectedVital || selectedProfiles.length < 2 || !fromDate || !toDate
//         }
//       >
//         Run Comparison
//       </button>

//       {/* Combined Line Chart with distinct colors */}
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
//                   dot={{ r: 3 }}
//                 />
//               ))}
//             </LineChart>
//           </ResponsiveContainer>
//         </div>
//       )}

//       {/* Table */}
//       {comparisonRows.length > 0 && (
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
//               {comparisonRows.map((row, i) => (
//                 <tr key={i}>
//                   <td>{row.date}</td>
//                   {selectedProfiles.map((name) => {
//                     const cell = row[name] || {
//                       value: "—",
//                       unit: "",
//                       isAbnormal: false,
//                     };
//                     return (
//                       <td
//                         key={name}
//                         style={{
//                           backgroundColor: cell.isAbnormal
//                             ? "#f8d7d7"
//                             : undefined,
//                           color: cell.isAbnormal ? "#a00" : undefined,
//                           fontWeight: cell.isAbnormal ? "bold" : undefined,
//                         }}
//                       >
//                         {cell.value !== "—"
//                           ? `${cell.value} ${cell.unit}`
//                           : "—"}
//                       </td>
//                     );
//                   })}
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         </div>
//       )}
//     </div>
//   );
// }

// above code is accurate

import React, { useEffect, useState, useMemo } from "react";
import useDatabase from "./useDatabase";
import { useLocation } from "react-router-dom";
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

// A simple color palette for chart lines
const COLORS = [
  "#8884d8", // purple
  "#82ca9d", // green
  "#ff7300", // orange
  "#ff0000", // red
  "#00aaff", // blue
  "#aa00ff", // magenta
  "#ffdd00", // yellow
];

export default function CompareVitals() {
  const { db } = useDatabase();
  const location = useLocation();

  const [profiles, setProfiles] = useState([]);
  const [selectedProfiles, setSelectedProfiles] = useState(
    location.state?.baseProfile ? [location.state.baseProfile.name] : []
  );
  const [vitalTypes, setVitalTypes] = useState([]);
  const [selectedVital, setSelectedVital] = useState("");
  const [bpComponent, setBpComponent] = useState("systolic");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [comparisonRows, setComparisonRows] = useState([]);

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

  // Load vital types
  useEffect(() => {
    if (!db) return;
    const stmt = db.prepare(
      "SELECT DISTINCT vitalName, minValue, maxValue FROM Vitals"
    );
    const out = [];
    while (stmt.step()) out.push(stmt.getAsObject());
    stmt.free();
    setVitalTypes(out);
  }, [db]);

  // Compare handler
  const handleCompare = () => {
    if (
      !db ||
      !selectedVital ||
      selectedProfiles.length !== 2 || // require exactly two
      !fromDate ||
      !toDate
    ) {
      alert("Select exactly 2 profiles, a vital, and date range.");
      return;
    }
    const placeholders = selectedProfiles.map(() => "?").join(",");
    const sql = `
      SELECT profileName, date, time, value, unit, minValue, maxValue
      FROM Vitals
      WHERE vitalName = ?
        AND profileName IN (${placeholders})
        AND date BETWEEN ? AND ?
      ORDER BY date, profileName
    `;
    const stmt = db.prepare(sql);
    stmt.bind([selectedVital, ...selectedProfiles, fromDate, toDate]);

    const rows = [];
    while (stmt.step()) rows.push(stmt.getAsObject());
    stmt.free();

    const pivot = {};
    rows.forEach((r) => {
      let num = parseFloat(r.value);
      if (selectedVital.toLowerCase() === "bloodpressure") {
        const [sys, dia] = r.value.split("/").map(parseFloat);
        num = bpComponent === "diastolic" ? dia : sys;
      }
      const abnormal =
        !isNaN(num) &&
        ((r.minValue != null && num < r.minValue) ||
          (r.maxValue != null && num > r.maxValue));

      if (!pivot[r.date]) pivot[r.date] = { date: r.date };
      pivot[r.date][r.profileName] = {
        value: num,
        unit: r.unit,
        isAbnormal: abnormal,
      };
    });

    setComparisonRows(Object.values(pivot));
  };

  // Build chart data
  const chartData = useMemo(
    () =>
      comparisonRows.map((row) => {
        const point = { date: row.date };
        selectedProfiles.forEach((name) => {
          point[name] = row[name]?.value ?? null;
        });
        return point;
      }),
    [comparisonRows, selectedProfiles]
  );

  return (
    <div style={{ padding: 20, fontFamily: "Arial, sans-serif" }}>
      <h2 style={{ textAlign: "center" }}>Compare Vitals</h2>

      {/* Controls */}
      <div style={{ marginBottom: 16 }}>
        <label>
          Vital{" "}
          <select
            value={selectedVital}
            onChange={(e) => setSelectedVital(e.target.value)}
          >
            <option value="">— choose vital —</option>
            {vitalTypes.map(({ vitalName }) => (
              <option key={vitalName} value={vitalName}>
                {vitalName}
              </option>
            ))}
          </select>
        </label>

        {selectedVital.toLowerCase() === "bloodpressure" && (
          <span style={{ marginLeft: 16 }}>
            <label>
              <input
                type="radio"
                name="bpComp"
                value="systolic"
                checked={bpComponent === "systolic"}
                onChange={() => setBpComponent("systolic")}
              />{" "}
              Systolic
            </label>
            <label style={{ marginLeft: 12 }}>
              <input
                type="radio"
                name="bpComp"
                value="diastolic"
                checked={bpComponent === "diastolic"}
                onChange={() => setBpComponent("diastolic")}
              />{" "}
              Diastolic
            </label>
          </span>
        )}

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

      {/* Profile selection */}
      <div style={{ marginBottom: 16 }}>
        <strong>Select Profiles (max 2):</strong>
        {profiles.map((p) => (
          <label key={p.id} style={{ marginLeft: 8 }}>
            <input
              type="checkbox"
              value={p.name}
              checked={selectedProfiles.includes(p.name)}
              disabled={
                !selectedProfiles.includes(p.name) &&
                selectedProfiles.length >= 2
              }
              onChange={(e) => {
                const name = e.target.value;
                setSelectedProfiles((prev) =>
                  prev.includes(name)
                    ? prev.filter((x) => x !== name)
                    : [...prev, name]
                );
              }}
            />{" "}
            {p.name} ({p.relation})
          </label>
        ))}
      </div>

      <button
        onClick={handleCompare}
        disabled={
          !selectedVital ||
          selectedProfiles.length !== 2 ||
          !fromDate ||
          !toDate
        }
      >
        Run Comparison
      </button>

      {/* Combined Line Chart with distinct colors */}
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
                  dot={{ r: 3 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Table */}
      {comparisonRows.length > 0 && (
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
              {comparisonRows.map((row, i) => (
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
