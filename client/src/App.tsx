import { Switch, Route, Redirect } from "wouter";
import { AuthService } from "./lib/auth";
import Login from "@/pages/login";
import Home from "@/pages/home";
import Services from "@/pages/services";
import Booking from "@/pages/booking";
import Quote from "@/pages/quote";
import History from "@/pages/history";
import Profile from "@/pages/profile";
import Contact from "@/pages/contact";
import Notifications from "@/pages/notifications";
import Garanties from "@/pages/garanties";
import MentionsLegales from "@/pages/mentions-legales";
import CGV from "@/pages/cgv";
import AdminDashboard from "@/pages/admin-dashboard";
import AdminBookings from "@/pages/admin-bookings";
import AdminQuotes from "@/pages/admin-quotes";
import AdminInvoices from "@/pages/admin-invoices";
import AdminUsers from "@/pages/admin-users";
import AdminWorkProgress from "@/pages/admin-work-progress";
import AdminProfile from "@/pages/admin-profile";
import AdminCalendar from "@/pages/admin-calendar";
import BottomNavigation from "@/components/bottom-navigation";
import DesktopNavigation from "@/components/desktop-navigation";
import { useEffect, useState } from "react";
import { useLocation } from "wouter";

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const isAuthenticated = AuthService.isAuthenticated();
  
  if (!isAuthenticated) {
    return <Redirect to="/login" />;
  }
  
  return <Component />;
}

function AdminRoute({ component: Component }: { component: React.ComponentType }) {
  const isAuthenticated = AuthService.isAuthenticated();
  const user = AuthService.getUser();
  const isAdmin = user?.role === "admin";
  
  if (!isAuthenticated) {
    return <Redirect to="/login" />;
  }
  
  if (!isAdmin) {
    return <Redirect to="/" />;
  }
  
  return <Component />;
}

function AdminOrEmployeeRoute({ component: Component }: { component: React.ComponentType }) {
  const isAuthenticated = AuthService.isAuthenticated();
  const user = AuthService.getUser();
  const isAdminOrEmployee = user?.role === "admin" || user?.role === "employee";
  
  if (!isAuthenticated) {
    return <Redirect to="/login" />;
  }
  
  if (!isAdminOrEmployee) {
    return <Redirect to="/" />;
  }
  
  return <Component />;
}

function Router() {
  const [location] = useLocation();
  const isAuthenticated = AuthService.isAuthenticated();
  const showBottomNav = isAuthenticated && location !== "/login" && location !== "/contact";

  return (
    <div className="min-h-screen bg-background text-foreground">
      <DesktopNavigation />
      <div className="responsive-container bg-background min-h-screen relative lg:max-w-none lg:px-6">

        <Switch>
          <Route path="/login" component={Login} />
          <Route path="/" component={() => <ProtectedRoute component={Home} />} />
          <Route path="/services" component={() => <ProtectedRoute component={Services} />} />
          <Route path="/booking" component={() => <ProtectedRoute component={Booking} />} />
          <Route path="/quote" component={() => <ProtectedRoute component={Quote} />} />
          <Route path="/history" component={() => <ProtectedRoute component={History} />} />
          <Route path="/notifications" component={() => <ProtectedRoute component={Notifications} />} />
          <Route path="/profile" component={() => <ProtectedRoute component={Profile} />} />
          <Route path="/contact" component={() => <ProtectedRoute component={Contact} />} />
          <Route path="/garanties" component={Garanties} />
          <Route path="/mentions-legales" component={MentionsLegales} />
          <Route path="/cgv" component={CGV} />
          
          {/* Admin Routes */}
          <Route path="/admin" component={() => <AdminRoute component={AdminDashboard} />} />
          <Route path="/admin/bookings" component={() => <AdminRoute component={AdminBookings} />} />
          <Route path="/admin/quotes" component={() => <AdminRoute component={AdminQuotes} />} />
          <Route path="/admin/invoices" component={() => <AdminRoute component={AdminInvoices} />} />
          <Route path="/admin/users" component={() => <AdminRoute component={AdminUsers} />} />
          <Route path="/admin/work-progress" component={() => <AdminRoute component={AdminWorkProgress} />} />
          <Route path="/admin/calendar" component={() => <AdminRoute component={AdminCalendar} />} />
          <Route path="/admin-profile" component={() => <AdminOrEmployeeRoute component={AdminProfile} />} />
          
          <Route>
            {isAuthenticated ? <Redirect to="/" /> : <Redirect to="/login" />}
          </Route>
        </Switch>

        {showBottomNav && <BottomNavigation />}
      </div>
    </div>
  );
}

function App() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return <Router />;
}

export default App;
