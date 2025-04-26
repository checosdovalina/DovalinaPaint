import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Project, Client, Staff } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MapPin, Calendar, Clock } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import worker1 from "@/assets/images/worker1.svg";
import worker2 from "@/assets/images/worker2.svg";
import worker3 from "@/assets/images/worker3.svg";
import worker4 from "@/assets/images/worker4.svg";
import homeProject1 from "@/assets/images/home-project1.svg";
import homeProject2 from "@/assets/images/home-project2.svg";
import homeProject3 from "@/assets/images/home-project3.svg";
import commercialProject1 from "@/assets/images/commercial-project1.svg";
import commercialProject2 from "@/assets/images/commercial-project2.svg";
import commercialProject3 from "@/assets/images/commercial-project3.svg";

interface ProjectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: Project | null;
  onEdit: (project: Project) => void;
}

export function ProjectModal({ open, onOpenChange, project, onEdit }: ProjectModalProps) {
  // Fetch client data
  const { data: client } = useQuery<Client>({
    queryKey: ["/api/clients", project?.clientId],
    queryFn: async ({ queryKey }) => {
      const res = await fetch(`/api/clients/${queryKey[1]}`);
      if (!res.ok) throw new Error("Failed to fetch client");
      return res.json();
    },
    enabled: !!project?.clientId,
  });
  
  // Fetch staff data for assigned staff
  const { data: staffMembers } = useQuery<Staff[]>({
    queryKey: ["/api/staff"],
    queryFn: async () => {
      const res = await fetch("/api/staff");
      if (!res.ok) throw new Error("Failed to fetch staff");
      return res.json();
    },
    enabled: open,
  });
  
  if (!project) return null;
  
  // Helper function to format dates
  const formatDate = (date: Date | undefined | null) => {
    if (!date) return "No definida";
    return format(new Date(date), "d MMM yyyy", { locale: es });
  };
  
  // Get assigned staff details
  const assignedStaff = project.assignedStaff 
    ? (staffMembers || []).filter(staff => 
        Array.isArray(project.assignedStaff) && 
        (project.assignedStaff as number[]).includes(staff.id)
      )
    : [];
  
  // Get client classification label
  const getClassificationLabel = (classification: string) => {
    switch (classification) {
      case "residential":
        return "Residencial";
      case "commercial":
        return "Comercial";
      case "industrial":
        return "Industrial";
      default:
        return classification;
    }
  };
  
  // Get priority label
  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case "high":
        return "Alta Prioridad";
      case "medium":
        return "Media Prioridad";
      case "low":
        return "Baja Prioridad";
      default:
        return "Normal";
    }
  };
  
  // Get priority classes
  const getPriorityClasses = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      case "low":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };
  
  // Get status label
  const getStatusLabel = (status: string) => {
    switch (status) {
      case "pending":
        return "Pendiente por visitar";
      case "quoted":
        return "Presupuesto enviado";
      case "approved":
        return "Presupuesto aprobado";
      case "preparing":
        return "En preparación";
      case "in_progress":
        return "En proceso";
      case "reviewing":
        return "En revisión final";
      case "completed":
        return "Finalizado";
      case "archived":
        return "Archivado";
      default:
        return status;
    }
  };
  
  // Sample project images
  const projectImages = [
    homeProject1, homeProject2, homeProject3,
    commercialProject1, commercialProject2, commercialProject3
  ];
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Detalles del Proyecto</DialogTitle>
          <DialogDescription>
            Información completa del proyecto seleccionado
          </DialogDescription>
        </DialogHeader>
        
        <div className="mt-4">
          <div className="bg-gray-50 p-4 rounded-md mb-4">
            <div className="flex justify-between">
              <div>
                <h4 className="font-bold text-gray-700">{project.title}</h4>
                <p className="text-sm text-gray-500">Cliente {client ? getClassificationLabel(client.classification) : ""}</p>
              </div>
              <Badge className={getPriorityClasses(project.priority)}>
                {getPriorityLabel(project.priority)}
              </Badge>
            </div>
          </div>
          
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium text-gray-500">Dirección</h4>
              <p className="text-gray-900 flex items-center">
                <MapPin className="h-4 w-4 mr-1 text-gray-400" />
                {project.address}
              </p>
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-gray-500">Tipo de Servicio</h4>
              <p className="text-gray-900">{project.serviceType}</p>
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-gray-500">Estado Actual</h4>
              <p className="text-gray-900">
                {getStatusLabel(project.status)}
                {project.status === "in_progress" && project.progress !== undefined && 
                  ` (${project.progress}% completado)`
                }
              </p>
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-gray-500">Fechas</h4>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="text-xs text-gray-500 flex items-center">
                    <Calendar className="h-3 w-3 mr-1" />
                    Inicio:
                  </p>
                  <p className="text-sm">{formatDate(project.startDate)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 flex items-center">
                    <Clock className="h-3 w-3 mr-1" />
                    Entrega estimada:
                  </p>
                  <p className="text-sm">{formatDate(project.dueDate)}</p>
                </div>
              </div>
            </div>
            
            {assignedStaff.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-500">Equipo Asignado</h4>
                <div className="flex mt-1 -space-x-2">
                  {assignedStaff.map((staff, index) => (
                    <Avatar key={staff.id} className="border-2 border-white">
                      <AvatarFallback>
                        {staff.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  ))}
                </div>
              </div>
            )}
            
            <div>
              <h4 className="text-sm font-medium text-gray-500">Imágenes del Proyecto</h4>
              <div className="grid grid-cols-3 gap-2 mt-1">
                {projectImages.slice(0, 3).map((img, index) => (
                  <img
                    key={index}
                    src={img}
                    alt={`Imagen del proyecto ${index + 1}`}
                    className="w-full h-20 object-cover rounded"
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
          <Button onClick={() => onEdit(project)}>
            Editar Proyecto
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
