import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiGet, apiPost, apiDelete, apiPut } from "@/lib/api";
import { queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Users, Plus, Trash2, Edit3, Shield, User } from "lucide-react";
import { Link } from "wouter";

interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  clientType?: string;
  companyName?: string;
  companyAddress?: string;
  companySiret?: string;
  companyVat?: string;
  companyApe?: string;
  companyContact?: string;
  createdAt: string;
}

const createUserSchema = z.object({
  name: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  email: z.string().email("Email invalide"),
  password: z.string().min(6, "Le mot de passe doit contenir au moins 6 caractères"),
  phone: z.string().optional(),
  role: z.enum(["admin", "employee", "customer"]),
  clientType: z.enum(["particulier", "professionnel"]).default("particulier"),
  // Champs société (optionnels, requis seulement si professionnel)
  companyName: z.string().optional(),
  companyAddress: z.string().optional(),
  companySiret: z.string().optional(),
  companyVat: z.string().optional(),
  companyApe: z.string().optional(),
  companyContact: z.string().optional(),
}).refine((data) => {
  if (data.clientType === "professionnel") {
    return data.companyName && data.companyName.length > 0;
  }
  return true;
}, {
  message: "Nom de l'entreprise requis pour les clients professionnels",
  path: ["companyName"],
});

type CreateUserData = z.infer<typeof createUserSchema>;

// Schéma pour la mise à jour des utilisateurs (sans mot de passe)
const updateUserSchema = z.object({
  name: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  email: z.string().email("Email invalide"),
  phone: z.string().optional(),
  role: z.enum(["admin", "employee", "customer"]),
  clientType: z.enum(["particulier", "professionnel"]).default("particulier"),
  // Champs société (optionnels, requis seulement si professionnel)
  companyName: z.string().optional(),
  companyAddress: z.string().optional(),
  companySiret: z.string().optional(),
  companyVat: z.string().optional(),
  companyApe: z.string().optional(),
  companyContact: z.string().optional(),
}).refine((data) => {
  if (data.clientType === "professionnel") {
    return data.companyName && data.companyName.length > 0;
  }
  return true;
}, {
  message: "Nom de l'entreprise requis pour les clients professionnels",
  path: ["companyName"],
});

type UpdateUserData = z.infer<typeof updateUserSchema>;

export default function AdminUsers() {
  const { toast } = useToast();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const { data: users, isLoading } = useQuery({
    queryKey: ["/api/admin/users"],
  });

  const createForm = useForm<CreateUserData>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      phone: "",
      role: "customer",
      clientType: "particulier",
      companyName: "",
      companyAddress: "",
      companySiret: "",
      companyVat: "",
      companyApe: "",
      companyContact: "",
    },
  });

  const clientType = createForm.watch("clientType");

  const editForm = useForm<UpdateUserData>({
    resolver: zodResolver(updateUserSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      role: "customer",
      clientType: "particulier",
      companyName: "",
      companyAddress: "",
      companySiret: "",
      companyVat: "",
      companyApe: "",
      companyContact: "",
    },
  });

  const editClientType = editForm.watch("clientType");

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    editForm.reset({
      name: user.name,
      email: user.email,
      phone: user.phone || "",
      role: user.role as "admin" | "employee" | "customer",
      clientType: user.clientType as "particulier" | "professionnel" || "particulier",
      companyName: user.companyName || "",
      companyAddress: user.companyAddress || "",
      companySiret: user.companySiret || "",
      companyVat: user.companyVat || "",
      companyApe: user.companyApe || "",
      companyContact: user.companyContact || "",
    });
    setIsEditDialogOpen(true);
  };

  const createUserMutation = useMutation({
    mutationFn: (data: CreateUserData) => apiPost("/api/admin/users", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      setIsCreateDialogOpen(false);
      createForm.reset();
      toast({
        title: "Utilisateur créé",
        description: "Le nouvel utilisateur a été créé avec succès",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de créer l'utilisateur",
        variant: "destructive",
      });
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateUserData }) => 
      apiPut(`/api/admin/users/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      setIsEditDialogOpen(false);
      setEditingUser(null);
      editForm.reset();
      toast({
        title: "Utilisateur modifié",
        description: "L'utilisateur a été modifié avec succès",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de modifier l'utilisateur",
        variant: "destructive",
      });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: (userId: string) => apiDelete(`/api/admin/users/${userId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "Utilisateur supprimé",
        description: "L'utilisateur a été supprimé avec succès",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de supprimer l'utilisateur",
        variant: "destructive",
      });
    },
  });

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "admin": return "bg-red-500";
      case "employee": return "bg-blue-500";
      case "customer": return "bg-green-500";
      default: return "bg-gray-500";
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "admin": return Shield;
      case "employee": return Users;
      case "customer": return User;
      default: return User;
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "admin": return "Administrateur";
      case "employee": return "Employé";
      case "customer": return "Client";
      default: return role;
    }
  };

  if (isLoading) {
    return (
      <div className="pb-24 px-6 py-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-secondary rounded w-48"></div>
          <div className="space-y-4">
            {[1,2,3].map(i => (
              <div key={i} className="h-24 bg-secondary rounded-ios"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-24 px-6 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <Link href="/admin">
            <Button variant="ghost" size="sm" data-testid="button-back-admin">
              ← Retour
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Gestion Utilisateurs</h1>
            <p className="text-sm text-muted-foreground">
              {users?.length || 0} utilisateur{(users?.length || 0) > 1 ? 's' : ''} enregistré{(users?.length || 0) > 1 ? 's' : ''}
            </p>
          </div>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="ios-button" data-testid="button-create-user">
              <Plus size={16} className="mr-2" />
              Créer
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-sm mx-auto">
            <DialogHeader>
              <DialogTitle>Créer un utilisateur</DialogTitle>
            </DialogHeader>
            <form onSubmit={createForm.handleSubmit((data) => createUserMutation.mutate(data))} className="space-y-4">
              <div>
                <Label htmlFor="name">Nom complet</Label>
                <Input
                  id="name"
                  placeholder="Nom et prénom"
                  data-testid="input-create-name"
                  {...createForm.register("name")}
                />
                {createForm.formState.errors.name && (
                  <p className="text-sm text-destructive mt-1">
                    {createForm.formState.errors.name.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="utilisateur@exemple.com"
                  data-testid="input-create-email"
                  {...createForm.register("email")}
                />
                {createForm.formState.errors.email && (
                  <p className="text-sm text-destructive mt-1">
                    {createForm.formState.errors.email.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="password">Mot de passe</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  data-testid="input-create-password"
                  {...createForm.register("password")}
                />
                {createForm.formState.errors.password && (
                  <p className="text-sm text-destructive mt-1">
                    {createForm.formState.errors.password.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="phone">Téléphone (optionnel)</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="06 12 34 56 78"
                  data-testid="input-create-phone"
                  {...createForm.register("phone")}
                />
              </div>

              <div>
                <Label htmlFor="role">Rôle</Label>
                <Select 
                  value={createForm.watch("role")} 
                  onValueChange={(value) => createForm.setValue("role", value as any)}
                >
                  <SelectTrigger data-testid="select-create-role">
                    <SelectValue placeholder="Sélectionner un rôle" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="customer">Client</SelectItem>
                    <SelectItem value="employee">Employé</SelectItem>
                    <SelectItem value="admin">Administrateur</SelectItem>
                  </SelectContent>
                </Select>
                {createForm.formState.errors.role && (
                  <p className="text-sm text-destructive mt-1">
                    {createForm.formState.errors.role.message}
                  </p>
                )}
              </div>

              {createForm.watch("role") === "customer" && (
                <div>
                  <Label htmlFor="clientType">Type de client</Label>
                  <Select 
                    value={createForm.watch("clientType")} 
                    onValueChange={(value) => createForm.setValue("clientType", value as any)}
                  >
                    <SelectTrigger data-testid="select-client-type">
                      <SelectValue placeholder="Type de client" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="particulier">Particulier</SelectItem>
                      <SelectItem value="professionnel">Professionnel</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {createForm.watch("role") === "customer" && clientType === "professionnel" && (
                <>
                  <div>
                    <Label htmlFor="companyName">Nom de l'entreprise *</Label>
                    <Input
                      id="companyName"
                      placeholder="Nom de l'entreprise"
                      data-testid="input-company-name"
                      {...createForm.register("companyName")}
                    />
                    {createForm.formState.errors.companyName && (
                      <p className="text-sm text-destructive mt-1">
                        {createForm.formState.errors.companyName.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="companyAddress">Adresse de l'entreprise</Label>
                    <Input
                      id="companyAddress"
                      placeholder="Adresse complète de l'entreprise"
                      data-testid="input-company-address"
                      {...createForm.register("companyAddress")}
                    />
                  </div>

                  <div>
                    <Label htmlFor="companySiret">SIRET</Label>
                    <Input
                      id="companySiret"
                      placeholder="Numéro SIRET"
                      data-testid="input-company-siret"
                      {...createForm.register("companySiret")}
                    />
                  </div>

                  <div>
                    <Label htmlFor="companyVat">Numéro TVA</Label>
                    <Input
                      id="companyVat"
                      placeholder="Numéro de TVA intracommunautaire"
                      data-testid="input-company-vat"
                      {...createForm.register("companyVat")}
                    />
                  </div>

                  <div>
                    <Label htmlFor="companyApe">Code APE</Label>
                    <Input
                      id="companyApe"
                      placeholder="Code APE/NAF"
                      data-testid="input-company-ape"
                      {...createForm.register("companyApe")}
                    />
                  </div>

                  <div>
                    <Label htmlFor="companyContact">Contact dans l'entreprise</Label>
                    <Input
                      id="companyContact"
                      placeholder="Nom du contact principal"
                      data-testid="input-company-contact"
                      {...createForm.register("companyContact")}
                    />
                  </div>
                </>
              )}

              <div className="flex space-x-2 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => setIsCreateDialogOpen(false)}
                  data-testid="button-cancel-create"
                >
                  Annuler
                </Button>
                <Button 
                  type="submit" 
                  className="flex-1 ios-button"
                  disabled={createUserMutation.isPending}
                  data-testid="button-submit-create"
                >
                  {createUserMutation.isPending ? "Création..." : "Créer"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Modal modification utilisateur */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-sm mx-auto">
            <DialogHeader>
              <DialogTitle>Modifier l'utilisateur</DialogTitle>
            </DialogHeader>
            <form onSubmit={editForm.handleSubmit((data) => updateUserMutation.mutate({ id: editingUser?.id || "", data }))} className="space-y-4">
              <div>
                <Label htmlFor="edit-name">Nom complet</Label>
                <Input
                  id="edit-name"
                  placeholder="Nom et prénom"
                  data-testid="input-edit-name"
                  {...editForm.register("name")}
                />
                {editForm.formState.errors.name && (
                  <p className="text-sm text-destructive mt-1">
                    {editForm.formState.errors.name.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="edit-email">Email</Label>
                <Input
                  id="edit-email"
                  type="email"
                  placeholder="utilisateur@exemple.com"
                  data-testid="input-edit-email"
                  {...editForm.register("email")}
                />
                {editForm.formState.errors.email && (
                  <p className="text-sm text-destructive mt-1">
                    {editForm.formState.errors.email.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="edit-phone">Téléphone (optionnel)</Label>
                <Input
                  id="edit-phone"
                  type="tel"
                  placeholder="06 12 34 56 78"
                  data-testid="input-edit-phone"
                  {...editForm.register("phone")}
                />
              </div>

              <div>
                <Label htmlFor="edit-role">Rôle</Label>
                <Select 
                  value={editForm.watch("role")} 
                  onValueChange={(value) => editForm.setValue("role", value as any)}
                >
                  <SelectTrigger data-testid="select-edit-role">
                    <SelectValue placeholder="Sélectionner un rôle" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="customer">Client</SelectItem>
                    <SelectItem value="employee">Employé</SelectItem>
                    <SelectItem value="admin">Administrateur</SelectItem>
                  </SelectContent>
                </Select>
                {editForm.formState.errors.role && (
                  <p className="text-sm text-destructive mt-1">
                    {editForm.formState.errors.role.message}
                  </p>
                )}
              </div>

              {editForm.watch("role") === "customer" && (
                <div>
                  <Label htmlFor="edit-clientType">Type de client</Label>
                  <Select 
                    value={editForm.watch("clientType")} 
                    onValueChange={(value) => editForm.setValue("clientType", value as any)}
                  >
                    <SelectTrigger data-testid="select-edit-client-type">
                      <SelectValue placeholder="Type de client" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="particulier">Particulier</SelectItem>
                      <SelectItem value="professionnel">Professionnel</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {editForm.watch("role") === "customer" && editClientType === "professionnel" && (
                <>
                  <div>
                    <Label htmlFor="edit-companyName">Nom de l'entreprise *</Label>
                    <Input
                      id="edit-companyName"
                      placeholder="Nom de l'entreprise"
                      data-testid="input-edit-company-name"
                      {...editForm.register("companyName")}
                    />
                    {editForm.formState.errors.companyName && (
                      <p className="text-sm text-destructive mt-1">
                        {editForm.formState.errors.companyName.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="edit-companyAddress">Adresse de l'entreprise</Label>
                    <Input
                      id="edit-companyAddress"
                      placeholder="Adresse complète de l'entreprise"
                      data-testid="input-edit-company-address"
                      {...editForm.register("companyAddress")}
                    />
                  </div>

                  <div>
                    <Label htmlFor="edit-companySiret">SIRET</Label>
                    <Input
                      id="edit-companySiret"
                      placeholder="Numéro SIRET"
                      data-testid="input-edit-company-siret"
                      {...editForm.register("companySiret")}
                    />
                  </div>

                  <div>
                    <Label htmlFor="edit-companyVat">Numéro TVA</Label>
                    <Input
                      id="edit-companyVat"
                      placeholder="Numéro de TVA intracommunautaire"
                      data-testid="input-edit-company-vat"
                      {...editForm.register("companyVat")}
                    />
                  </div>

                  <div>
                    <Label htmlFor="edit-companyApe">Code APE</Label>
                    <Input
                      id="edit-companyApe"
                      placeholder="Code APE/NAF"
                      data-testid="input-edit-company-ape"
                      {...editForm.register("companyApe")}
                    />
                  </div>

                  <div>
                    <Label htmlFor="edit-companyContact">Contact dans l'entreprise</Label>
                    <Input
                      id="edit-companyContact"
                      placeholder="Nom du contact principal"
                      data-testid="input-edit-company-contact"
                      {...editForm.register("companyContact")}
                    />
                  </div>
                </>
              )}

              <div className="flex space-x-2 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  className="flex-1 rounded-lg font-medium border-border/20 hover:bg-secondary/50 hover:border-border/40 transition-all duration-200 active:scale-95 shadow-sm hover:shadow-md"
                  onClick={() => setIsEditDialogOpen(false)}
                  data-testid="button-cancel-edit"
                >
                  Annuler
                </Button>
                <Button 
                  type="submit" 
                  className="flex-1 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80 rounded-lg font-medium shadow-md hover:shadow-lg transition-all duration-200 active:scale-95"
                  disabled={updateUserMutation.isPending}
                  data-testid="button-submit-edit"
                >
                  {updateUserMutation.isPending ? "Modification..." : "Modifier"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Users List */}
      <div className="space-y-4">
        {users?.map((user) => {
          const RoleIcon = getRoleIcon(user.role);
          
          return (
            <Card key={user.id} className="ios-card" data-testid={`card-user-${user.id}`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3 flex-1">
                    <div className={`w-10 h-10 ${getRoleBadgeColor(user.role)} rounded-full flex items-center justify-center`}>
                      <RoleIcon size={20} className="text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium" data-testid={`user-name-${user.id}`}>
                        {user.name}
                      </h3>
                      <p className="text-sm text-muted-foreground" data-testid={`user-email-${user.id}`}>
                        {user.email}
                      </p>
                      {user.phone && (
                        <p className="text-xs text-muted-foreground" data-testid={`user-phone-${user.id}`}>
                          {user.phone}
                        </p>
                      )}
                      {user.role === "customer" && user.clientType === "professionnel" && user.companyName && (
                        <div className="mt-2 p-2 bg-gray-50 dark:bg-gray-800 rounded-md">
                          <p className="text-xs font-medium text-blue-600 dark:text-blue-400">
                            🏢 {user.companyName}
                          </p>
                          {user.companySiret && (
                            <p className="text-xs text-muted-foreground">
                              SIRET: {user.companySiret}
                            </p>
                          )}
                          {user.companyContact && (
                            <p className="text-xs text-muted-foreground">
                              Contact: {user.companyContact}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Badge 
                      className={`${getRoleBadgeColor(user.role)} text-white`}
                      data-testid={`user-role-${user.id}`}
                    >
                      {getRoleLabel(user.role)}
                    </Badge>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-primary/50 hover:border-primary hover:bg-primary/10 text-primary hover:text-primary rounded-lg font-medium shadow-sm hover:shadow-md transition-all duration-200 active:scale-95"
                      onClick={() => handleEditUser(user)}
                      data-testid={`button-edit-user-${user.id}`}
                    >
                      <Edit3 size={16} />
                    </Button>
                    
                    {user.role !== "admin" && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-destructive/50 hover:border-destructive hover:bg-destructive/10 text-destructive hover:text-destructive"
                        onClick={() => {
                          if (confirm(`Êtes-vous sûr de vouloir supprimer l'utilisateur ${user.name} ?`)) {
                            deleteUserMutation.mutate(user.id);
                          }
                        }}
                        data-testid={`button-delete-user-${user.id}`}
                      >
                        <Trash2 size={16} />
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
        
        {users?.length === 0 && (
          <Card className="ios-card">
            <CardContent className="p-8 text-center">
              <Users size={48} className="mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">Aucun utilisateur</h3>
              <p className="text-muted-foreground mb-4">
                Créez le premier utilisateur pour commencer
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}