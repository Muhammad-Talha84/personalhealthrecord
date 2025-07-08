// import React, { useEffect, useState, useMemo } from "react";
// import { useNavigate, useLocation } from "react-router-dom";
// import useDatabase from "../Components/useDatabase";
// import "../CSS/AllReportsScreen.css";

// const AllReportsScreen = () => {
//   const navigate = useNavigate();
//   const location = useLocation();
//   const { profile } = location.state || {};
//   const { db } = useDatabase();

//   const [labReports, setLabReports] = useState([]);
//   const [showAllDates, setShowAllDates] = useState(false);

//   // Fetch LabReports
//   useEffect(() => {
//     if (!db || !profile) return;
//     const stmt = db.prepare("SELECT * FROM LabReports WHERE profileName = ?");
//     stmt.bind([profile.name]);
//     const rows = [];
//     while (stmt.step()) rows.push(stmt.getAsObject());
//     stmt.free();
//     setLabReports(rows);
//   }, [db, profile]);

//   // Group reports by testName → date
//   const reportsByTest = useMemo(
//     () =>
//       labReports.reduce((acc, r) => {
//         if (!acc[r.testName]) acc[r.testName] = {};
//         if (!acc[r.testName][r.date]) acc[r.testName][r.date] = [];
//         acc[r.testName][r.date].push(r);
//         return acc;
//       }, {}),
//     [labReports]
//   );

//   // Latest for each test
//   const latestByTest = useMemo(
//     () =>
//       Object.entries(reportsByTest).map(([testName, dateGroups]) => {
//         const latestDate = Object.keys(dateGroups).sort(
//           (a, b) => new Date(b) - new Date(a)
//         )[0];
//         return { testName, date: latestDate, reports: dateGroups[latestDate] };
//       }),
//     [reportsByTest]
//   );

//   return (
//     <div className="all-reports-container">
//       <h1>All Lab Reports</h1>
//       {profile && <h2>{profile.name}'s Reports</h2>}

//       <div className="toggle-buttons">
//         <button onClick={() => setShowAllDates(false)}>Latest Only</button>
//         <button onClick={() => setShowAllDates(true)}>Show All Dates</button>
//       </div>

//       <div className="reports-grid">
//         {showAllDates
//           ? Object.entries(reportsByTest).map(([testName, dateGroups]) => (
//               <div key={testName} className="report-card">
//                 <h3>{testName}</h3>
//                 {Object.entries(dateGroups)
//                   .sort(([d1], [d2]) => new Date(d2) - new Date(d1))
//                   .map(([date, reports]) => (
//                     <div key={date} className="report-group">
//                       <h4>{date}</h4>
//                       {reports.map((r) => (
//                         <p key={r.id || r.parameter}>
//                           {r.parameter}: {r.result} {r.unit || ""}
//                         </p>
//                       ))}
//                     </div>
//                   ))}
//               </div>
//             ))
//           : latestByTest.map(({ testName, date, reports }) => (
//               <div key={testName} className="report-card">
//                 <h3>
//                   {testName} <small>({date})</small>
//                 </h3>
//                 {reports.map((r) => (
//                   <p key={r.id || r.parameter}>
//                     {r.parameter}: {r.result} {r.unit || ""}
//                   </p>
//                 ))}
//               </div>
//             ))}
//       </div>

//       <div className="actions">
//         <button onClick={() => navigate(-1)}>Back</button>
//         <button onClick={() => navigate("/addreport", { state: { profile } })}>
//           Add Lab Report
//         </button>
//       </div>
//     </div>
//   );
// };

// export default AllReportsScreen;

//REPORTS DOWNLOAD IN PDF FORM CODE
// import React, { useEffect, useState, useMemo } from "react";
// import { useNavigate, useLocation } from "react-router-dom";
// import useDatabase from "../Components/useDatabase";
// import jsPDF from "jspdf";
// import autoTable from "jspdf-autotable";
// import "../CSS/AllReportsScreen.css";

// const AllReportsScreen = () => {
//   const navigate = useNavigate();
//   const location = useLocation();
//   const { profile } = location.state || {};
//   const { db } = useDatabase();

//   const [labReports, setLabReports] = useState([]);
//   const [showAllDates, setShowAllDates] = useState(false);

//   // Fetch LabReports (including min/max range fields)
//   useEffect(() => {
//     if (!db || !profile) return;
//     const stmt = db.prepare(
//       `SELECT testName, date, parameter, result, unit, minValue, maxValue
//        FROM LabReports WHERE profileName = ?`
//     );
//     stmt.bind([profile.name]);
//     const rows = [];
//     while (stmt.step()) rows.push(stmt.getAsObject());
//     stmt.free();
//     setLabReports(rows);
//   }, [db, profile]);

//   // Group reports by testName → date
//   const reportsByTest = useMemo(
//     () =>
//       labReports.reduce((acc, r) => {
//         if (!acc[r.testName]) acc[r.testName] = {};
//         if (!acc[r.testName][r.date]) acc[r.testName][r.date] = [];
//         acc[r.testName][r.date].push(r);
//         return acc;
//       }, {}),
//     [labReports]
//   );

//   // Latest for each test
//   const latestByTest = useMemo(
//     () =>
//       Object.entries(reportsByTest).map(([testName, dateGroups]) => {
//         const latestDate = Object.keys(dateGroups).sort(
//           (a, b) => new Date(b) - new Date(a)
//         )[0];
//         return { testName, date: latestDate, reports: dateGroups[latestDate] };
//       }),
//     [reportsByTest]
//   );

//   // PDF generation with abnormal highlighting
//   const generatePdf = (title, dataArray) => {
//     const doc = new jsPDF();
//     doc.setFontSize(16);
//     doc.text(`${profile.name} - ${title}`, 14, 20);
//     const headers = [
//       "Test Name",
//       "Date",
//       "Parameter",
//       "Result",
//       "Unit",
//       "Range",
//     ];
//     const body = dataArray.map((row) => [
//       row.testName,
//       row.date,
//       row.parameter,
//       String(row.result),
//       row.unit || "",
//       `${row.minValue}-${row.maxValue}`,
//     ]);

//     autoTable(doc, {
//       head: [headers],
//       body,
//       startY: 30,
//       styles: { fontSize: 10 },
//       didParseCell: (data) => {
//         if (data.section === "body" && data.column.index === 3) {
//           const val = parseFloat(data.cell.raw);
//           const [min, max] = data.row.raw[5].split("-").map(parseFloat);
//           if (val < min || val > max) data.cell.styles.textColor = [255, 0, 0];
//         }
//       },
//     });

//     doc.save(
//       `${profile.name.replace(/\s+/g, "_")}_${title.replace(/\s+/g, "_")}.pdf`
//     );
//   };

//   const handleDownloadLatest = () => {
//     const rows = latestByTest.flatMap((item) =>
//       item.reports.map((r) => ({
//         testName: item.testName,
//         date: item.date,
//         parameter: r.parameter,
//         result: r.result,
//         unit: r.unit,
//         minValue: r.minValue,
//         maxValue: r.maxValue,
//       }))
//     );
//     generatePdf("Latest_Reports", rows);
//   };

//   const handleDownloadAll = () => {
//     const rows = [];
//     Object.entries(reportsByTest).forEach(([testName, dateGroups]) => {
//       Object.entries(dateGroups).forEach(([date, reports]) => {
//         reports.forEach((r) =>
//           rows.push({
//             testName,
//             date,
//             parameter: r.parameter,
//             result: r.result,
//             unit: r.unit,
//             minValue: r.minValue,
//             maxValue: r.maxValue,
//           })
//         );
//       });
//     });
//     generatePdf("All_Reports", rows);
//   };

//   // Screen abnormal check
//   const isAbnormal = (r) => r.result < r.minValue || r.result > r.maxValue;

//   return (
//     <div className="all-reports-container">
//       <h1>All Lab Reports</h1>
//       {profile && <h2>{profile.name}'s Reports</h2>}

//       <div className="toggle-buttons">
//         <button onClick={() => setShowAllDates(false)}>Latest Only</button>
//         <button onClick={() => setShowAllDates(true)}>Show All Dates</button>
//       </div>

//       <div className="reports-grid">
//         {(showAllDates
//           ? Object.entries(reportsByTest)
//           : latestByTest.map((item) => [
//               item.testName,
//               { [item.date]: item.reports },
//             ])
//         ).map(([testName, dateGroups]) => (
//           <div key={testName} className="report-card">
//             <h3>{testName}</h3>
//             {Object.entries(dateGroups)
//               .sort(([d1], [d2]) => new Date(d2) - new Date(d1))
//               .map(([date, reports]) => (
//                 <div key={date} className="report-group">
//                   <h4>{date}</h4>
//                   {reports.map((r) => (
//                     <p
//                       key={r.parameter}
//                       style={{ color: isAbnormal(r) ? "red" : "inherit" }}
//                     >
//                       {r.parameter}: {r.result} {r.unit || ""}
//                       <small>
//                         {" "}
//                         (Range: {r.minValue}-{r.maxValue})
//                       </small>
//                     </p>
//                   ))}
//                 </div>
//               ))}
//           </div>
//         ))}
//       </div>

//       <div className="actions">
//         <button onClick={() => navigate(-1)}>Back</button>
//         <button onClick={handleDownloadLatest}>Download Latest PDF</button>
//         <button onClick={handleDownloadAll}>Download All PDF</button>
//         <button onClick={() => navigate("/addreport", { state: { profile } })}>
//           Add Lab Report
//         </button>
//       </div>
//     </div>
//   );
// };

// export default AllReportsScreen;

// 3 REPORT DOWNLOAD IN PDF AS WELL AS TXT FORM

// src/screens/AllReportsScreen.js with TXT export
// src/screens/AllReportsScreen.js with TXT export (latest + all)
import React, { useEffect, useState, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import useDatabase from "../Components/useDatabase";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import "../CSS/AllReportsScreen.css";

const AllReportsScreen = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { profile } = location.state || {};
  const { db } = useDatabase();

  const [labReports, setLabReports] = useState([]);
  const [showAllDates, setShowAllDates] = useState(false);

  useEffect(() => {
    if (!db || !profile) return;
    const stmt = db.prepare(
      `SELECT testName, date, parameter, result, unit, minValue, maxValue 
       FROM LabReports WHERE profileName = ?`
    );
    stmt.bind([profile.name]);
    const rows = [];
    while (stmt.step()) rows.push(stmt.getAsObject());
    stmt.free();
    setLabReports(rows);
  }, [db, profile]);

  const reportsByTest = useMemo(
    () =>
      labReports.reduce((acc, r) => {
        if (!acc[r.testName]) acc[r.testName] = {};
        if (!acc[r.testName][r.date]) acc[r.testName][r.date] = [];
        acc[r.testName][r.date].push(r);
        return acc;
      }, {}),
    [labReports]
  );

  const latestByTest = useMemo(
    () =>
      Object.entries(reportsByTest).map(([testName, dateGroups]) => {
        const latestDate = Object.keys(dateGroups).sort(
          (a, b) => new Date(b) - new Date(a)
        )[0];
        return { testName, date: latestDate, reports: dateGroups[latestDate] };
      }),
    [reportsByTest]
  );

  const generatePdf = (title, dataArray) => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text(`${profile.name} - ${title}`, 14, 20);
    const headers = [
      "Test Name",
      "Date",
      "Parameter",
      "Result",
      "Unit",
      "Range",
    ];
    const body = dataArray.map((row) => [
      row.testName,
      row.date,
      row.parameter,
      String(row.result),
      row.unit || "",
      `${row.minValue}-${row.maxValue}`,
    ]);

    autoTable(doc, {
      head: [headers],
      body,
      startY: 30,
      styles: { fontSize: 10 },
      didParseCell: (data) => {
        if (data.section === "body" && data.column.index === 3) {
          const val = parseFloat(data.cell.raw);
          const [min, max] = data.row.raw[5].split("-").map(parseFloat);
          if (val < min || val > max) data.cell.styles.textColor = [255, 0, 0];
        }
      },
    });

    doc.save(
      `${profile.name.replace(/\s+/g, "_")}_${title.replace(/\s+/g, "_")}.pdf`
    );
  };

  const handleDownloadLatest = () => {
    const rows = latestByTest.flatMap((item) =>
      item.reports.map((r) => ({
        testName: item.testName,
        date: item.date,
        parameter: r.parameter,
        result: r.result,
        unit: r.unit,
        minValue: r.minValue,
        maxValue: r.maxValue,
      }))
    );
    generatePdf("Latest_Reports", rows);
  };

  const handleDownloadAll = () => {
    const rows = [];
    Object.entries(reportsByTest).forEach(([testName, dateGroups]) => {
      Object.entries(dateGroups).forEach(([date, reports]) => {
        reports.forEach((r) =>
          rows.push({
            testName,
            date,
            parameter: r.parameter,
            result: r.result,
            unit: r.unit,
            minValue: r.minValue,
            maxValue: r.maxValue,
          })
        );
      });
    });
    generatePdf("All_Reports", rows);
  };

  const handleDownloadAllTxt = () => {
    const rows = [];
    Object.entries(reportsByTest).forEach(([testName, dateGroups]) => {
      Object.entries(dateGroups).forEach(([date, reports]) => {
        reports.forEach((r) => {
          rows.push(
            `${r.date} | ${testName} | ${r.parameter}: ${r.result} ${
              r.unit || ""
            } (Range: ${r.minValue}-${r.maxValue})`
          );
        });
      });
    });
    const content = `${profile.name} - All Lab Reports\n\n${rows.join("\n")}`;
    const blob = new Blob([content], { type: "text/plain" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${profile.name.replace(/\s+/g, "_")}_AllReports.txt`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const handleDownloadLatestTxt = () => {
    const rows = latestByTest.flatMap((item) =>
      item.reports.map(
        (r) =>
          `${item.date} | ${item.testName} | ${r.parameter}: ${r.result} ${
            r.unit || ""
          } (Range: ${r.minValue}-${r.maxValue})`
      )
    );
    const content = `${profile.name} - Latest Lab Reports\n\n${rows.join(
      "\n"
    )}`;
    const blob = new Blob([content], { type: "text/plain" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${profile.name.replace(/\s+/g, "_")}_LatestReports.txt`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const isAbnormal = (r) => r.result < r.minValue || r.result > r.maxValue;

  return (
    <div className="all-reports-container">
      <h1>All Lab Reports</h1>
      {profile && <h2>{profile.name}'s Reports</h2>}

      <div className="toggle-buttons">
        <button onClick={() => setShowAllDates(false)}>Latest Only</button>
        <button onClick={() => setShowAllDates(true)}>Show All Dates</button>
      </div>

      <div className="reports-grid">
        {(showAllDates
          ? Object.entries(reportsByTest)
          : latestByTest.map((item) => [
              item.testName,
              { [item.date]: item.reports },
            ])
        ).map(([testName, dateGroups]) => (
          <div key={testName} className="report-card">
            <h3>{testName}</h3>
            {Object.entries(dateGroups)
              .sort(([d1], [d2]) => new Date(d2) - new Date(d1))
              .map(([date, reports]) => (
                <div key={date} className="report-group">
                  <h4>{date}</h4>
                  {reports.map((r) => (
                    <p
                      key={r.parameter}
                      style={{ color: isAbnormal(r) ? "red" : "inherit" }}
                    >
                      {r.parameter}: {r.result} {r.unit || ""}
                      <small>
                        {" "}
                        (Range: {r.minValue}-{r.maxValue})
                      </small>
                    </p>
                  ))}
                </div>
              ))}
          </div>
        ))}
      </div>

      <div className="actions">
        <button onClick={() => navigate(-1)}>Back</button>
        <button onClick={handleDownloadLatest}>Download Latest PDF</button>
        <button onClick={handleDownloadAll}>Download All PDF</button>
        <button onClick={handleDownloadLatestTxt}>Download Latest TXT</button>
        <button onClick={handleDownloadAllTxt}>Download All TXT</button>
        <button onClick={() => navigate("/addreport", { state: { profile } })}>
          Add Lab Report
        </button>
      </div>
    </div>
  );
};

export default AllReportsScreen;
