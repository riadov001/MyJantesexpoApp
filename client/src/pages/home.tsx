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
      {/* Header with Logo - Responsive */}
      <div className="px-4 xs:px-6 py-4 md:py-6 lg:py-8 border-b border-border">
        <div className="container mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h2 className="text-lg xs:text-xl md:text-2xl lg:text-3xl xl:text-4xl font-bold" data-testid="text-welcome">
                Bonjour, {user?.name || "Utilisateur"}
              </h2>
              <p className="text-xs xs:text-sm md:text-base lg:text-lg text-muted-foreground mt-1">
                Que souhaitez-vous faire aujourd'hui ?
              </p>
            </div>
            <img 
              src={logoUrl} 
              alt="MY JANTES" 
              className="h-10 xs:h-12 sm:h-14 md:h-16 lg:h-18 xl:h-20 w-auto bg-white rounded-lg p-1.5 sm:p-2 shadow-sm flex-shrink-0 ml-4"
              data-testid="logo-myjantes"
            />
          </div>
        </div>
      </div>

      {/* Quick Actions - Responsive */}
      <div className="px-4 xs:px-6 py-6 md:py-8 lg:py-10">
        <div className="max-w-7xl mx-auto">
          <h3 className="text-base xs:text-lg md:text-xl lg:text-2xl font-semibold mb-4 md:mb-6 lg:mb-8">Actions rapides</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 xs:gap-4 md:gap-6 lg:gap-8">
            <button
              className="ios-card text-center p-4 xs:p-5 sm:p-6 md:p-7 lg:p-8 xl:p-10 hover:scale-105 transition-transform duration-200"
              onClick={() => setLocation("/booking")}
              data-testid="button-booking"
            >
              <Calendar className="text-primary mb-2 xs:mb-3 mx-auto" size={24} />
              <p className="font-medium text-sm xs:text-base md:text-lg lg:text-xl">Réserver</p>
              <p className="text-xs sm:text-sm md:text-base text-muted-foreground mt-1 leading-tight">Nouvelle réservation</p>
            </button>
            <button
              className="ios-card text-center p-4 xs:p-5 sm:p-6 md:p-7 lg:p-8 xl:p-10 hover:scale-105 transition-transform duration-200"
              onClick={() => setLocation("/quote")}
              data-testid="button-quote"
            >
              <FileText className="text-primary mb-2 xs:mb-3 mx-auto" size={24} />
              <p className="font-medium text-sm xs:text-base md:text-lg lg:text-xl">Devis</p>
              <p className="text-xs sm:text-sm md:text-base text-muted-foreground mt-1 leading-tight">Demander un devis</p>
            </button>
            <button
              className="ios-card text-center p-4 xs:p-5 sm:p-6 md:p-7 lg:p-8 xl:p-10 hover:scale-105 transition-transform duration-200"
              onClick={() => setLocation("/history")}
              data-testid="button-history"
            >
              <FileText className="text-primary mb-2 xs:mb-3 mx-auto" size={24} />
              <p className="font-medium text-sm xs:text-base md:text-lg lg:text-xl">Historique</p>
              <p className="text-xs sm:text-sm md:text-base text-muted-foreground mt-1 leading-tight">Mes prestations</p>
            </button>
            <button
              className="ios-card text-center p-4 xs:p-5 sm:p-6 md:p-7 lg:p-8 xl:p-10 hover:scale-105 transition-transform duration-200"
              onClick={() => setLocation("/profile")}
              data-testid="button-profile"
            >
              <User className="text-primary mb-2 xs:mb-3 mx-auto" size={24} />
              <p className="font-medium text-sm xs:text-base md:text-lg lg:text-xl">Profil</p>
              <p className="text-xs sm:text-sm md:text-base text-muted-foreground mt-1 leading-tight">Mon compte</p>
            </button>
          </div>
        </div>
      </div>

      {/* Recent Activity - Responsive */}
      <div className="px-4 xs:px-6 pb-24 lg:pb-8">
        <div className="max-w-7xl mx-auto">
          <h3 className="text-base xs:text-lg md:text-xl lg:text-2xl font-semibold mb-4 md:mb-6 lg:mb-8">Activité récente</h3>
          <div className="space-y-3 md:space-y-4 lg:grid lg:grid-cols-2 xl:grid-cols-3 lg:gap-6 lg:space-y-0">
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
