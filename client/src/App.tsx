import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch, Redirect } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import MissionLayout from "./components/MissionLayout";
import { useAuth } from "./_core/hooks/useAuth";

// Pages — Language v2 names
import LandingPage from "./pages/LandingPage";           // Public landing page
import MissionControl from "./pages/MissionControl";     // Dashboard
import LaunchPad from "./pages/LaunchPad";               // New Product
import Assembly from "./pages/Assembly";                 // Build
import Systems from "./pages/Systems";                   // Connections
import ControlTower from "./pages/ControlTower";         // Health
import Login from "./pages/Login";
import FlightDeck from "./pages/FlightDeck";             // Settings
import MissionVault from "./pages/MissionVault";         // Vault

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return null;
  if (!isAuthenticated) return <Redirect to="/login" />;
  return <Component />;
}

function Router() {
  return (
    <Switch>
      {/* Public landing page — no nav, no auth required */}
      <Route path="/" component={LandingPage} />
      <Route path="/login" component={Login} />

      {/* Authenticated app — all routes under /dashboard */}
      <Route>
        <MissionLayout>
          <Switch>
            <Route path="/dashboard" component={MissionControl} />
            <Route path="/new-product" component={LaunchPad} />
            <Route path="/build" component={Assembly} />
            <Route path="/connections" component={Systems} />
            <Route path="/health" component={ControlTower} />
            <Route path="/settings">
              <ProtectedRoute component={FlightDeck} />
            </Route>
            <Route path="/vault">
              <ProtectedRoute component={MissionVault} />
            </Route>

            {/* Legacy redirects — keep old URLs working */}
            <Route path="/launch-pad">
              <Redirect to="/new-product" />
            </Route>
            <Route path="/assembly">
              <Redirect to="/build" />
            </Route>
            <Route path="/systems">
              <Redirect to="/connections" />
            </Route>
            <Route path="/control-tower">
              <Redirect to="/health" />
            </Route>
            <Route path="/flight-deck">
              <Redirect to="/settings" />
            </Route>
            <Route path="/mission-control">
              <Redirect to="/dashboard" />
            </Route>

            <Route path="/404" component={NotFound} />
            <Route component={NotFound} />
          </Switch>
        </MissionLayout>
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
