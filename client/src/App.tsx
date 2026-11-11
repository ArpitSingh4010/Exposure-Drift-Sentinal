import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { UserStoreProvider, useUserStore } from '@/hooks/useUserStore';
import { TopBar } from '@/components/layout/TopBar';
import { Sidebar } from '@/components/layout/Sidebar';
import { BottomNav } from '@/components/layout/BottomNav';
import { Footer } from '@/components/layout/Footer';
import { Desktop } from '@/pages/Desktop';
import { Login } from '@/pages/Login';
import { Policies } from '@/pages/Policies';
import { Products } from '@/pages/Products';
import { Portfolio } from '@/pages/Portfolio';
import { Simulator } from '@/pages/Simulator';
import { Audit } from '@/pages/Audit';
import { Rules } from '@/pages/Rules';
import { EventDetail } from '@/pages/EventDetail';
import { Registry } from '@/pages/Registry';

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
        <main className="flex-1 overflow-y-auto flex flex-col app-canvas pb-16 md:pb-0">
          <Routes>
            <Route path="/" element={<Navigate to="/desktop" replace />} />
            <Route path="/desktop"         element={<Desktop />} />
            <Route path="/events/:eventId" element={<EventDetail />} />
            <Route path="/policies/*"      element={<Policies />} />
            <Route path="/products"        element={<Products />} />
            <Route path="/portfolio"       element={<Portfolio />} />
            <Route path="/simulator"       element={<Simulator />} />
            <Route path="/audit"           element={<Audit />} />
            <Route path="/rules"           element={<Rules />} />
            <Route path="/registry"        element={<Registry />} />
            <Route
              path="*"
              element={
                <div className="flex flex-col items-center justify-center flex-1 p-12 text-center space-y-2">
                  <div className="font-mono text-2xl text-[#7A7A74]">404</div>
                  <h1 className="text-base font-semibold text-[#1A1A18]">Page Not Found</h1>
                  <p className="text-xs text-[#7A7A74] max-w-xs">
                    The requested location does not exist in this workspace.
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
