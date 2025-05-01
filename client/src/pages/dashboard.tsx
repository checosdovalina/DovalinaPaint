import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Project, Activity, Quote } from "@shared/schema";
import { Layout } from "@/components/layout";
import { KanbanBoard } from "@/components/kanban-board";
import { ProjectModal } from "@/components/project-modal";
import { ActivityList } from "@/components/activity-list";
import { StatsCard } from "@/components/stats-card";
import {
  ChartGantt,
  File,
  DollarSign,
  UserPlus,
  Filter,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProjectForm } from "@/components/project-form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function Dashboard() {
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [showProjectDetails, setShowProjectDetails] = useState(false);
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [projectToEdit, setProjectToEdit] = useState<Project | null>(null);
  const [projectFilter, setProjectFilter] = useState<string>("all");

  // Fetch projects for the Kanban board
  const { data: projects, isLoading: isLoadingProjects } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
    queryFn: async () => {
      const res = await fetch("/api/projects");
      if (!res.ok) throw new Error("Failed to fetch projects");
      return res.json();
    },
  });

  // Fetch recent activities
  const { data: activities, isLoading: isLoadingActivities } = useQuery<Activity[]>({
    queryKey: ["/api/activities"],
    queryFn: async () => {
      const res = await fetch("/api/activities");
      if (!res.ok) throw new Error("Failed to fetch activities");
      return res.json();
    },
  });
  
  // Fetch quotes for income calculation
  const { data: quotes, isLoading: isLoadingQuotes } = useQuery<Quote[]>({
    queryKey: ["/api/quotes"],
    queryFn: async () => {
      const res = await fetch("/api/quotes");
      if (!res.ok) throw new Error("Failed to fetch quotes");
      return res.json();
    },
  });

  const handleProjectClick = (project: Project) => {
    setSelectedProject(project);
    setShowProjectDetails(true);
  };

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

  // Filter projects based on selected filter
  const filteredProjects = projects?.filter(project => {
    if (projectFilter === "all") return true;
    return project.status === projectFilter;
  });

  // Calculate stats
  const activeProjects = projects?.filter(p => 
    p.status === "in_progress" || p.status === "preparing" || p.status === "reviewing"
  ).length || 0;
  
  const pendingQuotes = projects?.filter(p => p.status === "quoted").length || 0;
  
  // Calculate current month income from quotes
  const [currentMonthIncome, setCurrentMonthIncome] = useState(0);
  
  useEffect(() => {
    if (quotes) {
      // Get current month and year
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      
      // Filter quotes that were approved in the current month
      const approvedQuotesThisMonth = quotes.filter(quote => {
        if (quote.status !== 'approved' || !quote.approvedDate) return false;
        const approvedDate = new Date(quote.approvedDate);
        return approvedDate.getMonth() === currentMonth && 
               approvedDate.getFullYear() === currentYear;
      });
      
      // Calculate total profit from approved quotes
      let totalProfit = 0;
      
      approvedQuotesThisMonth.forEach(quote => {
        // Parse and calculate based on materialsEstimate and laborEstimate
        try {
          let materialsTotal = 0;
          let laborTotal = 0;
          
          // Check if materialsEstimate has data
          if (quote.materialsEstimate && typeof quote.materialsEstimate === 'object') {
            // Try to parse if it's a string
            const materials = Array.isArray(quote.materialsEstimate) 
              ? quote.materialsEstimate 
              : JSON.parse(typeof quote.materialsEstimate === 'string' 
                ? quote.materialsEstimate 
                : JSON.stringify(quote.materialsEstimate));
                
            if (Array.isArray(materials)) {
              materials.forEach(item => {
                if (item && typeof item === 'object' && 'total' in item) {
                  materialsTotal += Number(item.total) || 0;
                }
              });
            }
          }
          
          // Check if laborEstimate has data
          if (quote.laborEstimate && typeof quote.laborEstimate === 'object') {
            // Try to parse if it's a string
            const labor = Array.isArray(quote.laborEstimate) 
              ? quote.laborEstimate 
              : JSON.parse(typeof quote.laborEstimate === 'string' 
                ? quote.laborEstimate 
                : JSON.stringify(quote.laborEstimate));
                
            if (Array.isArray(labor)) {
              labor.forEach(item => {
                if (item && typeof item === 'object' && 'total' in item) {
                  laborTotal += Number(item.total) || 0;
                }
              });
            }
          }
          
          // Use quote.totalEstimate if available, otherwise use calculated total
          const quoteTotal = quote.totalEstimate || (materialsTotal + laborTotal);
          
          // Calculate profit margin (assuming 25% profit margin)
          // In a real implementation, use the actual profit margin from each quote
          const profitMargin = 0.25; // Default 25% profit margin
          const profit = quoteTotal * profitMargin;
          
          totalProfit += profit;
        } catch (e) {
          console.error("Error calculating profit for quote", quote.id, e);
        }
      });
      
      setCurrentMonthIncome(totalProfit);
    }
  }, [quotes]);
  
  const newClients = 8; // This would come from an API call in a real app

  return (
    <Layout title="Dashboard">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <StatsCard
          title="Proyectos Activos"
          value={activeProjects}
          icon={<ChartGantt className="text-white h-5 w-5" />}
          iconBgColor="bg-primary"
        />
        <StatsCard
          title="Presupuestos Pendientes"
          value={pendingQuotes}
          icon={<File className="text-white h-5 w-5" />}
          iconBgColor="bg-yellow-500"
        />
        <StatsCard
          title="Ingresos (Mes Actual)"
          value={`$${currentMonthIncome.toLocaleString()}`}
          icon={<DollarSign className="text-white h-5 w-5" />}
          iconBgColor="bg-green-500"
        />
        <StatsCard
          title="Nuevos Clientes (Mes)"
          value={newClients}
          icon={<UserPlus className="text-white h-5 w-5" />}
          iconBgColor="bg-blue-500"
        />
      </div>

      {/* Kanban Board Header */}
      <div className="mt-8 flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Project Progress Pipeline
          </h3>
          <div className="flex space-x-3">
            <div className="relative">
              <Select
                value={projectFilter}
                onValueChange={setProjectFilter}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending Visit</SelectItem>
                  <SelectItem value="quoted">Quote Sent</SelectItem>
                  <SelectItem value="approved">Quote Approved</SelectItem>
                  <SelectItem value="preparing">In Preparation</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="reviewing">Final Review</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </Button>
            <Button size="sm" onClick={handleNewProject}>
              <Plus className="h-4 w-4 mr-2" />
              New Project
            </Button>
          </div>
        </div>
      </div>

      {/* Kanban Board */}
      {isLoadingProjects ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
        </div>
      ) : (
        <KanbanBoard
          projects={filteredProjects || []}
          onProjectClick={handleProjectClick}
        />
      )}

      {/* Recent Activity */}
      <div className="mt-8">
        {isLoadingActivities ? (
          <div className="flex justify-center py-10">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
          </div>
        ) : (
          <ActivityList activities={activities || []} />
        )}
      </div>

      {/* Project Details Modal */}
      <ProjectModal
        open={showProjectDetails}
        onOpenChange={setShowProjectDetails}
        project={selectedProject}
        onEdit={handleEditProject}
      />

      {/* Project Form Dialog */}
      <Dialog open={showProjectForm} onOpenChange={setShowProjectForm}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              {projectToEdit ? "Edit Project" : "New Project"}
            </DialogTitle>
            <DialogDescription>
              {projectToEdit
                ? "Modify the project details as needed"
                : "Fill out the details to create a new project"}
            </DialogDescription>
          </DialogHeader>
          <ProjectForm
            initialData={projectToEdit || undefined}
            onSuccess={handleCloseForm}
          />
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
