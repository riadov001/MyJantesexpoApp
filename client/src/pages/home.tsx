import { useQuery } from "@tanstack/react-query";
import { AuthService } from "@/lib/auth";
import { apiGet } from "@/lib/api";
import { useLocation } from "wouter";
import { Calendar, FileText, User, Wrench } from "lucide-react";

export default function Home() {
  const [, setLocation] = useLocation();
  const user = AuthService.getUser();

  const { data: recentActivity } = useQuery({
    queryKey: ["/api/history"],
    queryFn: () => apiGet<{ quotes: any[]; invoices: any[] }>("/api/history"),
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
    <div className="pb-24">
      {/* Navigation Header */}
      <div className="px-6 py-4 border-b border-border">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold" data-testid="text-welcome">
              Bonjour, {user?.name || "Utilisateur"}
            </h2>
            <p className="text-sm text-muted-foreground">
              Que souhaitez-vous faire aujourd'hui ?
            </p>
          </div>
          <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
            <User className="text-white" size={20} />
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="px-6 py-6">
        <h3 className="text-lg font-semibold mb-4">Actions rapides</h3>
        <div className="grid grid-cols-2 gap-4">
          <button
            className="ios-card text-center p-6"
            onClick={() => setLocation("/booking")}
            data-testid="button-booking"
          >
            <Calendar className="text-primary text-2xl mb-3 mx-auto" size={32} />
            <p className="font-medium">Réserver</p>
            <p className="text-xs text-muted-foreground mt-1">Nouvelle réservation</p>
          </button>
          <button
            className="ios-card text-center p-6"
            onClick={() => setLocation("/quote")}
            data-testid="button-quote"
          >
            <FileText className="text-primary text-2xl mb-3 mx-auto" size={32} />
            <p className="font-medium">Devis</p>
            <p className="text-xs text-muted-foreground mt-1">Demander un devis</p>
          </button>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="px-6 pb-24">
        <h3 className="text-lg font-semibold mb-4">Activité récente</h3>
        <div className="space-y-3">
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
  );
}
