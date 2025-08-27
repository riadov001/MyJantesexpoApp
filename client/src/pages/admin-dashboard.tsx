import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { BarChart3, Users, FileText, DollarSign, Clock, AlertCircle } from "lucide-react";

interface DashboardStats {
  totalBookings: number;
  pendingBookings: number;
  totalQuotes: number;
  pendingQuotes: number;
  totalInvoices: number;
  unpaidInvoices: number;
  totalRevenue: number;
}

export default function AdminDashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["/api/admin/dashboard"],
    queryFn: () => apiGet<DashboardStats>("/api/admin/dashboard"),
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const statCards = [
    {
      title: "Réservations",
      value: stats?.totalBookings || 0,
      pending: stats?.pendingBookings || 0,
      icon: Users,
      color: "bg-blue-500",
      testId: "stat-bookings"
    },
    {
      title: "Devis",
      value: stats?.totalQuotes || 0,
      pending: stats?.pendingQuotes || 0,
      icon: FileText,
      color: "bg-green-500",
      testId: "stat-quotes"
    },
    {
      title: "Factures",
      value: stats?.totalInvoices || 0,
      pending: stats?.unpaidInvoices || 0,
      icon: BarChart3,
      color: "bg-yellow-500",
      testId: "stat-invoices"
    },
    {
      title: "Chiffre d'affaires",
      value: formatCurrency(stats?.totalRevenue || 0),
      pending: null,
      icon: DollarSign,
      color: "bg-red-500",
      testId: "stat-revenue"
    }
  ];

  if (isLoading) {
    return (
      <div className="pb-24 px-6 py-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-secondary rounded w-48"></div>
          <div className="grid grid-cols-2 gap-4">
            {[1,2,3,4].map(i => (
              <div key={i} className="h-32 bg-secondary rounded-ios"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-24">
      <div className="px-6 py-4 border-b border-border">
        <h2 className="text-xl font-bold" data-testid="admin-dashboard-title">Dashboard Admin</h2>
        <p className="text-sm text-muted-foreground">Vue d'ensemble de votre activité</p>
      </div>

      <div className="px-6 py-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-4">
          {statCards.map((stat) => (
            <Card 
              key={stat.title} 
              className="ios-card p-4"
              data-testid={stat.testId}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.title}</p>
                  <p className="text-2xl font-bold" data-testid={`${stat.testId}-value`}>
                    {stat.value}
                  </p>
                  {stat.pending !== null && stat.pending > 0 && (
                    <div className="flex items-center mt-2">
                      <Clock className="w-3 h-3 text-yellow-400 mr-1" />
                      <span className="text-xs text-yellow-400">
                        {stat.pending} en attente
                      </span>
                    </div>
                  )}
                </div>
                <div className={`w-12 h-12 ${stat.color} rounded-ios flex items-center justify-center`}>
                  <stat.icon className="text-white" size={24} />
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="ios-card">
          <h3 className="font-semibold mb-4">Actions rapides</h3>
          <div className="space-y-3">
            <button 
              className="w-full flex items-center justify-between p-3 hover:bg-secondary rounded-ios transition-colors"
              data-testid="button-manage-bookings"
            >
              <div className="flex items-center space-x-3">
                <Users className="text-primary" size={20} />
                <span>Gérer les réservations</span>
              </div>
              {stats?.pendingBookings! > 0 && (
                <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                  {stats?.pendingBookings}
                </span>
              )}
            </button>
            
            <button 
              className="w-full flex items-center justify-between p-3 hover:bg-secondary rounded-ios transition-colors"
              data-testid="button-manage-quotes"
            >
              <div className="flex items-center space-x-3">
                <FileText className="text-primary" size={20} />
                <span>Valider les devis</span>
              </div>
              {stats?.pendingQuotes! > 0 && (
                <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                  {stats?.pendingQuotes}
                </span>
              )}
            </button>
            
            <button 
              className="w-full flex items-center justify-between p-3 hover:bg-secondary rounded-ios transition-colors"
              data-testid="button-manage-invoices"
            >
              <div className="flex items-center space-x-3">
                <BarChart3 className="text-primary" size={20} />
                <span>Gérer les factures</span>
              </div>
              {stats?.unpaidInvoices! > 0 && (
                <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                  {stats?.unpaidInvoices}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Activity Summary */}
        {(stats?.pendingBookings! > 0 || stats?.pendingQuotes! > 0 || stats?.unpaidInvoices! > 0) && (
          <div className="ios-card border-l-4 border-l-yellow-500">
            <div className="flex items-center space-x-2 mb-3">
              <AlertCircle className="text-yellow-500" size={20} />
              <h3 className="font-semibold">Actions requises</h3>
            </div>
            <div className="space-y-2">
              {stats?.pendingBookings! > 0 && (
                <p className="text-sm text-muted-foreground">
                  • {stats?.pendingBookings} réservation{stats?.pendingBookings! > 1 ? 's' : ''} à traiter
                </p>
              )}
              {stats?.pendingQuotes! > 0 && (
                <p className="text-sm text-muted-foreground">
                  • {stats?.pendingQuotes} devis à chiffrer
                </p>
              )}
              {stats?.unpaidInvoices! > 0 && (
                <p className="text-sm text-muted-foreground">
                  • {stats?.unpaidInvoices} facture{stats?.unpaidInvoices! > 1 ? 's' : ''} impayée{stats?.unpaidInvoices! > 1 ? 's' : ''}
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}