import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Project, ServiceOrder, Staff, Subcontractor } from '@shared/schema';
import { Layout } from '@/components/layout';
import { CalendarView } from '@/components/calendar-view';
import { Button } from '@/components/ui/button';
import { Plus, Calendar as CalendarIcon } from 'lucide-react';

export default function Calendar() {
  // Fetch projects
  const { data: projects, isLoading: isLoadingProjects, refetch: refetchProjects } = useQuery<Project[]>({
    queryKey: ['/api/projects'],
    queryFn: async () => {
      const res = await fetch('/api/projects');
      if (!res.ok) throw new Error('Failed to fetch projects');
      return res.json();
    },
  });

  // Fetch service orders
  const { data: serviceOrders, isLoading: isLoadingServiceOrders, refetch: refetchServiceOrders } = useQuery<ServiceOrder[]>({
    queryKey: ['/api/service-orders'],
    queryFn: async () => {
      const res = await fetch('/api/service-orders');
      if (!res.ok) throw new Error('Failed to fetch service orders');
      return res.json();
    },
  });

  // Fetch staff members
  const { data: staff, isLoading: isLoadingStaff } = useQuery<Staff[]>({
    queryKey: ['/api/staff'],
    queryFn: async () => {
      const res = await fetch('/api/staff');
      if (!res.ok) throw new Error('Failed to fetch staff');
      return res.json();
    },
  });
  
  // Fetch subcontractors
  const { data: subcontractors, isLoading: isLoadingSubcontractors } = useQuery<Subcontractor[]>({
    queryKey: ['/api/subcontractors'],
    queryFn: async () => {
      const res = await fetch('/api/subcontractors');
      if (!res.ok) throw new Error('Failed to fetch subcontractors');
      return res.json();
    },
  });

  // Function to refresh all data
  const refreshData = () => {
    refetchProjects();
    refetchServiceOrders();
  };

  // Estado para controlar cuando debemos abrir el formulario de nuevo evento
  const [openAddEventForm, setOpenAddEventForm] = useState(false);
  
  return (
    <Layout title="Calendario">
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <CalendarIcon className="h-6 w-6 mr-2" />
            <h1 className="text-2xl font-bold">Calendario</h1>
          </div>
          <Button onClick={() => setOpenAddEventForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Evento
          </Button>
        </div>
        <p className="text-muted-foreground mt-1">
          Visualiza y gestiona todos tus proyectos, órdenes de servicio y eventos en un solo lugar
        </p>
      </div>

      <CalendarView
        projects={projects}
        serviceOrders={serviceOrders}
        staff={staff}
        subcontractors={subcontractors}
        isLoadingProjects={isLoadingProjects}
        isLoadingServiceOrders={isLoadingServiceOrders}
        refreshData={refreshData}
        showAddEvent={openAddEventForm}
        onCloseAddEvent={() => setOpenAddEventForm(false)}
      />
    </Layout>
  );
}