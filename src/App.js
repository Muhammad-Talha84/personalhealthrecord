import { BrowserRouter as Router, Route, Routes } from "react-router-dom";

import BloodCP from "../src/Components/BloodCP";
import BloodPressure from "../src/Components/BloodPressure";
import Sugar from "../src/Components/Sugar";
import Temperature from "./Components/Temperature";
import AddProfile from "./Components/AddProfile";
import TFT from "./Components/TFT";
import VitalDetail from "./Components/VitalDetail";
import AddReport from "./Components/AddReport";
import Login from "./Account/Login";
import Signup from "./Account/SignUp";
import Profile from "./Components/Profile";
import BloodPressureGraph from "./Components/BloodPressureGraph";
import BloodPressureTable from "./Components/BloodPressureTable";
import ProfileDetailScreen from "./Components/ProfileDetailScreen";
import RFT from "./Components/RFT";
import LFT from "./Components/LFT";
import LipidProfile from "./Components/LipidProfile";
import AddVital from "./Components/AddVital";
import HeartRate from "./Components/HeartRate";
import ReportsDetail from "./Components/ReportsDetail";
import AbnormalReports from "./Components/AbnormalReports";
import Electrolytes from "./Components/Electrolytes";
import CompareScreen from "./Components/CompareScreen";
import LabParameterGraph from "./Components/LabParameterGraph";
import BreathingRate from "./Components/BreathingRate";
import CompareVitals from "./Components/CompareVitals";
import AbnormalVitalScreen from "./Components/AbnormalVitalScreen";
import AllVitalsScreen from "./Components/AllVitalsScreen";
import AllReportsScreen from "./Components/AllReportsScreen";
// TASK IMPLEMENT
import PreBloodPressure from "./Components/PreBloodPressure";
import PreBreathingRate from "./Components/PreBreathingRate";
import PreHeartRate from "./Components/PreHeartRate";
import PreTemperature from "./Components/PreTemperature";
// TASK IMPLEMET
import PreElectroytes from "./Components/PreElectroytes";

import PreBloodCP from "./Components/PreBloodCP";
import PreTFT from "./Components/PreTFT";
import PreRFT from "./Components/PreRFT";
import PreLFT from "./Components/PreLFT";
import PreLipidProfile from "./Components/PreLipidProfile";

function App() {
  return (
    <Router>
      <Routes>
        {/* Account */}
        <Route path="/" element={<Login />} />
        <Route path="/Signup" element={<Signup />} />

        {/* Blood Cp.js */}
        <Route path="/cp" element={<BloodCP />} />
        {/* BloodPressure.js */}
        <Route path="/bp" element={<BloodPressure />} />
        {/* Sugar */}
        {/* <Route path="/sugar" element={<Sugar />} /> */}

        {/* PULSE RATE */}
        <Route path="/breath" element={<BreathingRate />} />
        {/* Temperature */}
        <Route path="/temp" element={<Temperature />} />
        {/* Add Profile */}
        <Route path="/add" element={<AddProfile />} />
        {/* View Profile */}
        <Route path="/vitaldetail" element={<VitalDetail />} />
        {/* Thyroid Function Test */}
        <Route path="/thyroid" element={<TFT />} />
        {/* Report add */}
        <Route path="/addreport" element={<AddReport />} />
        {/* Add Vital */}
        <Route path="/addvital" element={<AddVital />} />
        {/* profile */}
        <Route path="/profile" element={<Profile />} />
        {/* Blood pressure graph */}
        <Route path="/bpgraph" element={<BloodPressureGraph />} />
        {/* blood pressure table */}
        <Route path="/bptable" element={<BloodPressureTable />} />
        {/* Profile Detail Screen */}
        <Route path="/profiledetail" element={<ProfileDetailScreen />} />
        {/* RFT */}
        <Route path="/rft" element={<RFT />} />
        {/* LFT */}
        <Route path="/lft" element={<LFT />} />
        {/* Lipid Profile */}
        <Route path="/lipid" element={<LipidProfile />} />
        {/* Heart Rate */}
        <Route path="/heart" element={<HeartRate />} />
        {/* Electrolytes */}
        <Route path="/electrolyte" element={<Electrolytes />} />
        {/* Reports Detail */}
        <Route path="/reportsdetail" element={<ReportsDetail />} />
        {/* abnormal reports  */}
        <Route path="/abnormal" element={<AbnormalReports />} />
        {/* Comapare Screen */}
        <Route path="/compare" element={<CompareScreen />} />
        {/* lab parameter graph */}
        <Route path="/graph" element={<LabParameterGraph />} />
        {/* Compare vitals */}
        <Route path="/compvital" element={<CompareVitals />} />
        {/* abnormal vital screen */}
        <Route path="abnorVital" element={<AbnormalVitalScreen />} />
        {/* all vitals screen  */}
        <Route path="allvital" element={<AllVitalsScreen />} />
        {/* all reports screen */}
        <Route path="allrep" element={<AllReportsScreen />} />
        {/* FOR TASK IMPLEMENTATION */}
        {/* PreBloodPressure.js */}
        <Route path="/prebp" element={<PreBloodPressure />} />
        {/* PreBreathing rate.js */}
        <Route path="/prebreath" element={<PreBreathingRate />} />
        {/* Preheart rate.js */}
        <Route path="/preheart" element={<PreHeartRate />} />
        {/* PreTemperature.js */}
        <Route path="/pretemp" element={<PreTemperature />} />
        {/* FOR TASK IMPLEMENT */}
        <Route path="preelectrolyte" element={<PreElectroytes />} />
        <Route path="prerft" element={<PreRFT />} />
        <Route path="prelft" element={<PreLFT />} />
        <Route path="prethyroid" element={<PreTFT />} />
        <Route path="prelipid" element={<PreLipidProfile />} />
        <Route path="precp" element={<PreBloodCP />} />
      </Routes>
    </Router>
  );
}

export default App;
