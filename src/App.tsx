import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { AppRoutes } from "./routes/AppRoutes";

// AuthProvider debe envolver a las rutas para que ProtectedRoute pueda leer la sesión.
// Las rutas (y su protección por login/rol) viven en src/routes/AppRoutes.tsx.
function App() {
  return (
    <AuthProvider>
      <BrowserRouter
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
