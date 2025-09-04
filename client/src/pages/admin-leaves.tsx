import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plane, CheckCircle, XCircle, Clock, User, Calendar, MessageSquare } from "lucide-react";
import { Link } from "wouter";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface LeaveRequest {
  id: string;
  employeeId: string;
  employeeName?: string;
  startDate: string;
  endDate: string;
  reason: string;
  status: "pending" | "approved" | "rejected";
  notes?: string;
  approvedBy?: string;
  approvedAt?: string;
  createdAt: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

export default function AdminLeaves() {
  const { toast } = useToast();
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null);
  const [actionNotes, setActionNotes] = useState("");
  const [isActionDialogOpen, setIsActionDialogOpen] = useState(false);
  const [actionType, setActionType] = useState<"approve" | "reject" | null>(null);

  // Fetch all leave requests
  const { data: leaveRequests = [], isLoading } = useQuery<LeaveRequest[]>({
    queryKey: ["/api/admin/leave-requests"],
  });

  // Fetch users to map employee names
  const { data: users = [] } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
  });

  // Update leave request status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status, notes }: { id: string; status: string; notes?: string }) => {
      const response = await fetch(`/api/admin/leave-requests/${id}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ status, notes }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Erreur lors de la mise à jour");
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/leave-requests"] });
      toast({ 
        title: "Succès", 
        description: `Demande de congés ${actionType === "approve" ? "approuvée" : "refusée"} avec succès` 
      });
      setIsActionDialogOpen(false);
      setSelectedRequest(null);
      setActionNotes("");
      setActionType(null);
    },
    onError: (error: Error) => {
      toast({ 
        title: "Erreur", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  const getEmployeeName = (employeeId: string) => {
    const employee = users.find(user => user.id === employeeId);
    return employee?.name || "Employé inconnu";
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "approved":
        return "bg-green-100 text-green-800 border-green-200";
      case "rejected":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="w-4 h-4" />;
      case "approved":
        return <CheckCircle className="w-4 h-4" />;
      case "rejected":
        return <XCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "pending":
        return "En attente";
      case "approved":
        return "Approuvé";
      case "rejected":
        return "Refusé";
      default:
        return status;
    }
  };

  const handleAction = (request: LeaveRequest, action: "approve" | "reject") => {
    setSelectedRequest(request);
    setActionType(action);
    setIsActionDialogOpen(true);
  };

  const submitAction = () => {
    if (!selectedRequest || !actionType) return;
    
    updateStatusMutation.mutate({
      id: selectedRequest.id,
      status: actionType === "approve" ? "approved" : "rejected",
      notes: actionNotes,
    });
  };

  const calculateDays = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  };

  if (isLoading) {
    return (
      <div className="pb-24 px-6 py-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-secondary rounded w-64"></div>
          <div className="space-y-4">
            {[1,2,3].map(i => (
              <div key={i} className="h-32 bg-secondary rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const pendingRequests = leaveRequests.filter(req => req.status === "pending");
  const processedRequests = leaveRequests.filter(req => req.status !== "pending");

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
            <h1 className="text-2xl font-bold">Gestion des Congés</h1>
            <p className="text-sm text-muted-foreground">
              {pendingRequests.length} demande{pendingRequests.length > 1 ? 's' : ''} en attente
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Plane className="w-5 h-5 text-primary" />
          <span className="text-sm font-medium">
            {leaveRequests.length} demandes au total
          </span>
        </div>
      </div>

      {/* Pending Requests */}
      {pendingRequests.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4 flex items-center">
            <Clock className="w-5 h-5 mr-2 text-yellow-600" />
            Demandes en attente
          </h2>
          
          <div className="space-y-4">
            {pendingRequests.map((request) => (
              <Card key={request.id} className="border-l-4 border-l-yellow-500" data-testid={`leave-request-${request.id}`}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="flex items-center space-x-2">
                          <User className="w-4 h-4 text-muted-foreground" />
                          <span className="font-medium">{getEmployeeName(request.employeeId)}</span>
                        </div>
                        <Badge variant="outline" className={getStatusColor(request.status)}>
                          {getStatusIcon(request.status)}
                          <span className="ml-1">{getStatusText(request.status)}</span>
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div className="flex items-center space-x-2">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm">
                            Du {format(new Date(request.startDate), "dd/MM/yyyy", { locale: fr })} 
                            au {format(new Date(request.endDate), "dd/MM/yyyy", { locale: fr })}
                          </span>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          <strong>{calculateDays(request.startDate, request.endDate)} jour{calculateDays(request.startDate, request.endDate) > 1 ? 's' : ''}</strong>
                        </div>
                      </div>
                      
                      <div className="mb-4">
                        <div className="flex items-start space-x-2">
                          <MessageSquare className="w-4 h-4 text-muted-foreground mt-0.5" />
                          <div>
                            <span className="text-sm font-medium">Motif:</span>
                            <p className="text-sm text-muted-foreground">{request.reason}</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-xs text-muted-foreground">
                        Demandé le {format(new Date(request.createdAt), "dd/MM/yyyy à HH:mm", { locale: fr })}
                      </div>
                    </div>
                    
                    <div className="flex space-x-2 ml-4">
                      <Button
                        size="sm"
                        className="bg-green-600 hover:bg-green-700 text-white"
                        onClick={() => handleAction(request, "approve")}
                        data-testid={`button-approve-${request.id}`}
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Approuver
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleAction(request, "reject")}
                        data-testid={`button-reject-${request.id}`}
                      >
                        <XCircle className="w-4 h-4 mr-1" />
                        Refuser
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Processed Requests */}
      {processedRequests.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-4 flex items-center">
            <CheckCircle className="w-5 h-5 mr-2 text-green-600" />
            Demandes traitées
          </h2>
          
          <div className="space-y-4">
            {processedRequests.map((request) => (
              <Card key={request.id} className={`border-l-4 ${request.status === 'approved' ? 'border-l-green-500' : 'border-l-red-500'}`} data-testid={`processed-request-${request.id}`}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="flex items-center space-x-2">
                          <User className="w-4 h-4 text-muted-foreground" />
                          <span className="font-medium">{getEmployeeName(request.employeeId)}</span>
                        </div>
                        <Badge variant="outline" className={getStatusColor(request.status)}>
                          {getStatusIcon(request.status)}
                          <span className="ml-1">{getStatusText(request.status)}</span>
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div className="flex items-center space-x-2">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm">
                            Du {format(new Date(request.startDate), "dd/MM/yyyy", { locale: fr })} 
                            au {format(new Date(request.endDate), "dd/MM/yyyy", { locale: fr })}
                          </span>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          <strong>{calculateDays(request.startDate, request.endDate)} jour{calculateDays(request.startDate, request.endDate) > 1 ? 's' : ''}</strong>
                        </div>
                      </div>
                      
                      <div className="mb-4">
                        <div className="flex items-start space-x-2">
                          <MessageSquare className="w-4 h-4 text-muted-foreground mt-0.5" />
                          <div>
                            <span className="text-sm font-medium">Motif:</span>
                            <p className="text-sm text-muted-foreground">{request.reason}</p>
                          </div>
                        </div>
                      </div>
                      
                      {request.notes && (
                        <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <span className="text-sm font-medium">Notes administratives:</span>
                          <p className="text-sm text-muted-foreground mt-1">{request.notes}</p>
                        </div>
                      )}
                      
                      <div className="text-xs text-muted-foreground">
                        {request.status === 'approved' ? 'Approuvé' : 'Refusé'} le{' '}
                        {request.approvedAt && format(new Date(request.approvedAt), "dd/MM/yyyy à HH:mm", { locale: fr })}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* No requests */}
      {leaveRequests.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <Plane className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">Aucune demande de congés</h3>
            <p className="text-muted-foreground">
              Les demandes de congés des employés apparaîtront ici
            </p>
          </CardContent>
        </Card>
      )}

      {/* Action Dialog */}
      <Dialog open={isActionDialogOpen} onOpenChange={setIsActionDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {actionType === "approve" ? "Approuver" : "Refuser"} la demande
            </DialogTitle>
          </DialogHeader>
          
          {selectedRequest && (
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <p className="font-medium">{getEmployeeName(selectedRequest.employeeId)}</p>
                <p className="text-sm text-muted-foreground">
                  Du {format(new Date(selectedRequest.startDate), "dd/MM/yyyy", { locale: fr })} 
                  au {format(new Date(selectedRequest.endDate), "dd/MM/yyyy", { locale: fr })}
                </p>
                <p className="text-sm text-muted-foreground mt-2">{selectedRequest.reason}</p>
              </div>
              
              <div>
                <Label htmlFor="notes">Notes (optionnel)</Label>
                <Textarea
                  id="notes"
                  placeholder="Ajoutez des notes sur cette décision..."
                  value={actionNotes}
                  onChange={(e) => setActionNotes(e.target.value)}
                  className="mt-1"
                />
              </div>
              
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setIsActionDialogOpen(false)}
                >
                  Annuler
                </Button>
                <Button
                  className={`flex-1 ${actionType === "approve" ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"}`}
                  onClick={submitAction}
                  disabled={updateStatusMutation.isPending}
                >
                  {updateStatusMutation.isPending ? "..." : (actionType === "approve" ? "Approuver" : "Refuser")}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}