import { React } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import ThermostatIcon from "@mui/icons-material/Thermostat";

import MonitorHeartIcon from "@mui/icons-material/MonitorHeart";
import "../CSS/AddVital.css";

const AddVital = () => {
  const predefinedReports = [
    {
      name: "Temperature",
      icon: <ThermostatIcon style={{ fontSize: "24px", color: "red" }} />,
      route: "/temp",
    },
    // { name: "Blood Glucose", icon: null, route: "/sugar" },
    { name: "Breathing Rate", route: "/breath" },
    { name: "Heart Rate", route: "/heart" },
    {
      name: "Blood Pressure",
      icon: <MonitorHeartIcon style={{ fontSize: "24px", color: "red" }} />,
      route: "/bp",
    },
    // { name: "Sugar", route: "/sugar" },
  ];
  const navigate = useNavigate();
  const location = useLocation();
  const profile = location.state?.profile || {}; //they get the selected profile
  const handleVitalClick = (route) => {
    navigate(route, { state: { profile } }); // Pass profile data to next screen
  };

  return (
    <div className="reportContainer">
      <div>
        <h2 className="section-title">Health Overview</h2>
        <h3>Selected Profile: {profile.name}</h3> {/* Show selected profile */}
        <div className="grid">
          {predefinedReports.map((test, index) => (
            <div className="card" key={index}>
              <button onClick={() => handleVitalClick(test.route)}>
                {test.name}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AddVital;

// import React, { useState, useEffect } from "react";
// import { useNavigate, useLocation } from "react-router-dom";
// import ThermostatIcon from "@mui/icons-material/Thermostat";
// import MonitorHeartIcon from "@mui/icons-material/MonitorHeart";
// import useDatabase from "../Components/useDatabase";
// import "../CSS/AddVital.css";

// const AddVital = () => {
//   const { fetchVitalTypes } = useDatabase();
//   const [vitals, setVitals] = useState([]);
//   const navigate = useNavigate();
//   const location = useLocation();
//   const profile = location.state?.profile || {};

//   useEffect(() => {
//     (async () => {
//       const rows = await fetchVitalTypes();
//       setVitals(rows);
//     })();
//   }, [fetchVitalTypes]);

//   const handleVitalClick = (type) => {
//     navigate("/record-vital", { state: { profile, vitalType: type } });
//   };

//   return (
//     <div className="reportContainer">
//       <h2 className="section-title">Health Overview</h2>
//       <h3>Selected Profile: {profile.name}</h3>
//       <div className="grid">
//         {vitals.map((type) => (
//           <div className="card" key={type.id}>
//             <button onClick={() => handleVitalClick(type)}>
//               {type.icon
//                 ? React.cloneElement(type.icon, {
//                     style: { fontSize: 24, color: "red" },
//                   })
//                 : null}
//               {type.name}
//             </button>
//             {type.unit && <small>{type.unit}</small>}
//           </div>
//         ))}

//         {/* “Add New Vital Type” card */}
//         <div className="card">
//           <button
//             onClick={() => navigate("/add-vital-type", { state: { profile } })}
//           >
//             + Add New Vital Type
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default AddVital;
