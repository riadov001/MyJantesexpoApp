import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api";
import { Service } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export default function Services() {
  const { data: services, isLoading, error } = useQuery({
    queryKey: ["/api/services"],
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin" size={32} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-6 py-8 text-center">
        <p className="text-destructive">Erreur lors du chargement des services</p>
      </div>
    );
  }

  return (
    <div className="pb-24">
      <div className="px-6 py-4 border-b border-border">
        <h2 className="text-xl font-bold">Services</h2>
        <p className="text-sm text-muted-foreground">Découvrez nos prestations</p>
      </div>

      <div className="px-6 py-6 space-y-4">
        {services?.map((service) => (
          <div key={service.id} className="ios-card" data-testid={`card-service-${service.id}`}>
            {service.image && (
              <img
                src={service.image}
                alt={service.name}
                className="w-full h-40 object-cover rounded-ios mb-4"
                data-testid={`img-service-${service.id}`}
              />
            )}
            <h3 className="font-semibold text-lg mb-2" data-testid={`text-service-name-${service.id}`}>
              {service.name}
            </h3>
            <p className="text-muted-foreground text-sm mb-4" data-testid={`text-service-description-${service.id}`}>
              {service.description}
            </p>
            
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value={`service-${service.id}`} className="border-none">
                <AccordionTrigger 
                  className="text-primary hover:text-primary/80 text-sm font-medium py-2 px-0"
                  data-testid={`button-service-details-${service.id}`}
                >
                  Voir plus de détails
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground pb-2">
                  <div className="space-y-2">
                    <p><strong>Détails du service :</strong></p>
                    <p>Nos experts s'occupent de votre véhicule avec le plus grand soin. Chaque intervention est réalisée selon les standards de qualité les plus élevés.</p>
                    <p className="text-primary font-medium mt-3">
                      💼 Prix sur devis personnalisé
                    </p>
                    <p className="text-xs">
                      Contactez-nous pour obtenir un devis gratuit adapté à vos besoins spécifiques.
                    </p>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        ))}

        {!services?.length && (
          <div className="ios-card text-center py-8">
            <p className="text-muted-foreground">Aucun service disponible</p>
          </div>
        )}
      </div>
    </div>
  );
}
