import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Home, Cog, Calendar, FileText, User, Bell, Settings, LogOut } from "lucide-react";
import { AuthService } from "@/lib/auth";
import { Button } from "@/components/ui/button";

const getNavItems = (isAdmin: boolean) => {
  const baseItems = [
    { path: "/", icon: Home, label: "Accueil", testId: "desktop-tab-home" },
    { path: "/services", icon: Cog, label: "Services", testId: "desktop-tab-services" },
    { path: "/booking", icon: Calendar, label: "Réserver", testId: "desktop-tab-booking" },
  ];
  
  if (isAdmin) {
    return [
      ...baseItems,
      { path: "/admin", icon: Settings, label: "Administration", testId: "desktop-tab-admin", isAdmin: true },
      { path: "/notifications", icon: Bell, label: "Notifications", testId: "desktop-tab-notifications" },
    ];
  }
  
  return [
    ...baseItems,
    { path: "/notifications", icon: Bell, label: "Notifications", testId: "desktop-tab-notifications" },
    { path: "/profile", icon: User, label: "Profil", testId: "desktop-tab-profile" },
  ];
};

export default function DesktopNavigation() {
  const [location, setLocation] = useLocation();
  const user = AuthService.getUser();
  const isAdmin = user?.role === "admin";
  const navItems = getNavItems(isAdmin);
  
  const { data: unreadCount } = useQuery({
    queryKey: ["/api/notifications/unread-count"],
    refetchInterval: 30000,
  }) as { data?: { count: number } };

  const handleLogout = () => {
    AuthService.removeToken();
    setLocation('/login');
  };

  return (
    <div className="desktop-nav">
      <nav className="bg-card border-b border-border">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-8">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white font-bold text-sm">
                  MJ
                </div>
                <h1 className="text-xl font-bold">MyJantes</h1>
              </div>
              
              <div className="flex space-x-6">
                {navItems.map((item) => {
                  const isActive = location === item.path || (item.path === "/admin" && location.startsWith("/admin"));
                  const isNotificationTab = item.path === "/notifications";
                  const hasUnreadNotifications = (unreadCount as any)?.count > 0;
                  const isAdminTab = 'isAdmin' in item && item.isAdmin;
                  
                  return (
                    <button
                      key={item.path}
                      className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                        isActive 
                          ? (isAdminTab ? "bg-red-500/20 text-red-400" : "bg-primary/20 text-primary") 
                          : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                      }`}
                      onClick={() => setLocation(item.path)}
                      data-testid={item.testId}
                    >
                      <div className="relative">
                        <item.icon size={18} />
                        {isNotificationTab && hasUnreadNotifications && (
                          <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                            <span className="text-white text-xs font-bold">
                              {(unreadCount as any)?.count > 9 ? "9+" : (unreadCount as any)?.count}
                            </span>
                          </div>
                        )}
                        {isAdminTab && (
                          <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></div>
                        )}
                      </div>
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-sm text-muted-foreground">
                {user?.name} ({user?.role})
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleLogout}
                className="flex items-center space-x-2"
                data-testid="desktop-logout-button"
              >
                <LogOut size={16} />
                <span>Déconnexion</span>
              </Button>
            </div>
          </div>
        </div>
      </nav>
    </div>
  );
}