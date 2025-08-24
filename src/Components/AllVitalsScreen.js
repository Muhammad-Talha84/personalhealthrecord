// import React, { useEffect, useState, useMemo } from "react";
// import { useNavigate, useLocation } from "react-router-dom";
// import "../CSS/AllVitals.css";
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

// const AllVitalsScreen = () => {
//   const navigate = useNavigate();
//   const { state } = useLocation();
//   const { profile } = state || {};
//   const { db } = useDatabase();

//   const [vitals, setVitals] = useState([]);

//   useEffect(() => {
//     if (!db || !profile) return;
//     const stmt = db.prepare("SELECT * FROM Vitals WHERE profileName = ?");
//     stmt.bind([profile.name]);
//     const rows = [];
//     while (stmt.step()) rows.push(stmt.getAsObject());
//     stmt.free();
//     setVitals(rows);
//   }, [db, profile]);

//   const chartDatasets = useMemo(() => {
//     // group vitals by type
//     const grouped = vitals.reduce((acc, v) => {
//       const type = v.vitalName;
//       if (!acc[type]) acc[type] = [];

//       // normalize time (replace dots with colons)
//       const timeStr = v.time ? v.time.replace(/\./g, ":") : "";
//       const dateTimeStr = `${v.date} ${timeStr}`;
//       const datetime = new Date(dateTimeStr);

//       // parse values
//       let value = null;
//       let systolic = null;
//       let diastolic = null;

//       if (type.toLowerCase() === "bloodpressure") {
//         const raw = v.value?.toString() || "";
//         if (raw.includes("/")) {
//           const [sys, dia] = raw.split("/");
//           systolic = Number(sys) || null;
//           diastolic = Number(dia) || null;
//         } else {
//           // fallback to explicit columns
//           systolic = v.maxValue != null ? Number(v.maxValue) : null;
//           diastolic = v.minValue != null ? Number(v.minValue) : null;
//         }
//       } else {
//         value = v.value != null ? Number(v.value) : null;
//       }

//       acc[type].push({ datetime, value, systolic, diastolic });
//       return acc;
//     }, {});

//     // build dataset array
//     return Object.entries(grouped).map(([type, entries]) => ({
//       type,
//       data: entries
//         .sort((a, b) => a.datetime - b.datetime)
//         .map(({ datetime, value, systolic, diastolic }) => ({
//           datetime: datetime.toLocaleString(),
//           value,
//           systolic,
//           diastolic,
//         })),
//     }));
//   }, [vitals]);

//   return (
//     <div className="all-vitals-container">
//       <h1>All Vitals Overview</h1>
//       <div className="chart-grid">
//         {chartDatasets.map(({ type, data }) => (
//           <div key={type} className="chart-card">
//             <h2>{type}</h2>
//             {data.length > 0 ? (
//               <ResponsiveContainer width="100%" height={250}>
//                 <LineChart data={data}>
//                   <CartesianGrid strokeDasharray="3 3" />
//                   <XAxis dataKey="datetime" />
//                   <YAxis />
//                   <Tooltip />
//                   <Legend />
//                   {type.toLowerCase() === "bloodpressure" ? (
//                     <>
//                       <Line
//                         type="monotone"
//                         dataKey="systolic"
//                         name="Systolic"
//                         stroke="#8884d8"
//                         strokeWidth={2}
//                         dot={{ r: 3 }}
//                       />
//                       <Line
//                         type="monotone"
//                         dataKey="diastolic"
//                         name="Diastolic"
//                         stroke="#82ca9d"
//                         strokeWidth={2}
//                         dot={{ r: 3 }}
//                       />
//                     </>
//                   ) : (
//                     <Line
//                       type="monotone"
//                       dataKey="value"
//                       name={type}
//                       stroke="#8884d8"
//                       strokeWidth={2}
//                       dot={{ r: 3 }}
//                     />
//                   )}
//                 </LineChart>
//               </ResponsiveContainer>
//             ) : (
//               <p>No data for {type}</p>
//             )}
//             <button
//               onClick={() =>
//                 navigate(
//                   type.toLowerCase() === "bloodpressure"
//                     ? "/bpgraph"
//                     : "/vitaldetail",
//                   {
//                     state: {
//                       profile,
//                       type,
//                       readings: vitals
//                         .filter((v) => v.vitalName === type)
//                         .sort(
//                           (a, b) =>
//                             new Date(
//                               `${a.date} ${a.time.replace(/\./g, ":")}`
//                             ) -
//                             new Date(`${b.date} ${b.time.replace(/\./g, ":")}`)
//                         ),
//                     },
//                   }
//                 )
//               }
//             >
//               View Details
//             </button>
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// };

// export default AllVitalsScreen;

import React, { useEffect, useState, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "../CSS/AllVitals.css";
import useDatabase from "../Components/useDatabase";
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
import jsPDF from "jspdf";

const AllVitalsScreen = () => {
  const navigate = useNavigate();
  const { state } = useLocation();
  const { profile } = state || {};
  const { db } = useDatabase();

  const [vitals, setVitals] = useState([]);

  useEffect(() => {
    if (!db || !profile) return;
    const stmt = db.prepare("SELECT * FROM Vitals WHERE profileName = ?");
    stmt.bind([profile.name]);
    const rows = [];
    while (stmt.step()) rows.push(stmt.getAsObject());
    stmt.free();
    setVitals(rows);
  }, [db, profile]);

  const chartDatasets = useMemo(() => {
    const grouped = vitals.reduce((acc, v) => {
      const type = v.vitalName;
      if (!acc[type]) acc[type] = [];
      const timeStr = v.time ? v.time.replace(/\./g, ":") : "";
      const datetime = new Date(`${v.date} ${timeStr}`);
      let value = null;
      let systolic = null;
      let diastolic = null;
      if (type.toLowerCase() === "bloodpressure") {
        const raw = v.value?.toString() || "";
        if (raw.includes("/")) {
          [systolic, diastolic] = raw.split("/").map((n) => Number(n) || null);
        } else {
          systolic = v.maxValue != null ? Number(v.maxValue) : null;
          diastolic = v.minValue != null ? Number(v.minValue) : null;
        }
      } else {
        value = v.value != null ? Number(v.value) : null;
      }
      acc[type].push({ datetime, value, systolic, diastolic, rawEntry: v });
      return acc;
    }, {});

    return Object.entries(grouped).map(([type, entries]) => ({
      type,
      data: entries
        .sort((a, b) => a.datetime - b.datetime)
        .map(({ datetime, value, systolic, diastolic }) => ({
          datetime: datetime.toLocaleString(),
          value,
          systolic,
          diastolic,
        })),
      raw: entries.map((e) => e.rawEntry),
    }));
  }, [vitals]);

  const downloadTxt = (items, fileName) => {
    const header = "Type,Date,Time,Value,Systolic,Diastolic\n";
    const lines = items.map((v) => {
      const [sys, dia] =
        v.vitalName.toLowerCase() === "bloodpressure"
          ? [v.systolic || v.maxValue, v.diastolic || v.minValue]
          : ["", ""];
      const val = v.value != null ? v.value : "";
      return `${v.vitalName},${v.date},${v.time},${val},${sys},${dia}`;
    });
    const blob = new Blob([header + lines.join("\n")], { type: "text/plain" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = fileName;
    link.click();
  };

  const downloadPdf = (items, fileName) => {
    const doc = new jsPDF();
    doc.setFontSize(12);
    let y = 10;
    doc.text("Vitals Report", 10, y);
    y += 10;
    doc.setFontSize(10);
    items.forEach((v) => {
      const entryVal =
        v.value != null ? v.value : `${v.maxValue}/${v.minValue}`;
      const line = `${v.vitalName} - ${v.date} ${v.time}: ${entryVal}`;
      doc.text(line, 10, y);
      y += 7;
      if (y > 280) {
        doc.addPage();
        y = 10;
      }
    });
    doc.save(fileName);
  };

  const getLatestEntries = () => {
    return chartDatasets.map(
      ({ raw }) =>
        raw.sort(
          (a, b) =>
            new Date(`${b.date} ${b.time.replace(/\./g, ":")}`) -
            new Date(`${a.date} ${a.time.replace(/\./g, ":")}`)
        )[0]
    );
  };

  const handleDownloadLatestTxt = () => {
    const latest = getLatestEntries();
    downloadTxt(latest, `latest_vitals_${profile.name}.txt`);
  };

  const handleDownloadLatestPdf = () => {
    const latest = getLatestEntries();
    downloadPdf(latest, `latest_vitals_${profile.name}.pdf`);
  };

  const handleDownloadAllTxt = () => {
    downloadTxt(vitals, `all_vitals_${profile.name}.txt`);
  };

  const handleDownloadAllPdf = () => {
    downloadPdf(vitals, `all_vitals_${profile.name}.pdf`);
  };

  return (
    <div className="all-vitals-container">
      <h1>All Vitals Overview</h1>
      <div className="download-controls">
        <button onClick={handleDownloadLatestTxt}>
          Download Latest Vitals (TXT)
        </button>
        <button onClick={handleDownloadLatestPdf}>
          Download Latest Vitals (PDF)
        </button>
        <button onClick={handleDownloadAllTxt}>
          Download All Vitals (TXT)
        </button>
        <button onClick={handleDownloadAllPdf}>
          Download All Vitals (PDF)
        </button>
      </div>

      <div className="chart-grid">
        {chartDatasets.map(({ type, data }) => (
          <div key={type} className="chart-card">
            <h2>{type}</h2>
            {data.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="datetime" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  {type.toLowerCase() === "bloodpressure" ? (
                    <>
                      <Line
                        type="monotone"
                        dataKey="systolic"
                        name="Systolic"
                        stroke="#8884d8"
                        strokeWidth={2}
                        dot={{ r: 3 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="diastolic"
                        name="Diastolic"
                        stroke="#82ca9d"
                        strokeWidth={2}
                        dot={{ r: 3 }}
                      />
                    </>
                  ) : (
                    <Line
                      type="monotone"
                      dataKey="value"
                      name={type}
                      stroke="#8884d8"
                      strokeWidth={2}
                      dot={{ r: 3 }}
                    />
                  )}
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p>No data for {type}</p>
            )}
            <button
              onClick={() =>
                navigate(
                  type.toLowerCase() === "bloodpressure"
                    ? "/bpgraph"
                    : "/vitaldetail",
                  {
                    state: {
                      profile,
                      type,
                      readings: vitals
                        .filter((v) => v.vitalName === type)
                        .sort(
                          (a, b) =>
                            new Date(
                              `${a.date} ${a.time.replace(/\./g, ":")}`
                            ) -
                            new Date(`${b.date} ${b.time.replace(/\./g, ":")}`)
                        ),
                    },
                  }
                )
              }
            >
              View Details
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AllVitalsScreen;
