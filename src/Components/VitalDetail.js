// import React, { useState, useEffect } from "react";
// import { useLocation } from "react-router-dom";
// import useDatabase from "../Components/useDatabase"; // ← your hook
// import {
//   LineChart,
//   Line,
//   XAxis,
//   YAxis,
//   CartesianGrid,
//   Tooltip,
//   ResponsiveContainer,
// } from "recharts";

// export default function VitalDetail() {
//   const { state } = useLocation();
//   const { db } = useDatabase();

//   // profile.name must match Vitals.profileName
//   const [profile, setProfile] = useState(null);
//   const [type, setType] = useState(""); // vitalName
//   // viewMode: graph vs table
//   const [viewMode, setViewMode] = useState("graph");

//   // period & custom-range
//   const [period, setPeriod] = useState("all");
//   const [fromDate, setFromDate] = useState("");
//   const [toDate, setToDate] = useState("");

//   // final data we’ll feed recharts / table
//   const [readings, setReadings] = useState([]);

//   // pull profile/type out of location.state:
//   useEffect(() => {
//     if (state?.profile && state?.type) {
//       setProfile(state.profile);
//       setType(state.type);
//     }
//   }, [state]);

//   // whenever db ⏤or⏤ filtering options change, re-query:
//   useEffect(() => {
//     if (!db || !profile || !type) return;

//     let sql = "";
//     let params = [profile.name, type];

//     switch (period) {
//       case "recent":
//         sql = `
//           SELECT
//             date || ' ' || replace(time, '.', ':') AS dateTime,
//             value,vitalNote
//           FROM Vitals
//           WHERE profileName = ?
//             AND vitalName   = ?
//           ORDER BY datetime(
//             date || ' ' || replace(time, '.', ':')
//           ) DESC
//           LIMIT 1;
//         `;
//         break;

//       case "daily":
//         sql = `
//         SELECT
//           date || ' ' || replace(time, '.', ':') AS dateTime,
//           value,vitalNote
//         FROM Vitals
//         WHERE profileName = ?
//           AND vitalName   = ?
//           AND date = date('now','localtime')
//         ORDER BY dateTime;
//         `;
//         break;

//       case "weekly":
//         sql = `
//         SELECT
//           strftime('%Y-%m-%d', date) AS dateTime,
//           AVG(value)                   AS value
//           NULL                         AS vitalNote
//         FROM Vitals
//         WHERE profileName = ?
//           AND vitalName   = ?
//           AND date >= date('now','-6 days','localtime')
//         GROUP BY dateTime
//         ORDER BY dateTime;
//         `;
//         break;

//       case "monthly":
//         sql = `
//         SELECT
//           month,
//           dateTime,
//           value,
//           vitalNote
//         FROM (
//           SELECT
//             strftime('%Y-%m', date)                                       AS month,
//             strftime(
//               '%Y-%m-%d %H:%M',
//               datetime(
//                 date || ' ' || replace(time, '.', ':')
//               )
//             )                                                              AS dateTime,
//             value,vitalNote
//             ROW_NUMBER() OVER (
//               PARTITION BY strftime('%Y-%m', date)
//               ORDER BY datetime(
//                 date || ' ' || replace(time, '.', ':')
//               ) DESC
//             )                                                              AS rn
//           FROM Vitals
//           WHERE profileName = ?
//             AND vitalName   = ?
//         )
//         WHERE rn = 1
//         ORDER BY month;
//         `;
//         break;

//       case "custom":
//         if (!fromDate || !toDate) {
//           setReadings([]);
//           return;
//         }
//         sql = `
//           SELECT date || ' ' || time AS dateTime, value,vitalNote
//           FROM Vitals
//           WHERE profileName = ?
//             AND vitalName   = ?
//             AND date BETWEEN ? AND ?
//           ORDER BY dateTime;
//         `;
//         params.push(fromDate, toDate);
//         break;

//       default:
//         break;
//     }

//     if (period === "all") {
//       if (!state?.readings?.length) return;
//       const transformed = state.readings
//         .map((r) => {
//           const dt = new Date(`${r.date} ${r.time}`);
//           return {
//             ...r,
//             dateTime: dt.getTime(),
//             dateLabel: dt.toLocaleString(),
//             value: Number(r.value),
//             vitalNote: r.vitalNote ?? r.note ?? null,
//           };
//         })
//         .sort((a, b) => a.dateTime - b.dateTime);
//       setReadings(transformed);
//     } else {
//       const result = db.exec(sql, params);
//       if (!result.length) {
//         setReadings([]);
//         return;
//       }
//       const { columns, values } = result[0];
//       const mapped = values.map((row) => {
//         const obj = columns.reduce((o, col, i) => {
//           o[col] = row[i];
//           return o;
//         }, {});
//         const dt = new Date(obj.dateTime);
//         return {
//           dateTime: dt.getTime(),
//           dateLabel: obj.dateTime,
//           value: Number(obj.value),
//           vitalNote: obj.vitalNote ?? null,
//         };
//       });
//       setReadings(mapped);
//     }
//   }, [db, profile, type, period, fromDate, toDate]);

//   if (!profile || !type) {
//     return <p>Loading…</p>;
//   }

//   return (
//     <div className="vitalDetailContainer">
//       <h2>
//         {type} Details for {profile.name}
//       </h2>

//       <div className="controls">
//         {/* Period buttons */}
//         {["all", "recent", "daily", "weekly", "monthly", "custom"].map((p) => (
//           <button
//             key={p}
//             onClick={() => setPeriod(p)}
//             className={period === p ? "active" : ""}
//           >
//             {p.charAt(0).toUpperCase() + p.slice(1)}
//           </button>
//         ))}

//         {/* Custom range inputs */}
//         {period === "custom" && (
//           <span className="date-range">
//             <label>
//               From{" "}
//               <input
//                 type="date"
//                 value={fromDate}
//                 onChange={(e) => setFromDate(e.target.value)}
//               />
//             </label>
//             <label>
//               To{" "}
//               <input
//                 type="date"
//                 value={toDate}
//                 onChange={(e) => setToDate(e.target.value)}
//               />
//             </label>
//           </span>
//         )}

//         {/* Graph vs Table */}
//         <button
//           onClick={() => setViewMode("graph")}
//           className={viewMode === "graph" ? "active" : ""}
//         >
//           Graph
//         </button>
//         <button
//           onClick={() => setViewMode("table")}
//           className={viewMode === "table" ? "active" : ""}
//         >
//           Table
//         </button>
//       </div>

//       {viewMode === "graph" ? (
//         <div style={{ width: "100%", height: 400 }}>
//           <ResponsiveContainer>
//             <LineChart
//               data={readings}
//               margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
//             >
//               <CartesianGrid stroke="#ccc" strokeDasharray="3 3" />
//               <XAxis
//                 dataKey="dateTime"
//                 tickFormatter={(ts) =>
//                   new Date(ts).toLocaleString("en-US", {
//                     month: "short",
//                     day: "2-digit",
//                     hour: "numeric",
//                     minute: "numeric",
//                   })
//                 }
//                 angle={-45}
//                 textAnchor="end"
//                 height={60}
//               />
//               <YAxis
//                 domain={["auto", "auto"]}
//                 label={{
//                   value: `${type}${
//                     readings[0]?.unit ? ` (${readings[0].unit})` : ""
//                   }`,
//                   angle: -90,
//                   position: "insideLeft",
//                 }}
//               />
//               <Tooltip
//                 labelFormatter={(ts) => new Date(ts).toLocaleString()}
//                 formatter={(v) => [v, type]}
//               />
//               <Line
//                 dataKey="value"
//                 stroke="#2196F3"
//                 strokeWidth={2}
//                 dot={{ r: 4 }}
//                 activeDot={{ r: 6 }}
//               />
//             </LineChart>
//           </ResponsiveContainer>
//         </div>
//       ) : (
//         <table className="vitalTable">
//           <thead>
//             <tr>
//               <th>Date & Time</th>
//               <th>Value{readings[0]?.unit ? ` (${readings[0].unit})` : ""}</th>
//               <th>Note</th>
//             </tr>
//           </thead>
//           <tbody>
//             {readings.map((r, i) => (
//               <tr key={i}>
//                 <td>{r.dateLabel}</td>
//                 <td>{r.value}</td>
//                 <td>{r.vitalNote ?? ""}</td>
//               </tr>
//             ))}
//           </tbody>
//         </table>
//       )}
//     </div>
//   );
// }

//uper wali ma note nai dsplay hora tha bs is waja sa comment kiya
import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import useDatabase from "../Components/useDatabase"; // ← your hook
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function VitalDetail() {
  const { state } = useLocation();
  const { db } = useDatabase();

  const [profile, setProfile] = useState(null);
  const [type, setType] = useState(""); // vitalName
  const [viewMode, setViewMode] = useState("graph");
  const [period, setPeriod] = useState("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [readings, setReadings] = useState([]);

  useEffect(() => {
    if (state?.profile && state?.type) {
      setProfile(state.profile);
      setType(state.type);
    }
  }, [state]);

  useEffect(() => {
    if (!db || !profile || !type) return;

    let sql = "";
    let params = [profile.name, type];

    switch (period) {
      case "recent":
        sql = `
          SELECT
            date || ' ' || replace(time, '.', ':') AS dateTime,
            value,
            unit,
            vitalNote
          FROM Vitals
          WHERE profileName = ?
            AND vitalName   = ?
          ORDER BY datetime(
            date || ' ' || replace(time, '.', ':')
          ) DESC
          LIMIT 1;
        `;
        break;

      case "daily":
        sql = `
          SELECT
            date || ' ' || replace(time, '.', ':') AS dateTime,
            value,
            unit,
            vitalNote
          FROM Vitals
          WHERE profileName = ?
            AND vitalName   = ?
            AND date = date('now','localtime')
          ORDER BY dateTime;
        `;
        break;

      case "weekly":
        sql = `
          SELECT
            strftime('%Y-%m-%d', date) AS dateTime,
            AVG(value)                   AS value,
            NULL                         AS unit,
            NULL                         AS vitalNote
          FROM Vitals
          WHERE profileName = ?
            AND vitalName   = ?
            AND date >= date('now','-6 days','localtime')
          GROUP BY dateTime
          ORDER BY dateTime;
        `;
        break;

      case "monthly":
        sql = `
          SELECT
            month,
            dateTime,
            value,
            unit,
            vitalNote
          FROM (
            SELECT
              strftime('%Y-%m', date)                                       AS month,
              strftime(
                '%Y-%m-%d %H:%M',
                datetime(
                  date || ' ' || replace(time, '.', ':')
                )
              )                                                              AS dateTime,
              value,
              unit,
              vitalNote,
              ROW_NUMBER() OVER (
                PARTITION BY strftime('%Y-%m', date)
                ORDER BY datetime(
                  date || ' ' || replace(time, '.', ':')
                ) DESC
              )                                                              AS rn
            FROM Vitals
            WHERE profileName = ?
              AND vitalName   = ?
          )
          WHERE rn = 1
          ORDER BY month;
        `;
        break;

      case "custom":
        if (!fromDate || !toDate) {
          setReadings([]);
          return;
        }
        sql = `
          SELECT date || ' ' || replace(time, '.', ':') AS dateTime,
                 value,
                 unit,
                 vitalNote
          FROM Vitals
          WHERE profileName = ?
            AND vitalName   = ?
            AND date BETWEEN ? AND ?
          ORDER BY dateTime;
        `;
        params.push(fromDate, toDate);
        break;

      default:
        break;
    }

    // ALWAYS query DB for 'all' — do NOT rely on state.readings for note completeness
    if (period === "all") {
      const q = `
        SELECT date || ' ' || replace(time, '.', ':') AS dateTime,
               value,
               unit,
               vitalNote
        FROM Vitals
        WHERE profileName = ?
          AND vitalName   = ?
        ORDER BY datetime(date || ' ' || replace(time, '.', ':'));
      `;
      try {
        const res = db.exec(q, [profile.name, type]);
        console.log("[VitalDetail] ALL raw result:", res);
        if (!res.length) {
          setReadings([]);
          return;
        }
        const { columns, values } = res[0];
        const mapped = values.map((row) => {
          const obj = columns.reduce((o, col, i) => {
            o[col] = row[i];
            return o;
          }, {});
          const dt = new Date(obj.dateTime);
          return {
            dateTime: isNaN(dt.getTime()) ? Date.now() : dt.getTime(),
            dateLabel: obj.dateTime,
            value: Number(obj.value),
            unit: obj.unit ?? "",
            vitalNote: obj.vitalNote ?? null,
          };
        });
        console.log(
          "[VitalDetail] ALL mapped rows (first 5):",
          mapped.slice(0, 5)
        );
        setReadings(mapped);
      } catch (err) {
        console.error("[VitalDetail] ALL query error:", err, q, [
          profile.name,
          type,
        ]);
        setReadings([]);
      }
      return;
    }

    // non-'all' branches
    try {
      const result = db.exec(sql, params);
      console.log("DB result for period", period, { sql, params, result });
      if (!result.length) {
        setReadings([]);
        return;
      }
      const { columns, values } = result[0];
      const mapped = values.map((row) => {
        const obj = columns.reduce((o, col, i) => {
          o[col] = row[i];
          return o;
        }, {});
        const dt = new Date(obj.dateTime);
        return {
          dateTime: isNaN(dt.getTime()) ? Date.now() : dt.getTime(),
          dateLabel: obj.dateTime,
          value: Number(obj.value),
          unit: obj.unit ?? "",
          vitalNote: obj.vitalNote ?? null,
        };
      });
      console.log("[VitalDetail] mapped rows:", mapped.slice(0, 5));
      setReadings(mapped);
    } catch (err) {
      console.error("SQL execution error:", err, sql, params);
      setReadings([]);
    }
  }, [db, profile, type, period, fromDate, toDate, state]);

  if (!profile || !type) {
    return <p>Loading…</p>;
  }

  return (
    <div className="vitalDetailContainer">
      <h2>
        {type} Details for {profile.name}
      </h2>

      <div className="controls">
        {["all", "recent", "daily", "weekly", "monthly", "custom"].map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={period === p ? "active" : ""}
          >
            {p.charAt(0).toUpperCase() + p.slice(1)}
          </button>
        ))}

        {period === "custom" && (
          <span className="date-range">
            <label>
              From{" "}
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
              />
            </label>
            <label>
              To{" "}
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
              />
            </label>
          </span>
        )}

        <button
          onClick={() => setViewMode("graph")}
          className={viewMode === "graph" ? "active" : ""}
        >
          Graph
        </button>
        <button
          onClick={() => setViewMode("table")}
          className={viewMode === "table" ? "active" : ""}
        >
          Table
        </button>
      </div>

      {viewMode === "graph" ? (
        <div style={{ width: "100%", height: 400 }}>
          <ResponsiveContainer>
            <LineChart
              data={readings}
              margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
            >
              <CartesianGrid stroke="#ccc" strokeDasharray="3 3" />
              <XAxis
                dataKey="dateTime"
                tickFormatter={(ts) =>
                  new Date(ts).toLocaleString("en-US", {
                    month: "short",
                    day: "2-digit",
                    hour: "numeric",
                    minute: "numeric",
                  })
                }
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis
                domain={["auto", "auto"]}
                label={{
                  value: `${type}${
                    readings[0]?.unit ? ` (${readings[0].unit})` : ""
                  }`,
                  angle: -90,
                  position: "insideLeft",
                }}
              />
              <Tooltip
                labelFormatter={(ts) => new Date(ts).toLocaleString()}
                formatter={(v) => [v, type]}
              />
              <Line
                dataKey="value"
                stroke="#2196F3"
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <table className="vitalTable">
          <thead>
            <tr>
              <th>Date & Time</th>
              <th>Value{readings[0]?.unit ? ` (${readings[0].unit})` : ""}</th>
              <th>Note</th>
            </tr>
          </thead>
          <tbody>
            {readings.map((r, i) => (
              <tr key={i}>
                <td>{r.dateLabel}</td>
                <td>
                  {r.value} {r.unit ?? ""}
                </td>
                <td>{r.vitalNote ?? ""}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
