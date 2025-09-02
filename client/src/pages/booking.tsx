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
  { label: "Matin (9h - 12h)", start: "09:00", end: "12:00" },
  { label: "Après-midi (14h - 17h)", start: "14:00", end: "17:00" },
  { label: "Toute la journée (9h - 17h)", start: "09:00", end: "17:00" },
];

export default function Booking() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState<string>("");

  const { data: services } = useQuery({
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
    createBookingMutation.mutate(data);
  };

  const handleSuggestedTime = (start: string, end: string) => {
    if (selectedDate) {
      form.setValue("startDateTime", `${selectedDate}T${start}`);
      form.setValue("endDateTime", `${selectedDate}T${end}`);
    }
  };

  // Get today's date in YYYY-MM-DD format
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="pb-24">
      <div className="px-6 py-4 border-b border-border">
        <h2 className="text-xl font-bold">Réservation</h2>
        <p className="text-sm text-muted-foreground">Planifiez votre intervention</p>
      </div>

      <div className="px-6 py-6 space-y-6">
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
              <div className="grid grid-cols-1 gap-2">
                {suggestedTimes.map((suggestion, index) => (
                  <button
                    key={index}
                    type="button"
                    className="p-3 border rounded-xl text-sm transition-colors border-border hover:border-primary hover:bg-secondary text-left"
                    onClick={() => handleSuggestedTime(suggestion.start, suggestion.end)}
                    data-testid={`button-suggestion-${index}`}
                  >
                    {suggestion.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Heure de début et fin */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="startDateTime" className="block text-sm font-medium mb-2">
                Heure de début
              </Label>
              <Input
                id="startDateTime"
                type="datetime-local"
                min={selectedDate ? `${selectedDate}T08:00` : undefined}
                max={selectedDate ? `${selectedDate}T18:00` : undefined}
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
                Heure de fin
              </Label>
              <Input
                id="endDateTime"
                type="datetime-local"
                min={selectedDate ? `${selectedDate}T08:00` : undefined}
                max={selectedDate ? `${selectedDate}T18:00` : undefined}
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
