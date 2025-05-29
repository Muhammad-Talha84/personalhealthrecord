import { React } from "react";
import { useNavigate, useLocation } from "react-router-dom";

import BloodtypeIcon from "@mui/icons-material/Bloodtype";

import "../CSS/AddReport.css";

const AddReport = () => {
  const predefinedReports = [
    {
      name: "Blood CP",
      icon: <BloodtypeIcon style={{ fontSize: "24px" }} />,
      route: "/cp",
    },

    {
      name: "Thyroid Function Test",
      route: "/thyroid",
    },
    {
      name: "RFT",

      route: "/rft",
    },
    {
      name: "LFT",

      route: "/lft",
    },
    {
      name: "LIPID PROFILE",

      route: "/lipid",
    },
    { name: "Electrolytes", route: "/electrolyte" },
  ];
  const navigate = useNavigate();
  const location = useLocation();
  const profile = location.state?.profile || {}; //they get the selected profile
  const handleReportClick = (route) => {
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
              <button onClick={() => handleReportClick(test.route)}>
                {test.name}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AddReport;
