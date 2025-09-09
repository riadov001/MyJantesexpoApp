import { useLocation } from "wouter";
import { ChevronLeft, Car, Phone, Mail, MapPin, Clock } from "lucide-react";

export default function Contact() {
  const [, setLocation] = useLocation();

  const contactInfo = [
    {
      icon: Phone,
      label: "Téléphone",
      value: "03.21.40.80.53",
      link: "tel:+33321408053",
      bgColor: "bg-green-500",
      testId: "link-phone"
    },
    {
      icon: Mail,
      label: "Email",
      value: "contact@myjantes.fr",
      link: "mailto:contact@myjantes.fr",
      bgColor: "bg-blue-500",
      testId: "link-email"
    },
    {
      icon: MapPin,
      label: "Adresse",
      value: "46 rue Convention\n62800 Liévin",
      bgColor: "bg-red-500",
      testId: "text-address"
    },
    {
      icon: Clock,
      label: "Horaires",
      value: "Lun-Ven: 8h-18h\nSam: 8h-12h",
      bgColor: "bg-orange-500",
      testId: "text-hours"
    },
  ];

  return (
    <div className="pb-24">
      <div className="px-6 py-4 border-b border-border flex items-center">
        <button 
          onClick={() => setLocation("/profile")} 
          className="mr-4"
          data-testid="button-back"
        >
          <ChevronLeft className="text-primary" size={24} />
        </button>
        <h2 className="text-xl font-bold">Contact</h2>
      </div>

      <div className="px-6 py-6 space-y-6">
        {/* Company Header */}
        <div className="ios-card text-center">
          <div className="w-16 h-16 bg-primary rounded-full mx-auto mb-4 flex items-center justify-center">
            <Car className="text-2xl text-white" size={32} />
          </div>
          <h3 className="font-semibold text-lg mb-2">MyJantes</h3>
          <p className="text-muted-foreground">Votre expert en jantes et pneus</p>
        </div>

        {/* Contact Information */}
        <div className="space-y-4">
          {contactInfo.map((item, index) => {
            const content = (
              <div className="ios-card flex items-center space-x-4">
                <div className={`w-12 h-12 ${item.bgColor} rounded-ios flex items-center justify-center`}>
                  <item.icon className="text-white" size={20} />
                </div>
                <div>
                  <p className="font-medium">{item.label}</p>
                  <p className="text-muted-foreground whitespace-pre-line">{item.value}</p>
                </div>
              </div>
            );

            if (item.link) {
              return (
                <a 
                  key={index} 
                  href={item.link} 
                  className="block"
                  data-testid={item.testId}
                >
                  {content}
                </a>
              );
            }

            return (
              <div key={index} data-testid={item.testId}>
                {content}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
