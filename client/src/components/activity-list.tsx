import { Activity } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, User } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

interface ActivityListProps {
  activities: Activity[];
}

export function ActivityList({ activities }: ActivityListProps) {
  // Helper function to get badge color based on activity type
  const getBadgeVariant = (type: string) => {
    switch (type) {
      case "project_created":
      case "project_updated":
        return "bg-blue-100 text-blue-800";
      case "quote_created":
      case "quote_updated":
      case "quote_approved":
        return "bg-green-100 text-green-800";
      case "client_created":
      case "client_updated":
        return "bg-purple-100 text-purple-800";
      case "service_order_created":
      case "service_order_updated":
        return "bg-yellow-100 text-yellow-800";
      case "project_completed":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };
  
  // Helper function to get activity type label
  const getActivityTypeLabel = (type: string) => {
    switch (type) {
      case "project_created":
        return "Nuevo Proyecto";
      case "project_updated":
        return "Actualización de Proyecto";
      case "quote_created":
        return "Presupuesto Creado";
      case "quote_sent":
        return "Presupuesto Enviado";
      case "quote_approved":
        return "Presupuesto Aprobado";
      case "client_created":
        return "Nuevo Cliente";
      case "client_updated":
        return "Cliente Actualizado";
      case "service_order_created":
        return "Orden de Servicio Creada";
      case "service_order_updated":
        return "Orden de Servicio Actualizada";
      case "project_completed":
        return "Proyecto Finalizado";
      case "user_login":
        return "Inicio de Sesión";
      case "user_logout":
        return "Cierre de Sesión";
      case "user_registered":
        return "Registro de Usuario";
      default:
        return type.replace(/_/g, " ");
    }
  };
  
  // Helper function to format relative time
  const formatRelativeTime = (date: Date) => {
    return formatDistanceToNow(new Date(date), { addSuffix: true, locale: es });
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg leading-6 font-medium text-gray-900">
          Actividad Reciente
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="divide-y divide-gray-200">
          {activities.map((activity) => (
            <li key={activity.id}>
              <div className="px-1 py-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-primary truncate">
                    {activity.description}
                  </p>
                  <div className="ml-2 flex-shrink-0">
                    <Badge className={getBadgeVariant(activity.type)}>
                      {getActivityTypeLabel(activity.type)}
                    </Badge>
                  </div>
                </div>
                <div className="mt-2 sm:flex sm:justify-between">
                  <div className="sm:flex">
                    <p className="flex items-center text-sm text-gray-500">
                      <User className="mr-1.5 h-4 w-4 text-gray-400" />
                      {activity.userId ? `Usuario ID: ${activity.userId}` : "Sistema"}
                    </p>
                  </div>
                  <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                    <Clock className="mr-1.5 h-4 w-4 text-gray-400" />
                    <p>{formatRelativeTime(activity.createdAt)}</p>
                  </div>
                </div>
              </div>
            </li>
          ))}
          
          {activities.length === 0 && (
            <li className="py-6 text-center text-gray-500">
              No hay actividades recientes
            </li>
          )}
        </ul>
      </CardContent>
    </Card>
  );
}
