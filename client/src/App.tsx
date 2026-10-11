import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { UserStoreProvider } from '@/hooks/useUserStore';
import { TopBar } from '@/components/layout/TopBar';
import { Sidebar } from '@/components/layout/Sidebar';
import { Footer } from '@/components/layout/Footer';
import { Desktop } from '@/pages/Desktop';
import { Policies } from '@/pages/Policies';
import { Portfolio } from '@/pages/Portfolio';
import { Simulator } from '@/pages/Simulator';
import { Audit } from '@/pages/Audit';
import { Rules } from '@/pages/Rules';
import { EventDetail } from '@/pages/EventDetail';

/** Root application layout — TopBar + Sidebar + main content area + Footer */
export default function App(): React.ReactElement {
  return (
    <UserStoreProvider>
      <BrowserRouter>
        <div className="flex flex-col h-full">
          {/* ── Top bar ──────────────────────────────────────────────── */}
          <TopBar />

          {/* ── Body: sidebar + content ───────────────────────────────── */}
          <div className="flex flex-1 overflow-hidden">
            <Sidebar />

            <main className="flex-1 overflow-y-auto flex flex-col bg-gray-50">
              <Routes>
                <Route path="/" element={<Navigate to="/desktop" replace />} />
                <Route path="/desktop" element={<Desktop />} />
                <Route path="/events/:eventId" element={<EventDetail />} />
                <Route path="/policies/*" element={<Policies />} />
                <Route path="/portfolio" element={<Portfolio />} />
                <Route path="/simulator" element={<Simulator />} />
                <Route path="/audit" element={<Audit />} />
                <Route path="/rules" element={<Rules />} />
                <Route
                  path="*"
                  element={
                    <div className="p-6">
                      <h1 className="text-xl font-semibold text-gray-900">404 — Not Found</h1>
                      <p className="text-sm text-gray-500 mt-1">
                        The page you are looking for does not exist.
                      </p>
                    </div>
                  }
                />
              </Routes>

              {/* ── Footer on every page ─────────────────────────────── */}
              <Footer />
            </main>
          </div>
        </div>
      </BrowserRouter>
    </UserStoreProvider>
  );
}
