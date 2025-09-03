import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { insertBookingSchema, type InsertBooking, type Service } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiGet, apiPost } from "@/lib/api";
import { useLocation } from "wouter";

// Créneaux suggérés pour aider l'utilisateur
const suggestedTimes = [
  { label: "Matin (9h - 12h)", start: "09:00", end: "12:00", days: 0 },
  { label: "Après-midi (14h - 17h)", start: "14:00", end: "17:00", days: 0 },
  { label: "Toute la journée (9h - 17h)", start: "09:00", end: "17:00", days: 0 },
  { label: "2 jours (Dépôt 9h → Récupération lendemain 17h)", start: "09:00", end: "17:00", days: 1 },
  { label: "3 jours (Dépôt 9h → Récupération J+2 17h)", start: "09:00", end: "17:00", days: 2 },
  { label: "1 semaine (Dépôt lundi 9h → Récupération vendredi 17h)", start: "09:00", end: "17:00", days: 4 },
];

export default function Booking() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState<string>("");

  const { data: services } = useQuery<Service[]>({
    queryKey: ["/api/services"],
  });

  const form = useForm<InsertBooking>({
    resolver: zodResolver(insertBookingSchema),
    defaultValues: {
      serviceId: "",
      startDateTime: "",
      endDateTime: "",
      vehicleBrand: "",
      vehiclePlate: "",
      notes: "",
    },
  });

  const createBookingMutation = useMutation({
    mutationFn: (data: InsertBooking) => apiPost("/api/bookings", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/history"] });
      toast({
        title: "Réservation confirmée",
        description: "Votre réservation a été enregistrée avec succès.",
      });
      setLocation("/");
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de créer la réservation",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertBooking) => {
    // Log pour debug
    console.log("Données de réservation envoyées:", data);
    createBookingMutation.mutate(data);
  };

  const handleSuggestedTime = (start: string, end: string, days: number) => {
    if (selectedDate) {
      const startDate = new Date(selectedDate);
      const endDate = new Date(selectedDate);
      endDate.setDate(startDate.getDate() + days);
      
      form.setValue("startDateTime", `${selectedDate}T${start}`);
      form.setValue("endDateTime", `${endDate.toISOString().split('T')[0]}T${end}`);
    }
  };

  // Get today's date in YYYY-MM-DD format
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="pb-24 md:pb-0">
      <div className="px-6 py-4 border-b border-border">
        <h2 className="text-xl md:text-2xl font-bold">Réservation</h2>
        <p className="text-sm text-muted-foreground">Planifiez votre intervention • Séjours multi-jours acceptés</p>
      </div>

      <div className="px-6 py-6 max-w-2xl mx-auto space-y-6">
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Service Selection */}
          <div>
            <Label htmlFor="service" className="block text-sm font-medium mb-2">
              Service
            </Label>
            <Select onValueChange={(value) => form.setValue("serviceId", value)}>
              <SelectTrigger className="form-input" data-testid="select-service">
                <SelectValue placeholder="Sélectionnez un service" />
              </SelectTrigger>
              <SelectContent>
                {services?.map((service) => (
                  <SelectItem key={service.id} value={service.id}>
                    {service.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.serviceId && (
              <p className="text-sm text-destructive mt-1">
                {form.formState.errors.serviceId.message}
              </p>
            )}
          </div>

          {/* Date Selection */}
          <div>
            <Label htmlFor="date" className="block text-sm font-medium mb-2">
              Date de la prestation
            </Label>
            <Input
              id="date"
              type="date"
              min={today}
              className="form-input"
              data-testid="input-date"
              value={selectedDate}
              onChange={(e) => {
                setSelectedDate(e.target.value);
                // Reset time fields when date changes
                form.setValue("startDateTime", "");
                form.setValue("endDateTime", "");
              }}
            />
          </div>

          {/* Créneaux suggérés */}
          {selectedDate && (
            <div>
              <Label className="block text-sm font-medium mb-2">Créneaux suggérés (optionnel)</Label>
              <p className="text-xs text-muted-foreground mb-3">
                💡 Votre véhicule peut rester plusieurs jours au garage selon vos besoins
              </p>
              <div className="grid grid-cols-1 gap-2">
                {suggestedTimes.map((suggestion, index) => (
                  <button
                    key={index}
                    type="button"
                    className="p-3 border rounded-xl text-sm transition-colors border-border hover:border-primary hover:bg-secondary text-left"
                    onClick={() => handleSuggestedTime(suggestion.start, suggestion.end, suggestion.days)}
                    data-testid={`button-suggestion-${index}`}
                  >
                    {suggestion.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Heure de début et fin */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="startDateTime" className="block text-sm font-medium mb-2">
                📅 Date et heure de dépôt du véhicule
              </Label>
              <Input
                id="startDateTime"
                type="datetime-local"
                min={today ? `${today}T08:00` : undefined}
                className="form-input"
                data-testid="input-start-time"
                {...form.register("startDateTime")}
              />
              {form.formState.errors.startDateTime && (
                <p className="text-sm text-destructive mt-1">
                  {form.formState.errors.startDateTime.message}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="endDateTime" className="block text-sm font-medium mb-2">
                📅 Date et heure de récupération du véhicule
              </Label>
              <p className="text-xs text-muted-foreground mb-2">
                Peut être le même jour ou plusieurs jours plus tard
              </p>
              <Input
                id="endDateTime"
                type="datetime-local"
                min={form.watch("startDateTime") || (today ? `${today}T08:00` : undefined)}
                className="form-input"
                data-testid="input-end-time"
                {...form.register("endDateTime")}
              />
              {form.formState.errors.endDateTime && (
                <p className="text-sm text-destructive mt-1">
                  {form.formState.errors.endDateTime.message}
                </p>
              )}
            </div>
          </div>

          {/* Vehicle Info */}
          <div>
            <Label className="block text-sm font-medium mb-2">
              Informations véhicule
            </Label>
            <div className="space-y-3">
              <Input
                placeholder="Marque et modèle"
                className="form-input"
                data-testid="input-vehicle-brand"
                {...form.register("vehicleBrand")}
              />
              {form.formState.errors.vehicleBrand && (
                <p className="text-sm text-destructive mt-1">
                  {form.formState.errors.vehicleBrand.message}
                </p>
              )}
              <Input
                placeholder="Immatriculation"
                className="form-input"
                data-testid="input-vehicle-plate"
                {...form.register("vehiclePlate")}
              />
              {form.formState.errors.vehiclePlate && (
                <p className="text-sm text-destructive mt-1">
                  {form.formState.errors.vehiclePlate.message}
                </p>
              )}

              {/* Informations jantes */}
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <Label htmlFor="wheelQuantity" className="block text-sm font-medium mb-2">
                    Nombre de jantes
                  </Label>
                  <Select onValueChange={(value) => form.setValue("wheelQuantity", parseInt(value))}>
                    <SelectTrigger className="form-input" data-testid="select-wheel-quantity">
                      <SelectValue placeholder="Choisir le nombre" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2">2 jantes</SelectItem>
                      <SelectItem value="4">4 jantes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="wheelDiameter" className="block text-sm font-medium mb-2">
                    Diamètre (pouces)
                  </Label>
                  <Select onValueChange={(value) => form.setValue("wheelDiameter", value)}>
                    <SelectTrigger className="form-input" data-testid="select-wheel-diameter">
                      <SelectValue placeholder="Choisir le diamètre" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15">15 pouces</SelectItem>
                      <SelectItem value="16">16 pouces</SelectItem>
                      <SelectItem value="17">17 pouces</SelectItem>
                      <SelectItem value="18">18 pouces</SelectItem>
                      <SelectItem value="19">19 pouces</SelectItem>
                      <SelectItem value="20">20 pouces</SelectItem>
                      <SelectItem value="21">21 pouces</SelectItem>
                      <SelectItem value="22">22 pouces</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <Label htmlFor="notes" className="block text-sm font-medium mb-2">
              Notes (optionnel)
            </Label>
            <Textarea
              id="notes"
              placeholder="Précisions sur votre demande..."
              className="form-input min-h-24"
              data-testid="textarea-notes"
              {...form.register("notes")}
            />
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            className="ios-button w-full"
            disabled={createBookingMutation.isPending}
            data-testid="button-submit-booking"
          >
            {createBookingMutation.isPending ? "Confirmation..." : "Confirmer la réservation"}
          </Button>
        </form>
      </div>
    </div>
  );
}
