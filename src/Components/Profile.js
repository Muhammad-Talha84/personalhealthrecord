import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../CSS/Profile.css";
import useDatabase from "../Components/useDatabase";
const Profile = () => {
  const [profiles, setProfiles] = useState([]);
  const { db } = useDatabase();
  const navigate = useNavigate();
  // Retrieve current user's email from localStorage
  const currentUserEmail = localStorage.getItem("currentUserEmail");
  // Fetch stored profiles from localStorage on component mount
  useEffect(() => {
    if (db) {
      try {
        // Use a prepared statement to fetch all profiles
        const stmt = db.prepare("SELECT * FROM profiles WHERE userEmail = ?");
        stmt.bind([currentUserEmail]);
        const rows = [];
        while (stmt.step()) {
          rows.push(stmt.getAsObject());
        }
        stmt.free();
        console.log("Fetched profiles:", rows);
        setProfiles(rows);
      } catch (error) {
        console.error("Error fetching profiles:", error);
      }
    }
  }, [db, currentUserEmail]);

  const handleProfileClick = (profile) => {
    // You can navigate or display more details here:
    navigate("/profiledetail", { state: { profile } });
  };

  return (
    <div className="profileContainer">
      <div>
        <h2 className="section-title">Profile</h2>
        <div className="btnProfile">
          <button onClick={() => navigate("/add")}>Add Profile</button>
        </div>

        <div className="profiles-list">
          {profiles.length > 0 ? (
            profiles.map((profile) => (
              <div
                key={profile.id}
                className="profile-card"
                // onClick={() => handleProfileClick(profile)} // Click event to navigate
                // style={{ cursor: "pointer" }} // Make it look clickable
                // onMouseEnter={(e) =>
                //   (e.currentTarget.style.background = "#bbdefb")
                // }
                // onMouseLeave={(e) =>
                //   (e.currentTarget.style.background = "#e3f2fd")
                // }
                onClick={() => handleProfileClick(profile)}
              >
                <h3>{profile.name}</h3>
                <p>Relation: {profile.relation}</p>
              </div>
            ))
          ) : (
            <p>No profiles found</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
