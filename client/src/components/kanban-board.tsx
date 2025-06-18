import { useState, useEffect, useRef } from "react";
import { DragDropContext, Droppable, Draggable, DropResult } from "react-beautiful-dnd";
import { ProjectCard } from "@/components/project-card";
import { Project } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface KanbanBoardProps {
  projects: Project[];
  onProjectClick: (project: Project) => void;
}

interface KanbanColumn {
  id: string;
  title: string;
  status: string;
  projects: Project[];
}

export function KanbanBoard({ projects, onProjectClick }: KanbanBoardProps) {
  const { toast } = useToast();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [columns, setColumns] = useState<KanbanColumn[]>([]);
  
  // Initialize columns
  useEffect(() => {
    const statusColumns: KanbanColumn[] = [
      { id: "pending", title: "Pending Visit", status: "pending", projects: [] },
      { id: "quoted", title: "Quote Sent", status: "quoted", projects: [] },
      { id: "approved", title: "Quote Approved", status: "approved", projects: [] },
      { id: "preparing", title: "In Preparation", status: "preparing", projects: [] },
      { id: "in_progress", title: "In Progress", status: "in_progress", projects: [] },
      { id: "reviewing", title: "Final Review", status: "reviewing", projects: [] },
      { id: "completed", title: "Completed", status: "completed", projects: [] },
      { id: "archived", title: "Archived", status: "archived", projects: [] },
    ];
    
    // Distribute projects to their respective columns
    if (projects) {
      projects.forEach(project => {
        const column = statusColumns.find(col => col.status === project.status);
        if (column) {
          column.projects.push(project);
        }
      });
    }
    
    setColumns(statusColumns);
  }, [projects]);
  
  const onDragEnd = async (result: DropResult) => {
    const { source, destination } = result;
    
    // Dropped outside the list
    if (!destination) return;
    
    // Same position
    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) return;
    
    // Find source and destination columns
    const sourceColumn = columns.find(col => col.id === source.droppableId);
    const destColumn = columns.find(col => col.id === destination.droppableId);
    
    if (!sourceColumn || !destColumn) return;
    
    // Same column - reordering within column
    if (source.droppableId === destination.droppableId) {
      const newProjects = [...sourceColumn.projects];
      const [removed] = newProjects.splice(source.index, 1);
      newProjects.splice(destination.index, 0, removed);
      
      const newColumns = columns.map(col => 
        col.id === source.droppableId
          ? { ...col, projects: newProjects }
          : col
      );
      
      setColumns(newColumns);
    } else {
      // Moving between columns - change project status
      const sourceProjects = [...sourceColumn.projects];
      const destProjects = [...destColumn.projects];
      const [movedProject] = sourceProjects.splice(source.index, 1);
      
      // Update project status
      const updatedProject = { ...movedProject, status: destColumn.status };
      destProjects.splice(destination.index, 0, updatedProject);
      
      const newColumns = columns.map(col => {
        if (col.id === source.droppableId) {
          return { ...col, projects: sourceProjects };
        }
        if (col.id === destination.droppableId) {
          return { ...col, projects: destProjects };
        }
        return col;
      });
      
      setColumns(newColumns);
      
      // Update project status in the database
      try {
        await apiRequest("PUT", `/api/projects/${movedProject.id}`, {
          status: destColumn.status
        });
        
        // Invalidate projects query to refresh data
        queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
        
        toast({
          title: "Project Updated",
          description: `Project ${movedProject.title} has been moved to ${destColumn.title}`,
        });
      } catch (error) {
        toast({
          title: "Error updating project",
          description: "Could not update project status",
          variant: "destructive",
        });
        
        // Revert the UI change
        setColumns(columns);
      }
    }
  };

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -300, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 300, behavior: 'smooth' });
    }
  };
  
  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="relative">
        {/* Navigation Arrows */}
        <Button
          variant="outline"
          size="icon"
          className="absolute left-2 top-1/2 -translate-y-1/2 z-10 bg-white shadow-lg"
          onClick={scrollLeft}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="absolute right-2 top-1/2 -translate-y-1/2 z-10 bg-white shadow-lg"
          onClick={scrollRight}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
        
        <div 
          ref={scrollContainerRef}
          className="overflow-x-scroll scrollbar-thin scrollbar-always-visible pb-6" 
          style={{ 
            width: '100%',
            maxWidth: '100%',
            overflowX: 'scroll'
          }}
        >
          <div 
            className="flex space-x-3" 
            style={{ 
              minWidth: '2400px',
              width: '2400px'
            }}
          >
            {columns.map(column => (
              <div 
                key={column.id}
                className="flex flex-col w-56 bg-gray-100 rounded-md min-h-[65vh] flex-shrink-0"
              >
                <div className="p-3 border-b flex justify-between items-center bg-gray-200 rounded-t-md">
                  <h3 className="font-medium text-gray-900">{column.title}</h3>
                  <span className="bg-gray-300 text-gray-700 rounded-full px-2 py-1 text-xs">
                    {column.projects.length}
                  </span>
                </div>
                
                <Droppable droppableId={column.id}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={cn(
                        "p-2 flex-1 overflow-y-auto",
                        snapshot.isDraggingOver ? "bg-gray-200" : ""
                      )}
                    >
                      {column.projects.map((project, index) => (
                        <Draggable
                          key={project.id.toString()}
                          draggableId={project.id.toString()}
                          index={index}
                        >
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={cn(
                                snapshot.isDragging ? "opacity-50" : ""
                              )}
                            >
                              <ProjectCard
                                project={project}
                                onClick={onProjectClick}
                              />
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DragDropContext>
  );
}
