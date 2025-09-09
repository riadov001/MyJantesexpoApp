import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPost, downloadFile } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Calendar, Clock, Settings, CheckCircle, XCircle } from "lucide-react";

type HistoryData = {
  bookings: any[];
  quotes: any[];
  invoices: any[];
};

export default function History() {
  const [activeTab, setActiveTab] = useState<"bookings" | "quotes" | "invoices">("bookings");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: history, isLoading } = useQuery<HistoryData>({
    queryKey: ["/api/history"],
  });

  const acceptQuoteMutation = useMutation({
    mutationFn: (quoteId: string) => apiPost(`/api/quotes/${quoteId}/accept`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/history"] });
      toast({
        title: "Devis accepté",
        description: "Le devis a été accepté et une facture a été générée.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Impossible d'accepter le devis",
        variant: "destructive",
      });
    },
  });

  const markAsPaidMutation = useMutation({
    mutationFn: (invoiceId: string) => apiPost(`/api/invoices/${invoiceId}/paid`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/history"] });
      toast({
        title: "Facture mise à jour",
        description: "La facture a été marquée comme payée.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de mettre à jour la facture",
        variant: "destructive",
      });
    },
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
        return "bg-green-500 bg-opacity-20 text-green-400";
      case "pending":
        return "bg-yellow-500 bg-opacity-20 text-yellow-400";
      case "unpaid":
        return "bg-red-500 bg-opacity-20 text-red-400";
      default:
        return "bg-gray-500 bg-opacity-20 text-gray-400";
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin" size={32} />
      </div>
    );
  }

  return (
    <div className="pb-24">
      <div className="px-6 py-4 border-b border-border">
        <h2 className="text-xl font-bold">Historique</h2>
        <p className="text-sm text-muted-foreground">Vos prestations, devis et factures</p>
      </div>

      {/* Segment Control */}
      <div className="px-6 py-4">
        <div className="flex bg-secondary rounded-ios p-1">
          <button
            className={`flex-1 py-2 text-center rounded-ios transition-all ${
              activeTab === "bookings"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground"
            }`}
            onClick={() => setActiveTab("bookings")}
            data-testid="tab-bookings"
          >
            Prestations
          </button>
          <button
            className={`flex-1 py-2 text-center rounded-ios transition-all ${
              activeTab === "quotes"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground"
            }`}
            onClick={() => setActiveTab("quotes")}
            data-testid="tab-quotes"
          >
            Devis
          </button>
          <button
            className={`flex-1 py-2 text-center rounded-ios transition-all ${
              activeTab === "invoices"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground"
            }`}
            onClick={() => setActiveTab("invoices")}
            data-testid="tab-invoices"
          >
            Factures
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 space-y-4">
        {activeTab === "bookings" && (
          <div className="space-y-4">
            {history?.bookings?.map((booking) => (
              <div key={booking.id} className="ios-card" data-testid={`card-booking-${booking.id}`}>
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-primary" />
                    <div>
                      <h3 className="font-semibold" data-testid={`text-booking-service-${booking.id}`}>
                        {booking.service?.name || "Service"}
                      </h3>
                      <p className="text-sm text-muted-foreground" data-testid={`text-booking-vehicle-${booking.id}`}>
                        {booking.vehicleBrand}
                        {booking.wheelQuantity && ` • ${booking.wheelQuantity} jantes`}
                        {booking.wheelDiameter && ` • ${booking.wheelDiameter} pouces`}
                      </p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(booking.status)}`}>
                    {getStatusText(booking.status)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm mb-4">
                  <div>
                    <div className="flex items-center space-x-1 text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      <span data-testid={`text-booking-dates-${booking.id}`}>
                        {formatDate(booking.startDateTime || booking.createdAt)}
                        {booking.endDateTime && booking.startDateTime !== booking.endDateTime && 
                          ` - ${formatDate(booking.endDateTime)}`
                        }
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">
                  Plaque: {booking.vehiclePlate}
                  {booking.notes && ` • ${booking.notes}`}
                </div>
              </div>
            ))}

            {!history?.bookings?.length && (
              <div className="ios-card text-center py-8">
                <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Aucune prestation trouvée</p>
              </div>
            )}
          </div>
        )}

        {activeTab === "quotes" && (
          <div className="space-y-4">
            {history?.quotes?.map((quote) => (
              <div key={quote.id} className="ios-card" data-testid={`card-quote-${quote.id}`}>
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-semibold" data-testid={`text-quote-id-${quote.id}`}>
                      Devis #{quote.id.slice(0, 8)}
                    </h3>
                    <p className="text-sm text-muted-foreground" data-testid={`text-quote-description-${quote.id}`}>
                      {quote.vehicleBrand} {quote.vehicleModel}
                    </p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(quote.status)}`}>
                    {getStatusText(quote.status)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm mb-4">
                  <span className="text-muted-foreground" data-testid={`text-quote-date-${quote.id}`}>
                    {formatDate(quote.createdAt)}
                  </span>
                  {quote.amount && (
                    <span className="font-semibold text-lg" data-testid={`text-quote-amount-${quote.id}`}>
                      {quote.amount}€
                    </span>
                  )}
                </div>
                {quote.status === "pending" && quote.amount && (
                  <div className="flex space-x-2">
                    <Button
                      className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white flex-1 text-sm py-2 rounded-lg font-medium shadow-md hover:shadow-lg transition-all duration-200 active:scale-95"
                      onClick={() => acceptQuoteMutation.mutate(quote.id)}
                      disabled={acceptQuoteMutation.isPending}
                      data-testid={`button-accept-quote-${quote.id}`}
                    >
                      {acceptQuoteMutation.isPending ? "..." : "Accepter"}
                    </Button>
                    <Button
                      variant="outline"
                      className="px-4 py-2 text-sm rounded-lg font-medium border-primary/20 text-primary hover:bg-primary/10 hover:border-primary/40 transition-all duration-200 active:scale-95 shadow-sm hover:shadow-md"
                      onClick={() => window.open(`/api/admin/quotes/${quote.id}/preview`, '_blank')}
                      data-testid={`button-quote-details-${quote.id}`}
                    >
                      Détails
                    </Button>
                  </div>
                )}
                {quote.status !== "pending" && (
                  <Button
                    variant="outline"
                    className="w-full px-4 py-2 text-sm rounded-lg font-medium border-primary/20 text-primary hover:bg-primary/10 hover:border-primary/40 transition-all duration-200 active:scale-95 shadow-sm hover:shadow-md"
                    onClick={() => window.open(`/api/admin/quotes/${quote.id}/preview`, '_blank')}
                    data-testid={`button-quote-details-${quote.id}`}
                  >
                    Voir les détails
                  </Button>
                )}
              </div>
            ))}

            {!history?.quotes?.length && (
              <div className="ios-card text-center py-8">
                <p className="text-muted-foreground">Aucun devis trouvé</p>
              </div>
            )}
          </div>
        )}

        {activeTab === "invoices" && (
          <div className="space-y-4">
            {history?.invoices?.map((invoice) => (
              <div key={invoice.id} className="ios-card" data-testid={`card-invoice-${invoice.id}`}>
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-semibold" data-testid={`text-invoice-id-${invoice.id}`}>
                      Facture #{invoice.id.slice(0, 8)}
                    </h3>
                    <p className="text-sm text-muted-foreground" data-testid={`text-invoice-description-${invoice.id}`}>
                      {invoice.description}
                    </p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(invoice.status)}`}>
                    {getStatusText(invoice.status)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm mb-4">
                  <span className="text-muted-foreground" data-testid={`text-invoice-date-${invoice.id}`}>
                    {formatDate(invoice.createdAt)}
                  </span>
                  <span className="font-semibold text-lg" data-testid={`text-invoice-amount-${invoice.id}`}>
                    {invoice.amount}€
                  </span>
                </div>
                {invoice.status === "unpaid" && (
                  <div className="flex space-x-2">
                    <Button
                      className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white flex-1 text-sm py-2 rounded-lg font-medium shadow-md hover:shadow-lg transition-all duration-200 active:scale-95"
                      onClick={() => markAsPaidMutation.mutate(invoice.id)}
                      disabled={markAsPaidMutation.isPending}
                      data-testid={`button-mark-paid-${invoice.id}`}
                    >
                      {markAsPaidMutation.isPending ? "..." : "Marquer payée"}
                    </Button>
                    <Button
                      variant="outline"
                      className="px-4 py-2 text-sm rounded-lg font-medium border-primary/20 text-primary hover:bg-primary/10 hover:border-primary/40 transition-all duration-200 active:scale-95 shadow-sm hover:shadow-md"
                      data-testid={`button-invoice-pdf-${invoice.id}`}
                    >
                      PDF
                    </Button>
                  </div>
                )}
                {invoice.status === "paid" && (
                  <Button
                    variant="outline"
                    className="w-full px-4 py-2 text-sm rounded-lg font-medium border-primary/20 text-primary hover:bg-primary/10 hover:border-primary/40 transition-all duration-200 active:scale-95 shadow-sm hover:shadow-md"
                    data-testid={`button-invoice-pdf-${invoice.id}`}
                  >
                    Télécharger PDF
                  </Button>
                )}
              </div>
            ))}

            {!history?.invoices?.length && (
              <div className="ios-card text-center py-8">
                <p className="text-muted-foreground">Aucune facture trouvée</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
