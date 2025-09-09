import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, User, Clock, MapPin, Car, UserCheck, Plane } from "lucide-react";
import type { Booking, User as UserType, LeaveRequest } from "@shared/schema";

export default function AdminPlanning() {
  const [selectedEmployee, setSelectedEmployee] = useState<string>("all");
  const [selectedWeek, setSelectedWeek] = useState<string>(getCurrentWeek());

  // Récupérer les employés
  const { data: employees } = useQuery<UserType[]>({
    queryKey: ["/api/admin/users"],
    select: (users) => users?.filter(user => user.role === 'employee') || [],
  });

  // Récupérer les réservations avec employés assignés
  const { data: bookings } = useQuery<Booking[]>({
    queryKey: ["/api/admin/bookings"],
  });

  // Récupérer les congés
  const { data: leaveRequests } = useQuery<LeaveRequest[]>({
    queryKey: ["/api/admin/leave-requests"],
  });

  // Filtrer les données selon l'employé sélectionné
  const filteredBookings = bookings?.filter(booking => 
    selectedEmployee === "all" ? booking.assignedEmployee : booking.assignedEmployee === selectedEmployee
  ) || [];

  const filteredLeaveRequests = leaveRequests?.filter(leave =>
    selectedEmployee === "all" ? true : leave.employeeId === selectedEmployee
  ) || [];

  const getWeekDates = (weekString: string) => {
    const [year, week] = weekString.split('-W').map(Number);
    const date = new Date(year, 0, 1 + (week - 1) * 7);
    const dayOfWeek = date.getDay();
    const startDate = new Date(date.getTime() - (dayOfWeek - 1) * 24 * 60 * 60 * 1000);
    
    const weekDates = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
      weekDates.push(day);
    }
    return weekDates;
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("fr-FR", {
      weekday: "short",
      day: "numeric",
      month: "short",
    });
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getEmployeeName = (employeeId: string) => {
    return employees?.find(emp => emp.id === employeeId)?.name || employeeId;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "text-green-400 bg-green-500/20 border-green-500/30";
      case "pending":
        return "text-yellow-400 bg-yellow-500/20 border-yellow-500/30";
      case "cancelled":
        return "text-red-400 bg-red-500/20 border-red-500/30";
      case "completed":
        return "text-blue-400 bg-blue-500/20 border-blue-500/30";
      default:
        return "text-gray-400 bg-gray-500/20 border-gray-500/30";
    }
  };

  const weekDates = getWeekDates(selectedWeek);

  return (
    <div className="pb-24">
      <div className="px-6 py-4 border-b border-border">
        <h2 className="text-xl font-bold" data-testid="admin-planning-title">Planning des Employés</h2>
        <p className="text-sm text-muted-foreground">Visualisez le planning et les assignations</p>
      </div>

      {/* Filtres */}
      <div className="px-6 py-4 space-y-4">
        <div className="flex gap-4">
          <div className="flex-1">
            <label className="text-sm font-medium mb-2 block">Employé</label>
            <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
              <SelectTrigger data-testid="select-employee-filter">
                <SelectValue placeholder="Tous les employés" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les employés</SelectItem>
                {employees?.map((employee) => (
                  <SelectItem key={employee.id} value={employee.id}>
                    {employee.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex-1">
            <label className="text-sm font-medium mb-2 block">Semaine</label>
            <input
              type="week"
              value={selectedWeek}
              onChange={(e) => setSelectedWeek(e.target.value)}
              className="w-full p-2 border border-border rounded-lg bg-card text-card-foreground"
              data-testid="input-week-filter"
            />
          </div>
        </div>
      </div>

      {/* Vue planning */}
      <div className="px-6 space-y-6">
        {/* Vue par jour de la semaine */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7 gap-4">
          {weekDates.map((date, index) => {
            const dayBookings = filteredBookings.filter(booking => {
              if (!booking.startDateTime) return false;
              const bookingDate = new Date(booking.startDateTime);
              return bookingDate.toDateString() === date.toDateString();
            });

            const dayLeaves = filteredLeaveRequests.filter(leave => {
              const leaveStart = new Date(leave.startDate);
              const leaveEnd = new Date(leave.endDate);
              return date >= leaveStart && date <= leaveEnd && leave.status === 'approved';
            });

            return (
              <Card key={index} className="min-h-[200px]" data-testid={`planning-day-${index}`}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">
                    {formatDate(date)}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {/* Congés */}
                  {dayLeaves.map((leave) => (
                    <div
                      key={leave.id}
                      className="p-2 rounded-lg bg-orange-500/20 border border-orange-500/30"
                      data-testid={`leave-${leave.id}`}
                    >
                      <div className="flex items-center space-x-2">
                        <Plane className="w-3 h-3 text-orange-400" />
                        <span className="text-xs font-medium text-orange-400">
                          Congé
                        </span>
                      </div>
                      <div className="text-xs text-orange-300 mt-1">
                        {getEmployeeName(leave.employeeId)}
                      </div>
                    </div>
                  ))}

                  {/* Réservations */}
                  {dayBookings.map((booking) => (
                    <div
                      key={booking.id}
                      className={`p-2 rounded-lg border ${getStatusColor(booking.status!)}`}
                      data-testid={`planning-booking-${booking.id}`}
                    >
                      <div className="flex items-center space-x-2 mb-1">
                        <Clock className="w-3 h-3" />
                        <span className="text-xs font-medium">
                          {booking.startDateTime && formatTime(booking.startDateTime)}
                        </span>
                      </div>
                      <div className="text-xs opacity-80 space-y-1">
                        <div className="flex items-center space-x-1">
                          <User className="w-3 h-3" />
                          <span>{booking.serviceId}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Car className="w-3 h-3" />
                          <span>{booking.vehicleBrand}</span>
                        </div>
                        {booking.assignedEmployee && (
                          <div className="flex items-center space-x-1">
                            <UserCheck className="w-3 h-3" />
                            <span>{getEmployeeName(booking.assignedEmployee)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}

                  {dayBookings.length === 0 && dayLeaves.length === 0 && (
                    <div className="text-xs text-muted-foreground text-center py-4">
                      Aucune activité
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Statistiques */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Statistiques de la semaine</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {filteredBookings.filter(b => b.status === 'confirmed').length}
              </div>
              <div className="text-sm text-muted-foreground">Confirmées</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-400">
                {filteredBookings.filter(b => b.status === 'pending').length}
              </div>
              <div className="text-sm text-muted-foreground">En attente</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400">
                {filteredBookings.filter(b => b.status === 'completed').length}
              </div>
              <div className="text-sm text-muted-foreground">Terminées</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-400">
                {filteredLeaveRequests.filter(l => l.status === 'approved').length}
              </div>
              <div className="text-sm text-muted-foreground">Congés</div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function getCurrentWeek(): string {
  const now = new Date();
  const year = now.getFullYear();
  const start = new Date(year, 0, 1);
  const week = Math.ceil(((now.getTime() - start.getTime()) / 86400000 + start.getDay() + 1) / 7);
  return `${year}-W${week.toString().padStart(2, '0')}`;
}