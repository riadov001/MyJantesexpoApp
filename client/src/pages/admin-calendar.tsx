import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addWeeks, subWeeks, addMonths, subMonths, isToday, startOfDay, addDays } from "date-fns";
import { fr } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ChevronLeft, ChevronRight, Settings, Calendar as CalendarIcon, Users, Clock, Plus, RefreshCw } from "lucide-react";
import type { Booking, TimeSlotConfig } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

interface CalendarData {
  bookings: Booking[];
  configs: TimeSlotConfig[];
}

const TIME_SLOTS = [
  "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
  "14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00"
];

type ViewMode = "week" | "month";

export default function AdminCalendar() {
  const [viewMode, setViewMode] = useState<ViewMode>("week");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string | null>(null);
  const [configDialogOpen, setConfigDialogOpen] = useState(false);
  const [syncDialogOpen, setSyncDialogOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [configData, setConfigData] = useState({
    maxCapacity: 2,
    isActive: true,
    reason: "",
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const isWeekView = viewMode === "week";
  const startDate = isWeekView ? startOfWeek(currentDate, { weekStartsOn: 1 }) : startOfMonth(currentDate);
  const endDate = isWeekView ? endOfWeek(currentDate, { weekStartsOn: 1 }) : endOfMonth(currentDate);
  
  const { data: calendarData, isLoading } = useQuery({
    queryKey: ["/api/admin/calendar-data", format(startDate, "yyyy-MM-dd"), format(endDate, "yyyy-MM-dd")],
    queryFn: async () => {
      const response = await fetch(`/api/admin/calendar-data?startDate=${format(startDate, "yyyy-MM-dd")}&endDate=${format(endDate, "yyyy-MM-dd")}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('myjantes_token')}`,
        },
      });
      if (!response.ok) {
        throw new Error('Failed to fetch calendar data');
      }
      return response.json();
    },
  });

  const configMutation = useMutation({
    mutationFn: async (data: any) => {
      if (selectedDate && selectedTimeSlot) {
        const dateStr = format(selectedDate, "yyyy-MM-dd");
        const existingConfig = calendarData?.configs.find(
          (c: TimeSlotConfig) => c.date === dateStr && c.timeSlot === selectedTimeSlot
        );

        if (existingConfig) {
          const response = await fetch(`/api/admin/time-slot-configs/${dateStr}/${selectedTimeSlot}`, {
            method: "PUT",
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('myjantes_token')}`,
            },
            body: JSON.stringify(data),
          });
          if (!response.ok) throw new Error('Failed to update config');
          return response.json();
        } else {
          const response = await fetch("/api/admin/time-slot-configs", {
            method: "POST",
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('myjantes_token')}`,
            },
            body: JSON.stringify({
              date: dateStr,
              timeSlot: selectedTimeSlot,
              ...data,
            }),
          });
          if (!response.ok) throw new Error('Failed to create config');
          return response.json();
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/calendar-data"] });
      setConfigDialogOpen(false);
      toast({
        title: "Configuration mise à jour",
        description: "La configuration du créneau a été sauvegardée.",
      });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder la configuration.",
        variant: "destructive",
      });
    },
  });

  const getBookingsForDateAndTime = (date: Date, timeSlot: string) => {
    if (!calendarData) return [];
    const dateStr = format(date, "yyyy-MM-dd");
    return calendarData.bookings.filter(
      (booking: Booking) => booking.date === dateStr && booking.timeSlot === timeSlot
    );
  };

  const getConfigForDateAndTime = (date: Date, timeSlot: string) => {
    if (!calendarData) return null;
    const dateStr = format(date, "yyyy-MM-dd");
    return calendarData.configs.find(
      (config: TimeSlotConfig) => config.date === dateStr && config.timeSlot === timeSlot
    );
  };

  const openConfigDialog = (date: Date, timeSlot: string) => {
    setSelectedDate(date);
    setSelectedTimeSlot(timeSlot);
    
    const existingConfig = getConfigForDateAndTime(date, timeSlot);
    setConfigData({
      maxCapacity: existingConfig?.maxCapacity || 2,
      isActive: existingConfig?.isActive ?? true,
      reason: existingConfig?.reason || "",
    });
    
    setConfigDialogOpen(true);
  };

  const handleSaveConfig = () => {
    configMutation.mutate(configData);
  };

  const navigatePrevious = () => {
    if (isWeekView) {
      setCurrentDate(subWeeks(currentDate, 1));
    } else {
      setCurrentDate(subMonths(currentDate, 1));
    }
  };

  const navigateNext = () => {
    if (isWeekView) {
      setCurrentDate(addWeeks(currentDate, 1));
    } else {
      setCurrentDate(addMonths(currentDate, 1));
    }
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const { data: googleStatus } = useQuery({
    queryKey: ["/api/google/status"],
    queryFn: async () => {
      const response = await fetch("/api/google/status", {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('myjantes_token')}`,
        },
      });
      if (!response.ok) throw new Error('Failed to check Google status');
      return response.json();
    },
  });

  const handleGoogleCalendarSync = async () => {
    try {
      if (!googleStatus?.connected) {
        // Redirect to Google OAuth
        const response = await fetch("/api/google/auth", {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('myjantes_token')}`,
          },
        });
        
        if (response.ok) {
          const { authUrl } = await response.json();
          window.open(authUrl, '_blank', 'width=500,height=600');
          
          toast({
            title: "Connexion Google Calendar",
            description: "Veuillez autoriser l'accès dans la nouvelle fenêtre",
          });
        }
      } else {
        toast({
          title: "Google Calendar",
          description: "Déjà connecté à Google Calendar",
        });
      }
      
      setSyncDialogOpen(false);
    } catch (error) {
      toast({
        title: "Erreur de synchronisation",
        description: "Impossible de se connecter à Google Calendar",
        variant: "destructive",
      });
    }
  };

  const renderWeekView = () => {
    const days = eachDayOfInterval({ start: startDate, end: endDate });
    
    if (isMobile) {
      // Vue mobile simplifiée - une colonne par jour
      return (
        <div className="space-y-4">
          {days.map(day => (
            <Card key={day.toString()} className="p-4">
              <div className="mb-3">
                <h3 className={`text-lg font-semibold ${isSameDay(day, new Date()) ? 'text-blue-600' : 'text-gray-900'}`}>
                  {format(day, "EEEE d MMMM", { locale: fr })}
                </h3>
              </div>
              
              <div className="space-y-2">
                {TIME_SLOTS.map(timeSlot => {
                  const bookings = getBookingsForDateAndTime(day, timeSlot);
                  const config = getConfigForDateAndTime(day, timeSlot);
                  const capacity = config?.maxCapacity || 2;
                  const isDisabled = config?.isActive === false;
                  
                  return (
                    <div
                      key={timeSlot}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                        isDisabled ? 'bg-red-50 border-red-200' : 'bg-gray-50 hover:bg-blue-50 border-gray-200'
                      }`}
                      onClick={() => openConfigDialog(day, timeSlot)}
                      data-testid={`slot-${format(day, "yyyy-MM-dd")}-${timeSlot}`}
                    >
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium text-gray-900">{timeSlot}</span>
                        <span className="text-sm text-gray-500">
                          {bookings.length}/{capacity}
                        </span>
                      </div>
                      
                      {bookings.length > 0 && (
                        <div className="space-y-1">
                          {bookings.map((booking: Booking) => (
                            <div key={booking.id} className="text-sm p-2 rounded bg-blue-100 text-blue-800">
                              {booking.vehicleBrand} - {booking.vehiclePlate}
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {isDisabled && (
                        <div className="text-sm text-red-600 font-medium">
                          Fermé - {config?.reason || "Indisponible"}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </Card>
          ))}
        </div>
      );
    }

    // Vue desktop - grille complète
    return (
      <div className="flex flex-col h-full">
        {/* En-tête des jours */}
        <div className="grid grid-cols-8 border-b bg-gray-50">
          <div className="p-4 border-r"></div>
          {days.map((day) => (
            <div key={day.toString()} className="p-4 text-center border-r">
              <div className="text-sm text-gray-500 uppercase tracking-wide">
                {format(day, "EEE", { locale: fr })}
              </div>
              <div className={`text-lg font-semibold mt-1 ${isToday(day) ? "text-blue-600" : ""}`}>
                {format(day, "d")}
              </div>
            </div>
          ))}
        </div>

        {/* Grille horaire */}
        <div className="flex-1 overflow-auto">
          <div className="grid grid-cols-8 min-h-full">
            {/* Colonne des heures */}
            <div className="border-r bg-gray-50">
              {TIME_SLOTS.map((timeSlot) => (
                <div key={timeSlot} className="h-16 border-b border-gray-200 p-2 text-sm text-gray-600 flex items-center">
                  {timeSlot}
                </div>
              ))}
            </div>

            {/* Colonnes des jours */}
            {days.map((day) => (
              <div key={day.toString()} className="border-r">
                {TIME_SLOTS.map((timeSlot) => {
                  const bookings = getBookingsForDateAndTime(day, timeSlot);
                  const config = getConfigForDateAndTime(day, timeSlot);
                  const maxCapacity = config?.maxCapacity || 2;
                  const isSlotActive = config?.isActive ?? true;
                  
                  return (
                    <div
                      key={`${day}-${timeSlot}`}
                      className={`h-16 border-b border-gray-200 p-1 cursor-pointer hover:bg-gray-50 transition-colors ${
                        !isSlotActive ? "bg-red-50" : ""
                      }`}
                      onClick={() => openConfigDialog(day, timeSlot)}
                      data-testid={`time-slot-${format(day, "yyyy-MM-dd")}-${timeSlot}`}
                    >
                      {bookings.map((booking: Booking, index: number) => (
                        <div
                          key={booking.id}
                          className={`text-xs p-1 mb-1 rounded-md border-l-2 ${
                            booking.status === "confirmed" 
                              ? "bg-blue-50 border-blue-400 text-blue-800"
                              : booking.status === "pending"
                                ? "bg-yellow-50 border-yellow-400 text-yellow-800"
                                : "bg-gray-50 border-gray-400 text-gray-600"
                          }`}
                          style={{ 
                            maxHeight: `${(60 - 8) / maxCapacity}px`,
                            overflow: "hidden"
                          }}
                        >
                          <div className="font-medium truncate">{booking.vehicleBrand}</div>
                          <div className="truncate">{booking.vehiclePlate}</div>
                        </div>
                      ))}
                      
                      {!isSlotActive && (
                        <div className="text-xs text-gray-500 italic">
                          Indisponible
                        </div>
                      )}
                      
                      {bookings.length >= maxCapacity && isSlotActive && (
                        <div className="text-xs text-red-600 font-medium">
                          Complet
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderMonthView = () => {
    const days = eachDayOfInterval({ start: startDate, end: endDate });
    const weeks = [];
    
    for (let i = 0; i < days.length; i += 7) {
      weeks.push(days.slice(i, i + 7));
    }

    return (
      <div className="grid grid-rows-6 h-full">
        {/* En-tête des jours de la semaine */}
        <div className="grid grid-cols-7 border-b bg-gray-50">
          {["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"].map((day) => (
            <div key={day} className="p-3 text-center font-medium text-gray-600 text-sm border-r">
              {day}
            </div>
          ))}
        </div>

        {/* Lignes des semaines */}
        {weeks.map((week, weekIndex) => (
          <div key={weekIndex} className="grid grid-cols-7 flex-1">
            {week.map((day) => {
              const dayBookings = calendarData?.bookings.filter(
                (booking: Booking) => booking.date === format(day, "yyyy-MM-dd")
              ) || [];
              
              return (
                <Card key={day.toString()} className={`rounded-none border-r border-b ${
                  isSameMonth(day, currentDate) ? "bg-white" : "bg-gray-50"
                } ${isToday(day) ? "ring-2 ring-blue-500" : ""}`}>
                  <CardContent className="p-2 h-full flex flex-col">
                    <div className={`text-sm font-medium mb-1 ${
                      isToday(day) ? "text-blue-600" : isSameMonth(day, currentDate) ? "text-gray-900" : "text-gray-400"
                    }`}>
                      {format(day, "d")}
                    </div>
                    
                    <div className="flex-1 space-y-1 overflow-hidden">
                      {dayBookings.slice(0, 3).map((booking: Booking) => (
                        <div
                          key={booking.id}
                          className={`text-xs p-1 rounded text-white truncate ${
                            booking.status === "confirmed" 
                              ? "bg-blue-500"
                              : booking.status === "pending"
                                ? "bg-yellow-500"
                                : "bg-gray-500"
                          }`}
                        >
                          {booking.timeSlot} - {booking.vehicleBrand}
                        </div>
                      ))}
                      
                      {dayBookings.length > 3 && (
                        <div className="text-xs text-gray-500">
                          +{dayBookings.length - 3} autres
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ))}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <CalendarIcon className="h-8 w-8 animate-spin mx-auto mb-2" />
          <div>Chargement du calendrier...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-white">
      {/* Barre d'outils - Responsive */}
      <div className={`${isMobile ? 'flex-col space-y-3 p-3' : 'flex items-center justify-between p-4'} border-b bg-white shadow-sm`}>
        <div className={`flex ${isMobile ? 'flex-col space-y-3' : 'items-center gap-4'}`}>
          <h1 className={`${isMobile ? 'text-lg text-center' : 'text-xl'} font-semibold flex items-center ${isMobile ? 'justify-center' : ''} gap-2`}>
            <CalendarIcon className="h-5 w-5" />
            Calendrier
          </h1>
          
          {isMobile ? (
            <div className="flex flex-col space-y-2">
              <div className="flex items-center justify-center gap-2">
                <Button variant="outline" size="sm" onClick={navigatePrevious}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={goToToday} className="px-3">
                  Aujourd'hui
                </Button>
                <Button variant="outline" size="sm" onClick={navigateNext}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="text-center text-sm font-medium text-gray-700">
                {isWeekView 
                  ? `${format(startDate, "d MMM", { locale: fr })} - ${format(endDate, "d MMM yyyy", { locale: fr })}`
                  : format(currentDate, "MMMM yyyy", { locale: fr })
                }
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={navigatePrevious}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={goToToday}>
                  Aujourd'hui
                </Button>
                <Button variant="outline" size="sm" onClick={navigateNext}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              
              <span className="text-lg font-medium">
                {isWeekView 
                  ? `${format(startDate, "d MMM", { locale: fr })} - ${format(endDate, "d MMM yyyy", { locale: fr })}`
                  : format(currentDate, "MMMM yyyy", { locale: fr })
                }
              </span>
            </>
          )}
        </div>

        <div className={`flex ${isMobile ? 'flex-col space-y-2' : 'items-center gap-2'}`}>
          <Select value={viewMode} onValueChange={(value: ViewMode) => setViewMode(value)}>
            <SelectTrigger className={isMobile ? 'w-full' : 'w-32'}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Semaine</SelectItem>
              <SelectItem value="month">Mois</SelectItem>
            </SelectContent>
          </Select>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setSyncDialogOpen(true)}
            data-testid="button-sync-google"
            className={`${googleStatus?.connected ? "border-green-500 text-green-600" : ""} ${isMobile ? 'w-full justify-center' : ''}`}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Google Agenda
            {googleStatus?.connected && (
              <span className="ml-2 w-2 h-2 bg-green-500 rounded-full"></span>
            )}
          </Button>
        </div>
      </div>

      {/* Contenu du calendrier */}
      <div className="flex-1 overflow-hidden">
        {isWeekView ? renderWeekView() : renderMonthView()}
      </div>

      {/* Dialog de configuration de créneau - Responsive */}
      <Dialog open={configDialogOpen} onOpenChange={setConfigDialogOpen}>
        <DialogContent className={isMobile ? 'w-[95vw] max-w-[95vw]' : ''}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Configuration du Créneau
            </DialogTitle>
            <DialogDescription>
              Gérez la capacité et la disponibilité de ce créneau horaire.
            </DialogDescription>
          </DialogHeader>
          
          {selectedDate && selectedTimeSlot && (
            <div className="space-y-4">
              <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                <strong>{format(selectedDate, "EEEE d MMMM yyyy", { locale: fr })}</strong> à <strong>{selectedTimeSlot}</strong>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="maxCapacity">Capacité maximale</Label>
                <Input
                  id="maxCapacity"
                  type="number"
                  min="0"
                  max="10"
                  value={configData.maxCapacity}
                  onChange={(e) => setConfigData(prev => ({ 
                    ...prev, 
                    maxCapacity: parseInt(e.target.value) || 0 
                  }))}
                  data-testid="input-max-capacity"
                />
                <div className="text-xs text-gray-500">
                  Nombre maximum de réservations simultanées
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="isActive"
                  checked={configData.isActive}
                  onCheckedChange={(checked) => setConfigData(prev => ({ 
                    ...prev, 
                    isActive: checked 
                  }))}
                  data-testid="switch-is-active"
                />
                <Label htmlFor="isActive">Créneau disponible</Label>
              </div>

              {!configData.isActive && (
                <div className="space-y-2">
                  <Label htmlFor="reason">Raison de l'indisponibilité</Label>
                  <Textarea
                    id="reason"
                    placeholder="Ex: Congé, formation, maintenance..."
                    value={configData.reason}
                    onChange={(e) => setConfigData(prev => ({ 
                      ...prev, 
                      reason: e.target.value 
                    }))}
                    data-testid="textarea-reason"
                  />
                </div>
              )}

              <div className={`${isMobile ? 'flex flex-col space-y-2' : 'flex justify-end gap-2'} pt-4`}>
                <Button 
                  variant="outline" 
                  onClick={() => setConfigDialogOpen(false)}
                  data-testid="button-cancel"
                  className={isMobile ? 'w-full' : ''}
                >
                  Annuler
                </Button>
                <Button 
                  onClick={handleSaveConfig}
                  disabled={configMutation.isPending}
                  data-testid="button-save"
                  className={isMobile ? 'w-full' : ''}
                >
                  {configMutation.isPending ? "Sauvegarde..." : "Sauvegarder"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog de synchronisation Google Calendar - Responsive */}
      <Dialog open={syncDialogOpen} onOpenChange={setSyncDialogOpen}>
        <DialogContent className={isMobile ? 'w-[95vw] max-w-[95vw]' : ''}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5" />
              Synchronisation Google Agenda
            </DialogTitle>
            <DialogDescription>
              Synchronisez vos réservations avec Google Agenda pour une gestion centralisée.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {googleStatus?.connected ? (
              <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="font-medium text-green-900 mb-2">✅ Google Calendar connecté</h4>
                <p className="text-sm text-green-800">
                  Vos réservations peuvent maintenant être synchronisées automatiquement avec Google Calendar.
                </p>
                <ul className="text-sm text-green-700 space-y-1 mt-2">
                  <li>• Création automatique d'événements pour les nouvelles réservations</li>
                  <li>• Invitation automatique des clients</li>
                  <li>• Rappels configurés automatiquement</li>
                </ul>
              </div>
            ) : (
              <>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">Fonctionnalités de synchronisation :</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Export automatique des réservations vers Google Agenda</li>
                    <li>• Synchronisation bidirectionnelle des créneaux</li>
                    <li>• Notifications de conflits d'horaires</li>
                    <li>• Gestion des invitations clients</li>
                  </ul>
                </div>
                
                <div className="text-sm text-gray-600">
                  Pour activer la synchronisation, vous devez d'abord connecter votre compte Google.
                </div>
              </>
            )}

            <div className={`${isMobile ? 'flex flex-col space-y-2' : 'flex justify-end gap-2'}`}>
              <Button 
                variant="outline" 
                onClick={() => setSyncDialogOpen(false)}
                className={isMobile ? 'w-full' : ''}
              >
                Annuler
              </Button>
              <Button 
                onClick={handleGoogleCalendarSync}
                className={`${googleStatus?.connected ? "bg-green-600 hover:bg-green-700" : "bg-blue-600 hover:bg-blue-700"} ${isMobile ? 'w-full' : ''}`}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                {googleStatus?.connected ? "Reconnecter" : "Connecter Google Agenda"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}