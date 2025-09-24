import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Layout from "./Layout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import ProtectedRoute from "./components/ProtectedRoute";
import { AuthProvider } from "./context/AuthContext";
import UserManagement from "./pages/UserManagement";
import Water from "./pages/Water";
import Device from "./pages/Device";

function App() {
  return (
    <AuthProvider>
    <Router>
      <Layout>
        <Routes>
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/user"
            element={
              <ProtectedRoute>
                <UserManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/water"
            element={
              <ProtectedRoute>
                <Water />
              </ProtectedRoute>
            }
          />
          <Route
            path="/device"
            element={
              <ProtectedRoute>
                <Device />
              </ProtectedRoute>
            }
          />

          <Route path="/login" element={<Login />} />
        </Routes>
      </Layout>
    </Router>
    </AuthProvider>
  );
}

export default App;
