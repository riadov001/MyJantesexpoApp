import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api";
import { Service } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

export default function Services() {
  const { data: services, isLoading, error } = useQuery({
    queryKey: ["/api/services"],
    queryFn: () => apiGet<Service[]>("/api/services"),
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
            <div className="flex justify-between items-center">
              <span className="text-primary font-semibold" data-testid={`text-service-price-${service.id}`}>
                À partir de {service.basePrice}€
              </span>
              <Button className="ios-button px-4 py-2 text-sm" data-testid={`button-service-details-${service.id}`}>
                Voir plus
              </Button>
            </div>
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
