import { useState } from "react";
import { AuthService } from "@/lib/auth";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  User, 
  Calendar, 
  Activity, 
  Clock, 
  FileText, 
  CheckCircle, 
  AlertCircle,
  Eye,
  Users
} from "lucide-react";
import { CacheManager } from "@/components/cache-manager";

interface AuditLog {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  oldValues: any;
  newValues: any;
  createdAt: string;
}

interface BookingAssignment {
  id: string;
  bookingId: string;
  employeeId: string;
  assignedBy: string;
  assignedAt: string;
  notes?: string;
}

export default function AdminProfile() {
  const user = AuthService.getUser();
  const isAdmin = user?.role === "admin";
  const isEmployee = user?.role === "employee";
  const [selectedTab, setSelectedTab] = useState("profile");

  // Temporairement désactivé - endpoints pas encore implémentés
  const auditLogs: any[] = [];
  const auditLoading = false;
  const assignments: any[] = [];
  const assignmentsLoading = false;
  const employees: any[] = [];
  const employeesLoading = false;

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case "create":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "update":
        return <FileText className="w-4 h-4 text-blue-500" />;
      case "status_change":
        return <Activity className="w-4 h-4 text-yellow-500" />;
      case "delete":
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Eye className="w-4 h-4 text-gray-500" />;
    }
  };

  const getActionLabel = (action: string) => {
    switch (action) {
      case "create":
        return "Création";
      case "update":
        return "Modification";
      case "status_change":
        return "Changement de statut";
      case "delete":
        return "Suppression";
      default:
        return action;
    }
  };

  const getEntityLabel = (entityType: string) => {
    switch (entityType) {
      case "booking":
        return "Réservation";
      case "quote":
        return "Devis";
      case "invoice":
        return "Facture";
      case "user":
        return "Utilisateur";
      default:
        return entityType;
    }
  };

  if (!isAdmin && !isEmployee) {
    return (
      <div className="pb-24 px-6 py-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Accès non autorisé</h3>
              <p className="text-muted-foreground">
                Cette page est réservée aux administrateurs et employés.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="pb-24">
      <div className="px-6 py-4 border-b border-border">
        <h2 className="text-xl font-bold" data-testid="admin-profile-title">
          Profil Professionnel
        </h2>
        <p className="text-sm text-muted-foreground">
          {isAdmin ? "Interface administrateur" : "Interface employé"}
        </p>
      </div>

      <div className="px-6 py-6">
        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList className={`grid w-full ${isAdmin ? 'grid-cols-5' : isEmployee ? 'grid-cols-4' : 'grid-cols-3'}`}>
            <TabsTrigger value="profile">Profil</TabsTrigger>
            <TabsTrigger value="activity">Activité</TabsTrigger>
            <TabsTrigger value="cache">Cache</TabsTrigger>
            {isEmployee && <TabsTrigger value="assignments">Assignations</TabsTrigger>}
            {isAdmin && <TabsTrigger value="employees">Équipe</TabsTrigger>}
          </TabsList>

          <TabsContent value="profile" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Informations Personnelles
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Nom</label>
                  <p className="text-lg">{user?.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Email</label>
                  <p className="text-lg">{user?.email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Rôle</label>
                  <div className="mt-1">
                    <Badge variant={isAdmin ? "destructive" : "default"}>
                      {isAdmin ? "Administrateur" : "Employé"}
                    </Badge>
                  </div>
                </div>
                {user?.phone && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Téléphone</label>
                    <p className="text-lg">{user.phone}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="cache" className="space-y-6">
            <CacheManager />
          </TabsContent>

          <TabsContent value="activity" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  Journal d'Activité
                </CardTitle>
              </CardHeader>
              <CardContent>
                {auditLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-16 bg-secondary rounded-ios animate-pulse"></div>
                    ))}
                  </div>
                ) : auditLogs && auditLogs.length > 0 ? (
                  <div className="space-y-3">
                    {auditLogs.map((log: AuditLog) => (
                      <div
                        key={log.id}
                        className="flex items-start gap-3 p-3 bg-secondary rounded-ios"
                      >
                        {getActionIcon(log.action)}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium">
                              {getActionLabel(log.action)}
                            </span>
                            <Badge variant="outline" className="text-xs">
                              {getEntityLabel(log.entityType)}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            ID: {log.entityId}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Clock className="w-3 h-3" />
                            {formatDate(log.createdAt)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Activity className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">Aucune activité récente</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {isEmployee && (
            <TabsContent value="assignments" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    Mes Assignations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {assignmentsLoading ? (
                    <div className="space-y-3">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="h-20 bg-secondary rounded-ios animate-pulse"></div>
                      ))}
                    </div>
                  ) : assignments && assignments.length > 0 ? (
                    <div className="space-y-3">
                      {assignments.map((assignment: BookingAssignment) => (
                        <div
                          key={assignment.id}
                          className="p-4 bg-secondary rounded-ios"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium">
                              Réservation {assignment.bookingId.slice(-8)}
                            </span>
                            <Badge variant="default">Assigné</Badge>
                          </div>
                          {assignment.notes && (
                            <p className="text-sm text-muted-foreground mb-2">
                              {assignment.notes}
                            </p>
                          )}
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Clock className="w-3 h-3" />
                            Assigné le {formatDate(assignment.assignedAt)}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">Aucune assignation active</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {isAdmin && (
            <TabsContent value="employees" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Gestion de l'Équipe
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {employeesLoading ? (
                    <div className="space-y-3">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="h-16 bg-secondary rounded-ios animate-pulse"></div>
                      ))}
                    </div>
                  ) : employees && employees.length > 0 ? (
                    <div className="space-y-3">
                      {employees.map((employee: any) => (
                        <div
                          key={employee.id}
                          className="flex items-center justify-between p-4 bg-secondary rounded-ios"
                        >
                          <div>
                            <h4 className="font-medium">{employee.name}</h4>
                            <p className="text-sm text-muted-foreground">{employee.email}</p>
                          </div>
                          <Badge variant="default">Employé</Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">Aucun employé dans l'équipe</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
}