import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPost } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

type HistoryData = {
  quotes: any[];
  invoices: any[];
};

export default function History() {
  const [activeTab, setActiveTab] = useState<"quotes" | "invoices">("quotes");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: history, isLoading } = useQuery({
    queryKey: ["/api/history"],
    queryFn: () => apiGet<HistoryData>("/api/history"),
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
        <p className="text-sm text-muted-foreground">Vos devis et factures</p>
      </div>

      {/* Segment Control */}
      <div className="px-6 py-4">
        <div className="flex bg-secondary rounded-ios p-1">
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
                      className="ios-button flex-1 text-sm py-2"
                      onClick={() => acceptQuoteMutation.mutate(quote.id)}
                      disabled={acceptQuoteMutation.isPending}
                      data-testid={`button-accept-quote-${quote.id}`}
                    >
                      {acceptQuoteMutation.isPending ? "..." : "Accepter"}
                    </Button>
                    <Button
                      variant="outline"
                      className="px-4 py-2 text-sm"
                      data-testid={`button-quote-details-${quote.id}`}
                    >
                      Détails
                    </Button>
                  </div>
                )}
                {quote.status !== "pending" && (
                  <Button
                    variant="outline"
                    className="w-full px-4 py-2 text-sm"
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
                      className="ios-button flex-1 text-sm py-2"
                      onClick={() => markAsPaidMutation.mutate(invoice.id)}
                      disabled={markAsPaidMutation.isPending}
                      data-testid={`button-mark-paid-${invoice.id}`}
                    >
                      {markAsPaidMutation.isPending ? "..." : "Marquer payée"}
                    </Button>
                    <Button
                      variant="outline"
                      className="px-4 py-2 text-sm"
                      data-testid={`button-invoice-pdf-${invoice.id}`}
                    >
                      PDF
                    </Button>
                  </div>
                )}
                {invoice.status === "paid" && (
                  <Button
                    variant="outline"
                    className="w-full px-4 py-2 text-sm"
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
