import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Login } from "./pages/Login";
import { AuthProvider } from "./context/AuthContext"; 

// 1. Importamos todas las páginas internas de la aplicación
import { Dashboard } from "./pages/Dashboard";
import { Oportunidades } from "./pages/Oportunidades";
import { CirugiasEfectivas } from "./pages/CirugiasEfectivas";
import { Seguimientos } from "./pages/Seguimientos";
import { Usuarios } from "./pages/Usuarios";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true
        }}
      >
        <Routes>
          {/* Ruta pública inicial */}
          <Route path="/login" element={<Login />} />
          
          {/* 2. Definimos las rutas internas del sistema */}
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/oportunidades" element={<Oportunidades />} />
          <Route path="/cirugias" element={<CirugiasEfectivas />} />
          <Route path="/seguimientos" element={<Seguimientos />} />
          <Route path="/usuarios" element={<Usuarios />} />

          {/* Si un usuario ya logueado entra a la raíz /, lo mandamos al Dashboard */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          
          {/* Comodín por si escriben cualquier otra ruta rota */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;