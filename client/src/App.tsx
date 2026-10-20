import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { UserStoreProvider, useUserStore } from '@/hooks/useUserStore';
import { TopBar } from '@/components/layout/TopBar';
import { Sidebar } from '@/components/layout/Sidebar';
import { BottomNav } from '@/components/layout/BottomNav';
import { Footer } from '@/components/layout/Footer';
import { Desktop } from '@/pages/Desktop';
import { Login } from '@/pages/Login';
import { Policies } from '@/pages/Policies';
import { Portfolio } from '@/pages/Portfolio';
import { Simulator } from '@/pages/Simulator';
import { Audit } from '@/pages/Audit';
import { Rules } from '@/pages/Rules';
import { EventDetail } from '@/pages/EventDetail';

/** Guard: redirect to /login if no user session */
function RequireAuth({ children }: { children: React.ReactElement }): React.ReactElement {
  const { userId } = useUserStore();
  if (!userId) return <Navigate to="/login" replace />;
  return children;
}

/** App shell — TopBar + Sidebar + content */
function AppShell(): React.ReactElement {
  return (
    <div className="flex flex-col h-full">
      <TopBar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto flex flex-col eds-canvas pb-16 md:pb-0">
          <Routes>
            <Route path="/" element={<Navigate to="/desktop" replace />} />
            <Route path="/desktop"         element={<Desktop />} />
            <Route path="/events/:eventId" element={<EventDetail />} />
            <Route path="/policies/*"      element={<Policies />} />
            <Route path="/portfolio"       element={<Portfolio />} />
            <Route path="/simulator"       element={<Simulator />} />
            <Route path="/audit"           element={<Audit />} />
            <Route path="/rules"           element={<Rules />} />
            <Route
              path="*"
              element={
                <div className="flex flex-col items-center justify-center flex-1 p-12 text-center">
                  <div className="text-6xl mb-4">🧭</div>
                  <h1 className="text-xl font-heading font-semibold text-slate-800">404 — Page Not Found</h1>
                  <p className="text-sm text-slate-500 mt-2 max-w-xs">
                    The page you're looking for doesn't exist in this workspace.
                  </p>
                </div>
              }
            />
          </Routes>
          <Footer />
        </main>
      </div>
      <BottomNav />
    </div>
  );
}

/** Root application */
export default function App(): React.ReactElement {
  return (
    <UserStoreProvider>
      <BrowserRouter>
        <Routes>
          {/* Public route */}
          <Route path="/login" element={<Login />} />

          {/* Protected routes */}
          <Route
            path="/*"
            element={
              <RequireAuth>
                <AppShell />
              </RequireAuth>
            }
          />
        </Routes>
      </BrowserRouter>
    </UserStoreProvider>
  );
}
