import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPost } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Wrench, Plus, Send, Clock, CheckCircle, AlertCircle } from "lucide-react";
import type { WorkProgress, Booking } from "@shared/schema";

interface CreateWorkProgressData {
  bookingId: string;
  userId: string;
  status: string;
  description: string;
  photos?: string[];
  estimatedCompletion?: string;
}

export default function AdminWorkProgress() {
  const [newProgress, setNewProgress] = useState<CreateWorkProgressData>({
    bookingId: "",
    userId: "",
    status: "received",
    description: "",
    photos: [],
    estimatedCompletion: ""
  });
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: workProgress, isLoading } = useQuery({
    queryKey: ["/api/admin/work-progress"],
  });

  const { data: bookings } = useQuery({
    queryKey: ["/api/admin/bookings"],
  });

  const { data: users } = useQuery({
    queryKey: ["/api/admin/users"],
  });

  const createProgressMutation = useMutation({
    mutationFn: (data: CreateWorkProgressData) => apiPost("/api/work-progress", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/work-progress"] });
      toast({ title: "Suivi créé", description: "Le suivi des travaux a été créé avec succès." });
      setNewProgress({
        bookingId: "",
        userId: "",
        status: "received",
        description: "",
        photos: [],
        estimatedCompletion: ""
      });
      setIsCreateModalOpen(false);
    },
    onError: (error: any) => {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    },
  });

  const handleCreateProgress = () => {
    if (!newProgress.bookingId || !newProgress.userId || !newProgress.description) {
      toast({ 
        title: "Erreur", 
        description: "Veuillez remplir tous les champs obligatoires", 
        variant: "destructive" 
      });
      return;
    }
    createProgressMutation.mutate(newProgress);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      received: { label: "Reçu", variant: "secondary" as const },
      in_progress: { label: "En cours", variant: "default" as const },
      quality_check: { label: "Contrôle qualité", variant: "default" as const },
      completed: { label: "Terminé", variant: "default" as const },
      ready_for_pickup: { label: "Prêt à récupérer", variant: "default" as const },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || { label: status, variant: "outline" as const };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "received":
        return <Clock className="h-4 w-4" />;
      case "in_progress":
        return <Wrench className="h-4 w-4" />;
      case "completed":
      case "ready_for_pickup":
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  if (isLoading) {
    return <div className="p-6">Chargement...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Suivi des travaux</h1>
          <p className="text-muted-foreground">Gérer l'avancement des travaux et notifier les clients</p>
        </div>
        
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-progress">
              <Plus className="h-4 w-4 mr-2" />
              Nouveau suivi
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Créer un nouveau suivi de travaux</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Réservation</label>
                <Select
                  value={newProgress.bookingId}
                  onValueChange={(value) => setNewProgress({...newProgress, bookingId: value})}
                >
                  <SelectTrigger data-testid="select-booking">
                    <SelectValue placeholder="Sélectionner une réservation" />
                  </SelectTrigger>
                  <SelectContent>
                    {bookings?.map((booking) => (
                      <SelectItem key={booking.id} value={booking.id}>
                        {booking.vehicleBrand} - {booking.vehiclePlate} ({booking.date})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium">Client</label>
                <Select
                  value={newProgress.userId}
                  onValueChange={(value) => setNewProgress({...newProgress, userId: value})}
                >
                  <SelectTrigger data-testid="select-user">
                    <SelectValue placeholder="Sélectionner un client" />
                  </SelectTrigger>
                  <SelectContent>
                    {users?.filter(user => user.role === "customer").map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name} ({user.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium">Statut</label>
                <Select
                  value={newProgress.status}
                  onValueChange={(value) => setNewProgress({...newProgress, status: value})}
                >
                  <SelectTrigger data-testid="select-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="received">Reçu</SelectItem>
                    <SelectItem value="in_progress">En cours</SelectItem>
                    <SelectItem value="quality_check">Contrôle qualité</SelectItem>
                    <SelectItem value="completed">Terminé</SelectItem>
                    <SelectItem value="ready_for_pickup">Prêt à récupérer</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium">Description</label>
                <Textarea
                  placeholder="Description du statut des travaux..."
                  value={newProgress.description}
                  onChange={(e) => setNewProgress({...newProgress, description: e.target.value})}
                  data-testid="textarea-description"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Date d'achèvement estimée (optionnel)</label>
                <Input
                  type="datetime-local"
                  value={newProgress.estimatedCompletion}
                  onChange={(e) => setNewProgress({...newProgress, estimatedCompletion: e.target.value})}
                  data-testid="input-estimated-completion"
                />
              </div>

              <Button 
                onClick={handleCreateProgress}
                className="w-full"
                disabled={createProgressMutation.isPending}
                data-testid="button-create-submit"
              >
                <Send className="h-4 w-4 mr-2" />
                Créer et notifier le client
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Liste des suivis */}
      <div className="grid gap-4">
        {workProgress?.map((progress) => (
          <Card key={progress.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  {getStatusIcon(progress.status)}
                  Suivi #{progress.id.substring(0, 8)}
                </CardTitle>
                {getStatusBadge(progress.status)}
              </div>
              <CardDescription>
                Réservation: {progress.bookingId.substring(0, 8)} • 
                Client: {progress.userId.substring(0, 8)}
                {progress.estimatedCompletion && (
                  <> • Estimé: {new Date(progress.estimatedCompletion).toLocaleDateString()}</>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-2">
                {progress.description}
              </p>
              <div className="text-xs text-muted-foreground">
                Créé le {new Date(progress.createdAt).toLocaleString()}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {workProgress?.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <Wrench className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Aucun suivi de travaux</h3>
            <p className="text-muted-foreground">
              Créez votre premier suivi de travaux pour commencer à informer vos clients.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}