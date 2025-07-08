import React, { useEffect, useState, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "../CSS/ProfileDetail.css";

import useDatabase from "../Components/useDatabase";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

const ProfileDetailScreen = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { profile } = location.state || {};
  const { db } = useDatabase();

  // Raw data
  const [vitals, setVitals] = useState([]);
  const [labReports, setLabReports] = useState([]);

  // LabReports filters
  const [filterDate, setFilterDate] = useState("");
  const [showMostRecent, setShowMostRecent] = useState(false);

  // Vitals filters
  const [filterDateVitals, setFilterDateVitals] = useState("");
  const [showMostRecentVitals, setShowMostRecentVitals] = useState(false);

  // Selected vital for chart / navigation
  const [selectedVitalType, setSelectedVitalType] = useState(null);

  // Fetch Vitals from DB
  useEffect(() => {
    if (!db || !profile) return;
    const stmt = db.prepare("SELECT * FROM Vitals WHERE profileName = ?");
    stmt.bind([profile.name]);
    const rows = [];
    while (stmt.step()) rows.push(stmt.getAsObject());
    stmt.free();
    setVitals(rows);
  }, [db, profile]);

  // Fetch LabReports from DB
  useEffect(() => {
    if (!db || !profile) return;
    const stmt = db.prepare("SELECT * FROM LabReports WHERE profileName = ?");
    stmt.bind([profile.name]);
    const rows = [];
    while (stmt.step()) rows.push(stmt.getAsObject());
    stmt.free();
    setLabReports(rows);
  }, [db, profile]);

  // Group LabReports by testName + date
  const groupedReports = useMemo(() => {
    return labReports.reduce((acc, report) => {
      const key = `${report.testName}-${report.date}`;
      if (!acc[key]) {
        acc[key] = {
          testName: report.testName,
          date: report.date,
          time: report.time,
          reports: [],
        };
      }
      acc[key].reports.push(report);
      return acc;
    }, {});
  }, [labReports]);

  // Apply LabReports filters
  const filteredGroupedReports = useMemo(() => {
    const entries = Object.entries(groupedReports);
    if (filterDate) {
      return Object.fromEntries(
        entries.filter(([, grp]) => grp.date === filterDate)
      );
    }
    if (showMostRecent) {
      const dates = entries.map(([, grp]) => grp.date);
      if (!dates.length) return {};
      const latest = dates.sort((a, b) => new Date(b) - new Date(a))[0];
      return Object.fromEntries(
        entries.filter(([, grp]) => grp.date === latest)
      );
    }
    return groupedReports;
  }, [groupedReports, filterDate, showMostRecent]);

  // Apply Vitals filters
  const filteredVitals = useMemo(() => {
    if (filterDateVitals) {
      return vitals.filter((v) => v.date === filterDateVitals);
    }
    if (showMostRecentVitals) {
      if (!vitals.length) return [];
      const latest = vitals
        .map((v) => v.date)
        .sort((a, b) => new Date(b) - new Date(a))[0];
      return vitals.filter((v) => v.date === latest);
    }
    return vitals;
  }, [vitals, filterDateVitals, showMostRecentVitals]);

  // Prepare data for the line chart of the selected vital
  const chartData = useMemo(() => {
    if (!selectedVitalType) return [];
    return filteredVitals
      .filter((v) => v.vitalName === selectedVitalType)
      .map((v) => ({
        datetime: `${v.date} ${v.time}`,
        value: Number(v.value),
      }))
      .sort(
        (a, b) =>
          new Date(a.datetime).getTime() - new Date(b.datetime).getTime()
      );
  }, [filteredVitals, selectedVitalType]);

  // Navigate to Lab Report detail
  const goToReportDetail = (grp) => {
    navigate("/reportsdetail", { state: { profile, report: grp, labReports } });
  };

  // Navigate to Vital detail or BP screen
  const handleViewVital = (vital) => {
    const readings = vitals
      .filter((v) => v.vitalName === vital.vitalName && v.date && v.time)
      .map((v) => ({
        date: v.date,
        time: v.time,
        value: v.value,
        unit: v.unit,
      }))
      .sort(
        (a, b) =>
          new Date(`${a.date} ${a.time}`) - new Date(`${b.date} ${b.time}`)
      );
    if (vital.vitalName.toLowerCase() === "bloodpressure") {
      navigate("/bp", { state: { profile, data: readings } });
    } else {
      navigate("/vitaldetail", {
        state: { profile, type: vital.vitalName, readings },
      });
    }
  };

  return (
    <div className="profiledetailContainer">
      {/* Profile Header */}
      <div className="details">
        <h1 style={{ textAlign: "center" }}>PERSONAL HEALTH RECORD</h1>
        <h2>Profile Details</h2>
        {profile ? (
          <>
            <div className="profile-grid">
              {[
                ["Name", profile.name],
                ["Relation", profile.relation],
                ["Gender", profile.gender],
                ["DOB", profile.dob],
                ["Blood Group", profile.bloodGroup],
                ["Height", profile.height],
                ["Weight", profile.weight],
              ].map(([label, val]) => (
                <div key={label} className="profile-item">
                  <strong>{label}:</strong> {val}
                </div>
              ))}
            </div>
            <button
              className="abnormalButton"
              onClick={() => navigate("/abnormal", { state: { profile } })}
            >
              View Abnormal Reports
            </button>
          </>
        ) : (
          <p>No Profile Selected</p>
        )}
      </div>

      {/* Vitals & Lab Reports */}
      <div className="dataSections">
        {/* Vitals Section */}
        <div className="vitalsSection">
          <h3>Vitals</h3>
          {/* Vitals Filters */}
          <div className="vitalsFilter" style={{ marginBottom: "1rem" }}>
            <input
              type="date"
              value={filterDateVitals}
              onChange={(e) => {
                setFilterDateVitals(e.target.value);
                setShowMostRecentVitals(false);
                setSelectedVitalType(null);
              }}
            />
            <button
              onClick={() => {
                setShowMostRecentVitals(false);
                setSelectedVitalType(null);
              }}
            >
              Search
            </button>
            <button
              onClick={() => {
                setShowMostRecentVitals(true);
                setFilterDateVitals("");
                setSelectedVitalType(null);
              }}
            >
              Most Recent
            </button>
            <button
              onClick={() => {
                setFilterDateVitals("");
                setShowMostRecentVitals(false);
                setSelectedVitalType(null);
              }}
            >
              Show All
            </button>
          </div>

          {/* Vitals List */}
          {filteredVitals.length > 0 ? (
            <div className="vitalsList">
              {filteredVitals.map((v, idx) => (
                <div
                  key={idx}
                  className={`vitalItem ${
                    selectedVitalType === v.vitalName ? "selected" : ""
                  }`}
                  onClick={() => {
                    setSelectedVitalType(v.vitalName);
                    handleViewVital(v);
                  }}
                  style={{ cursor: "pointer" }}
                >
                  <p>
                    <strong>{v.vitalName}</strong>: {v.value} {v.unit} {v.date}{" "}
                    {v.time}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ textAlign: "center", color: "gray" }}>
              No Vitals Found
            </p>
          )}

          {/* Vitals Chart */}
          {selectedVitalType && chartData.length > 0 && (
            <div
              className="vitalsChart"
              style={{ height: 300, marginTop: "2rem" }}
            >
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="datetime" />
                  <YAxis />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="value"
                    name={selectedVitalType}
                    stroke="#8884d8"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Vitals Actions */}
          <div style={{ marginTop: "1rem", display: "flex", gap: "10px" }}>
            <button
              onClick={() => navigate("/addvital", { state: { profile } })}
            >
              Add Vital
            </button>
            <button
              onClick={() =>
                navigate("/compvital", { state: { baseProfile: profile } })
              }
            >
              Compare Vitals with Family
            </button>
            <button
              onClick={() => navigate("/abnorVital", { state: { profile } })}
            >
              View Abnormal Vitals
            </button>
            <button
              onClick={() => navigate("/allvital", { state: { profile } })}
            >
              View All Vitals
            </button>
          </div>
        </div>

        {/* Lab Reports Section */}
        <div className="labReportsSection">
          <h3>Lab Reports</h3>

          {/* Lab Reports Filters */}
          <div className="labReportsFilter" style={{ marginBottom: "1rem" }}>
            <input
              type="date"
              value={filterDate}
              onChange={(e) => {
                setFilterDate(e.target.value);
                setShowMostRecent(false);
              }}
            />
            <button onClick={() => setShowMostRecent(false)}>Search</button>
            <button
              onClick={() => {
                setShowMostRecent(true);
                setFilterDate("");
              }}
            >
              Most Recent
            </button>
            <button
              onClick={() => {
                setFilterDate("");
                setShowMostRecent(false);
              }}
            >
              Show All
            </button>
          </div>

          {/* Lab Reports List */}
          {Object.keys(filteredGroupedReports).length > 0 ? (
            <div className="labReportsList">
              {Object.entries(filteredGroupedReports).map(([key, grp]) => (
                <div
                  key={key}
                  className="labReportItem"
                  style={{
                    cursor: "pointer",
                    marginBottom: "1rem",
                    border: "1px solid #ddd",
                    padding: "10px",
                  }}
                  onClick={() => goToReportDetail(grp)}
                >
                  <p>
                    <strong>{grp.testName}</strong>
                    <br />
                    <small>
                      Date: {grp.date} {grp.time && `| Time: ${grp.time}`}
                    </small>
                  </p>
                  {grp.reports.map((r) => (
                    <p
                      key={r.id || r.parameter}
                      style={{ margin: "2px 0", fontSize: "0.9rem" }}
                    >
                      {r.parameter}: {r.result} {r.unit || ""}
                    </p>
                  ))}
                </div>
              ))}
            </div>
          ) : (
            <p style={{ textAlign: "center", color: "gray" }}>
              No Lab Reports Found
            </p>
          )}

          {/* Lab Reports Actions */}
          <div style={{ marginTop: "1rem", display: "flex", gap: "10px" }}>
            <button
              onClick={() =>
                navigate("/compare", { state: { baseProfile: profile } })
              }
            >
              Compare Tests
            </button>
            <button
              onClick={() => navigate("/addreport", { state: { profile } })}
            >
              Add Lab Report
            </button>
            <button onClick={() => navigate("/allrep", { state: { profile } })}>
              All Report
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileDetailScreen;

//2
//  ya code b blkl ok ha zarorat hogi iski task ma to uncomment karna ha
// import React, { useEffect, useState, useMemo } from "react";
// import { useNavigate, useLocation } from "react-router-dom";
// import "../CSS/ProfileDetail.css";

// import useDatabase from "../Components/useDatabase";
// import {
//   ResponsiveContainer,
//   LineChart,
//   Line,
//   XAxis,
//   YAxis,
//   CartesianGrid,
//   Tooltip,
// } from "recharts";
// const ProfileDetailScreen = () => {
//   const navigate = useNavigate();
//   const location = useLocation();
//   const { profile } = location.state || {};
//   const { db } = useDatabase();

//   // State for vitals and lab reports
//   const [vitals, setVitals] = useState([]);
//   const [labReports, setLabReports] = useState([]);

//   // State for vitals filters
//   const [filterDateVitals, setFilterDateVitals] = useState("");
//   const [showMostRecentVitals, setShowMostRecentVitals] = useState(false);

//   // State for lab report filters
//   const [filterDate, setFilterDate] = useState("");
//   const [showMostRecent, setShowMostRecent] = useState(false);

//   // For charting vitals
//   const [selectedVitalType, setSelectedVitalType] = useState(null);
//   // For expanding lab test blocks
//   const [expandedTest, setExpandedTest] = useState(null);

//   // Toggle open/closed for a test block
//   const handleToggleTest = (testName) => {
//     setExpandedTest(expandedTest === testName ? null : testName);
//   };

//   // Navigate to graph view for lab reports
//   const goToGraph = (testName, parameter) => {
//     navigate("/graph", {
//       state: { profileName: profile.name, testName, parameter },
//     });
//   };

//   // Fetch Vitals
//   useEffect(() => {
//     if (!db || !profile) return;
//     try {
//       const stmt = db.prepare("SELECT * FROM Vitals WHERE profileName = ?");
//       stmt.bind([profile.name]);
//       const rows = [];
//       while (stmt.step()) rows.push(stmt.getAsObject());
//       stmt.free();
//       setVitals(rows);
//     } catch (err) {
//       console.error("Error fetching vitals:", err);
//     }
//   }, [db, profile]);

//   // Fetch Lab Reports
//   useEffect(() => {
//     if (!db || !profile) return;
//     try {
//       const stmt = db.prepare("SELECT * FROM LabReports WHERE profileName = ?");
//       stmt.bind([profile.name]);
//       const rows = [];
//       while (stmt.step()) rows.push(stmt.getAsObject());
//       stmt.free();
//       setLabReports(rows);
//     } catch (err) {
//       console.error("Error fetching lab reports:", err);
//     }
//   }, [db, profile]);

//   // Prepare filtered vitals based on date or most recent flags
//   const filteredVitals = useMemo(() => {
//     if (filterDateVitals)
//       return vitals.filter((v) => v.date === filterDateVitals);
//     if (showMostRecentVitals) {
//       if (!vitals.length) return [];
//       const latest = vitals
//         .map((v) => v.date)
//         .sort((a, b) => new Date(b) - new Date(a))[0];
//       return vitals.filter((v) => v.date === latest);
//     }
//     return vitals;
//   }, [vitals, filterDateVitals, showMostRecentVitals]);

//   // Prepare data for vitals line chart
//   const chartData = useMemo(() => {
//     if (!selectedVitalType) return [];
//     return filteredVitals
//       .filter((v) => v.vitalName === selectedVitalType)
//       .map((v) => ({ datetime: `${v.date} ${v.time}`, value: Number(v.value) }))
//       .sort((a, b) => new Date(a.datetime) - new Date(b.datetime));
//   }, [filteredVitals, selectedVitalType]);

//   // Group and filter lab reports
//   const reportsByTest = useMemo(() => {
//     let filtered = labReports;
//     if (filterDate) {
//       filtered = labReports.filter((r) => r.date === filterDate);
//     } else if (showMostRecent) {
//       const dates = Array.from(new Set(labReports.map((r) => r.date)));
//       if (dates.length) {
//         const latest = dates.sort((a, b) => new Date(b) - new Date(a))[0];
//         filtered = labReports.filter((r) => r.date === latest);
//       }
//     }
//     return filtered.reduce((byTest, rpt) => {
//       const { testName, date } = rpt;
//       byTest[testName] = byTest[testName] || {};
//       byTest[testName][date] = byTest[testName][date] || [];
//       byTest[testName][date].push(rpt);
//       return byTest;
//     }, {});
//   }, [labReports, filterDate, showMostRecent]);

//   // Handle navigation for a selected vital
//   const handleViewVital = (vital) => {
//     const readings = vitals
//       .filter((v) => v.vitalName === vital.vitalName && v.date && v.time)
//       .map((v) => ({
//         date: v.date,
//         time: v.time,
//         value: v.value,
//         unit: v.unit,
//       }))
//       .sort(
//         (a, b) =>
//           new Date(`${a.date} ${a.time}`) - new Date(`${b.date} ${b.time}`)
//       );
//     if (vital.vitalName.toLowerCase() === "bloodpressure") {
//       navigate("/bp", { state: { profile, data: readings } });
//     } else {
//       navigate("/vitaldetail", {
//         state: { profile, type: vital.vitalName, readings },
//       });
//     }
//   };

//   return (
//     <div className="profiledetailContainer">
//       {/* Profile Details */}
//       <div className="details">
//         <h1 style={{ textAlign: "center" }}>PERSONAL HEALTH RECORD</h1>
//         <h2>Profile Details</h2>
//         {profile ? (
//           <>
//             <div className="profile-grid">
//               <div className="profile-item">
//                 <strong>Name:</strong> {profile.name}
//               </div>
//               <div className="profile-item">
//                 <strong>Relation:</strong> {profile.relation}
//               </div>
//               <div className="profile-item">
//                 <strong>Gender:</strong> {profile.gender}
//               </div>
//               <div className="profile-item">
//                 <strong>DOB:</strong> {profile.dob}
//               </div>
//               <div className="profile-item">
//                 <strong>Blood Group:</strong> {profile.bloodGroup}
//               </div>
//               <div className="profile-item">
//                 <strong>Height:</strong> {profile.height}
//               </div>
//               <div className="profile-item">
//                 <strong>Weight:</strong> {profile.weight}
//               </div>
//             </div>
//             <button
//               className="abnormalButton"
//               onClick={() => navigate("/abnormal", { state: { profile } })}
//             >
//               View Abnormal Reports
//             </button>
//           </>
//         ) : (
//           <p>No Profile Selected</p>
//         )}
//       </div>

//       {/* Vitals & Lab Reports Sections */}
//       <div className="dataSections">
//         {/* Vitals Section */}
//         <div className="vitalsSection">
//           <h3>Vitals</h3>
//           <div className="vitalsFilter" style={{ marginBottom: "1rem" }}>
//             <input
//               type="date"
//               value={filterDateVitals}
//               onChange={(e) => {
//                 setFilterDateVitals(e.target.value);
//                 setShowMostRecentVitals(false);
//                 setSelectedVitalType(null);
//               }}
//             />
//             <button
//               onClick={() => {
//                 setShowMostRecentVitals(false);
//                 setSelectedVitalType(null);
//               }}
//             >
//               Search
//             </button>
//             <button
//               onClick={() => {
//                 setShowMostRecentVitals(true);
//                 setFilterDateVitals("");
//                 setSelectedVitalType(null);
//               }}
//             >
//               Most Recent
//             </button>
//             <button
//               onClick={() => {
//                 setFilterDateVitals("");
//                 setShowMostRecentVitals(false);
//                 setSelectedVitalType(null);
//               }}
//             >
//               Show All
//             </button>
//           </div>
//           {filteredVitals.length > 0 ? (
//             <div className="vitalsList">
//               {filteredVitals.map((v, idx) => (
//                 <div
//                   key={idx}
//                   className={`vitalItem ${
//                     selectedVitalType === v.vitalName ? "selected" : ""
//                   }`}
//                   onClick={() => {
//                     setSelectedVitalType(v.vitalName);
//                     handleViewVital(v);
//                   }}
//                   style={{ cursor: "pointer" }}
//                 >
//                   <p>
//                     <strong>{v.vitalName}</strong>: {v.value} {v.unit} {v.date}{" "}
//                     {v.time}
//                   </p>
//                 </div>
//               ))}
//             </div>
//           ) : (
//             <p style={{ textAlign: "center", color: "gray" }}>
//               No Vitals Found
//             </p>
//           )}
//           {selectedVitalType && chartData.length > 0 && (
//             <div
//               className="vitalsChart"
//               style={{ height: 300, marginTop: "2rem" }}
//             >
//               <ResponsiveContainer width="100%" height="100%">
//                 <LineChart data={chartData}>
//                   <CartesianGrid strokeDasharray="3 3" />
//                   <XAxis dataKey="datetime" />
//                   <YAxis />
//                   <Tooltip />
//                   <Line
//                     type="monotone"
//                     dataKey="value"
//                     name={selectedVitalType}
//                     stroke="#8884d8"
//                     strokeWidth={2}
//                     dot={{ r: 3 }}
//                   />
//                 </LineChart>
//               </ResponsiveContainer>
//             </div>
//           )}
//           <div style={{ marginTop: "1rem", display: "flex", gap: "10px" }}>
//             <button
//               onClick={() => navigate("/addvital", { state: { profile } })}
//             >
//               Add Vital
//             </button>
//             <button
//               onClick={() =>
//                 navigate("/compvital", { state: { baseProfile: profile } })
//               }
//             >
//               Compare Vitals with Family
//             </button>
//             <button
//               onClick={() => navigate("/abnorVital", { state: { profile } })}
//             >
//               View Abnormal Vitals
//             </button>
//             <button
//               onClick={() => navigate("/allvital", { state: { profile } })}
//             >
//               View All Vitals
//             </button>
//           </div>
//         </div>

//         {/* Lab Reports Section */}
//         <div className="labReportsSection">
//           <h3>Lab Reports</h3>

//           {/* Filter Controls */}
//           <div className="labReportsFilter" style={{ marginBottom: "1rem" }}>
//             <input
//               type="date"
//               value={filterDate}
//               onChange={(e) => {
//                 setFilterDate(e.target.value);
//                 setShowMostRecent(false);
//               }}
//             />
//             <button onClick={() => setShowMostRecent(false)}>Search</button>
//             <button
//               onClick={() => {
//                 setShowMostRecent(true);
//                 setFilterDate("");
//               }}
//             >
//               Most Recent
//             </button>
//             <button
//               onClick={() => {
//                 setFilterDate("");
//                 setShowMostRecent(false);
//               }}
//             >
//               Show All
//             </button>
//           </div>
//           {/* for graph */}
//           <div className="labReportsList">
//             {Object.entries(reportsByTest).map(([testName, dateMap]) => {
//               // collect unique parameters across dates
//               const params = Array.from(
//                 new Set(
//                   Object.values(dateMap) // gives array of all report-arrays for each date
//                     .flat() // flattens into one big array of report objects
//                     .map((r) => r.parameter) // picks out the `parameter` field
//                 )
//               );

//               return (
//                 <div key={testName} className="testBlock">
//                   <div
//                     className="labReportItem"
//                     onClick={() => handleToggleTest(testName)}
//                     style={{
//                       cursor: "pointer",
//                       border: "1px solid #ddd",
//                       padding: "8px",
//                     }}
//                   >
//                     <p>
//                       <strong>{testName}</strong>
//                     </p>
//                     <small>
//                       Dates: {Object.keys(dateMap).sort().join(", ")}
//                     </small>
//                   </div>

//                   {expandedTest === testName && (
//                     <div
//                       className="parameterList"
//                       style={{ marginLeft: "1rem", marginTop: "4px" }}
//                     >
//                       {params.map((param) => (
//                         <div
//                           key={param}
//                           className="parameterItem"
//                           onClick={() => goToGraph(testName, param)}
//                           style={{ cursor: "pointer", padding: "4px" }}
//                         >
//                           {param}
//                         </div>
//                       ))}
//                     </div>
//                   )}
//                 </div>
//               );
//             })}
//           </div>

//           {/* {Object.keys(filteredGroupedReports).length > 0 ? (
//             <div className="labReportsList">
//               {Object.entries(filteredGroupedReports).map(([key, data]) => (
//                 <div
//                   key={key}
//                   className="labReportItem"
//                   style={{
//                     cursor: "pointer",
//                     marginBottom: "1rem",
//                     border: "1px solid #ddd",
//                     padding: "10px",
//                   }}
//                   onClick={() => goToReportDetail(data)}
//                 >
//                   <p>
//                     <strong>{data.testName}</strong>
//                     <br />
//                     <small>
//                       Date: {data.date} {data.time && `| Time: ${data.time}`}
//                     </small>
//                   </p>
//                   {data.reports.map((r) => (
//                     <p
//                       key={r.id || r.parameter}
//                       style={{ margin: "2px 0", fontSize: "0.9rem" }}
//                     >
//                       {r.parameter}: {r.result} {r.unit || ""}
//                     </p>
//                   ))}
//                 </div>
//               ))}
//             </div>
//           ) : (
//             <p style={{ textAlign: "center", color: "gray" }}>
//               No Lab Reports Found
//             </p>
//           )} */}
//           {/* TESTING */}
//           {Object.entries(reportsByTest).map(([testName, dateMap]) => (
//             <div
//               key={testName}
//               className="labReportItem"
//               onClick={() =>
//                 navigate("/reportsdetail", {
//                   state: { profile, testName, dateMap },
//                 })
//               }
//             >
//               <p>
//                 <strong>{testName}</strong>
//                 <br />
//                 <small>Dates: {Object.keys(dateMap).sort().join(", ")}</small>
//               </p>
//             </div>
//           ))}

//           {/* Buttons Section */}
//           <div style={{ marginTop: "1rem", display: "flex", gap: "10px" }}>
//             <button
//               onClick={() =>
//                 navigate("/compare", { state: { baseProfile: profile } })
//               }
//             >
//               Compare Tests
//             </button>

//             <button
//               onClick={() => navigate("/addreport", { state: { profile } })}
//             >
//               Add Lab Report
//             </button>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default ProfileDetailScreen;

// For task report and their parameter show in seperate screen
// import React, { useEffect, useState, useMemo } from "react";
// import { useNavigate, useLocation } from "react-router-dom";
// import "../CSS/ProfileDetail.css";

// import useDatabase from "../Components/useDatabase";
// import {
//   ResponsiveContainer,
//   LineChart,
//   Line,
//   XAxis,
//   YAxis,
//   CartesianGrid,
//   Tooltip,
// } from "recharts";

// const ProfileDetailScreen = () => {
//   const navigate = useNavigate();
//   const location = useLocation();
//   const { profile } = location.state || {};
//   const { db } = useDatabase();

//   // Raw data
//   const [vitals, setVitals] = useState([]);
//   const [labReports, setLabReports] = useState([]);

//   // LabReports filters
//   const [filterDate, setFilterDate] = useState("");
//   const [showMostRecent, setShowMostRecent] = useState(false);

//   // Vitals filters
//   const [filterDateVitals, setFilterDateVitals] = useState("");
//   const [showMostRecentVitals, setShowMostRecentVitals] = useState(false);

//   // Selected vital for chart / navigation
//   const [selectedVitalType, setSelectedVitalType] = useState(null);

//   // Fetch Vitals from DB
//   useEffect(() => {
//     if (!db || !profile) return;
//     const stmt = db.prepare("SELECT * FROM Vitals WHERE profileName = ?");
//     stmt.bind([profile.name]);
//     const rows = [];
//     while (stmt.step()) rows.push(stmt.getAsObject());
//     stmt.free();
//     setVitals(rows);
//   }, [db, profile]);

//   // Fetch LabReports from DB
//   useEffect(() => {
//     if (!db || !profile) return;
//     const stmt = db.prepare("SELECT * FROM LabReports WHERE profileName = ?");
//     stmt.bind([profile.name]);
//     const rows = [];
//     while (stmt.step()) rows.push(stmt.getAsObject());
//     stmt.free();
//     setLabReports(rows);
//   }, [db, profile]);

//   // Group LabReports by testName + date
//   const groupedReports = useMemo(() => {
//     return labReports.reduce((acc, report) => {
//       const key = `${report.testName}-${report.date}`;
//       if (!acc[key]) {
//         acc[key] = {
//           testName: report.testName,
//           date: report.date,
//           time: report.time,
//           reports: [],
//         };
//       }
//       acc[key].reports.push(report);
//       return acc;
//     }, {});
//   }, [labReports]);

//   // Apply LabReports filters
//   const filteredGroupedReports = useMemo(() => {
//     const entries = Object.entries(groupedReports);
//     if (filterDate) {
//       return Object.fromEntries(
//         entries.filter(([, grp]) => grp.date === filterDate)
//       );
//     }
//     if (showMostRecent) {
//       const dates = entries.map(([, grp]) => grp.date);
//       if (!dates.length) return {};
//       const latest = dates.sort((a, b) => new Date(b) - new Date(a))[0];
//       return Object.fromEntries(
//         entries.filter(([, grp]) => grp.date === latest)
//       );
//     }
//     return groupedReports;
//   }, [groupedReports, filterDate, showMostRecent]);

//   // Apply Vitals filters
//   const filteredVitals = useMemo(() => {
//     if (filterDateVitals) {
//       return vitals.filter((v) => v.date === filterDateVitals);
//     }
//     if (showMostRecentVitals) {
//       if (!vitals.length) return [];
//       const latest = vitals
//         .map((v) => v.date)
//         .sort((a, b) => new Date(b) - new Date(a))[0];
//       return vitals.filter((v) => v.date === latest);
//     }
//     return vitals;
//   }, [vitals, filterDateVitals, showMostRecentVitals]);

//   // Prepare data for the line chart of the selected vital
//   const chartData = useMemo(() => {
//     if (!selectedVitalType) return [];
//     return filteredVitals
//       .filter((v) => v.vitalName === selectedVitalType)
//       .map((v) => ({
//         datetime: `${v.date} ${v.time}`,
//         value: Number(v.value),
//       }))
//       .sort(
//         (a, b) =>
//           new Date(a.datetime).getTime() - new Date(b.datetime).getTime()
//       );
//   }, [filteredVitals, selectedVitalType]);

//   // Navigation functions
//   const goToReportDetail = (grp) => {
//     navigate("/reportsdetail", {
//       state: { profile, report: grp, labReports },
//     });
//   };
//   const goToReportTable = (grp, e) => {
//     navigate("/reportstable", {
//       state: {
//         profile,
//         report: grp,
//       },
//     });
//   };

//   const handleViewVital = (vital) => {
//     const readings = vitals
//       .filter((v) => v.vitalName === vital.vitalName && v.date && v.time)
//       .map((v) => ({
//         date: v.date,
//         time: v.time,
//         value: v.value,
//         unit: v.unit,
//       }))
//       .sort(
//         (a, b) =>
//           new Date(`${a.date} ${a.time}`) - new Date(`${b.date} ${b.time}`)
//       );
//     if (vital.vitalName.toLowerCase() === "bloodpressure") {
//       navigate("/bp", { state: { profile, data: readings } });
//     } else {
//       navigate("/vitaldetail", {
//         state: { profile, type: vital.vitalName, readings },
//       });
//     }
//   };

//   return (
//     <div className="profiledetailContainer">
//       {/* Profile Header */}
//       <div className="details">
//         <h1 style={{ textAlign: "center" }}>PERSONAL HEALTH RECORD</h1>
//         <h2>Profile Details</h2>
//         {profile ? (
//           <>
//             <div className="profile-grid">
//               {[
//                 ["Name", profile.name],
//                 ["Relation", profile.relation],
//                 ["Gender", profile.gender],
//                 ["DOB", profile.dob],
//                 ["Blood Group", profile.bloodGroup],
//                 ["Height", profile.height],
//                 ["Weight", profile.weight],
//               ].map(([label, val]) => (
//                 <div key={label} className="profile-item">
//                   <strong>{label}:</strong> {val}
//                 </div>
//               ))}
//             </div>
//             <button
//               className="abnormalButton"
//               onClick={() => navigate("/abnormal", { state: { profile } })}
//             >
//               View Abnormal Reports
//             </button>
//           </>
//         ) : (
//           <p>No Profile Selected</p>
//         )}
//       </div>

//       {/* Vitals & Lab Reports */}

//       <div className="dataSections">
//         {/* Vitals Section */}
//         <div className="vitalsSection">
//           <h3>Vitals</h3>
//           {/* Vitals Filters */}
//           <div className="vitalsFilter" style={{ marginBottom: "1rem" }}>
//             <input
//               type="date"
//               value={filterDateVitals}
//               onChange={(e) => {
//                 setFilterDateVitals(e.target.value);
//                 setShowMostRecentVitals(false);
//                 setSelectedVitalType(null);
//               }}
//             />
//             <button
//               onClick={() => {
//                 setShowMostRecentVitals(false);
//                 setSelectedVitalType(null);
//               }}
//             >
//               Search
//             </button>
//             <button
//               onClick={() => {
//                 setShowMostRecentVitals(true);
//                 setFilterDateVitals("");
//                 setSelectedVitalType(null);
//               }}
//             >
//               Most Recent
//             </button>
//             <button
//               onClick={() => {
//                 setFilterDateVitals("");
//                 setShowMostRecentVitals(false);
//                 setSelectedVitalType(null);
//               }}
//             >
//               Show All
//             </button>
//           </div>

//           {/* Vitals List */}
//           {filteredVitals.length > 0 ? (
//             <div className="vitalsList">
//               {filteredVitals.map((v, idx) => (
//                 <div
//                   key={idx}
//                   className={`vitalItem ${
//                     selectedVitalType === v.vitalName ? "selected" : ""
//                   }`}
//                   onClick={() => {
//                     setSelectedVitalType(v.vitalName);
//                     handleViewVital(v);
//                   }}
//                   style={{ cursor: "pointer" }}
//                 >
//                   <p>
//                     <strong>{v.vitalName}</strong>: {v.value} {v.unit} {v.date}{" "}
//                     {v.time}
//                   </p>
//                 </div>
//               ))}
//             </div>
//           ) : (
//             <p style={{ textAlign: "center", color: "gray" }}>
//               No Vitals Found
//             </p>
//           )}

//           {/* Vitals Chart */}
//           {selectedVitalType && chartData.length > 0 && (
//             <div
//               className="vitalsChart"
//               style={{ height: 300, marginTop: "2rem" }}
//             >
//               <ResponsiveContainer width="100%" height="100%">
//                 <LineChart data={chartData}>
//                   <CartesianGrid strokeDasharray="3 3" />
//                   <XAxis dataKey="datetime" />
//                   <YAxis />
//                   <Tooltip />
//                   <Line
//                     type="monotone"
//                     dataKey="value"
//                     name={selectedVitalType}
//                     stroke="#8884d8"
//                     strokeWidth={2}
//                     dot={{ r: 3 }}
//                   />
//                 </LineChart>
//               </ResponsiveContainer>
//             </div>
//           )}

//           {/* Vitals Actions */}
//           <div style={{ marginTop: "1rem", display: "flex", gap: "10px" }}>
//             <button
//               onClick={() => navigate("/addvital", { state: { profile } })}
//             >
//               Add Vital
//             </button>
//             <button
//               onClick={() =>
//                 navigate("/compvital", { state: { baseProfile: profile } })
//               }
//             >
//               Compare Vitals with Family
//             </button>
//             <button
//               onClick={() => navigate("/abnorVital", { state: { profile } })}
//             >
//               View Abnormal Vitals
//             </button>
//             <button
//               onClick={() => navigate("/allvital", { state: { profile } })}
//             >
//               View All Vitals
//             </button>
//           </div>
//         </div>

//         {/* Lab Reports Section */}
//         <div className="labReportsSection">
//           <h3>Lab Reports</h3>

//           {/* Filters */}
//           <div className="labReportsFilter" style={{ marginBottom: "1rem" }}>
//             <input
//               type="date"
//               value={filterDate}
//               onChange={(e) => {
//                 setFilterDate(e.target.value);
//                 setShowMostRecent(false);
//               }}
//             />
//             <button onClick={() => setShowMostRecent(false)}>Search</button>
//             <button
//               onClick={() => {
//                 setShowMostRecent(true);
//                 setFilterDate("");
//               }}
//             >
//               Most Recent
//             </button>
//             <button
//               onClick={() => {
//                 setFilterDate("");
//                 setShowMostRecent(false);
//               }}
//             >
//               Show All
//             </button>
//           </div>

//           {/* Report Cards */}
//           {Object.entries(filteredGroupedReports).length > 0 ? (
//             <div className="labReportsList">
//               {Object.entries(filteredGroupedReports).map(([key, grp]) => (
//                 <div
//                   key={key}
//                   className="labReportItem"
//                   style={{
//                     marginBottom: "1rem",
//                     border: "1px solid #ddd",
//                     padding: "10px",
//                   }}
//                   // onClick={() => goToReportDetail(grp)}
//                 >
//                   <p>
//                     <strong>{grp.testName}</strong>
//                     <br />
//                     <small>
//                       Date: {grp.date} {grp.time && `| Time: ${grp.time}`}
//                     </small>
//                   </p>

//                   <div style={{ display: "flex", gap: "8px", marginBottom: 8 }}>
//                     <button
//                       type="button"
//                       onClick={(e) => {
//                         e.stopPropagation();
//                         goToReportDetail(grp);
//                       }}
//                     >
//                       Graph View
//                     </button>
//                     <button
//                       type="button"
//                       onClick={(e) => {
//                         e.stopPropagation();
//                         goToReportTable(grp);
//                       }}
//                     >
//                       Table View
//                     </button>
//                   </div>

//                   {grp.reports.map((r) => (
//                     <p
//                       key={r.id || r.parameter}
//                       style={{ margin: "2px 0", fontSize: "0.9rem" }}
//                     >
//                       {r.parameter}: {r.result} {r.unit || ""}
//                     </p>
//                   ))}
//                 </div>
//               ))}
//             </div>
//           ) : (
//             <p style={{ textAlign: "center", color: "gray" }}>
//               No Lab Reports Found
//             </p>
//           )}

//           {/* Lab Reports Actions */}
//           <div style={{ marginTop: "1rem", display: "flex", gap: "10px" }}>
//             <button
//               onClick={() =>
//                 navigate("/compare", { state: { baseProfile: profile } })
//               }
//             >
//               Compare Tests
//             </button>
//             <button
//               onClick={() => navigate("/addreport", { state: { profile } })}
//             >
//               Add Lab Report
//             </button>
//             <button onClick={() => navigate("/allrep", { state: { profile } })}>
//               All Reports
//             </button>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default ProfileDetailScreen;
