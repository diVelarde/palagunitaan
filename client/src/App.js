import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar.js';
import Footer from './components/Footer.js';
import ProtectedRoute from './components/ProtectedRoute.js';
import DashboardLayout from './layouts/DashboardLayout';

import LandingPage from './pages/LandingPage.js';
import DashboardPage from './pages/DashboardPage.js';
import NotFoundPage from './pages/NotFoundPage.js';
import StubPage from './pages/StubPage.js';
import { ErrorBoundary } from './pages/ErrorPage.js';

function AppShell() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-1">
        <Routes>
          <Route path="/" element={<LandingPage />} />

          {/* Public, read-only pages — built out in HTG/MAP/SRC/BLG phases */}
          <Route path="/browse" element={<StubPage title="Browse Heritage Entries" phase="HTG" />} />
          <Route path="/map" element={<StubPage title="Heritage Map" phase="MAP" />} />
          <Route path="/timeline" element={<StubPage title="Timeline" phase="SRC" />} />
          <Route path="/blog" element={<StubPage title="Community Blog" phase="BLG" />} />

          {/* Logged-in area */}
          <Route element={<ProtectedRoute minRole="public" />}>
            <Route element={<DashboardLayout />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route
                path="/dashboard/submissions"
                element={<StubPage title="My Submissions" phase="HTG" />}
              />
            </Route>
          </Route>

          <Route element={<ProtectedRoute minRole="contributor" />}>
            <Route path="/submit" element={<StubPage title="Submit an Entry" phase="HTG" />} />
          </Route>

          <Route element={<ProtectedRoute minRole="validator" />}>
            <Route
              element={<DashboardLayout />}
            >
              <Route path="/validate" element={<StubPage title="Validation Queue" phase="VAL" />} />
            </Route>
          </Route>

          <Route element={<ProtectedRoute minRole="admin" />}>
            <Route element={<DashboardLayout />}>
              <Route path="/admin" element={<StubPage title="Administration" phase="ADM" />} />
            </Route>
          </Route>

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </div>
      <Footer />
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <AppShell />
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;