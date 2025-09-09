import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiPost } from "@/lib/api";
import { useLocation } from "wouter";
import { z } from "zod";
import { ArrowLeft, User, Car, FileText } from "lucide-react";

// Schema pour la création d'un devis admin avec infos client
const createQuoteSchema = z.object({
  // Informations client
  clientName: z.string().min(1, "Le nom du client est requis"),
  clientEmail: z.string().email("Email invalide"),
  clientPhone: z.string().optional(),
  clientAddress: z.string().optional(),
  clientType: z.enum(["particulier", "professionnel"]),
  // Infos société (si professionnel)
  companyName: z.string().optional(),
  companyAddress: z.string().optional(),
  companySiret: z.string().optional(),
  companyVat: z.string().optional(),
  companyApe: z.string().optional(),
  companyContact: z.string().optional(),
  // Informations véhicule
  vehicleBrand: z.string().min(1, "La marque du véhicule est requise"),
  vehicleModel: z.string().min(1, "Le modèle du véhicule est requis"),
  vehicleYear: z.string().min(1, "L'année du véhicule est requise"),
  vehicleEngine: z.string().optional(),
  // Informations jantes
  wheelQuantity: z.number().optional(),
  wheelDiameter: z.string().optional(),
  // Description du travail
  description: z.string().min(10, "La description doit contenir au moins 10 caractères"),
});

type CreateQuoteData = z.infer<typeof createQuoteSchema>;

export default function AdminCreateQuote() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<CreateQuoteData>({
    resolver: zodResolver(createQuoteSchema),
    defaultValues: {
      clientType: "particulier",
      vehicleBrand: "",
      vehicleModel: "",
      vehicleYear: "",
      vehicleEngine: "",
      description: "",
      clientName: "",
      clientEmail: "",
      clientPhone: "",
      clientAddress: "",
    },
  });

  const createQuoteMutation = useMutation({
    mutationFn: (data: CreateQuoteData) => apiPost("/api/admin/quotes/create", data),
    onSuccess: () => {
      toast({
        title: "Devis créé",
        description: "Le devis a été créé avec succès.",
      });
      setLocation("/admin/quotes");
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de créer le devis",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: CreateQuoteData) => {
    setIsSubmitting(true);
    createQuoteMutation.mutate(data);
    setIsSubmitting(false);
  };

  const clientType = form.watch("clientType");

  return (
    <div className="pb-24 md:pb-0">
      <div className="px-6 py-4 border-b border-border">
        <div className="max-w-4xl mx-auto flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation("/admin/quotes")}
            className="p-2"
            data-testid="button-back"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h2 className="text-xl font-bold md:text-2xl">Nouveau Devis</h2>
            <p className="text-sm text-muted-foreground md:text-base">
              Créer un devis avec les informations client
            </p>
          </div>
        </div>
      </div>

      <div className="px-6 py-6 max-w-4xl mx-auto">
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          {/* Informations Client */}
          <div className="ios-card">
            <div className="flex items-center space-x-2 mb-6">
              <User className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold">Informations Client</h3>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="clientName" className="block text-sm font-medium mb-2">
                    Nom complet *
                  </Label>
                  <Input
                    id="clientName"
                    className="form-input"
                    data-testid="input-client-name"
                    {...form.register("clientName")}
                  />
                  {form.formState.errors.clientName && (
                    <p className="text-sm text-destructive mt-1">
                      {form.formState.errors.clientName.message}
                    </p>
                  )}
                </div>
                
                <div>
                  <Label htmlFor="clientEmail" className="block text-sm font-medium mb-2">
                    Email *
                  </Label>
                  <Input
                    id="clientEmail"
                    type="email"
                    className="form-input"
                    data-testid="input-client-email"
                    {...form.register("clientEmail")}
                  />
                  {form.formState.errors.clientEmail && (
                    <p className="text-sm text-destructive mt-1">
                      {form.formState.errors.clientEmail.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="clientPhone" className="block text-sm font-medium mb-2">
                    Téléphone
                  </Label>
                  <Input
                    id="clientPhone"
                    type="tel"
                    className="form-input"
                    data-testid="input-client-phone"
                    {...form.register("clientPhone")}
                  />
                </div>
                
                <div>
                  <Label htmlFor="clientType" className="block text-sm font-medium mb-2">
                    Type de client
                  </Label>
                  <Select onValueChange={(value: "particulier" | "professionnel") => form.setValue("clientType", value)}>
                    <SelectTrigger className="form-input" data-testid="select-client-type">
                      <SelectValue placeholder="Type de client" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="particulier">Particulier</SelectItem>
                      <SelectItem value="professionnel">Professionnel</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="clientAddress" className="block text-sm font-medium mb-2">
                  Adresse
                </Label>
                <Textarea
                  id="clientAddress"
                  className="form-input"
                  data-testid="input-client-address"
                  {...form.register("clientAddress")}
                />
              </div>

              {/* Informations entreprise si professionnel */}
              {clientType === "professionnel" && (
                <div className="space-y-4 border-t border-border pt-4">
                  <h4 className="font-medium text-sm text-muted-foreground">Informations Société</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="companyName" className="block text-sm font-medium mb-2">
                        Nom de l'entreprise
                      </Label>
                      <Input
                        id="companyName"
                        className="form-input"
                        data-testid="input-company-name"
                        {...form.register("companyName")}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="companySiret" className="block text-sm font-medium mb-2">
                        SIRET
                      </Label>
                      <Input
                        id="companySiret"
                        className="form-input"
                        data-testid="input-company-siret"
                        {...form.register("companySiret")}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="companyVat" className="block text-sm font-medium mb-2">
                        Numéro TVA
                      </Label>
                      <Input
                        id="companyVat"
                        className="form-input"
                        data-testid="input-company-vat"
                        {...form.register("companyVat")}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="companyApe" className="block text-sm font-medium mb-2">
                        Code APE
                      </Label>
                      <Input
                        id="companyApe"
                        className="form-input"
                        data-testid="input-company-ape"
                        {...form.register("companyApe")}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="companyAddress" className="block text-sm font-medium mb-2">
                      Adresse de l'entreprise
                    </Label>
                    <Textarea
                      id="companyAddress"
                      className="form-input"
                      data-testid="input-company-address"
                      {...form.register("companyAddress")}
                    />
                  </div>

                  <div>
                    <Label htmlFor="companyContact" className="block text-sm font-medium mb-2">
                      Personne de contact
                    </Label>
                    <Input
                      id="companyContact"
                      className="form-input"
                      data-testid="input-company-contact"
                      {...form.register("companyContact")}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Informations Véhicule */}
          <div className="ios-card">
            <div className="flex items-center space-x-2 mb-6">
              <Car className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold">Informations Véhicule</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="vehicleBrand" className="block text-sm font-medium mb-2">
                  Marque *
                </Label>
                <Input
                  id="vehicleBrand"
                  className="form-input"
                  data-testid="input-vehicle-brand"
                  {...form.register("vehicleBrand")}
                />
                {form.formState.errors.vehicleBrand && (
                  <p className="text-sm text-destructive mt-1">
                    {form.formState.errors.vehicleBrand.message}
                  </p>
                )}
              </div>
              
              <div>
                <Label htmlFor="vehicleModel" className="block text-sm font-medium mb-2">
                  Modèle *
                </Label>
                <Input
                  id="vehicleModel"
                  className="form-input"
                  data-testid="input-vehicle-model"
                  {...form.register("vehicleModel")}
                />
                {form.formState.errors.vehicleModel && (
                  <p className="text-sm text-destructive mt-1">
                    {form.formState.errors.vehicleModel.message}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <Label htmlFor="vehicleYear" className="block text-sm font-medium mb-2">
                  Année *
                </Label>
                <Input
                  id="vehicleYear"
                  className="form-input"
                  data-testid="input-vehicle-year"
                  {...form.register("vehicleYear")}
                />
                {form.formState.errors.vehicleYear && (
                  <p className="text-sm text-destructive mt-1">
                    {form.formState.errors.vehicleYear.message}
                  </p>
                )}
              </div>
              
              <div>
                <Label htmlFor="vehicleEngine" className="block text-sm font-medium mb-2">
                  Motorisation
                </Label>
                <Input
                  id="vehicleEngine"
                  className="form-input"
                  data-testid="input-vehicle-engine"
                  {...form.register("vehicleEngine")}
                />
              </div>
            </div>

            {/* Informations jantes */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
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

          {/* Description du travail */}
          <div className="ios-card">
            <div className="flex items-center space-x-2 mb-6">
              <FileText className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold">Description du Travail</h3>
            </div>
            
            <div>
              <Label htmlFor="description" className="block text-sm font-medium mb-2">
                Description détaillée du travail demandé *
              </Label>
              <Textarea
                id="description"
                className="form-input min-h-32"
                placeholder="Décrivez le travail à effectuer sur le véhicule..."
                data-testid="textarea-description"
                {...form.register("description")}
              />
              {form.formState.errors.description && (
                <p className="text-sm text-destructive mt-1">
                  {form.formState.errors.description.message}
                </p>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setLocation("/admin/quotes")}
              data-testid="button-cancel"
            >
              Annuler
            </Button>
            <Button
              type="submit"
              className="ios-button"
              disabled={isSubmitting || createQuoteMutation.isPending}
              data-testid="button-create-quote"
            >
              {isSubmitting || createQuoteMutation.isPending ? "Création..." : "Créer le Devis"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}