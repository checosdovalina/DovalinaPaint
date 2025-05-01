import React, { useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';
import { Project, ServiceOrder, Staff } from '@shared/schema';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { 
  CalendarIcon, 
  RefreshCcw, 
  Plus, 
  Calendar as CalendarLucide,
  Google
} from 'lucide-react';

interface CalendarEvent {
  id: string;
  title: string;
  start: Date | string;
  end?: Date | string;
  allDay?: boolean;
  color?: string;
  extendedProps?: {
    type: 'project' | 'serviceOrder' | 'googleEvent';
    projectId?: number;
    serviceOrderId?: number;
    googleEventId?: string;
    description?: string;
    location?: string;
    staffAssigned?: string[];
  };
}

interface CalendarViewProps {
  projects?: Project[];
  serviceOrders?: ServiceOrder[];
  staff?: Staff[];
  isLoadingProjects?: boolean;
  isLoadingServiceOrders?: boolean;
  refreshData?: () => void;
}

export function CalendarView({
  projects = [],
  serviceOrders = [],
  staff = [],
  isLoadingProjects = false,
  isLoadingServiceOrders = false,
  refreshData,
}: CalendarViewProps) {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [showGoogleEvents, setShowGoogleEvents] = useState(false);
  const [googleConnected, setGoogleConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [showEventDetails, setShowEventDetails] = useState(false);
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: '',
    start: '',
    end: '',
    allDay: false,
    description: '',
    location: '',
  });

  // Convert projects and service orders to calendar events
  useEffect(() => {
    const projectEvents: CalendarEvent[] = projects.map(project => {
      const startDate = project.startDate ? new Date(project.startDate) : new Date();
      const dueDate = project.dueDate ? new Date(project.dueDate) : new Date(startDate);
      
      // Add 1 day to due date for visualization if it's the same as start date
      if (dueDate.getTime() === startDate.getTime()) {
        dueDate.setDate(dueDate.getDate() + 1);
      }
      
      return {
        id: `project-${project.id}`,
        title: project.title,
        start: startDate,
        end: dueDate,
        allDay: true,
        color: getStatusColor(project.status),
        extendedProps: {
          type: 'project',
          projectId: project.id,
          description: project.description,
        },
      };
    });

    const serviceOrderEvents: CalendarEvent[] = serviceOrders.map(order => {
      const startDate = order.startDate ? new Date(order.startDate) : new Date();
      
      // Get assigned staff names
      const assignedStaffNames = order.assignedStaff 
        ? (typeof order.assignedStaff === 'string' 
            ? [order.assignedStaff] 
            : Array.isArray(order.assignedStaff) 
              ? order.assignedStaff 
              : [])
        : [];
      
      const project = projects.find(p => p.id === order.projectId);
      
      return {
        id: `service-${order.id}`,
        title: `Service: ${project ? project.title : `Order #${order.id}`}`,
        start: startDate,
        allDay: false,
        color: '#ff9800', // Orange for service orders
        extendedProps: {
          type: 'serviceOrder',
          serviceOrderId: order.id,
          projectId: order.projectId,
          description: order.details,
          staffAssigned: assignedStaffNames,
        },
      };
    });

    setEvents([...projectEvents, ...serviceOrderEvents]);
  }, [projects, serviceOrders]);

  // Function to handle Google Calendar authorization
  const handleGoogleAuth = async () => {
    try {
      setIsLoading(true);
      toast({
        title: "Google Calendar Integration",
        description: "Para integrar con Google Calendar, primero necesitamos obtener tu autorización",
      });
      
      // In a real implementation, this would initiate the OAuth flow
      // For this demo, we'll simulate it
      setTimeout(() => {
        setGoogleConnected(true);
        setIsLoading(false);
        toast({
          title: "¡Conectado con éxito!",
          description: "Ahora puedes sincronizar eventos con Google Calendar",
        });
      }, 2000);
    } catch (error) {
      setIsLoading(false);
      toast({
        title: "Error de conexión",
        description: "No se pudo conectar con Google Calendar",
        variant: "destructive",
      });
    }
  };

  // Function to sync with Google Calendar
  const syncWithGoogle = async () => {
    try {
      setIsLoading(true);
      toast({
        title: "Sincronizando...",
        description: "Obteniendo eventos de Google Calendar",
      });
      
      // In a real implementation, this would call your backend API
      // which would use the googleapis library to fetch events
      // For now, we'll add a sample event
      setTimeout(() => {
        const now = new Date();
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        const googleEvents: CalendarEvent[] = [
          {
            id: 'google-1',
            title: 'Meeting with Client',
            start: now,
            end: tomorrow,
            color: '#4285F4', // Google blue
            extendedProps: {
              type: 'googleEvent',
              googleEventId: 'sample-google-id-1',
              description: 'Discuss project requirements',
              location: 'Client Office',
            },
          },
        ];
        
        setEvents(prevEvents => {
          // Filter out previous Google events
          const filteredEvents = prevEvents.filter(e => e.extendedProps?.type !== 'googleEvent');
          return [...filteredEvents, ...googleEvents];
        });
        
        setShowGoogleEvents(true);
        setIsLoading(false);
        toast({
          title: "Sincronización completa",
          description: "Eventos de Google Calendar importados correctamente",
        });
      }, 2000);
    } catch (error) {
      setIsLoading(false);
      toast({
        title: "Error de sincronización",
        description: "No se pudieron obtener los eventos de Google Calendar",
        variant: "destructive",
      });
    }
  };

  // Handle event click
  const handleEventClick = (info: any) => {
    const eventId = info.event.id;
    const clickedEvent = events.find(e => e.id === eventId);
    
    if (clickedEvent) {
      setSelectedEvent(clickedEvent);
      setShowEventDetails(true);
    }
  };

  // Handle date click (to add new event)
  const handleDateClick = (info: any) => {
    setNewEvent({
      ...newEvent,
      start: info.dateStr,
      end: info.dateStr,
    });
    setShowAddEvent(true);
  };

  // Function to get color based on project status
  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'pending': return '#9e9e9e'; // Gray
      case 'quoted': return '#ffeb3b'; // Yellow
      case 'approved': return '#8bc34a'; // Light green
      case 'preparing': return '#03a9f4'; // Light blue
      case 'in_progress': return '#3f51b5'; // Indigo
      case 'reviewing': return '#9c27b0'; // Purple
      case 'completed': return '#4caf50'; // Green
      case 'archived': return '#607d8b'; // Blue gray
      default: return '#2196f3'; // Blue
    }
  };

  return (
    <div className="calendar-container">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center space-x-4">
          <h2 className="text-xl font-semibold">Calendario</h2>
          <div className="flex items-center space-x-2">
            <Switch
              id="google-sync"
              checked={showGoogleEvents}
              onCheckedChange={setShowGoogleEvents}
              disabled={!googleConnected}
            />
            <Label htmlFor="google-sync">Mostrar eventos de Google</Label>
          </div>
        </div>
        <div className="flex space-x-2">
          {!googleConnected ? (
            <Button 
              variant="outline" 
              onClick={handleGoogleAuth}
              disabled={isLoading}
            >
              <Google className="mr-2 h-4 w-4" />
              Conectar con Google
            </Button>
          ) : (
            <Button 
              variant="outline" 
              onClick={syncWithGoogle}
              disabled={isLoading}
            >
              <RefreshCcw className="mr-2 h-4 w-4" />
              Sincronizar con Google
            </Button>
          )}
          <Button 
            variant="default" 
            onClick={() => {
              setNewEvent({
                title: '',
                start: '',
                end: '',
                allDay: false,
                description: '',
                location: '',
              });
              setShowAddEvent(true);
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Evento
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-4">
          {isLoadingProjects || isLoadingServiceOrders ? (
            <div className="flex justify-center items-center h-[600px]">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
            </div>
          ) : (
            <FullCalendar
              plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
              initialView="dayGridMonth"
              headerToolbar={{
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth,timeGridWeek,timeGridDay',
              }}
              events={events.filter(e => 
                e.extendedProps?.type !== 'googleEvent' || showGoogleEvents
              )}
              eventClick={handleEventClick}
              dateClick={handleDateClick}
              editable={true}
              selectable={true}
              selectMirror={true}
              dayMaxEvents={true}
              height="auto"
              aspectRatio={1.8}
              locale="es"
              buttonText={{
                today: 'Hoy',
                month: 'Mes',
                week: 'Semana',
                day: 'Día',
              }}
            />
          )}
        </CardContent>
      </Card>

      {/* Event Details Dialog */}
      <Dialog open={showEventDetails} onOpenChange={setShowEventDetails}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{selectedEvent?.title}</DialogTitle>
            <DialogDescription>
              {selectedEvent?.extendedProps?.type === 'project' 
                ? 'Proyecto' 
                : selectedEvent?.extendedProps?.type === 'serviceOrder'
                ? 'Orden de Servicio'
                : 'Evento de Google Calendar'}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="grid grid-cols-4 gap-4 mb-4">
              <div className="col-span-1 font-medium">Fecha Inicio:</div>
              <div className="col-span-3">
                {selectedEvent?.start 
                  ? new Date(selectedEvent.start).toLocaleDateString('es-ES', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: 'numeric',
                      minute: 'numeric',
                    })
                  : 'No definida'}
              </div>
            </div>
            {selectedEvent?.end && (
              <div className="grid grid-cols-4 gap-4 mb-4">
                <div className="col-span-1 font-medium">Fecha Fin:</div>
                <div className="col-span-3">
                  {new Date(selectedEvent.end).toLocaleDateString('es-ES', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: 'numeric',
                  })}
                </div>
              </div>
            )}
            <div className="grid grid-cols-4 gap-4 mb-4">
              <div className="col-span-1 font-medium">Descripción:</div>
              <div className="col-span-3">
                {selectedEvent?.extendedProps?.description || 'Sin descripción'}
              </div>
            </div>
            {selectedEvent?.extendedProps?.location && (
              <div className="grid grid-cols-4 gap-4 mb-4">
                <div className="col-span-1 font-medium">Ubicación:</div>
                <div className="col-span-3">{selectedEvent.extendedProps.location}</div>
              </div>
            )}
            {selectedEvent?.extendedProps?.staffAssigned && selectedEvent.extendedProps.staffAssigned.length > 0 && (
              <div className="grid grid-cols-4 gap-4 mb-4">
                <div className="col-span-1 font-medium">Personal Asignado:</div>
                <div className="col-span-3">
                  <ul className="list-disc pl-5">
                    {selectedEvent.extendedProps.staffAssigned.map((staffName, idx) => (
                      <li key={idx}>{staffName}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEventDetails(false)}>
              Cerrar
            </Button>
            {selectedEvent?.extendedProps?.type === 'project' && (
              <Button 
                onClick={() => {
                  // Navigate to project details
                  setShowEventDetails(false);
                }}
              >
                Ver Proyecto
              </Button>
            )}
            {selectedEvent?.extendedProps?.type === 'serviceOrder' && (
              <Button 
                onClick={() => {
                  // Navigate to service order details
                  setShowEventDetails(false);
                }}
              >
                Ver Orden de Servicio
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Event Dialog */}
      <Dialog open={showAddEvent} onOpenChange={setShowAddEvent}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Nuevo Evento</DialogTitle>
            <DialogDescription>
              Añadir un nuevo evento al calendario
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="event-title" className="text-right">
                Título
              </Label>
              <Input
                id="event-title"
                className="col-span-3"
                value={newEvent.title}
                onChange={(e) => setNewEvent({...newEvent, title: e.target.value})}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="event-start" className="text-right">
                Fecha Inicio
              </Label>
              <Input
                id="event-start"
                type="datetime-local"
                className="col-span-3"
                value={newEvent.start}
                onChange={(e) => setNewEvent({...newEvent, start: e.target.value})}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="event-end" className="text-right">
                Fecha Fin
              </Label>
              <Input
                id="event-end"
                type="datetime-local"
                className="col-span-3"
                value={newEvent.end}
                onChange={(e) => setNewEvent({...newEvent, end: e.target.value})}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="event-description" className="text-right">
                Descripción
              </Label>
              <Input
                id="event-description"
                className="col-span-3"
                value={newEvent.description}
                onChange={(e) => setNewEvent({...newEvent, description: e.target.value})}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="event-location" className="text-right">
                Ubicación
              </Label>
              <Input
                id="event-location"
                className="col-span-3"
                value={newEvent.location}
                onChange={(e) => setNewEvent({...newEvent, location: e.target.value})}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <div className="text-right">
                <Label htmlFor="event-all-day">Todo el día</Label>
              </div>
              <div className="col-span-3">
                <Switch
                  id="event-all-day"
                  checked={newEvent.allDay}
                  onCheckedChange={(checked) => setNewEvent({...newEvent, allDay: checked})}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddEvent(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={() => {
                // Add event to the calendar
                if (!newEvent.title || !newEvent.start) {
                  toast({
                    title: "Datos incompletos",
                    description: "El título y la fecha de inicio son obligatorios",
                    variant: "destructive",
                  });
                  return;
                }
                
                const newCalendarEvent: CalendarEvent = {
                  id: `local-${Date.now()}`,
                  title: newEvent.title,
                  start: newEvent.start,
                  end: newEvent.end || undefined,
                  allDay: newEvent.allDay,
                  color: '#2196f3', // Default blue
                  extendedProps: {
                    type: 'project', // Default type
                    description: newEvent.description,
                    location: newEvent.location,
                  },
                };
                
                setEvents(prev => [...prev, newCalendarEvent]);
                setShowAddEvent(false);
                toast({
                  title: "Evento creado",
                  description: "El evento ha sido añadido al calendario",
                });
              }}
            >
              Guardar Evento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}