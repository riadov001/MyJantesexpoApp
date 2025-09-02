import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPost } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { FileText, User, Euro, Clock, Image } from "lucide-react";
import type { Quote } from "@shared/schema";

export default function AdminQuotes() {
  const [priceInput, setPriceInput] = useState<{ [key: string]: string }>({});
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: quotes, isLoading } = useQuery<Quote[]>({
    queryKey: ["/api/admin/quotes"],
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status, amount }: { id: string; status: string; amount?: string }) => 
      apiPost(`/api/admin/quotes/${id}/status`, { status, amount }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/quotes"] });
      toast({
        title: "Devis mis à jour",
        description: "Le statut du devis a été mis à jour avec succès.",
      });
      setPriceInput({});
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de mettre à jour le devis",
        variant: "destructive",
      });
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "text-green-400 bg-green-500 bg-opacity-20";
      case "pending":
        return "text-yellow-400 bg-yellow-500 bg-opacity-20";
      case "rejected":
        return "text-red-400 bg-red-500 bg-opacity-20";
      case "sent":
        return "text-blue-400 bg-blue-500 bg-opacity-20";
      default:
        return "text-gray-400 bg-gray-500 bg-opacity-20";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "approved":
        return "Approuvé";
      case "pending":
        return "En attente";
      case "rejected":
        return "Rejeté";
      case "sent":
        return "Envoyé";
      default:
        return status;
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const handlePriceUpdate = (quoteId: string, status: string) => {
    const amount = priceInput[quoteId];
    updateStatusMutation.mutate({ id: quoteId, status, amount });
  };

  if (isLoading) {
    return (
      <div className="pb-24 px-6 py-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-secondary rounded w-48"></div>
          {[1,2,3].map(i => (
            <div key={i} className="h-40 bg-secondary rounded-ios"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="pb-24">
      <div className="px-6 py-4 border-b border-border">
        <h2 className="text-xl font-bold" data-testid="admin-quotes-title">Gestion des Devis</h2>
        <p className="text-sm text-muted-foreground">Chiffrez et validez les demandes de devis</p>
      </div>

      <div className="px-6 py-6 space-y-4">
        {quotes?.map((quote) => (
          <div key={quote.id} className="ios-card" data-testid={`quote-${quote.id}`}>
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <User className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium" data-testid={`quote-service-${quote.id}`}>
                    Devis pour service
                  </span>
                </div>
                <div className="flex items-center space-x-2 mb-2">
                  <FileText className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm" data-testid={`quote-description-${quote.id}`}>
                    {quote.description}
                  </span>
                </div>
                {(() => {
                  const photos = quote.photos as string[] | undefined;
                  return photos && Array.isArray(photos) && photos.length > 0 ? (
                    <div className="flex items-center space-x-2 mb-2">
                      <Image className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">
                        {photos.length} photo{photos.length > 1 ? 's' : ''} jointe{photos.length > 1 ? 's' : ''}
                      </span>
                    </div>
                  ) : null;
                })()}
                {quote.amount && (
                  <div className="flex items-center space-x-2 mb-2">
                    <Euro className="w-4 h-4 text-green-400" />
                    <span className="text-sm font-medium text-green-400">
                      {quote.amount}€
                    </span>
                  </div>
                )}
              </div>
              <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(quote.status!)}`}>
                {getStatusText(quote.status!)}
              </span>
            </div>

            {quote.status === "pending" && (
              <div className="space-y-3 border-t border-border pt-4">
                <div className="flex items-center space-x-2">
                  <Euro className="w-4 h-4 text-muted-foreground" />
                  <Input
                    type="number"
                    placeholder="Prix en €"
                    value={priceInput[quote.id] || ""}
                    onChange={(e) => setPriceInput({ ...priceInput, [quote.id]: e.target.value })}
                    className="flex-1"
                    data-testid={`input-price-${quote.id}`}
                  />
                </div>
                
                <div className="flex space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="flex-1"
                    onClick={() => updateStatusMutation.mutate({ id: quote.id, status: "rejected" })}
                    data-testid={`button-reject-${quote.id}`}
                  >
                    Rejeter
                  </Button>
                  <Button 
                    size="sm"
                    className="flex-1"
                    disabled={!priceInput[quote.id] || isNaN(Number(priceInput[quote.id]))}
                    onClick={() => handlePriceUpdate(quote.id, "sent")}
                    data-testid={`button-approve-${quote.id}`}
                  >
                    Envoyer le devis
                  </Button>
                </div>
              </div>
            )}

            {quote.status !== "pending" && (
              <div className="space-y-3 border-t border-border pt-4">
                <div className="flex items-center space-x-2">
                  <Select onValueChange={(status) => {
                    updateStatusMutation.mutate({ id: quote.id, status });
                  }}>
                    <SelectTrigger className="flex-1" data-testid={`select-status-${quote.id}`}>
                      <SelectValue placeholder="Changer le statut" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">En attente</SelectItem>
                      <SelectItem value="sent">Envoyé</SelectItem>
                      <SelectItem value="approved">Approuvé</SelectItem>
                      <SelectItem value="rejected">Rejeté</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {quote.amount && (
                  <div className="flex space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="flex-1"
                      onClick={() => window.open(`/api/quotes/${quote.id}/pdf`, '_blank')}
                      data-testid={`button-download-pdf-${quote.id}`}
                    >
                      📄 PDF Devis
                    </Button>
                    {quote.status === "approved" && (
                      <Button 
                        size="sm"
                        className="flex-1"
                        onClick={() => {
                          // Ici on peut ajouter la conversion en facture plus tard
                          toast({
                            title: "Conversion en facture",
                            description: "Fonctionnalité en cours de développement",
                          });
                        }}
                        data-testid={`button-convert-invoice-${quote.id}`}
                      >
                        ✅ Facturer
                      </Button>
                    )}
                  </div>
                )}
              </div>
            )}

            <div className="mt-3 text-xs text-muted-foreground">
              <Clock className="w-3 h-3 inline mr-1" />
              Demandé le {formatDate(quote.createdAt!.toString())}
            </div>
          </div>
        ))}

        {!quotes?.length && (
          <div className="ios-card text-center py-8">
            <FileText className="text-muted-foreground mx-auto mb-4" size={48} />
            <p className="text-muted-foreground">Aucun devis trouvé</p>
          </div>
        )}
      </div>
    </div>
  );
}