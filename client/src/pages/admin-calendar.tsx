import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, getDay } from "date-fns";
import { fr } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ChevronLeft, ChevronRight, Settings, Calendar as CalendarIcon, Users } from "lucide-react";
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

export default function AdminCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string | null>(null);
  const [configDialogOpen, setConfigDialogOpen] = useState(false);
  const [configData, setConfigData] = useState({
    maxCapacity: 2,
    isActive: true,
    reason: "",
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  
  const { data: calendarData, isLoading } = useQuery<CalendarData>({
    queryKey: ["/api/admin/calendar-data", {
      startDate: format(monthStart, "yyyy-MM-dd"),
      endDate: format(monthEnd, "yyyy-MM-dd"),
    }],
  });

  const configMutation = useMutation({
    mutationFn: async (data: any) => {
      if (selectedDate && selectedTimeSlot) {
        const dateStr = format(selectedDate, "yyyy-MM-dd");
        const existingConfig = calendarData?.configs.find(
          c => c.date === dateStr && c.timeSlot === selectedTimeSlot
        );

        if (existingConfig) {
          return apiRequest(`/api/admin/time-slot-configs/${dateStr}/${selectedTimeSlot}`, {
            method: "PUT",
            body: data,
          });
        } else {
          return apiRequest("/api/admin/time-slot-configs", {
            method: "POST",
            body: {
              date: dateStr,
              timeSlot: selectedTimeSlot,
              ...data,
            },
          });
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
      booking => booking.date === dateStr && booking.timeSlot === timeSlot
    );
  };

  const getConfigForDateAndTime = (date: Date, timeSlot: string) => {
    if (!calendarData) return null;
    const dateStr = format(date, "yyyy-MM-dd");
    return calendarData.configs.find(
      config => config.date === dateStr && config.timeSlot === timeSlot
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

  const previousMonth = () => {
    setCurrentDate(subMonths(currentDate, 1));
  };

  const nextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1));
  };

  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });
  
  // Create calendar grid starting from Monday
  const calendarDays = [];
  const firstDayOfWeek = getDay(monthStart) === 0 ? 6 : getDay(monthStart) - 1; // Convert Sunday=0 to Monday=0
  
  // Add empty cells for days before month start
  for (let i = 0; i < firstDayOfWeek; i++) {
    calendarDays.push(null);
  }
  
  // Add month days
  calendarDays.push(...monthDays);

  if (isLoading) {
    return (
      <div className="p-4">
        <div className="text-center">Chargement du calendrier...</div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <CalendarIcon className="h-6 w-6" />
          Calendrier des Réservations
        </h1>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={previousMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-lg font-medium min-w-[200px] text-center">
            {format(currentDate, "MMMM yyyy", { locale: fr })}
          </span>
          <Button variant="outline" size="sm" onClick={nextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {/* Headers */}
        {["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"].map((day) => (
          <div key={day} className="p-2 text-center font-medium text-sm text-gray-500">
            {day}
          </div>
        ))}

        {/* Calendar days */}
        {calendarDays.map((day, index) => (
          <Card key={index} className={`min-h-[120px] ${day && isSameMonth(day, currentDate) ? "bg-white" : "bg-gray-50"}`}>
            <CardContent className="p-2">
              {day && (
                <>
                  <div className={`text-sm font-medium mb-2 ${isSameDay(day, new Date()) ? "text-red-600" : ""}`}>
                    {format(day, "d")}
                  </div>
                  
                  <div className="space-y-1">
                    {TIME_SLOTS.slice(0, 4).map((timeSlot) => {
                      const bookings = getBookingsForDateAndTime(day, timeSlot);
                      const config = getConfigForDateAndTime(day, timeSlot);
                      const maxCapacity = config?.maxCapacity || 2;
                      const isSlotActive = config?.isActive ?? true;
                      
                      return (
                        <div
                          key={timeSlot}
                          className={`p-1 rounded text-xs cursor-pointer transition-colors ${
                            !isSlotActive 
                              ? "bg-gray-200 text-gray-500" 
                              : bookings.length >= maxCapacity
                                ? "bg-red-100 text-red-800"
                                : bookings.length > 0
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-green-100 text-green-800 hover:bg-green-200"
                          }`}
                          onClick={() => openConfigDialog(day, timeSlot)}
                          data-testid={`time-slot-${format(day, "yyyy-MM-dd")}-${timeSlot}`}
                        >
                          <div className="flex items-center justify-between">
                            <span>{timeSlot}</span>
                            <div className="flex items-center gap-1">
                              {bookings.length > 0 && (
                                <Users className="h-3 w-3" />
                              )}
                              <span>{bookings.length}/{maxCapacity}</span>
                            </div>
                          </div>
                          {!isSlotActive && config?.reason && (
                            <div className="text-xs text-gray-400 truncate">
                              {config.reason}
                            </div>
                          )}
                        </div>
                      );
                    })}
                    
                    {TIME_SLOTS.length > 4 && (
                      <div className="text-xs text-gray-400 text-center">
                        +{TIME_SLOTS.length - 4} créneaux
                      </div>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Configuration Dialog */}
      <Dialog open={configDialogOpen} onOpenChange={setConfigDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Configuration du Créneau
            </DialogTitle>
          </DialogHeader>
          
          {selectedDate && selectedTimeSlot && (
            <div className="space-y-4">
              <div className="text-sm text-gray-600">
                {format(selectedDate, "EEEE d MMMM yyyy", { locale: fr })} à {selectedTimeSlot}
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
                <Label htmlFor="isActive">Créneau actif</Label>
              </div>

              {!configData.isActive && (
                <div className="space-y-2">
                  <Label htmlFor="reason">Raison de la désactivation</Label>
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

              <div className="flex justify-end gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => setConfigDialogOpen(false)}
                  data-testid="button-cancel"
                >
                  Annuler
                </Button>
                <Button 
                  onClick={handleSaveConfig}
                  disabled={configMutation.isPending}
                  data-testid="button-save"
                >
                  {configMutation.isPending ? "Sauvegarde..." : "Sauvegarder"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}