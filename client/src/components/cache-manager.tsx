import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trash2, RotateCcw, AlertTriangle } from "lucide-react";
import { AuthService } from "@/lib/auth";

export function CacheManager() {
  const [isClearing, setIsClearing] = useState(false);

  const clearApplicationCache = async () => {
    setIsClearing(true);
    try {
      // Clear localStorage
      const user = AuthService.getUser();
      const token = AuthService.getToken();
      
      localStorage.clear();
      
      // Restore user data if it was valid
      if (user && token) {
        AuthService.setToken(token);
        AuthService.setUser(user);
      }
      
      // Clear sessionStorage
      sessionStorage.clear();
      
      // Clear caches if available
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames.map(cacheName => caches.delete(cacheName))
        );
      }
      
      // Unregister service workers
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(
          registrations.map(registration => registration.unregister())
        );
      }
      
      // Force reload après nettoyage
      setTimeout(() => {
        window.location.reload();
      }, 500);
      
    } catch (error) {
      console.error('Erreur lors du nettoyage:', error);
    } finally {
      setIsClearing(false);
    }
  };

  const clearCookies = () => {
    // Clear all cookies for this domain
    document.cookie.split(";").forEach((c) => {
      const eqPos = c.indexOf("=");
      const name = eqPos > -1 ? c.substr(0, eqPos) : c;
      document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
    });
    
    // Reload page
    window.location.reload();
  };

  const emergencyReset = () => {
    // Nettoyage complet d'urgence
    localStorage.clear();
    sessionStorage.clear();
    
    // Clear all cookies
    document.cookie.split(";").forEach((c) => {
      const eqPos = c.indexOf("=");
      const name = eqPos > -1 ? c.substr(0, eqPos) : c;
      document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
    });
    
    // Force redirect to login
    window.location.href = '/login';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <RotateCcw className="w-5 h-5" />
          Gestion du Cache
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-muted-foreground">
          Si l'application ne fonctionne pas correctement, utilisez ces outils pour nettoyer le cache et les données temporaires.
        </div>
        
        <div className="space-y-3">
          <Button
            onClick={clearApplicationCache}
            disabled={isClearing}
            variant="outline"
            className="w-full rounded-lg font-medium border-primary/20 text-primary hover:bg-primary/10 hover:border-primary/40 transition-all duration-200 active:scale-95 shadow-sm hover:shadow-md"
            data-testid="button-clear-cache"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            {isClearing ? "Nettoyage..." : "Nettoyer le Cache"}
          </Button>
          
          <Button
            onClick={clearCookies}
            variant="outline"
            className="w-full rounded-lg font-medium border-yellow-500/20 text-yellow-600 hover:bg-yellow-500/10 hover:border-yellow-500/40 transition-all duration-200 active:scale-95 shadow-sm hover:shadow-md"
            data-testid="button-clear-cookies"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Effacer les Cookies
          </Button>
          
          <Button
            onClick={emergencyReset}
            variant="destructive"
            className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 rounded-lg font-medium shadow-md hover:shadow-lg transition-all duration-200 active:scale-95"
            data-testid="button-emergency-reset"
          >
            <AlertTriangle className="w-4 h-4 mr-2" />
            Réinitialisation d'Urgence
          </Button>
        </div>
        
        <div className="text-xs text-muted-foreground">
          ⚠️ La réinitialisation d'urgence vous déconnectera et effacera toutes les données temporaires.
        </div>
      </CardContent>
    </Card>
  );
}