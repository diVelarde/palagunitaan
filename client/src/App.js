import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar.js';
import Footer from './components/Footer.js';
import ProtectedRoute from './components/ProtectedRoute.js';
import DashboardLayout from './layouts/DashboardLayout';
import RouteLoadingFallback from './components/RouteLoadingFallback';

import LandingPage from './pages/LandingPage.js';
import DashboardPage from './pages/DashboardPage.js';
import NotFoundPage from './pages/NotFoundPage.js';
import StubPage from './pages/StubPage.js';
import { ErrorBoundary } from './pages/ErrorPage.js';

import heritageService from './services/heritageService';
import reviewService from './services/reviewService';
import adminService from './services/adminService';
import highlightService from './services/highlightService';
import blogService from './services/blogService';

const SubmitEntryPage = lazy(() => import('./pages/SubmitEntryPage'));
const EntryDetailPage = lazy(() => import('./pages/EntryDetailPage'));
const MapPage = lazy(() => import('./pages/MapPage'));
const BrowsePage = lazy(() => import('./pages/BrowsePage'));
const TimelinePage = lazy(() => import('./pages/TimelinePage'));
const BlogFeedPage = lazy(() => import('./pages/BlogFeedPage'));
const ValidatorDashboardPage = lazy(() => import('./pages/ValidatorDashboardPage'));
const AdminDashboardPage = lazy(() => import('./pages/AdminDashboardPage'));
const AuditLogPage = lazy(() => import('./pages/AuditLogPage'));

function AppShell() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-1">
        <Suspense fallback={<RouteLoadingFallback />}>
          <Routes>
            <Route path="/" element={<LandingPage />} />

            <Route path="/browse" element={<BrowsePage searchEntries={heritageService.searchEntries} />} />
            <Route path="/entries/:id" element={<EntryDetailPage fetchEntry={heritageService.getEntryById} />} />
            <Route path="/map" element={<MapPage />} />
            <Route path="/timeline" element={<TimelinePage fetchTimeline={heritageService.getTimeline} />} />
            <Route path="/blog" element={<BlogFeedPage fetchPosts={blogService.getPosts} />} />

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
              <Route path="/submit" element={<SubmitEntryPage onSubmit={heritageService.submitEntry} />} />
            </Route>

            <Route element={<ProtectedRoute minRole="validator" />}>
              <Route element={<DashboardLayout />}>
                <Route
                  path="/validate"
                  element={
                    <ValidatorDashboardPage
                      fetchPending={reviewService.getPendingEntries}
                      submitReview={reviewService.submitReview}
                    />
                  }
                />
              </Route>
            </Route>

            <Route element={<ProtectedRoute minRole="admin" />}>
              <Route element={<DashboardLayout />}>
                <Route
                  path="/admin"
                  element={
                    <AdminDashboardPage
                      fetchUsers={adminService.getUsers}
                      updateUserRole={adminService.updateUserRole}
                      fetchRegions={adminService.getRegions}
                      createRegion={adminService.createRegion}
                      fetchCategories={adminService.getCategories}
                      createCategory={adminService.createCategory}
                      searchEntries={heritageService.searchEntries}
                      createHighlight={highlightService.createHighlight}
                    />
                  }
                />

                <Route path="/admin/audit-log" element={<AuditLogPage fetchAuditLog={adminService.getAuditLog} />} />
              </Route>
            </Route>

            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
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