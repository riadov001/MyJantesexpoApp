import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPost, apiDelete } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { FileText, Euro, Clock, Plus, Send, Trash2, Edit, Download, Upload, Camera } from "lucide-react";
import type { Invoice } from "@shared/schema";

interface CreateInvoiceData {
  userId: string;
  amount: string;
  description: string;
  workDetails?: string;
}

export default function AdminInvoices() {
  const [newInvoice, setNewInvoice] = useState<CreateInvoiceData>({
    userId: "",
    amount: "",
    description: "",
    workDetails: ""
  });
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [notificationComment, setNotificationComment] = useState("");
  const [selectedInvoiceForNotif, setSelectedInvoiceForNotif] = useState<string>("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isNotifModalOpen, setIsNotifModalOpen] = useState(false);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: invoices, isLoading } = useQuery({
    queryKey: ["/api/admin/invoices"],
    queryFn: () => apiGet<Invoice[]>("/api/admin/invoices"),
  });

  const { data: users } = useQuery({
    queryKey: ["/api/admin/users"],
    queryFn: () => apiGet<any[]>("/api/admin/users"),
  });

  const createInvoiceMutation = useMutation({
    mutationFn: (data: CreateInvoiceData) => apiPost("/api/admin/invoices", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/invoices"] });
      toast({ title: "Facture créée", description: "La facture a été créée avec succès." });
      setNewInvoice({ userId: "", amount: "", description: "", workDetails: "" });
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
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Créer une facture</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <Select onValueChange={(value) => setNewInvoice({...newInvoice, userId: value})}>
                  <SelectTrigger data-testid="select-user">
                    <SelectValue placeholder="Sélectionner un client" />
                  </SelectTrigger>
                  <SelectContent>
                    {users?.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name} ({user.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  type="number"
                  placeholder="Montant en €"
                  value={newInvoice.amount}
                  onChange={(e) => setNewInvoice({...newInvoice, amount: e.target.value})}
                  data-testid="input-amount"
                />
                <Textarea
                  placeholder="Description de la facture"
                  value={newInvoice.description}
                  onChange={(e) => setNewInvoice({...newInvoice, description: e.target.value})}
                  data-testid="textarea-description"
                />
                <Button 
                  onClick={() => createInvoiceMutation.mutate(newInvoice)}
                  disabled={!newInvoice.userId || !newInvoice.amount || !newInvoice.description}
                  className="w-full"
                  data-testid="button-create-submit"
                >
                  Créer la facture
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

            <div className="flex items-center justify-between space-x-2">
              <Select onValueChange={(status) => updateStatusMutation.mutate({ id: invoice.id, status })}>
                <SelectTrigger className="flex-1" data-testid={`select-status-${invoice.id}`}>
                  <SelectValue placeholder="Changer le statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unpaid">Non payée</SelectItem>
                  <SelectItem value="paid">Payée</SelectItem>
                  <SelectItem value="overdue">En retard</SelectItem>
                  <SelectItem value="cancelled">Annulée</SelectItem>
                </SelectContent>
              </Select>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedInvoiceForNotif(invoice.id);
                  setIsNotifModalOpen(true);
                }}
                data-testid={`button-notify-${invoice.id}`}
              >
                <Send className="w-4 h-4 mr-1" />
                Notifier
              </Button>
              
              <Button
                variant="outline" 
                size="sm"
                onClick={() => window.open(`/api/invoices/${invoice.id}/pdf`, '_blank')}
                data-testid={`button-pdf-${invoice.id}`}
              >
                <Download className="w-4 h-4 mr-1" />
                PDF
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => sendEmailMutation.mutate(invoice.id)}
                disabled={sendEmailMutation.isPending}
                data-testid={`button-email-${invoice.id}`}
              >
                <Send className="w-4 h-4 mr-1" />
                {sendEmailMutation.isPending ? "Envoi..." : "Email"}
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setEditingInvoice(invoice);
                  setIsEditModalOpen(true);
                }}
                data-testid={`button-edit-${invoice.id}`}
              >
                <Edit className="w-4 h-4" />
              </Button>
              
              <Button
                variant="destructive"
                size="sm"
                onClick={() => {
                  if (confirm("Êtes-vous sûr de vouloir supprimer cette facture ?")) {
                    deleteInvoiceMutation.mutate(invoice.id);
                  }
                }}
                data-testid={`button-delete-${invoice.id}`}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>

            <div className="mt-3 text-xs text-muted-foreground">
              <Clock className="w-3 h-3 inline mr-1" />
              Créée le {formatDate(invoice.createdAt?.toString() || '')}
            </div>
          </div>
        ))}

        {!invoices?.length && (
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
  );
}