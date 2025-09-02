import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPost, apiDelete } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { FileText, Euro, Clock, Plus, Send, Trash2, Edit, Download, Upload, Camera, Smartphone } from "lucide-react";
import type { Invoice } from "@shared/schema";

interface CreateInvoiceData {
  userId: string;
  amount: string;
  description: string;
  workDetails?: string;
  vehicleBrand?: string;
  vehicleModel?: string;
  vehiclePlate?: string;
  vehicleYear?: string;
  subtotal?: string;
  vatRate?: string;
  items?: Array<{description: string, quantity: number, unitPrice: number, total: number}>;
  paymentTerms?: string;
}

export default function AdminInvoices() {
  const [newInvoice, setNewInvoice] = useState<CreateInvoiceData>({
    userId: "",
    amount: "",
    description: "",
    workDetails: "",
    vehicleBrand: "",
    vehicleModel: "",
    vehiclePlate: "",
    vehicleYear: "",
    subtotal: "",
    vatRate: "20.00",
    items: [],
    paymentTerms: "Paiement à réception",
  });

  const [currentItem, setCurrentItem] = useState({
    description: "",
    quantity: 1,
    unitPrice: 0,
  });
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [notificationComment, setNotificationComment] = useState("");
  const [selectedInvoiceForNotif, setSelectedInvoiceForNotif] = useState<string>("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isNotifModalOpen, setIsNotifModalOpen] = useState(false);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: invoices = [], isLoading } = useQuery({
    queryKey: ["/api/admin/invoices"],
  });

  const { data: users = [] } = useQuery({
    queryKey: ["/api/admin/users"],
  });

  const createInvoiceMutation = useMutation({
    mutationFn: (data: CreateInvoiceData) => apiPost("/api/admin/invoices", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/invoices"] });
      toast({ title: "Facture créée", description: "La facture a été créée avec succès." });
      setNewInvoice({ 
        userId: "", 
        amount: "", 
        description: "", 
        workDetails: "",
        vehicleBrand: "",
        vehicleModel: "",
        vehiclePlate: "",
        vehicleYear: "",
        subtotal: "",
        vatRate: "20.00",
        items: [],
        paymentTerms: "Paiement à réception",
      });
      setIsCreateModalOpen(false);
    },
    onError: (error: any) => {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    },
  });

  const updateInvoiceMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Invoice> }) =>
      apiPost(`/api/admin/invoices/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/invoices"] });
      toast({ title: "Facture modifiée", description: "La facture a été modifiée avec succès." });
      setEditingInvoice(null);
      setIsEditModalOpen(false);
    },
    onError: (error: any) => {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    },
  });

  const sendEmailMutation = useMutation({
    mutationFn: (id: string) => apiPost(`/api/admin/invoices/${id}/send-email`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/invoices"] });
      toast({ title: "Email envoyé", description: "La facture a été envoyée par email avec succès." });
    },
    onError: (error: any) => {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    },
  });

  const openMobileEmailMutation = useMutation({
    mutationFn: (id: string) => apiGet(`/api/admin/invoices/${id}/mobile-email-data`),
    onSuccess: (data: any) => {
      const emailTemplate = `Bonjour,

Veuillez trouver ci-joint votre facture.

En vous remerciant pour votre confiance.

Cordialement,
MyJantes`;

      const subject = `Facture MyJantes - ${data.description}`;
      const body = encodeURIComponent(emailTemplate);
      const subjectEncoded = encodeURIComponent(subject);
      
      // Créer un lien mailto: qui ouvre l'application de messagerie
      const mailtoUrl = `mailto:${data.clientEmail}?subject=${subjectEncoded}&body=${body}`;
      
      // Ouvrir l'application de messagerie
      window.location.href = mailtoUrl;
      
      toast({ 
        title: "Application messagerie ouverte", 
        description: "L'application de messagerie s'est ouverte avec les données pré-remplies. Ajoutez manuellement la facture PDF en pièce jointe." 
      });
    },
    onError: (error: any) => {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      apiPost(`/api/admin/invoices/${id}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/invoices"] });
      toast({ title: "Statut mis à jour", description: "Le statut de la facture a été mis à jour." });
    },
    onError: (error: any) => {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    },
  });

  const deleteInvoiceMutation = useMutation({
    mutationFn: (id: string) => apiDelete(`/api/admin/invoices/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/invoices"] });
      toast({ title: "Facture supprimée", description: "La facture a été supprimée avec succès." });
    },
    onError: (error: any) => {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    },
  });

  const sendNotificationMutation = useMutation({
    mutationFn: ({ invoiceId, comment }: { invoiceId: string; comment: string }) =>
      apiPost(`/api/admin/invoices/${invoiceId}/notify`, { comment }),
    onSuccess: () => {
      toast({ title: "Notification envoyée", description: "Le client a été notifié avec succès." });
      setNotificationComment("");
      setSelectedInvoiceForNotif("");
      setIsNotifModalOpen(false);
    },
    onError: (error: any) => {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "text-green-400 bg-green-500 bg-opacity-20";
      case "unpaid":
        return "text-red-400 bg-red-500 bg-opacity-20";
      case "overdue":
        return "text-orange-400 bg-orange-500 bg-opacity-20";
      case "cancelled":
        return "text-gray-400 bg-gray-500 bg-opacity-20";
      default:
        return "text-gray-400 bg-gray-500 bg-opacity-20";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "paid": return "Payée";
      case "unpaid": return "Non payée";
      case "overdue": return "En retard";
      case "cancelled": return "Annulée";
      default: return status;
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("fr-FR", {
      day: "numeric", month: "long", year: "numeric",
    });
  };

  if (isLoading) {
    return (
      <div className="pb-24 px-6 py-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-secondary rounded w-48"></div>
          {[1,2,3].map(i => (<div key={i} className="h-32 bg-secondary rounded-ios"></div>))}
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="pb-24">
        <div className="px-6 py-4 border-b border-border">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold" data-testid="admin-invoices-title">Gestion des Factures</h2>
            <p className="text-sm text-muted-foreground">Créer, modifier et suivre les factures</p>
          </div>
          <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
            <DialogTrigger asChild>
              <Button size="sm" data-testid="button-create-invoice">
                <Plus className="w-4 h-4 mr-2" />
                Nouvelle
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Créer une facture complète</DialogTitle>
              </DialogHeader>
              <div className="space-y-6">
                {/* Section Client */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-sm text-muted-foreground">Informations Client</h3>
                  <Select onValueChange={(value) => setNewInvoice({...newInvoice, userId: value})}>
                    <SelectTrigger data-testid="select-user">
                      <SelectValue placeholder="Sélectionner un client" />
                    </SelectTrigger>
                    <SelectContent>
                      {users?.map((user: any) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.name} ({user.email})
                          {user.clientType === "professionnel" && user.companyName && (
                            <span className="text-muted-foreground"> - {user.companyName}</span>
                          )}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Section Véhicule */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-sm text-muted-foreground">Informations Véhicule</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      placeholder="Marque"
                      value={newInvoice.vehicleBrand}
                      onChange={(e) => setNewInvoice({...newInvoice, vehicleBrand: e.target.value})}
                      data-testid="input-vehicle-brand"
                    />
                    <Input
                      placeholder="Modèle"
                      value={newInvoice.vehicleModel}
                      onChange={(e) => setNewInvoice({...newInvoice, vehicleModel: e.target.value})}
                      data-testid="input-vehicle-model"
                    />
                    <Input
                      placeholder="Plaque d'immatriculation"
                      value={newInvoice.vehiclePlate}
                      onChange={(e) => setNewInvoice({...newInvoice, vehiclePlate: e.target.value})}
                      data-testid="input-vehicle-plate"
                    />
                    <Input
                      placeholder="Année"
                      value={newInvoice.vehicleYear}
                      onChange={(e) => setNewInvoice({...newInvoice, vehicleYear: e.target.value})}
                      data-testid="input-vehicle-year"
                    />
                  </div>
                </div>

                {/* Section Articles/Services */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-sm text-muted-foreground">Articles/Services</h3>
                  
                  {/* Ajouter un article */}
                  <div className="border rounded-lg p-3 space-y-3">
                    <h4 className="text-xs text-muted-foreground">Ajouter un article</h4>
                    <div className="grid grid-cols-4 gap-2">
                      <Input
                        placeholder="Description"
                        value={currentItem.description}
                        onChange={(e) => setCurrentItem({...currentItem, description: e.target.value})}
                        className="col-span-2"
                      />
                      <Input
                        type="number"
                        placeholder="Qté"
                        value={currentItem.quantity}
                        onChange={(e) => setCurrentItem({...currentItem, quantity: parseInt(e.target.value) || 1})}
                      />
                      <Input
                        type="number"
                        placeholder="Prix unitaire"
                        value={currentItem.unitPrice}
                        onChange={(e) => setCurrentItem({...currentItem, unitPrice: parseFloat(e.target.value) || 0})}
                      />
                    </div>
                    <Button
                      size="sm"
                      onClick={() => {
                        if (currentItem.description && currentItem.quantity && currentItem.unitPrice) {
                          const total = currentItem.quantity * currentItem.unitPrice;
                          const newItems = [...(newInvoice.items || []), {...currentItem, total}];
                          setNewInvoice({...newInvoice, items: newItems});
                          setCurrentItem({description: "", quantity: 1, unitPrice: 0});
                        }
                      }}
                      disabled={!currentItem.description || !currentItem.unitPrice}
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Ajouter
                    </Button>
                  </div>

                  {/* Liste des articles */}
                  {newInvoice.items && newInvoice.items.length > 0 && (
                    <div className="space-y-2">
                      {newInvoice.items.map((item, index) => (
                        <div key={index} className="flex justify-between items-center bg-secondary/50 p-2 rounded">
                          <div className="flex-1">
                            <span className="font-medium">{item.description}</span>
                            <span className="text-muted-foreground ml-2">
                              {item.quantity} × {item.unitPrice}€ = {item.total}€
                            </span>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              const newItems = newInvoice.items?.filter((_, i) => i !== index);
                              setNewInvoice({...newInvoice, items: newItems});
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Section Montants */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-sm text-muted-foreground">Montants</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <label className="text-xs text-muted-foreground">Sous-total HT</label>
                      <Input
                        type="number"
                        placeholder="Sous-total HT"
                        value={newInvoice.subtotal}
                        onChange={(e) => {
                          const subtotal = e.target.value;
                          const vatRate = parseFloat(newInvoice.vatRate || "20");
                          const amount = parseFloat(subtotal) * (1 + vatRate / 100);
                          setNewInvoice({
                            ...newInvoice, 
                            subtotal,
                            amount: amount.toFixed(2)
                          });
                        }}
                        data-testid="input-subtotal"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs text-muted-foreground">TVA (%)</label>
                      <Input
                        type="number"
                        value={newInvoice.vatRate}
                        onChange={(e) => {
                          const vatRate = e.target.value;
                          const subtotal = parseFloat(newInvoice.subtotal || "0");
                          const amount = subtotal * (1 + parseFloat(vatRate) / 100);
                          setNewInvoice({
                            ...newInvoice, 
                            vatRate,
                            amount: amount.toFixed(2)
                          });
                        }}
                        data-testid="input-vat-rate"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs text-muted-foreground">Montant total TTC</label>
                    <Input
                      type="number"
                      placeholder="Montant total TTC"
                      value={newInvoice.amount}
                      onChange={(e) => setNewInvoice({...newInvoice, amount: e.target.value})}
                      data-testid="input-amount"
                    />
                  </div>
                </div>

                {/* Section Description et détails */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-sm text-muted-foreground">Description et détails</h3>
                  <Textarea
                    placeholder="Description générale de la facture"
                    value={newInvoice.description}
                    onChange={(e) => setNewInvoice({...newInvoice, description: e.target.value})}
                    data-testid="textarea-description"
                  />
                  <Textarea
                    placeholder="Détails du travail effectué"
                    value={newInvoice.workDetails}
                    onChange={(e) => setNewInvoice({...newInvoice, workDetails: e.target.value})}
                    data-testid="textarea-work-details"
                  />
                </div>

                {/* Section Conditions de paiement */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-sm text-muted-foreground">Conditions de paiement</h3>
                  <Select 
                    value={newInvoice.paymentTerms} 
                    onValueChange={(value) => setNewInvoice({...newInvoice, paymentTerms: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Paiement à réception">Paiement à réception</SelectItem>
                      <SelectItem value="Paiement sous 30 jours">Paiement sous 30 jours</SelectItem>
                      <SelectItem value="Paiement sous 15 jours">Paiement sous 15 jours</SelectItem>
                      <SelectItem value="Paiement comptant">Paiement comptant</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button 
                  onClick={() => createInvoiceMutation.mutate(newInvoice)}
                  disabled={!newInvoice.userId || !newInvoice.amount || !newInvoice.description}
                  className="w-full"
                  data-testid="button-create-submit"
                >
                  Créer la facture complète
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="px-6 py-6 space-y-4">
        {invoices?.map((invoice) => (
          <div key={invoice.id} className="ios-card" data-testid={`invoice-${invoice.id}`}>
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <FileText className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium" data-testid={`invoice-description-${invoice.id}`}>
                    {invoice.description}
                  </span>
                </div>
                <div className="flex items-center space-x-2 mb-2">
                  <Euro className="w-4 h-4 text-green-400" />
                  <span className="text-lg font-bold text-green-400">
                    {invoice.amount}€
                  </span>
                </div>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(invoice.status!)}`}>
                {getStatusText(invoice.status!)}
              </span>
            </div>

            {/* Actions mobile-friendly */}
            <div className="space-y-3">
              {/* Ligne 1: Changement de statut */}
              <div className="w-full">
                <Select onValueChange={(status) => updateStatusMutation.mutate({ id: invoice.id, status })}>
                  <SelectTrigger className="w-full h-11" data-testid={`select-status-${invoice.id}`}>
                    <SelectValue placeholder="Changer le statut" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unpaid">Non payée</SelectItem>
                    <SelectItem value="paid">Payée</SelectItem>
                    <SelectItem value="overdue">En retard</SelectItem>
                    <SelectItem value="cancelled">Annulée</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {/* Ligne 2: Actions principales */}
              <div className="flex justify-center gap-3">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => window.open(`/api/invoices/${invoice.id}/pdf`, '_blank')}
                      data-testid={`button-pdf-${invoice.id}`}
                      className="h-12 w-12"
                    >
                      <Download className="w-5 h-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Télécharger PDF</p>
                  </TooltipContent>
                </Tooltip>
                
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => sendEmailMutation.mutate(invoice.id)}
                      disabled={sendEmailMutation.isPending}
                      data-testid={`button-email-${invoice.id}`}
                      className="h-12 w-12"
                    >
                      <Send className="w-5 h-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{sendEmailMutation.isPending ? "Envoi..." : "Envoyer Email"}</p>
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => openMobileEmailMutation.mutate(invoice.id)}
                      disabled={openMobileEmailMutation.isPending}
                      data-testid={`button-mobile-email-${invoice.id}`}
                      className="h-12 w-12 bg-blue-50 hover:bg-blue-100"
                    >
                      <Smartphone className="w-5 h-5 text-blue-600" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{openMobileEmailMutation.isPending ? "Ouverture..." : "Email Mobile"}</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              
              {/* Ligne 3: Actions secondaires */}
              <div className="flex justify-center gap-3">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => {
                        setSelectedInvoiceForNotif(invoice.id);
                        setIsNotifModalOpen(true);
                      }}
                      data-testid={`button-notify-${invoice.id}`}
                      className="h-10 w-10"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Notifier client</p>
                  </TooltipContent>
                </Tooltip>
                
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => {
                        setEditingInvoice(invoice);
                        setIsEditModalOpen(true);
                      }}
                      data-testid={`button-edit-${invoice.id}`}
                      className="h-10 w-10"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Modifier facture</p>
                  </TooltipContent>
                </Tooltip>
                
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="destructive"
                      size="icon"
                      onClick={() => {
                        if (confirm("Êtes-vous sûr de vouloir supprimer cette facture ?")) {
                          deleteInvoiceMutation.mutate(invoice.id);
                        }
                      }}
                      data-testid={`button-delete-${invoice.id}`}
                      className="h-10 w-10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Supprimer facture</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>

            <div className="mt-3 text-xs text-muted-foreground">
              <Clock className="w-3 h-3 inline mr-1" />
              Créée le {formatDate(invoice.createdAt?.toString() || '')}
            </div>
          </div>
        ))}

        {!invoices.length && (
          <div className="ios-card text-center py-8">
            <FileText className="text-muted-foreground mx-auto mb-4" size={48} />
            <p className="text-muted-foreground">Aucune facture trouvée</p>
          </div>
        )}
      </div>

      {/* Dialog Notification avec commentaire */}
      <Dialog open={isNotifModalOpen} onOpenChange={setIsNotifModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Envoyer une notification au client</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              placeholder="Commentaire ou message personnalisé au client..."
              value={notificationComment}
              onChange={(e) => setNotificationComment(e.target.value)}
              data-testid="textarea-notification-comment"
            />
            <Button 
              onClick={() => selectedInvoiceForNotif && sendNotificationMutation.mutate({ 
                invoiceId: selectedInvoiceForNotif, 
                comment: notificationComment 
              })}
              className="w-full"
              data-testid="button-send-notification"
            >
              <Send className="w-4 h-4 mr-2" />
              Envoyer la notification
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog Édition */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier la facture</DialogTitle>
          </DialogHeader>
          {editingInvoice && (
            <div className="space-y-4">
              <Input
                type="number"
                placeholder="Montant en €"
                value={editingInvoice.amount?.toString() || ""}
                onChange={(e) => setEditingInvoice({...editingInvoice, amount: e.target.value})}
                data-testid="edit-input-amount"
              />
              <Textarea
                placeholder="Description de la facture"
                value={editingInvoice.description}
                onChange={(e) => setEditingInvoice({...editingInvoice, description: e.target.value})}
                data-testid="edit-textarea-description"
              />
              <Button 
                onClick={() => updateInvoiceMutation.mutate({ 
                  id: editingInvoice.id, 
                  data: { amount: editingInvoice.amount, description: editingInvoice.description } 
                })}
                className="w-full"
                data-testid="button-edit-submit"
              >
                Sauvegarder les modifications
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
      </div>
    </TooltipProvider>
  );
}