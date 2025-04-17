import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../CSS/LipidProfile.css";
const LipidProfile = () => {
  const [cholesterol, setCholesterol] = useState("");
  const [hdl, setHdl] = useState("");
  const [ldl, setLdl] = useState("");
  const [triglycerides, setTriglycerides] = useState("");
  const [vldl, setVldl] = useState("");
  const [data, setData] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const navigate = useNavigate();
  const handleAdd = (e) => {
    e.preventDefault();
    if (
      !cholesterol ||
      !hdl ||
      !ldl ||
      !triglycerides ||
      !vldl ||
      !date ||
      !time
    )
      return;

    const newData = {
      cholesterol,
      hdl,
      ldl,
      triglycerides,
      vldl,
      date,
      time,
    };

    setData([...data, newData]);
    setCholesterol("");
    setHdl("");
    setLdl("");
    setTriglycerides("");
    setVldl("");
    setDate("");
    setTime("");
  };
  return (
    <div className="lipidContainer">
      <h1>Lipid Profile Tests</h1>

      <form onSubmit={handleAdd}>
        <label>
          Date
          <input
            type="date"
            placeholder="Date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </label>
        <label>
          Time:
          <input
            type="time"
            placeholder="Time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
          />
        </label>
        <label>
          Cholesterol
          <input
            type="text"
            placeholder="Cholesterol"
            value={cholesterol}
            onChange={(e) => setCholesterol(e.target.value)}
          />
        </label>
        <label>
          HDL Cholesterol
          <input
            type="text"
            placeholder="HDL"
            value={hdl}
            onChange={(e) => setHdl(e.target.value)}
          />
        </label>
        <label>
          LDL Cholesterol
          <input
            type="text"
            placeholder="LDL"
            value={ldl}
            onChange={(e) => setLdl(e.target.value)}
          />
        </label>
        <label>
          Triglycerides
          <input
            type="text"
            placeholder="triglycerides"
            value={triglycerides}
            onChange={(e) => setTriglycerides(e.target.value)}
          />
        </label>
        <label>
          VLDL (Calculated)
          <input
            type="text"
            placeholder="VLDL"
            value={vldl}
            onChange={(e) => setVldl(e.target.value)}
          />
        </label>

        <button type="submit" className="submit-button">
          Add
        </button>
      </form>
    </div>
  );
};

export default LipidProfile;
