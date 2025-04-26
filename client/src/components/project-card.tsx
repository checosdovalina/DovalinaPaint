import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { MapPin, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Project } from "@shared/schema";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface ProjectCardProps {
  project: Project;
  onClick: (project: Project) => void;
  className?: string;
}

export function ProjectCard({ project, onClick, className }: ProjectCardProps) {
  // Helper function to get priority styling
  const getPriorityBadgeClasses = (priority: string) => {
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
  
  // Helper function to get status styling for border
  const getStatusBorderClasses = (status: string, progress: number) => {
    if (status === "in_progress") {
      // Project is delayed if progress is less than expected
      if (progress < 50 && new Date() > new Date(project.startDate as Date)) {
        return "border-l-4 border-red-500";
      }
      return "border-l-4 border-green-500";
    }
    return "";
  };
  
  // Helper function to format dates
  const formatDate = (date: Date | undefined | null) => {
    if (!date) return "No definida";
    return format(new Date(date), "d MMM", { locale: es });
  };
  
  // Helper function to get priority label
  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case "high":
        return "Alta";
      case "medium":
        return "Media";
      case "low":
        return "Baja";
      default:
        return "Normal";
    }
  };
  
  // Helper function to get status-specific date display
  const getDateDisplay = () => {
    switch (project.status) {
      case "pending":
        return `Agenda: ${formatDate(project.startDate)}`;
      case "quoted":
        return `Enviado: ${formatDate(project.createdAt)}`;
      case "approved":
        return `Aprobado: ${formatDate(project.startDate)}`;
      case "preparing":
        return `Inicio: ${formatDate(project.startDate)}`;
      case "in_progress":
        return `Inicio: ${formatDate(project.startDate)}`;
      case "reviewing":
        return `Revisión: ${formatDate(new Date())}`;
      case "completed":
        return `Terminado: ${formatDate(project.completedDate)}`;
      default:
        return `Creado: ${formatDate(project.createdAt)}`;
    }
  };
  
  return (
    <Card 
      className={cn(
        "bg-white cursor-pointer transition-shadow hover:shadow-md mb-2",
        getStatusBorderClasses(project.status, project.progress || 0),
        className
      )}
      onClick={() => onClick(project)}
    >
      <CardContent className="p-3">
        <div className="flex justify-between items-start">
          <h4 className="font-semibold text-sm text-gray-900">{project.title}</h4>
          <span className={cn(
            "text-xs px-2 py-1 rounded-full font-medium",
            getPriorityBadgeClasses(project.priority)
          )}>
            {getPriorityLabel(project.priority)}
          </span>
        </div>
        
        <p className="text-xs text-gray-500 mt-1 mb-2 flex items-center">
          <MapPin className="h-3 w-3 mr-1" />
          {project.address}
        </p>
        
        {/* Progress bar for in-progress projects */}
        {project.status === "in_progress" && (
          <div className="flex justify-between items-center mt-1 mb-2">
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div 
                className={cn(
                  "h-2.5 rounded-full",
                  project.progress && project.progress < 50 && new Date() > new Date(project.startDate as Date)
                    ? "bg-red-500"
                    : "bg-green-500"
                )}
                style={{ width: `${project.progress || 0}%` }}
              ></div>
            </div>
            <span className="text-xs text-gray-500 ml-2">{project.progress || 0}%</span>
          </div>
        )}
        
        <div className="border-t pt-2 mt-1">
          <div className="flex justify-between items-center text-xs">
            <span className={cn(
              "flex items-center",
              project.status === "completed" 
                ? "text-green-600 font-medium" 
                : project.status === "in_progress" && project.progress && project.progress < 50 && new Date() > new Date(project.startDate as Date)
                  ? "text-red-600 font-medium"
                  : "text-gray-500"
            )}>
              <Calendar className="h-3 w-3 mr-1" />
              {getDateDisplay()}
            </span>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-primary hover:text-blue-700 p-0 h-auto"
              onClick={(e) => {
                e.stopPropagation();
                onClick(project);
              }}
            >
              Ver detalles
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
