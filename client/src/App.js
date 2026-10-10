import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar.js';
import Footer from './components/Footer.js';
import ProtectedRoute from './components/ProtectedRoute.js';
import DashboardLayout from './layouts/DashboardLayout';
import RouteLoadingFallback from './components/RouteLoadingFallback';

import LandingPage from './pages/LandingPage.js';
import DashboardPage from './pages/DashboardPage.js';
import NotFoundPage from './pages/NotFoundPage.js';
import AboutPage from './pages/AboutPage.js';
import MySubmissionsPage from './pages/MySubmissionsPage.js';
import SubmitEntryWorkspacePage from './pages/SubmitEntryWorkspacePage.js';
import { ErrorBoundary } from './pages/ErrorPage.js';

import heritageService from './services/heritageService';
import reviewService from './services/reviewService';
import adminService from './services/adminService';
import highlightService from './services/highlightService';
import blogService from './services/blogService';
import heritageSiteService from './services/heritageSiteService';
import roleRequestService from './services/roleRequestService';

const EntryDetailPage = lazy(() => import('./pages/EntryDetailPage'));
const MapPage = lazy(() => import('./pages/MapPage'));
const BrowsePage = lazy(() => import('./pages/BrowsePage'));
const TimelinePage = lazy(() => import('./pages/TimelinePage'));
const BlogFeedPage = lazy(() => import('./pages/BlogFeedPage'));
const BlogPostPage = lazy(() => import('./pages/BlogPostPage'));
const ValidatorDashboardPage = lazy(() => import('./pages/ValidatorDashboardPage'));
const AdminDashboardPage = lazy(() => import('./pages/AdminDashboardPage'));

function AppShell() {
  return (
    <div className="site-app-shell min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-1">
        <Suspense fallback={<RouteLoadingFallback />}>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/about" element={<AboutPage />} />

            <Route
              path="/browse"
              element={
                <BrowsePage
                  searchEntries={heritageService.searchEntries}
                />
              }
            />
            <Route path="/entries/:id" element={<EntryDetailPage fetchEntry={heritageService.getEntryById} />} />
            <Route path="/map" element={<MapPage />} />
            <Route path="/timeline" element={<TimelinePage fetchTimeline={heritageService.getTimeline} />} />
            <Route
              path="/blog"
              element={<BlogFeedPage fetchPosts={blogService.getPosts} createPost={blogService.createPost} />}
            />
            <Route path="/blog/:id" element={<BlogPostPage fetchPost={blogService.getPostById} />} />

            <Route element={<ProtectedRoute minRole="public" />}>
              <Route element={<DashboardLayout />}>
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/dashboard/submit" element={<SubmitEntryWorkspacePage />} />
                <Route
                  path="/dashboard/submissions"
                  element={<MySubmissionsPage fetchMyEntries={heritageService.getMyEntries} />}
                />
              </Route>
            </Route>

            <Route element={<ProtectedRoute minRole="contributor" />}>
              <Route element={<DashboardLayout />}>
                <Route
                  path="/submit"
                  element={<Navigate to="/dashboard/submit" replace />}
                />
              </Route>
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
                      deleteRegion={adminService.deleteRegion}
                      fetchCategories={adminService.getCategories}
                      createCategory={adminService.createCategory}
                      deleteCategory={adminService.deleteCategory}
                      searchEntries={heritageService.searchEntries}
                      createHighlight={highlightService.createHighlight}
                      fetchHighlightHistory={highlightService.getHighlightHistory}
                      fetchPending={reviewService.getPendingEntries}
                      fetchPosts={blogService.getPosts}
                      fetchSites={heritageSiteService.getSites}
                      createSite={heritageSiteService.createSite}
                      deleteSite={heritageSiteService.deleteSite}
                      fetchAuditLog={adminService.getAuditLog}
                      fetchRoleRequests={roleRequestService.getPendingRequests}
                      reviewRoleRequest={roleRequestService.reviewRequest}
                      fetchHeritageEntries={adminService.getHeritageEntries}
                      deleteHeritageEntry={adminService.deleteHeritageEntry}
                      setEducationalAiExcluded={adminService.setEducationalAiExcluded}
                    />
                  }
                />

                <Route
                  path="/admin/audit-log"
                  element={<Navigate to="/admin?tab=audit-log" replace />}
                />
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
    <BrowserRouter>
      <ErrorBoundary>
        <AuthProvider>
          <AppShell />
        </AuthProvider>
      </ErrorBoundary>
    </BrowserRouter>
  );
}

export default App;