import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPost } from "@/lib/api";
import { Bell, CheckCircle, FileText, User, Wrench } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Notification } from "@shared/schema";

export default function Notifications() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: notifications, isLoading } = useQuery({
    queryKey: ["/api/notifications"],
  });

  const markAsReadMutation = useMutation({
    mutationFn: (id: string) => apiPost(`/api/notifications/${id}/read`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de marquer la notification comme lue",
        variant: "destructive",
      });
    },
  });

  const getIcon = (type: string) => {
    switch (type) {
      case "booking":
        return User;
      case "quote":
        return FileText;
      case "invoice":
        return CheckCircle;
      case "work_progress":
        return Wrench;
      default:
        return Bell;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "booking":
        return "text-blue-400";
      case "quote":
        return "text-green-400";
      case "invoice":
        return "text-yellow-400";
      case "work_progress":
        return "text-purple-400";
      default:
        return "text-gray-400";
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInMinutes < 60) {
      return `il y a ${diffInMinutes}min`;
    } else if (diffInHours < 24) {
      return `il y a ${diffInHours}h`;
    } else if (diffInDays < 7) {
      return `il y a ${diffInDays}j`;
    } else {
      return date.toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "short",
      });
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      markAsReadMutation.mutate(notification.id);
    }
  };

  if (isLoading) {
    return (
      <div className="pb-24 px-6 py-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-secondary rounded w-48"></div>
          {[1,2,3,4].map(i => (
            <div key={i} className="h-20 bg-secondary rounded-ios"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="pb-24">
      <div className="px-6 py-4 border-b border-border">
        <h2 className="text-xl font-bold" data-testid="notifications-title">Notifications</h2>
        <p className="text-sm text-muted-foreground">Suivez l'évolution de vos demandes</p>
      </div>

      <div className="px-6 py-6 space-y-3">
        {notifications?.map((notification) => {
          const IconComponent = getIcon(notification.type);
          return (
            <div
              key={notification.id}
              className={`ios-card cursor-pointer transition-colors ${
                !notification.read ? "border-l-4 border-l-primary bg-primary/5" : ""
              }`}
              onClick={() => handleNotificationClick(notification)}
              data-testid={`notification-${notification.id}`}
            >
              <div className="flex items-start space-x-3">
                <div className={`p-2 rounded-full bg-secondary ${getTypeColor(notification.type)}`}>
                  <IconComponent size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-sm" data-testid={`notification-title-${notification.id}`}>
                      {notification.title}
                    </p>
                    <span className="text-xs text-muted-foreground">
                      {formatDate(notification.createdAt!.toString())}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1" data-testid={`notification-message-${notification.id}`}>
                    {notification.message}
                  </p>
                  {!notification.read && (
                    <div className="flex items-center mt-2">
                      <div className="w-2 h-2 bg-primary rounded-full mr-2"></div>
                      <span className="text-xs text-primary">Nouveau</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {!notifications?.length && (
          <div className="ios-card text-center py-8">
            <Bell className="text-muted-foreground mx-auto mb-4" size={48} />
            <p className="text-muted-foreground">Aucune notification</p>
            <p className="text-sm text-muted-foreground mt-1">
              Vous recevrez des notifications pour vos réservations et devis
            </p>
          </div>
        )}
      </div>
    </div>
  );
}