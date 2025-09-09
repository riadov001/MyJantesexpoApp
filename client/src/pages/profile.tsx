import { AuthService } from "@/lib/auth";
import { useLocation } from "wouter";
import { Phone, Bell, FileText, Shield, LogOut, User as UserIcon, Settings, Key, Edit, Building, Calendar, Clock, Plus, CheckCircle, XCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { changePasswordSchema, updateClientProfileSchema, insertLeaveRequestSchema, type ChangePasswordData, type UpdateClientProfileData, type User, type LeaveRequest, type InsertLeaveRequest } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { apiPost, apiPut } from "@/lib/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export default function Profile() {
  const [, setLocation] = useLocation();
  const user = AuthService.getUser();
  const isAdmin = user?.role === "admin";
  const isEmployee = user?.role === "employee";
  const isAdminOrEmployee = isAdmin || isEmployee;
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
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

  // Formulaire pour les demandes de congés
  const leaveForm = useForm<Omit<InsertLeaveRequest, 'employeeId'>>({
    resolver: zodResolver(insertLeaveRequestSchema),
    defaultValues: {
      startDate: new Date(),
      endDate: new Date(),
      reason: "",
    },
  });

  // Query pour récupérer les demandes de congés
  const { data: leaveRequests, isLoading: isLoadingLeaveRequests } = useQuery<LeaveRequest[]>({
    queryKey: ["/api/leave-requests"],
    enabled: isAdminOrEmployee,
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

  const createLeaveRequestMutation = useMutation({
    mutationFn: (data: Omit<InsertLeaveRequest, 'employeeId'>) => {
      // Transformer les Date en strings ISO pour l'envoi
      const transformedData = {
        ...data,
        startDate: data.startDate instanceof Date ? data.startDate.toISOString() : data.startDate,
        endDate: data.endDate instanceof Date ? data.endDate.toISOString() : data.endDate,
      };
      return apiPost("/api/leave-requests", transformedData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leave-requests"] });
      toast({ title: "Succès", description: "Demande de congés envoyée avec succès" });
      leaveForm.reset();
      setIsLeaveModalOpen(false);
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
    ...(isAdminOrEmployee ? [{
      icon: Calendar,
      label: "Mes congés",
      action: () => setIsLeaveModalOpen(true),
      testId: "button-my-leave"
    }] : []),
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
              className="w-full flex items-center space-x-4 p-4 hover:bg-secondary/80 rounded-ios transition-all duration-200 hover:shadow-sm active:scale-[0.98] border border-transparent hover:border-border/50"
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
                  className="w-full flex items-center space-x-4 p-4 hover:bg-primary/10 rounded-ios transition-all duration-200 hover:shadow-sm active:scale-[0.98] border border-transparent hover:border-primary/20"
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
            className="w-full flex items-center space-x-4 p-4 hover:bg-red-500/10 rounded-ios transition-all duration-200 text-red-400 hover:text-red-500 hover:shadow-sm active:scale-[0.98] border border-transparent hover:border-red-500/20"
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
                  className="flex-1 rounded-lg font-medium border-border/20 hover:bg-secondary/50 hover:border-border/40 transition-all duration-200 active:scale-95 shadow-sm hover:shadow-md"
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  disabled={changePasswordMutation.isPending}
                  className="flex-1 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80 rounded-lg font-medium shadow-md hover:shadow-lg transition-all duration-200 active:scale-95"
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
                  className="flex-1 rounded-lg font-medium border-border/20 hover:bg-secondary/50 hover:border-border/40 transition-all duration-200 active:scale-95 shadow-sm hover:shadow-md"
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  disabled={updateProfileMutation.isPending}
                  className="flex-1 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80 rounded-lg font-medium shadow-md hover:shadow-lg transition-all duration-200 active:scale-95"
                  data-testid="button-submit-profile"
                >
                  {updateProfileMutation.isPending ? "Enregistrement..." : "Enregistrer"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Modal demandes de congés */}
      {isAdminOrEmployee && (
        <Dialog open={isLeaveModalOpen} onOpenChange={setIsLeaveModalOpen}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Mes congés</DialogTitle>
            </DialogHeader>

            <div className="space-y-6">
              {/* Formulaire nouvelle demande */}
              <div className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold">Nouvelle demande</h3>
                  <Plus className="w-5 h-5 text-primary" />
                </div>

                <Form {...leaveForm}>
                  <form
                    onSubmit={leaveForm.handleSubmit((data) => createLeaveRequestMutation.mutate(data))}
                    className="space-y-4"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={leaveForm.control}
                        name="startDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Date de début</FormLabel>
                            <FormControl>
                              <Input
                                type="date"
                                {...field}
                                value={field.value instanceof Date ? field.value.toISOString().split('T')[0] : ''}
                                onChange={(e) => field.onChange(new Date(e.target.value))}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={leaveForm.control}
                        name="endDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Date de fin</FormLabel>
                            <FormControl>
                              <Input
                                type="date"
                                {...field}
                                value={field.value instanceof Date ? field.value.toISOString().split('T')[0] : ''}
                                onChange={(e) => field.onChange(new Date(e.target.value))}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={leaveForm.control}
                      name="reason"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Motif</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Décrivez le motif de votre demande de congés..."
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button
                      type="submit"
                      disabled={createLeaveRequestMutation.isPending}
                      className="w-full"
                      data-testid="button-submit-leave-request"
                    >
                      {createLeaveRequestMutation.isPending ? "Envoi en cours..." : "Envoyer la demande"}
                    </Button>
                  </form>
                </Form>
              </div>

              {/* Liste des demandes existantes */}
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-4">Mes demandes de congés</h3>
                
                {isLoadingLeaveRequests ? (
                  <div className="text-center py-8">
                    <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                    <p className="mt-2 text-muted-foreground">Chargement des demandes...</p>
                  </div>
                ) : !leaveRequests || leaveRequests.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Calendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>Aucune demande de congés pour le moment</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {leaveRequests.map((request) => (
                      <div
                        key={request.id}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-secondary/20"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Clock className="w-4 h-4 text-muted-foreground" />
                            <span className="font-medium">
                              {new Date(request.startDate).toLocaleDateString('fr-FR')} - 
                              {' '}{new Date(request.endDate).toLocaleDateString('fr-FR')}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground">{request.reason}</p>
                          {request.notes && (
                            <p className="text-sm text-blue-600 mt-1">Note: {request.notes}</p>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {request.status === 'pending' && (
                            <div className="flex items-center gap-1 text-orange-600 bg-orange-100 px-2 py-1 rounded-full text-xs">
                              <Clock className="w-3 h-3" />
                              En attente
                            </div>
                          )}
                          {request.status === 'approved' && (
                            <div className="flex items-center gap-1 text-green-600 bg-green-100 px-2 py-1 rounded-full text-xs">
                              <CheckCircle className="w-3 h-3" />
                              Approuvé
                            </div>
                          )}
                          {request.status === 'rejected' && (
                            <div className="flex items-center gap-1 text-red-600 bg-red-100 px-2 py-1 rounded-full text-xs">
                              <XCircle className="w-3 h-3" />
                              Refusé
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
