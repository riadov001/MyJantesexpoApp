import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { 
  Calendar, 
  Clock, 
  User, 
  Car, 
  MapPin, 
  Settings,
  Plus,
  CheckCircle,
  AlertCircle
} from "lucide-react";

interface Booking {
  id: string;
  userId: string;
  date: string;
  timeSlot: string;
  vehicleBrand: string;
  vehiclePlate: string;
  status: string;
  assignedEmployee?: string;
  estimatedDuration?: number;
  notes?: string;
  createdAt: string;
}

interface Employee {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface CalendarBooking extends Booking {
  user?: { name: string; email: string };
  assignedEmployeeName?: string;
}

export default function AdminCalendar() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<CalendarBooking | null>(null);
  const [assignmentData, setAssignmentData] = useState({
    employeeId: "",
    notes: ""
  });

  const { data: bookings, isLoading: bookingsLoading } = useQuery({
    queryKey: ["/api/admin/bookings"],
  });

  const { data: employees } = useQuery({
    queryKey: ["/api/admin/employees"],
  });

  const { data: users } = useQuery({
    queryKey: ["/api/admin/users"],
  });

  const assignEmployeeMutation = useMutation({
    mutationFn: async (data: { bookingId: string; employeeId: string; notes: string }) => {
      const response = await fetch("/api/admin/assign-employee", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Erreur lors de l'assignation");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/bookings"] });
      toast({
        title: "Employé assigné",
        description: "L'employé a été assigné avec succès à cette réservation.",
      });
      setIsAssignDialogOpen(false);
      setSelectedBooking(null);
      setAssignmentData({ employeeId: "", notes: "" });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Impossible d'assigner l'employé",
        variant: "destructive",
      });
    },
  });

  // Créer un calendrier enrichi avec les données utilisateurs
  const enrichedBookings: CalendarBooking[] = (bookings || []).map((booking: Booking) => {
    const user = (users || []).find((u: any) => u.id === booking.userId);
    const assignedEmployee = (employees || []).find((emp: Employee) => emp.id === booking.assignedEmployee);
    
    return {
      ...booking,
      user: user ? { name: user.name, email: user.email } : undefined,
      assignedEmployeeName: assignedEmployee?.name,
    };
  });

  // Filtrer les réservations par date sélectionnée
  const bookingsForDate = enrichedBookings.filter(booking => 
    booking.date === selectedDate
  );

  // Grouper par créneaux horaires
  const timeSlots = [
    "08:00", "09:00", "10:00", "11:00", "12:00", 
    "13:00", "14:00", "15:00", "16:00", "17:00", "18:00"
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-green-500";
      case "pending":
        return "bg-yellow-500";
      case "cancelled":
        return "bg-red-500";
      case "completed":
        return "bg-blue-500";
      default:
        return "bg-gray-500";
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

  const handleAssignEmployee = () => {
    if (!selectedBooking || !assignmentData.employeeId) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner un employé",
        variant: "destructive",
      });
      return;
    }

    assignEmployeeMutation.mutate({
      bookingId: selectedBooking.id,
      employeeId: assignmentData.employeeId,
      notes: assignmentData.notes,
    });
  };

  if (bookingsLoading) {
    return (
      <div className="pb-24 px-6 py-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-secondary rounded w-48"></div>
          <div className="h-64 bg-secondary rounded-ios"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-24">
      <div className="px-6 py-4 border-b border-border">
        <h2 className="text-xl font-bold" data-testid="admin-calendar-title">
          Calendrier des Réservations
        </h2>
        <p className="text-sm text-muted-foreground">
          Gestion et assignation des réservations par date
        </p>
      </div>

      <div className="px-6 py-6 space-y-6">
        {/* Sélecteur de date */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Sélection de Date
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full"
            />
          </CardContent>
        </Card>

        {/* Vue du calendrier pour la date sélectionnée */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>
                Réservations du {new Date(selectedDate).toLocaleDateString("fr-FR", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  year: "numeric"
                })}
              </span>
              <Badge variant="outline">
                {bookingsForDate.length} réservation{bookingsForDate.length > 1 ? 's' : ''}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {bookingsForDate.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Aucune réservation pour cette date</p>
              </div>
            ) : (
              <div className="space-y-4">
                {timeSlots.map((timeSlot) => {
                  const slotBookings = bookingsForDate.filter(b => b.timeSlot === timeSlot);
                  
                  return (
                    <div key={timeSlot} className="border-l-4 border-primary pl-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium">{timeSlot}</span>
                        {slotBookings.length === 0 && (
                          <Badge variant="outline" className="text-xs">Libre</Badge>
                        )}
                      </div>
                      
                      {slotBookings.map((booking) => (
                        <div
                          key={booking.id}
                          className="bg-secondary rounded-ios p-4 mb-2"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <div className={`w-3 h-3 rounded-full ${getStatusColor(booking.status)}`}></div>
                              <span className="font-medium">{getStatusText(booking.status)}</span>
                            </div>
                            {!booking.assignedEmployee && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedBooking(booking);
                                  setIsAssignDialogOpen(true);
                                }}
                                data-testid={`button-assign-${booking.id}`}
                              >
                                <Plus className="w-4 h-4 mr-1" />
                                Assigner
                              </Button>
                            )}
                          </div>

                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4 text-muted-foreground" />
                              <span className="text-sm">
                                {booking.user?.name || "Client inconnu"} ({booking.user?.email})
                              </span>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <Car className="w-4 h-4 text-muted-foreground" />
                              <span className="text-sm">
                                {booking.vehicleBrand} - {booking.vehiclePlate}
                              </span>
                            </div>

                            {booking.assignedEmployeeName && (
                              <div className="flex items-center gap-2">
                                <CheckCircle className="w-4 h-4 text-green-500" />
                                <span className="text-sm">
                                  Assigné à {booking.assignedEmployeeName}
                                </span>
                              </div>
                            )}

                            {booking.estimatedDuration && (
                              <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4 text-muted-foreground" />
                                <span className="text-sm">
                                  Durée estimée: {booking.estimatedDuration} minutes
                                </span>
                              </div>
                            )}

                            {booking.notes && (
                              <div className="text-sm text-muted-foreground mt-2">
                                <strong>Notes:</strong> {booking.notes}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Dialog d'assignation d'employé */}
        <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Assigner un Employé</DialogTitle>
            </DialogHeader>
            
            {selectedBooking && (
              <div className="space-y-4">
                <div className="bg-secondary p-3 rounded-ios">
                  <p className="text-sm font-medium">Réservation</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedBooking.user?.name} - {selectedBooking.date} à {selectedBooking.timeSlot}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {selectedBooking.vehicleBrand} ({selectedBooking.vehiclePlate})
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium">Employé</label>
                  <Select
                    value={assignmentData.employeeId}
                    onValueChange={(value) => 
                      setAssignmentData(prev => ({ ...prev, employeeId: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un employé" />
                    </SelectTrigger>
                    <SelectContent>
                      {(employees || []).map((employee: Employee) => (
                        <SelectItem key={employee.id} value={employee.id}>
                          {employee.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium">Notes (optionnel)</label>
                  <Textarea
                    value={assignmentData.notes}
                    onChange={(e) => 
                      setAssignmentData(prev => ({ ...prev, notes: e.target.value }))
                    }
                    placeholder="Instructions spéciales pour cet employé..."
                    rows={3}
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={handleAssignEmployee}
                    disabled={assignEmployeeMutation.isPending || !assignmentData.employeeId}
                    className="flex-1"
                    data-testid="button-confirm-assignment"
                  >
                    {assignEmployeeMutation.isPending ? "Assignation..." : "Assigner"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setIsAssignDialogOpen(false)}
                    className="flex-1"
                  >
                    Annuler
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}