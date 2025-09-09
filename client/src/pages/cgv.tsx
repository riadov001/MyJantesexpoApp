import { ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";

export default function CGV() {
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
          <h2 className="text-xl font-bold">Conditions Générales de Vente</h2>
          <p className="text-sm text-muted-foreground">Nos conditions de service</p>
        </div>
      </div>

      <div className="px-6 py-6 space-y-6">
        <div className="ios-card">
          <h3 className="text-lg font-semibold mb-4">Article 1 - Champ d'application</h3>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>
              Les présentes conditions générales de vente (CGV) s'appliquent à toutes les prestations de services 
              proposées par MyJantes, société immatriculée sous le SIREN 913 678 199.
            </p>
            <p>
              En faisant appel à nos services, le client reconnaît avoir pris connaissance de ces conditions et 
              les accepte sans réserve.
            </p>
          </div>
        </div>

        <div className="ios-card">
          <h3 className="text-lg font-semibold mb-4">Article 2 - Services proposés</h3>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>MyJantes propose les services suivants :</p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Rénovation de jantes en aluminium</li>
              <li>Réparation de jantes</li>
              <li>Nettoyage et entretien de jantes</li>
              <li>Conseils et expertise technique</li>
            </ul>
            <p>
              Tous nos services sont réalisés par des professionnels qualifiés dans nos locaux situés 
              46 RUE DE LA CONVENTION, 62800 LIEVIN.
            </p>
          </div>
        </div>

        <div className="ios-card">
          <h3 className="text-lg font-semibold mb-4">Article 3 - Commandes et devis</h3>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>
              Toute prestation fait l'objet d'un devis préalable gratuit, établi après examen des jantes.
            </p>
            <p>
              Le devis est valable 30 jours. La commande devient ferme et définitive après acceptation 
              écrite du devis par le client et versement d'un acompte si demandé.
            </p>
          </div>
        </div>

        <div className="ios-card">
          <h3 className="text-lg font-semibold mb-4">Article 4 - Tarifs et paiement</h3>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>
              Les prix sont indiqués en euros, toutes taxes comprises (TTC) au taux de TVA en vigueur (20%).
            </p>
            <p>Les modalités de paiement acceptées sont :</p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Espèces</li>
              <li>Chèque</li>
              <li>Carte bancaire</li>
              <li>Virement bancaire</li>
            </ul>
            <p>
              Le paiement s'effectue comptant à la livraison, sauf accord particulier mentionné sur le devis.
            </p>
          </div>
        </div>

        <div className="ios-card">
          <h3 className="text-lg font-semibold mb-4">Article 5 - Exécution des prestations</h3>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>
              Les délais d'exécution sont donnés à titre indicatif et peuvent varier selon la complexité 
              de la prestation et la charge de travail.
            </p>
            <p>
              Le client sera informé de l'avancement des travaux et de la date de livraison prévue.
            </p>
          </div>
        </div>

        <div className="ios-card">
          <h3 className="text-lg font-semibold mb-4">Article 6 - Garanties</h3>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>
              MyJantes garantit ses prestations contre tout défaut de fabrication ou vice caché pendant 
              une durée de 6 mois à compter de la livraison.
            </p>
            <p>
              Cette garantie ne couvre pas l'usure normale, les dommages résultant d'un usage anormal 
              ou d'un entretien défaillant.
            </p>
          </div>
        </div>

        <div className="ios-card">
          <h3 className="text-lg font-semibold mb-4">Article 7 - Responsabilité</h3>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>
              MyJantes est couverte par une assurance responsabilité civile professionnelle pour 
              l'exercice de son activité.
            </p>
            <p>
              La responsabilité de MyJantes ne peut être engagée qu'en cas de faute prouvée dans 
              l'exécution de ses prestations.
            </p>
          </div>
        </div>

        <div className="ios-card">
          <h3 className="text-lg font-semibold mb-4">Article 8 - Droit de rétractation</h3>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>
              Conformément à l'article L221-28 du Code de la consommation, le droit de rétractation 
              ne s'applique pas aux prestations de services d'entretien ou de réparation à réaliser 
              en urgence au domicile du consommateur.
            </p>
          </div>
        </div>

        <div className="ios-card">
          <h3 className="text-lg font-semibold mb-4">Article 9 - Réclamations et litiges</h3>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>
              Toute réclamation doit être formulée par écrit dans les 8 jours suivant la livraison.
            </p>
            <p>
              En cas de litige, les parties s'efforceront de trouver une solution amiable. 
              À défaut, le tribunal compétent sera celui du ressort de notre siège social.
            </p>
          </div>
        </div>

        <div className="ios-card">
          <h3 className="text-lg font-semibold mb-4">Article 10 - Données personnelles</h3>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>
              Les données personnelles collectées sont traitées conformément au RGPD et à notre 
              politique de confidentialité.
            </p>
            <p>
              Le client dispose d'un droit d'accès, de rectification et de suppression de ses données.
            </p>
          </div>
        </div>

        <div className="ios-card text-center">
          <p className="text-sm text-muted-foreground mb-4">
            Conditions générales de vente en vigueur au 1er janvier 2025.
          </p>
          <button 
            onClick={() => setLocation("/contact")}
            className="ios-button"
            data-testid="button-contact"
          >
            Une question ? Contactez-nous
          </button>
        </div>
      </div>
    </div>
  );
}