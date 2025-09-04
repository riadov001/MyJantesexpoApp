import { AuthService } from "@/lib/auth";
import { useLocation } from "wouter";
import { Phone, Bell, FileText, Shield, LogOut, User as UserIcon, Settings, Key, Edit, Building } from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { changePasswordSchema, updateClientProfileSchema, type ChangePasswordData, type UpdateClientProfileData, type User } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { apiPost, apiPut } from "@/lib/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export default function Profile() {
  const [, setLocation] = useLocation();
  const user = AuthService.getUser();
  const isAdmin = user?.role === "admin";
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Récupérer les données complètes de l'utilisateur
  const { data: fullUserData, isLoading } = useQuery<User>({
    queryKey: ["/api/auth/me"],
    enabled: !!user,
  });

  // Formulaires
  const passwordForm = useForm<ChangePasswordData>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const profileForm = useForm<UpdateClientProfileData>({
    resolver: zodResolver(updateClientProfileSchema),
    defaultValues: {
      name: fullUserData?.name || "",
      phone: fullUserData?.phone || "",
      address: fullUserData?.address || "",
      clientType: (fullUserData?.clientType as "particulier" | "professionnel") || "particulier",
      companyName: fullUserData?.companyName || "",
      companyAddress: fullUserData?.companyAddress || "",
      companySiret: fullUserData?.companySiret || "",
      companyVat: fullUserData?.companyVat || "",
      companyApe: fullUserData?.companyApe || "",
      companyContact: fullUserData?.companyContact || "",
    },
  });

  // Mettre à jour les valeurs par défaut quand les données sont chargées - UNE SEULE FOIS
  useEffect(() => {
    if (fullUserData && !isLoading && isProfileModalOpen) {
      profileForm.reset({
        name: fullUserData.name || "",
        phone: fullUserData.phone || "",
        address: fullUserData.address || "",
        clientType: (fullUserData.clientType as "particulier" | "professionnel") || "particulier",
        companyName: fullUserData.companyName || "",
        companyAddress: fullUserData.companyAddress || "",
        companySiret: fullUserData.companySiret || "",
        companyVat: fullUserData.companyVat || "",
        companyApe: fullUserData.companyApe || "",
        companyContact: fullUserData.companyContact || "",
      });
    }
  }, [fullUserData, isLoading, isProfileModalOpen]);

  // Mutations
  const changePasswordMutation = useMutation({
    mutationFn: (data: ChangePasswordData) => apiPost("/api/auth/change-password", data),
    onSuccess: () => {
      toast({ title: "Succès", description: "Mot de passe modifié avec succès" });
      passwordForm.reset();
      setIsPasswordModalOpen(false);
    },
    onError: (error: any) => {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: (data: UpdateClientProfileData) => apiPut("/api/auth/profile", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      toast({ title: "Succès", description: "Profil mis à jour avec succès" });
      setIsProfileModalOpen(false);
    },
    onError: (error: any) => {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    },
  });

  const handleLogout = () => {
    AuthService.removeToken();
    setLocation("/login");
  };

  const menuItems = [
    {
      icon: Edit,
      label: "Modifier mon profil",
      action: () => setIsProfileModalOpen(true),
      testId: "button-edit-profile"
    },
    {
      icon: Key,
      label: "Changer mon mot de passe",
      action: () => setIsPasswordModalOpen(true),
      testId: "button-change-password"
    },
    {
      icon: Phone,
      label: "Contact",
      action: () => setLocation("/contact"),
      testId: "button-contact"
    },
    {
      icon: Bell,
      label: "Notifications",
      action: () => setLocation("/notifications"),
      testId: "button-notifications"
    },
    {
      icon: FileText,
      label: "CGV",
      action: () => setLocation("/cgv"),
      testId: "button-cgv"
    },
    {
      icon: Shield,
      label: "Politique de confidentialité",
      action: () => {},
      testId: "button-privacy"
    },
  ];

  const adminMenuItems = [
    {
      icon: Settings,
      label: "Administration",
      action: () => setLocation("/admin"),
      testId: "button-admin"
    },
    {
      icon: UserIcon,
      label: "Profil Professionnel",
      action: () => setLocation("/admin-profile"),
      testId: "button-admin-profile"
    },
  ];

  return (
    <div className="pb-24">
      <div className="px-6 py-4 border-b border-border">
        <h2 className="text-xl font-bold">Profil</h2>
      </div>

      <div className="px-6 py-6 space-y-6">
        {/* Profile Header */}
        <div className="text-center">
          <div className="w-20 h-20 bg-primary rounded-full mx-auto mb-4 flex items-center justify-center">
            <UserIcon className="text-3xl text-white" size={40} />
          </div>
          <h3 className="font-semibold text-lg" data-testid="text-user-name">
            {fullUserData?.name || user?.name || "Utilisateur"}
          </h3>
          <p className="text-muted-foreground" data-testid="text-user-email">
            {fullUserData?.email || user?.email || ""}
          </p>
          {fullUserData?.clientType === "professionnel" && fullUserData?.companyName && (
            <div className="mt-2 flex items-center justify-center space-x-2">
              <Building className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">{fullUserData.companyName}</span>
            </div>
          )}
        </div>

        {/* Informations détaillées */}
        {!isLoading && fullUserData && (
          <div className="ios-card space-y-4">
            <h4 className="font-semibold text-muted-foreground text-sm">Informations personnelles</h4>
            
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Type de client</span>
                <span className="font-medium capitalize">
                  {fullUserData.clientType === "professionnel" ? "Professionnel" : "Particulier"}
                </span>
              </div>
              
              {fullUserData.phone && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Téléphone</span>
                  <span className="font-medium">{fullUserData.phone}</span>
                </div>
              )}
              
              {fullUserData.address && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Adresse</span>
                  <span className="font-medium text-right flex-1 ml-4">{fullUserData.address}</span>
                </div>
              )}
            </div>

            {/* Informations société pour les professionnels */}
            {fullUserData.clientType === "professionnel" && (
              <>
                <div className="border-t border-border pt-4">
                  <h4 className="font-semibold text-muted-foreground text-sm mb-3">Informations société</h4>
                  <div className="space-y-3">
                    {fullUserData.companyName && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Nom de la société</span>
                        <span className="font-medium">{fullUserData.companyName}</span>
                      </div>
                    )}
                    
                    {fullUserData.companyAddress && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Adresse société</span>
                        <span className="font-medium text-right flex-1 ml-4">{fullUserData.companyAddress}</span>
                      </div>
                    )}
                    
                    {fullUserData.companySiret && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">SIRET</span>
                        <span className="font-medium">{fullUserData.companySiret}</span>
                      </div>
                    )}
                    
                    {fullUserData.companyVat && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">N° TVA</span>
                        <span className="font-medium">{fullUserData.companyVat}</span>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* Menu Items */}
        <div className="space-y-1">
          {menuItems.map((item, index) => (
            <button
              key={index}
              className="w-full flex items-center space-x-4 p-4 hover:bg-secondary rounded-ios transition-colors"
              onClick={item.action}
              data-testid={item.testId}
            >
              <item.icon className="w-5 h-5" />
              <span className="flex-1 text-left">{item.label}</span>
              <i className="fas fa-chevron-right text-muted-foreground"></i>
            </button>
          ))}

          {/* Admin Section */}
          {isAdmin && (
            <>
              <div className="border-t border-border my-4"></div>
              <div className="px-4 py-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Administration
                </p>
              </div>
              {adminMenuItems.map((item, index) => (
                <button
                  key={`admin-${index}`}
                  className="w-full flex items-center space-x-4 p-4 hover:bg-secondary rounded-ios transition-colors"
                  onClick={item.action}
                  data-testid={item.testId}
                >
                  <item.icon className="w-5 h-5 text-primary" />
                  <span className="flex-1 text-left font-medium">{item.label}</span>
                  <i className="fas fa-chevron-right text-muted-foreground"></i>
                </button>
              ))}
            </>
          )}

          <div className="border-t border-border my-4"></div>
          
          <button
            className="w-full flex items-center space-x-4 p-4 hover:bg-secondary rounded-ios transition-colors text-red-400"
            onClick={handleLogout}
            data-testid="button-logout"
          >
            <LogOut className="w-5 h-5" />
            <span className="flex-1 text-left">Déconnexion</span>
          </button>
        </div>
      </div>

      {/* Modal changement de mot de passe */}
      <Dialog open={isPasswordModalOpen} onOpenChange={setIsPasswordModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Changer mon mot de passe</DialogTitle>
          </DialogHeader>
          <Form {...passwordForm}>
            <form onSubmit={passwordForm.handleSubmit((data) => changePasswordMutation.mutate(data))} className="space-y-4">
              <FormField
                control={passwordForm.control}
                name="currentPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mot de passe actuel</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Votre mot de passe actuel" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={passwordForm.control}
                name="newPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nouveau mot de passe</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Votre nouveau mot de passe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={passwordForm.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirmer le nouveau mot de passe</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Confirmez votre nouveau mot de passe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex space-x-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsPasswordModalOpen(false)}
                  className="flex-1"
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  disabled={changePasswordMutation.isPending}
                  className="flex-1"
                  data-testid="button-submit-password"
                >
                  {changePasswordMutation.isPending ? "Modification..." : "Modifier"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Modal modification du profil */}
      <Dialog open={isProfileModalOpen} onOpenChange={setIsProfileModalOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Modifier mon profil</DialogTitle>
          </DialogHeader>
          <Form {...profileForm}>
            <form onSubmit={profileForm.handleSubmit((data) => updateProfileMutation.mutate(data))} className="space-y-6">
              {/* Informations personnelles */}
              <div className="space-y-4">
                <h3 className="font-semibold text-sm text-muted-foreground">Informations personnelles</h3>
                
                <FormField
                  control={profileForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nom complet</FormLabel>
                      <FormControl>
                        <Input placeholder="Votre nom complet" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={profileForm.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Téléphone</FormLabel>
                      <FormControl>
                        <Input placeholder="Votre numéro de téléphone" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={profileForm.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Adresse</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Votre adresse complète" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={profileForm.control}
                  name="clientType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type de client</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionnez votre type de client" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="particulier">Particulier</SelectItem>
                          <SelectItem value="professionnel">Professionnel</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Informations société (si professionnel) */}
              {profileForm.watch("clientType") === "professionnel" && (
                <div className="space-y-4 border-t border-border pt-6">
                  <h3 className="font-semibold text-sm text-muted-foreground">Informations société</h3>
                  
                  <FormField
                    control={profileForm.control}
                    name="companyName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nom de la société</FormLabel>
                        <FormControl>
                          <Input placeholder="Nom de votre société" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={profileForm.control}
                    name="companyAddress"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Adresse de la société</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Adresse complète de la société" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={profileForm.control}
                      name="companySiret"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>SIRET</FormLabel>
                          <FormControl>
                            <Input placeholder="N° SIRET" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={profileForm.control}
                      name="companyVat"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>N° TVA</FormLabel>
                          <FormControl>
                            <Input placeholder="N° TVA intracommunautaire" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={profileForm.control}
                      name="companyApe"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Code APE</FormLabel>
                          <FormControl>
                            <Input placeholder="Code APE/NAF" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={profileForm.control}
                      name="companyContact"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Contact société</FormLabel>
                          <FormControl>
                            <Input placeholder="Nom du contact" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              )}

              <div className="flex space-x-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsProfileModalOpen(false)}
                  className="flex-1"
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  disabled={updateProfileMutation.isPending}
                  className="flex-1"
                  data-testid="button-submit-profile"
                >
                  {updateProfileMutation.isPending ? "Enregistrement..." : "Enregistrer"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
