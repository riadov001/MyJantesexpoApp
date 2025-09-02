import { ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";

export default function MentionsLegales() {
  const [, setLocation] = useLocation();

  return (
    <div className="pb-24">
      <div className="px-6 py-4 border-b border-border flex items-center">
        <button 
          onClick={() => setLocation("/")}
          className="mr-4 p-1"
          data-testid="button-back"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h2 className="text-xl font-bold">Mentions légales</h2>
          <p className="text-sm text-muted-foreground">Informations légales</p>
        </div>
      </div>

      <div className="px-6 py-6 space-y-6">
        <div className="ios-card">
          <h3 className="text-lg font-semibold mb-4">Identification de l'entreprise</h3>
          <div className="space-y-2 text-sm">
            <p><strong>Dénomination sociale :</strong> MyJantes</p>
            <p><strong>Adresse :</strong> 46 RUE DE LA CONVENTION, 62800 LIEVIN, France</p>
            <p><strong>SIREN :</strong> 913 678 199</p>
            <p><strong>SIRET :</strong> 913 678 199 00021</p>
            <p><strong>Code APE :</strong> 4520A - Entretien et réparation de véhicules automobiles légers</p>
            <p><strong>N° TVA :</strong> FR73913678199</p>
          </div>
        </div>

        <div className="ios-card">
          <h3 className="text-lg font-semibold mb-4">Directeur de la publication</h3>
          <div className="space-y-2 text-sm">
            <p>Le directeur de la publication est le représentant légal de MyJantes.</p>
          </div>
        </div>

        <div className="ios-card">
          <h3 className="text-lg font-semibold mb-4">Hébergement</h3>
          <div className="space-y-2 text-sm">
            <p><strong>Hébergeur :</strong> Replit Inc.</p>
            <p><strong>Adresse :</strong> 767 Bryant St. #203, San Francisco, CA 94107, États-Unis</p>
          </div>
        </div>

        <div className="ios-card">
          <h3 className="text-lg font-semibold mb-4">Propriété intellectuelle</h3>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>
              L'ensemble du contenu de ce site (textes, images, logos, etc.) est protégé par le droit d'auteur 
              et appartient à MyJantes ou à ses partenaires. Toute reproduction, même partielle, est interdite 
              sans autorisation préalable.
            </p>
          </div>
        </div>

        <div className="ios-card">
          <h3 className="text-lg font-semibold mb-4">Données personnelles</h3>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>
              Les données personnelles collectées sur ce site sont traitées conformément au Règlement Général 
              sur la Protection des Données (RGPD). Vous disposez d'un droit d'accès, de rectification et de 
              suppression de vos données personnelles.
            </p>
            <p>
              Pour exercer ces droits, contactez-nous via notre formulaire de contact.
            </p>
          </div>
        </div>

        <div className="ios-card">
          <h3 className="text-lg font-semibold mb-4">Responsabilité</h3>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>
              MyJantes s'efforce de fournir des informations exactes et à jour. Cependant, nous ne pouvons 
              garantir l'exactitude, la complétude ou l'actualité des informations diffusées sur ce site.
            </p>
            <p>
              L'utilisation des informations et contenus disponibles sur ce site se fait sous l'entière 
              responsabilité de l'utilisateur.
            </p>
          </div>
        </div>

        <div className="ios-card">
          <h3 className="text-lg font-semibold mb-4">Contact</h3>
          <div className="space-y-2 text-sm">
            <p>Pour toute question concernant ces mentions légales, vous pouvez nous contacter :</p>
            <button 
              onClick={() => setLocation("/contact")}
              className="ios-button mt-2"
              data-testid="button-contact"
            >
              Formulaire de contact
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}