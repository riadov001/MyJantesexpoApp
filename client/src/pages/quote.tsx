import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { insertQuoteSchema, type InsertQuote, type Service } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiGet, apiPost } from "@/lib/api";
import { useLocation } from "wouter";
import PhotoPicker from "@/components/photo-picker";

export default function Quote() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedPhotos, setSelectedPhotos] = useState<string[]>([]);

  const { data: services } = useQuery({
    queryKey: ["/api/services"],
  });

  const form = useForm<InsertQuote>({
    resolver: zodResolver(insertQuoteSchema),
    defaultValues: {
      vehicleBrand: "",
      vehicleModel: "",
      vehicleYear: "",
      vehicleEngine: "",
      description: "",
      photos: [],
    },
  });

  const createQuoteMutation = useMutation({
    mutationFn: (data: InsertQuote) => apiPost("/api/quotes", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/quotes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/history"] });
      toast({
        title: "Devis envoyé",
        description: "Votre demande de devis a été envoyée avec succès.",
      });
      setLocation("/");
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Impossible d'envoyer le devis",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertQuote) => {
    createQuoteMutation.mutate({
      ...data,
      photos: selectedPhotos,
    });
  };

  return (
    <div className="pb-24">
      <div className="px-6 py-4 border-b border-border">
        <h2 className="text-xl font-bold">Demande de Devis</h2>
        <p className="text-sm text-muted-foreground">Obtenez une estimation personnalisée</p>
      </div>

      <div className="px-6 py-6 space-y-6">
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Vehicle Information */}
          <div className="ios-card">
            <h3 className="font-semibold mb-4">Informations du véhicule</h3>
            <div className="space-y-3">
              <Input
                placeholder="Marque"
                className="form-input"
                data-testid="input-vehicle-brand"
                {...form.register("vehicleBrand")}
              />
              {form.formState.errors.vehicleBrand && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.vehicleBrand.message}
                </p>
              )}

              <Input
                placeholder="Modèle"
                className="form-input"
                data-testid="input-vehicle-model"
                {...form.register("vehicleModel")}
              />
              {form.formState.errors.vehicleModel && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.vehicleModel.message}
                </p>
              )}

              <Input
                placeholder="Année"
                className="form-input"
                data-testid="input-vehicle-year"
                {...form.register("vehicleYear")}
              />
              {form.formState.errors.vehicleYear && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.vehicleYear.message}
                </p>
              )}

              <Input
                placeholder="Motorisation"
                className="form-input"
                data-testid="input-vehicle-engine"
                {...form.register("vehicleEngine")}
              />
            </div>
          </div>

          {/* Service Description */}
          <div className="ios-card">
            <h3 className="font-semibold mb-4">Description de la prestation</h3>
            <Textarea
              placeholder="Décrivez votre besoin en détail..."
              className="form-input min-h-32"
              data-testid="textarea-description"
              {...form.register("description")}
            />
            {form.formState.errors.description && (
              <p className="text-sm text-destructive">
                {form.formState.errors.description.message}
              </p>
            )}
          </div>

          {/* Photo Upload */}
          <div className="ios-card">
            <h3 className="font-semibold mb-4">Photos (optionnel)</h3>
            <PhotoPicker
              selectedPhotos={selectedPhotos}
              onPhotosChange={setSelectedPhotos}
            />
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            className="ios-button w-full"
            disabled={createQuoteMutation.isPending}
            data-testid="button-submit-quote"
          >
            {createQuoteMutation.isPending ? "Envoi..." : "Envoyer la demande de devis"}
          </Button>
        </form>
      </div>
    </div>
  );
}
