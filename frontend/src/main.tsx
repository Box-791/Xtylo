import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import App from "./App";
import PublicIntake from "./PublicIntake";
import AdminCampaigns from "./AdminCampaigns";
import "./index.css";


function AdminLayout() {
  return (
    <div>
      <nav style={{ padding: 10, borderBottom: "1px solid #ccc" }}>
        <Link to="/admin">Students</Link>{" "}
        <Link to="/admin/campaigns">Campaigns</Link>
      </nav>

      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/campaigns" element={<AdminCampaigns />} />
      </Routes>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<PublicIntake />} />
        <Route path="/admin" element={<App />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
)


