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
import Cholesterol from "./Components/Cholesterol";
import ReportsDetail from "./Components/ReportsDetail";
import AbnormalReports from "./Components/AbnormalReports";
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
        <Route path="/sugar" element={<Sugar />} />
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
        {/* Cholesterol */}
        <Route path="/cholestrol" element={<Cholesterol />} />
        {/* Reports Detail */}
        <Route path="/reportsdetail" element={<ReportsDetail />} />
        {/* abnormal reports  */}
        <Route path="/abnormal" element={<AbnormalReports />} />
      </Routes>
    </Router>
  );
}

export default App;
