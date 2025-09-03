import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPost } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Calendar, User, Car, Clock } from "lucide-react";
import type { Booking } from "@shared/schema";

export default function AdminBookings() {
  const [selectedBooking, setSelectedBooking] = useState<string>("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: bookings, isLoading } = useQuery({
    queryKey: ["/api/admin/bookings"],
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => 
      apiPost(`/api/admin/bookings/${id}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/bookings"] });
      toast({
        title: "Statut mis à jour",
        description: "Le statut de la réservation a été mis à jour avec succès.",
      });
      setSelectedBooking("");
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de mettre à jour le statut",
        variant: "destructive",
      });
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "text-green-400 bg-green-500 bg-opacity-20";
      case "pending":
        return "text-yellow-400 bg-yellow-500 bg-opacity-20";
      case "cancelled":
        return "text-red-400 bg-red-500 bg-opacity-20";
      case "completed":
        return "text-blue-400 bg-blue-500 bg-opacity-20";
      default:
        return "text-gray-400 bg-gray-500 bg-opacity-20";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "confirmed":
        return "Confirmée";
      case "pending":
        return "En attente";
      case "cancelled":
        return "Annulée";
      case "completed":
        return "Terminée";
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

  if (isLoading) {
    return (
      <div className="pb-24 px-6 py-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-secondary rounded w-48"></div>
          {[1,2,3].map(i => (
            <div key={i} className="h-32 bg-secondary rounded-ios"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="pb-24">
      <div className="px-6 py-4 border-b border-border">
        <h2 className="text-xl font-bold" data-testid="admin-bookings-title">Gestion des Réservations</h2>
        <p className="text-sm text-muted-foreground">Gérez les demandes de réservation</p>
      </div>

      <div className="px-6 py-6 space-y-4">
        {bookings?.map((booking) => (
          <div key={booking.id} className="ios-card" data-testid={`booking-${booking.id}`}>
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <User className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium" data-testid={`booking-service-${booking.id}`}>
                    {booking.serviceId}
                  </span>
                </div>
                <div className="flex items-center space-x-2 mb-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm" data-testid={`booking-date-${booking.id}`}>
                    {booking.startDateTime && booking.endDateTime ? (
                      <>
                        {new Date(booking.startDateTime).toLocaleDateString("fr-FR", {
                          day: "numeric",
                          month: "short",
                          year: "numeric"
                        })} {new Date(booking.startDateTime).toLocaleTimeString("fr-FR", {
                          hour: "2-digit",
                          minute: "2-digit"
                        })}
                        {" → "}
                        {new Date(booking.endDateTime).toLocaleDateString("fr-FR", {
                          day: "numeric", 
                          month: "short",
                          year: "numeric"
                        })} {new Date(booking.endDateTime).toLocaleTimeString("fr-FR", {
                          hour: "2-digit",
                          minute: "2-digit"
                        })}
                        {new Date(booking.startDateTime).toDateString() !== new Date(booking.endDateTime).toDateString() && (
                          <span className="text-green-400 ml-2">
                            ({Math.ceil((new Date(booking.endDateTime).getTime() - new Date(booking.startDateTime).getTime()) / (1000 * 60 * 60 * 24))} jour{Math.ceil((new Date(booking.endDateTime).getTime() - new Date(booking.startDateTime).getTime()) / (1000 * 60 * 60 * 24)) > 1 ? 's' : ''})
                          </span>
                        )}
                      </>
                    ) : (
                      `${formatDate(booking.date || '')} - ${booking.timeSlot || ''}`
                    )}
                  </span>
                </div>
                <div className="flex items-center space-x-2 mb-2">
                  <Car className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm" data-testid={`booking-vehicle-${booking.id}`}>
                    {booking.vehicleBrand} ({booking.vehiclePlate})
                  </span>
                </div>
                {booking.notes && (
                  <p className="text-sm text-muted-foreground mt-2" data-testid={`booking-notes-${booking.id}`}>
                    {booking.notes}
                  </p>
                )}
              </div>
              <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(booking.status!)}`}>
                {getStatusText(booking.status!)}
              </span>
            </div>

            <div className="flex items-center space-x-2">
              <Select onValueChange={(status) => {
                updateStatusMutation.mutate({ id: booking.id, status });
              }}>
                <SelectTrigger className="flex-1" data-testid={`select-status-${booking.id}`}>
                  <SelectValue placeholder="Changer le statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">En attente</SelectItem>
                  <SelectItem value="confirmed">Confirmée</SelectItem>
                  <SelectItem value="completed">Terminée</SelectItem>
                  <SelectItem value="cancelled">Annulée</SelectItem>
                </SelectContent>
              </Select>
              
              <Button 
                variant="outline" 
                size="sm"
                data-testid={`button-contact-${booking.id}`}
              >
                Contacter
              </Button>
            </div>

            <div className="mt-3 text-xs text-muted-foreground">
              <Clock className="w-3 h-3 inline mr-1" />
              Créée le {formatDate(booking.createdAt?.toString() || '')}
            </div>
          </div>
        ))}

        {!bookings?.length && (
          <div className="ios-card text-center py-8">
            <Calendar className="text-muted-foreground mx-auto mb-4" size={48} />
            <p className="text-muted-foreground">Aucune réservation trouvée</p>
          </div>
        )}
      </div>
    </div>
  );
}