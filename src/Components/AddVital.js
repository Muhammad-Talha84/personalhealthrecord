import { React } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import ThermostatIcon from "@mui/icons-material/Thermostat";

import MonitorHeartIcon from "@mui/icons-material/MonitorHeart";
import "../CSS/AddVital.css";
import { AiOutlineArrowLeft } from "react-icons/ai";
const AddVital = () => {
  const predefinedReports = [
    {
      name: "Temperature",
      icon: <ThermostatIcon style={{ fontSize: "24px", color: "red" }} />,
      route: "/temp",
    },
    { name: "Blood Glucose", icon: null, route: "/sugar" },

    { name: "Heart Rate", route: "/heart" },
    {
      name: "Blood Pressure",
      icon: <MonitorHeartIcon style={{ fontSize: "24px", color: "red" }} />,
      route: "/bp",
    },
    {
      name: "Cholesterol Level",
      route: "/cholestrol",
    },
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
