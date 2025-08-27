import { AuthService } from "@/lib/auth";
import { useLocation } from "wouter";
import { Phone, Bell, FileText, Shield, LogOut, User, Settings } from "lucide-react";

export default function Profile() {
  const [, setLocation] = useLocation();
  const user = AuthService.getUser();
  const isAdmin = user?.role === "admin";

  const handleLogout = () => {
    AuthService.removeToken();
    setLocation("/login");
  };

  const menuItems = [
    {
      icon: Phone,
      label: "Contact",
      action: () => setLocation("/contact"),
      testId: "button-contact"
    },
    {
      icon: Bell,
      label: "Notifications",
      action: () => setLocation("/notifications"),
      testId: "button-notifications"
    },
    {
      icon: FileText,
      label: "CGV",
      action: () => {},
      testId: "button-cgv"
    },
    {
      icon: Shield,
      label: "Politique de confidentialité",
      action: () => {},
      testId: "button-privacy"
    },
  ];

  const adminMenuItems = [
    {
      icon: Settings,
      label: "Administration",
      action: () => setLocation("/admin"),
      testId: "button-admin"
    },
  ];

  return (
    <div className="pb-24">
      <div className="px-6 py-4 border-b border-border">
        <h2 className="text-xl font-bold">Profil</h2>
      </div>

      <div className="px-6 py-6">
        {/* Profile Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-primary rounded-full mx-auto mb-4 flex items-center justify-center">
            <User className="text-3xl text-white" size={40} />
          </div>
          <h3 className="font-semibold text-lg" data-testid="text-user-name">
            {user?.name || "Utilisateur"}
          </h3>
          <p className="text-muted-foreground" data-testid="text-user-email">
            {user?.email || ""}
          </p>
        </div>

        {/* Menu Items */}
        <div className="space-y-1">
          {menuItems.map((item, index) => (
            <button
              key={index}
              className="w-full flex items-center space-x-4 p-4 hover:bg-secondary rounded-ios transition-colors"
              onClick={item.action}
              data-testid={item.testId}
            >
              <item.icon className="w-5 h-5" />
              <span className="flex-1 text-left">{item.label}</span>
              <i className="fas fa-chevron-right text-muted-foreground"></i>
            </button>
          ))}

          {/* Admin Section */}
          {isAdmin && (
            <>
              <div className="border-t border-border my-4"></div>
              <div className="px-4 py-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Administration
                </p>
              </div>
              {adminMenuItems.map((item, index) => (
                <button
                  key={`admin-${index}`}
                  className="w-full flex items-center space-x-4 p-4 hover:bg-secondary rounded-ios transition-colors"
                  onClick={item.action}
                  data-testid={item.testId}
                >
                  <item.icon className="w-5 h-5 text-primary" />
                  <span className="flex-1 text-left font-medium">{item.label}</span>
                  <i className="fas fa-chevron-right text-muted-foreground"></i>
                </button>
              ))}
            </>
          )}

          <div className="border-t border-border my-4"></div>
          
          <button
            className="w-full flex items-center space-x-4 p-4 hover:bg-secondary rounded-ios transition-colors text-red-400"
            onClick={handleLogout}
            data-testid="button-logout"
          >
            <LogOut className="w-5 h-5" />
            <span className="flex-1 text-left">Déconnexion</span>
          </button>
        </div>
      </div>
    </div>
  );
}
