import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Project, Client } from "@shared/schema";
import { Layout } from "@/components/layout";
import { ProjectForm } from "@/components/project-form";
import { ProjectCard } from "@/components/project-card";
import { ProjectModal } from "@/components/project-modal";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Search, Plus, Network, List, GridIcon, Filter, Trash } from "lucide-react";

export default function Projects() {
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [projectToEdit, setProjectToEdit] = useState<Project | null>(null);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [showProjectDetails, setShowProjectDetails] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [clientFilter, setClientFilter] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const { toast } = useToast();

  // Fetch projects
  const { data: projects, isLoading: isLoadingProjects } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
    queryFn: async () => {
      const res = await fetch("/api/projects");
      if (!res.ok) throw new Error("Failed to fetch projects");
      return res.json();
    },
  });

  // Fetch clients for filtering
  const { data: clients } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
    queryFn: async () => {
      const res = await fetch("/api/clients");
      if (!res.ok) throw new Error("Failed to fetch clients");
      return res.json();
    },
  });

  const handleEditProject = (project: Project) => {
    setProjectToEdit(project);
    setShowProjectDetails(false);
    setShowProjectForm(true);
  };

  const handleNewProject = () => {
    setProjectToEdit(null);
    setShowProjectForm(true);
  };

  const handleCloseForm = () => {
    setShowProjectForm(false);
    setProjectToEdit(null);
  };

  const handleProjectClick = (project: Project) => {
    setSelectedProject(project);
    setShowProjectDetails(true);
  };

  const handleDeleteClick = (project: Project) => {
    setProjectToDelete(project);
  };

  const handleDeleteConfirm = async () => {
    if (!projectToDelete) return;

    try {
      await apiRequest("DELETE", `/api/projects/${projectToDelete.id}`, undefined);
      
      toast({
        title: "Proyecto eliminado",
        description: "El proyecto ha sido eliminado exitosamente",
      });
      
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
    } catch (error) {
      toast({
        title: "Error",
        description: `No se pudo eliminar el proyecto: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setProjectToDelete(null);
    }
  };

  // Filter projects
  const filteredProjects = projects?.filter(project => {
    // Filter by status
    if (statusFilter !== "all" && project.status !== statusFilter) {
      return false;
    }
    
    // Filter by client
    if (clientFilter !== "all" && project.clientId !== parseInt(clientFilter)) {
      return false;
    }
    
    // Filter by search term
    if (searchTerm) {
      const searchTermLower = searchTerm.toLowerCase();
      return (
        project.title.toLowerCase().includes(searchTermLower) ||
        project.description.toLowerCase().includes(searchTermLower) ||
        project.address.toLowerCase().includes(searchTermLower) ||
        project.serviceType.toLowerCase().includes(searchTermLower)
      );
    }
    
    return true;
  });

  // Helper to get status label
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

  // Helper to get client name
  const getClientName = (clientId: number) => {
    const client = clients?.find(c => c.id === clientId);
    return client ? client.name : `Cliente #${clientId}`;
  };

  return (
    <Layout title="Gestión de Proyectos">
      <div className="flex flex-col space-y-4 mb-6">
        <div className="flex flex-wrap gap-4 justify-between items-center">
          <div className="flex items-center space-x-2 w-full max-w-md">
            <div className="relative w-full">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar proyectos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={() => setViewMode("grid")} className={viewMode === "grid" ? "bg-gray-100" : ""}>
              <GridIcon className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => setViewMode("list")} className={viewMode === "list" ? "bg-gray-100" : ""}>
              <List className="h-4 w-4" />
            </Button>
            <Button onClick={handleNewProject}>
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Proyecto
            </Button>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-4">
          <Select
            value={statusFilter}
            onValueChange={setStatusFilter}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Estado del proyecto" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los estados</SelectItem>
              <SelectItem value="pending">Pendiente por visitar</SelectItem>
              <SelectItem value="quoted">Presupuesto enviado</SelectItem>
              <SelectItem value="approved">Presupuesto aprobado</SelectItem>
              <SelectItem value="preparing">En preparación</SelectItem>
              <SelectItem value="in_progress">En proceso</SelectItem>
              <SelectItem value="reviewing">En revisión final</SelectItem>
              <SelectItem value="completed">Finalizado</SelectItem>
              <SelectItem value="archived">Archivado</SelectItem>
            </SelectContent>
          </Select>
          
          <Select
            value={clientFilter}
            onValueChange={setClientFilter}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Cliente" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los clientes</SelectItem>
              {clients?.map(client => (
                <SelectItem key={client.id} value={client.id.toString()}>
                  {client.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Button variant="outline" size="icon">
            <Filter className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {isLoadingProjects ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
        </div>
      ) : filteredProjects && filteredProjects.length > 0 ? (
        <>
          {/* Grid View */}
          {viewMode === "grid" && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProjects.map((project) => (
                <div key={project.id} className="relative group">
                  <ProjectCard
                    project={project}
                    onClick={handleProjectClick}
                  />
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-red-600 hover:bg-red-50 hover:text-red-700"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteClick(project);
                      }}
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {/* List View */}
          {viewMode === "list" && (
            <div className="bg-white rounded-md shadow overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Proyecto
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cliente
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estado
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Prioridad
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Progreso
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fechas
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredProjects.map((project) => (
                    <tr key={project.id} onClick={() => handleProjectClick(project)} className="hover:bg-gray-50 cursor-pointer">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{project.title}</div>
                        <div className="text-sm text-gray-500 truncate max-w-xs">{project.address}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{getClientName(project.clientId)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                          {getStatusLabel(project.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          project.priority === "high" 
                            ? "bg-red-100 text-red-800" 
                            : project.priority === "medium"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-green-100 text-green-800"
                        }`}>
                          {project.priority === "high" 
                            ? "Alta" 
                            : project.priority === "medium"
                            ? "Media"
                            : "Baja"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {project.progress !== undefined && project.progress !== null ? (
                          <div className="w-full bg-gray-200 rounded-full h-2.5 max-w-[100px]">
                            <div 
                              className="h-2.5 rounded-full bg-green-500"
                              style={{ width: `${project.progress}%` }}
                            ></div>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-500">N/A</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {project.startDate ? (
                          <div>Inicio: {new Date(project.startDate).toLocaleDateString()}</div>
                        ) : null}
                        {project.dueDate ? (
                          <div>Entrega: {new Date(project.dueDate).toLocaleDateString()}</div>
                        ) : null}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-primary hover:text-primary/80"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditProject(project);
                          }}
                        >
                          Editar
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-700"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteClick(project);
                          }}
                        >
                          Eliminar
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-20 text-gray-500">
          {searchTerm || statusFilter !== "all" || clientFilter !== "all"
            ? "No se encontraron proyectos con los filtros aplicados"
            : "No hay proyectos registrados. Cree uno nuevo haciendo clic en 'Nuevo Proyecto'"}
        </div>
      )}

      {/* Project Details Modal */}
      <ProjectModal
        open={showProjectDetails}
        onOpenChange={setShowProjectDetails}
        project={selectedProject}
        onEdit={handleEditProject}
      />

      {/* Project Form Dialog */}
      <Dialog open={showProjectForm} onOpenChange={setShowProjectForm}>
        <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {projectToEdit ? "Editar Proyecto" : "Nuevo Proyecto"}
            </DialogTitle>
            <DialogDescription>
              {projectToEdit
                ? "Modifique los detalles del proyecto según sea necesario"
                : "Complete el formulario para crear un nuevo proyecto"}
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[75vh] overflow-y-auto pr-2">
            <ProjectForm
              initialData={projectToEdit || undefined}
              onSuccess={handleCloseForm}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!projectToDelete}
        onOpenChange={(open) => !open && setProjectToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar Proyecto?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El proyecto será eliminado permanentemente del sistema.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-red-600 hover:bg-red-700"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
}
