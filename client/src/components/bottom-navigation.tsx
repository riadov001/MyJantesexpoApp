import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Home, Cog, Calendar, FileText, User, Bell, Settings } from "lucide-react";
import { AuthService } from "@/lib/auth";

const getNavItems = (isAdmin: boolean) => {
  const baseItems = [
    { path: "/services", icon: Cog, label: "Services", testId: "tab-services" },
    { path: "/booking", icon: Calendar, label: "Réserver", testId: "tab-booking" },
    { path: "/", icon: Home, label: "Accueil", testId: "tab-home" },
  ];
  
  if (isAdmin) {
    return [
      ...baseItems,
      { path: "/admin", icon: Settings, label: "Admin", testId: "tab-admin", isAdmin: true },
      { path: "/notifications", icon: Bell, label: "Notifs", testId: "tab-notifications" },
    ];
  }
  
  return [
    ...baseItems,
    { path: "/notifications", icon: Bell, label: "Notifs", testId: "tab-notifications" },
    { path: "/profile", icon: User, label: "Profil", testId: "tab-profile" },
  ];
};

export default function BottomNavigation() {
  const [location, setLocation] = useLocation();
  const user = AuthService.getUser();
  const isAdmin = user?.role === "admin";
  const navItems = getNavItems(isAdmin);
  
  const { data: unreadCount } = useQuery({
    queryKey: ["/api/notifications/unread-count"],
    refetchInterval: 30000, // Refresh every 30 seconds
  }) as { data?: { count: number } };

  return (
    <div className="fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-sm xs:max-w-md sm:max-w-lg lg:hidden bg-card border-t border-border ios-blur">
      <div className="flex items-center justify-around py-2 px-6">
        {navItems.map((item) => {
          const isActive = location === item.path || (item.path === "/admin" && location.startsWith("/admin"));
          const isNotificationTab = item.path === "/notifications";
          const hasUnreadNotifications = (unreadCount as any)?.count > 0;
          const isAdminTab = 'isAdmin' in item && item.isAdmin;
          
          return (
            <button
              key={item.path}
              className={`flex flex-col items-center py-2 space-y-1 relative ${
                isActive ? (isAdminTab ? "text-red-400" : "text-primary") : "text-muted-foreground"
              }`}
              onClick={() => setLocation(item.path)}
              data-testid={item.testId}
            >
              <div className="relative">
                <item.icon size={20} />
                {isNotificationTab && hasUnreadNotifications && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-bold">
                      {(unreadCount as any)?.count > 9 ? "9+" : (unreadCount as any)?.count}
                    </span>
                  </div>
                )}
                {isAdminTab && (
                  <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></div>
                )}
              </div>
              <span className="text-xs">{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
