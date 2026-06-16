import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import Dashboard from "./pages/Dashboard";
import LoginPage from "./pages/LoginPage";
import SurveyView from "./pages/SurveyView";
import RespondPage from "./pages/RespondPage";
import AdminPage from "./pages/AdminPage";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/respond" element={<RespondPage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/survey/:name" element={<SurveyView />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
