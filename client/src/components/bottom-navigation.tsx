import { useLocation } from "wouter";
import { Home, Cog, Calendar, FileText, User } from "lucide-react";

const navItems = [
  { path: "/services", icon: Cog, label: "Services", testId: "tab-services" },
  { path: "/booking", icon: Calendar, label: "Réserver", testId: "tab-booking" },
  { path: "/", icon: Home, label: "Accueil", testId: "tab-home" },
  { path: "/history", icon: FileText, label: "Historique", testId: "tab-history" },
  { path: "/profile", icon: User, label: "Profil", testId: "tab-profile" },
];

export default function BottomNavigation() {
  const [location, setLocation] = useLocation();

  return (
    <div className="fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-sm bg-card border-t border-border ios-blur">
      <div className="flex items-center justify-around py-2 px-6">
        {navItems.map((item) => {
          const isActive = location === item.path;
          return (
            <button
              key={item.path}
              className={`flex flex-col items-center py-2 space-y-1 ${
                isActive ? "text-primary" : "text-muted-foreground"
              }`}
              onClick={() => setLocation(item.path)}
              data-testid={item.testId}
            >
              <item.icon size={20} />
              <span className="text-xs">{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
