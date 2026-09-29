import { Routes, Route, Navigate } from "react-router-dom";
import { Login } from "../pages/Login";
import { Dashboard } from "../pages/Dashboard";
import { Oportunidades } from "../pages/Oportunidades";
import { CirugiasEfectivas } from "../pages/CirugiasEfectivas";
import { Seguimientos } from "../pages/Seguimientos";
import { Usuarios } from "../pages/Usuarios";
import { ProtectedRoute } from "./ProtectedRoute";

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/oportunidades"
        element={
          <ProtectedRoute>
            <Oportunidades />
          </ProtectedRoute>
        }
      />
      <Route
        path="/cirugias-efectivas"
        element={
          <ProtectedRoute>
            <CirugiasEfectivas />
          </ProtectedRoute>
        }
      />
      <Route
        path="/seguimientos"
        element={
          <ProtectedRoute>
            <Seguimientos />
          </ProtectedRoute>
        }
      />
      <Route
        path="/usuarios"
        element={
          <ProtectedRoute onlyRole="admin">
            <Usuarios />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
