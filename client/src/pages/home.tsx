import { useQuery } from "@tanstack/react-query";
import { AuthService } from "@/lib/auth";
import { apiGet } from "@/lib/api";
import { useLocation } from "wouter";
import { Calendar, FileText, User, Wrench } from "lucide-react";
import logoUrl from "@/assets/logo-myjantes.png";

export default function Home() {
  const [, setLocation] = useLocation();
  const user = AuthService.getUser();

  const { data: recentActivity } = useQuery<{
    bookings: any[];
    quotes: any[];
    invoices: any[];
  }>({
    queryKey: ["/api/history"],
  });

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "accepted":
      case "paid":
        return "text-green-400";
      case "pending":
        return "text-yellow-400";
      case "unpaid":
        return "text-red-400";
      default:
        return "text-muted-foreground";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "accepted":
        return "Accepté";
      case "paid":
        return "Payé";
      case "pending":
        return "En attente";
      case "unpaid":
        return "Impayé";
      default:
        return status;
    }
  };

  return (
    <div className="pb-24 lg:pb-8">
      {/* Header with Logo - Desktop optimized */}
      <div className="px-6 py-4 lg:py-8 border-b border-border">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl lg:text-3xl font-bold" data-testid="text-welcome">
                Bonjour, {user?.name || "Utilisateur"}
              </h2>
              <p className="text-sm lg:text-base text-muted-foreground">
                Que souhaitez-vous faire aujourd'hui ?
              </p>
            </div>
            <img 
              src={logoUrl} 
              alt="MY JANTES" 
              className="h-12 lg:h-16 w-auto bg-white rounded-lg p-2 shadow-sm"
              data-testid="logo-myjantes"
            />
          </div>
        </div>
      </div>

      {/* Quick Actions - Desktop optimized */}
      <div className="px-6 py-6 lg:py-8">
        <div className="max-w-7xl mx-auto">
          <h3 className="text-lg lg:text-xl font-semibold mb-4 lg:mb-6">Actions rapides</h3>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-8">
            <button
              className="ios-card text-center p-6 lg:p-8 hover:scale-105 transition-transform"
              onClick={() => setLocation("/booking")}
              data-testid="button-booking"
            >
              <Calendar className="text-primary text-2xl lg:text-4xl mb-3 mx-auto" size={32} />
              <p className="font-medium lg:text-lg">Réserver</p>
              <p className="text-xs lg:text-sm text-muted-foreground mt-1">Nouvelle réservation</p>
            </button>
            <button
              className="ios-card text-center p-6 lg:p-8 hover:scale-105 transition-transform"
              onClick={() => setLocation("/quote")}
              data-testid="button-quote"
            >
              <FileText className="text-primary text-2xl lg:text-4xl mb-3 mx-auto" size={32} />
              <p className="font-medium lg:text-lg">Devis</p>
              <p className="text-xs lg:text-sm text-muted-foreground mt-1">Demander un devis</p>
            </button>
            <button
              className="ios-card text-center p-6 lg:p-8 hover:scale-105 transition-transform"
              onClick={() => setLocation("/history")}
              data-testid="button-history"
            >
              <FileText className="text-primary text-2xl lg:text-4xl mb-3 mx-auto" size={32} />
              <p className="font-medium lg:text-lg">Historique</p>
              <p className="text-xs lg:text-sm text-muted-foreground mt-1">Mes prestations</p>
            </button>
            <button
              className="ios-card text-center p-6 lg:p-8 hover:scale-105 transition-transform"
              onClick={() => setLocation("/profile")}
              data-testid="button-profile"
            >
              <User className="text-primary text-2xl lg:text-4xl mb-3 mx-auto" size={32} />
              <p className="font-medium lg:text-lg">Profil</p>
              <p className="text-xs lg:text-sm text-muted-foreground mt-1">Mon compte</p>
            </button>
          </div>
        </div>
      </div>

      {/* Recent Activity - Desktop optimized */}
      <div className="px-6 pb-24 lg:pb-8">
        <div className="max-w-7xl mx-auto">
          <h3 className="text-lg lg:text-xl font-semibold mb-4 lg:mb-6">Activité récente</h3>
          <div className="space-y-3 lg:grid lg:grid-cols-2 lg:gap-6 lg:space-y-0">
          {recentActivity?.quotes?.slice(0, 2).map((quote) => (
            <div key={quote.id} className="ios-card flex items-center space-x-4" data-testid={`card-quote-${quote.id}`}>
              <div className="w-12 h-12 bg-secondary rounded-ios flex items-center justify-center">
                <FileText className="text-primary" size={20} />
              </div>
              <div className="flex-1">
                <p className="font-medium">Devis #{quote.id.slice(0, 8)}</p>
                <p className="text-sm text-muted-foreground">
                  {formatDate(quote.createdAt)}
                </p>
              </div>
              <span className={`text-sm font-medium ${getStatusColor(quote.status)}`}>
                {getStatusText(quote.status)}
              </span>
            </div>
          ))}

          {recentActivity?.invoices?.slice(0, 2).map((invoice) => (
            <div key={invoice.id} className="ios-card flex items-center space-x-4" data-testid={`card-invoice-${invoice.id}`}>
              <div className="w-12 h-12 bg-secondary rounded-ios flex items-center justify-center">
                <Wrench className="text-primary" size={20} />
              </div>
              <div className="flex-1">
                <p className="font-medium">Facture #{invoice.id.slice(0, 8)}</p>
                <p className="text-sm text-muted-foreground">
                  {formatDate(invoice.createdAt)}
                </p>
              </div>
              <span className={`text-sm font-medium ${getStatusColor(invoice.status)}`}>
                {getStatusText(invoice.status)}
              </span>
            </div>
          ))}

          {(!recentActivity?.quotes?.length && !recentActivity?.invoices?.length) && (
            <div className="ios-card text-center py-8">
              <p className="text-muted-foreground">Aucune activité récente</p>
              <p className="text-sm text-muted-foreground mt-1">
                Commencez par faire une réservation ou demander un devis
              </p>
            </div>
          )}
          </div>
        </div>
      </div>
    </div>
  );
}
