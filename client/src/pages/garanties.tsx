import { ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";

export default function Garanties() {
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
          <h2 className="text-xl font-bold">Garanties</h2>
          <p className="text-sm text-muted-foreground">Notre engagement qualité</p>
        </div>
      </div>

      <div className="px-6 py-6 space-y-6">
        <div className="ios-card">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-primary mb-2">Garanties</h1>
            <p className="text-lg text-muted-foreground">
              Chez Myjantes : Qualité exceptionnelle, garantie totale. Choisissez l'excellence pour vos jantes en aluminium ! ✨🔧
            </p>
          </div>
        </div>

        <div className="ios-card">
          <h2 className="text-xl font-semibold mb-4">Bienvenue dans notre section Garantie – Rénovation de Jantes en Aluminium</h2>
          <p className="text-muted-foreground mb-4">
            Chez Myjantes, nous comprenons l'importance de vos jantes en aluminium, non seulement en termes de performance, 
            mais aussi en tant qu'élément esthétique essentiel de votre véhicule. C'est pourquoi nous mettons à votre 
            disposition notre engagement inébranlable envers la qualité et la satisfaction client à travers notre garantie 
            de rénovation de jantes.
          </p>
        </div>

        <div className="ios-card">
          <h3 className="text-lg font-semibold mb-4">Notre Processus de Rénovation</h3>
          <div className="space-y-4">
            <div className="border-l-4 border-primary pl-4">
              <h4 className="font-medium text-primary mb-2">1. Évaluation Expertise</h4>
              <p className="text-sm text-muted-foreground">
                Dès réception de vos jantes, notre équipe d'experts effectue une évaluation approfondie pour identifier 
                les dommages, la corrosion et d'autres imperfections. Cette étape nous permet de déterminer le traitement 
                le plus approprié pour restaurer vos jantes à leur éclat d'origine.
              </p>
            </div>

            <div className="border-l-4 border-primary pl-4">
              <h4 className="font-medium text-primary mb-2">2. Nettoyage Professionnel</h4>
              <p className="text-sm text-muted-foreground">
                Une fois l'évaluation terminée, vos jantes entament un voyage de transformation. Nous utilisons des 
                techniques de nettoyage avancées pour éliminer la saleté, les résidus de freinage et les contaminants, 
                révélant ainsi la surface originale de vos jantes.
              </p>
            </div>

            <div className="border-l-4 border-primary pl-4">
              <h4 className="font-medium text-primary mb-2">3. Réparation Précise</h4>
              <p className="text-sm text-muted-foreground">
                Toute imperfection, rayure ou fissure est traitée avec une précision chirurgicale. Notre équipe d'experts 
                en réparation de jantes veille à ce que chaque détail soit pris en compte, garantissant une restauration optimale.
              </p>
            </div>

            <div className="border-l-4 border-primary pl-4">
              <h4 className="font-medium text-primary mb-2">4. Application de Revêtement Spécialisé</h4>
              <p className="text-sm text-muted-foreground">
                Nous utilisons des revêtements de la plus haute qualité, conçus pour protéger vos jantes contre les 
                agressions extérieures, y compris les intempéries et les impacts routiers. Ce revêtement confère également 
                un éclat durable à vos jantes, les préservant dans le temps.
              </p>
            </div>
          </div>
        </div>

        <div className="ios-card">
          <h3 className="text-lg font-semibold mb-4">Notre Garantie</h3>
          <p className="text-muted-foreground mb-4">
            Chez Myjantes, nous sommes fiers de la qualité de notre travail. C'est pourquoi chaque rénovation de jantes 
            est accompagnée d'une garantie complète. Nous nous engageons à ce que votre satisfaction soit totale, et nous 
            sommes convaincus que nos services dépasseront vos attentes.
          </p>
        </div>

        <div className="ios-card">
          <h3 className="text-lg font-semibold mb-4">Pourquoi Nous Choisir</h3>
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
              <div>
                <h4 className="font-medium">Expertise Inégalée</h4>
                <p className="text-sm text-muted-foreground">
                  Notre équipe possède une expertise inégalée dans le domaine de la rénovation de jantes en aluminium, 
                  assurant un savoir-faire exceptionnel à chaque étape du processus.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
              <div>
                <h4 className="font-medium">Service Client Exceptionnel</h4>
                <p className="text-sm text-muted-foreground">
                  Nous plaçons nos clients au cœur de notre entreprise. Notre équipe dévouée est toujours prête à répondre 
                  à vos questions et à vous guider tout au long du processus de rénovation.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
              <div>
                <h4 className="font-medium">Résultats Durables</h4>
                <p className="text-sm text-muted-foreground">
                  Grâce à nos techniques avancées et à l'utilisation de matériaux de haute qualité, nos rénovations de 
                  jantes offrent des résultats durables qui résistent aux rigueurs de la route.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="ios-card text-center">
          <h3 className="text-lg font-semibold mb-4">🔧✨ Votre satisfaction, notre engagement ✨🔧</h3>
          <p className="text-muted-foreground mb-4">
            Chez Myjantes, nous ne rénovons pas seulement des jantes, nous restaurons la confiance que vous avez dans 
            l'apparence et la performance de votre véhicule. Faites confiance à des professionnels passionnés et 
            choisissez-nous pour redonner vie à vos jantes en aluminium.
          </p>
          <p className="text-primary font-medium">
            Contactez-nous dès aujourd'hui pour une rénovation qui dépasse vos attentes !
          </p>
          <button 
            onClick={() => setLocation("/contact")}
            className="ios-button mt-4 px-6 py-3"
            data-testid="button-contact"
          >
            Nous contacter
          </button>
        </div>
      </div>
    </div>
  );
}