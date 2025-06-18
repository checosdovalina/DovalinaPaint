import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
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
import { Project, ServiceOrder, Staff, Subcontractor } from '@shared/schema';
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
  Calendar as CalendarLucide
} from 'lucide-react';
import { SiGoogle } from 'react-icons/si';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';

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
    subcontractorsAssigned?: string[];
  };
}

interface CalendarViewProps {
  projects?: Project[];
  serviceOrders?: ServiceOrder[];
  staff?: Staff[];
  subcontractors?: Subcontractor[];
  isLoadingProjects?: boolean;
  isLoadingServiceOrders?: boolean;
  refreshData?: () => void;
  showAddEvent?: boolean; // Indica si debemos mostrar el diálogo de nuevo evento
  onCloseAddEvent?: () => void; // Función para cerrar el diálogo
}

export function CalendarView({
  projects = [],
  serviceOrders = [],
  staff = [],
  subcontractors = [],
  isLoadingProjects = false,
  isLoadingServiceOrders = false,
  refreshData,
  showAddEvent: externalShowAddEvent,
  onCloseAddEvent,
}: CalendarViewProps) {
  const [, navigate] = useLocation();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<CalendarEvent[]>([]);
  const [showGoogleEvents, setShowGoogleEvents] = useState(false);
  const [googleConnected, setGoogleConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [showEventDetails, setShowEventDetails] = useState(false);
  const [showAddEvent, setShowAddEvent] = useState(false);
  
  // Filter states
  const [selectedStaffFilter, setSelectedStaffFilter] = useState<string[]>([]);
  const [selectedSubcontractorFilter, setSelectedSubcontractorFilter] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: '',
    start: '',
    end: '',
    allDay: false,
    description: '',
    location: '',
    assignedStaff: [] as string[],
    assignedType: 'staff', // 'staff' o 'subcontractor'
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

      // Get assigned subcontractor names
      const assignedSubcontractorNames = order.assignedSubcontractors 
        ? (typeof order.assignedSubcontractors === 'string' 
            ? [order.assignedSubcontractors] 
            : Array.isArray(order.assignedSubcontractors) 
              ? order.assignedSubcontractors 
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
          subcontractorsAssigned: assignedSubcontractorNames,
        },
      };
    });

    setEvents([...projectEvents, ...serviceOrderEvents]);
  }, [projects, serviceOrders]);

  // Filter events based on selected staff and subcontractors
  useEffect(() => {
    let filtered = events;

    // Filter by staff
    if (selectedStaffFilter.length > 0) {
      filtered = filtered.filter(event => {
        if (event.extendedProps?.type === 'serviceOrder') {
          const staffAssigned = event.extendedProps.staffAssigned || [];
          return selectedStaffFilter.some(staffId => 
            staffAssigned.includes(staffId) || staffAssigned.some(staffName => {
              // Also check by staff name for backward compatibility
              const staffMember = staff.find(s => s.id.toString() === staffId);
              return staffMember && staffName === staffMember.name;
            })
          );
        }
        return true; // Show projects when staff filter is active
      });
    }

    // Filter by subcontractors
    if (selectedSubcontractorFilter.length > 0) {
      filtered = filtered.filter(event => {
        if (event.extendedProps?.type === 'serviceOrder') {
          const subcontractorsAssigned = event.extendedProps.subcontractorsAssigned || [];
          return selectedSubcontractorFilter.some(subcontractorId => 
            subcontractorsAssigned.includes(subcontractorId) || subcontractorsAssigned.some(subcontractorName => {
              // Also check by subcontractor name for backward compatibility
              const subcontractor = subcontractors.find(s => s.id.toString() === subcontractorId);
              return subcontractor && subcontractorName === subcontractor.name;
            })
          );
        }
        return true; // Show projects when subcontractor filter is active
      });
    }

    setFilteredEvents(filtered);
  }, [events, selectedStaffFilter, selectedSubcontractorFilter, staff, subcontractors]);

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
      title: '',
      start: info.dateStr,
      end: info.dateStr,
      allDay: false,
      description: '',
      location: '',
      assignedStaff: [],
      assignedType: 'staff',
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
  
  // Efecto para manejar la apertura del diálogo desde props externas
  useEffect(() => {
    if (externalShowAddEvent) {
      setNewEvent({
        title: '',
        start: '',
        end: '',
        allDay: false,
        description: '',
        location: '',
        assignedStaff: [],
        assignedType: 'staff',
      });
      setShowAddEvent(true);
    }
  }, [externalShowAddEvent]);

  return (
    <div className="calendar-container">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center space-x-4">
          <h2 className="text-xl font-semibold">Calendar</h2>
          <div className="flex items-center space-x-2">
            <Switch
              id="google-sync"
              checked={showGoogleEvents}
              onCheckedChange={setShowGoogleEvents}
              disabled={!googleConnected}
            />
            <Label htmlFor="google-sync">Show Google Events</Label>
          </div>
          <Button 
            variant="outline" 
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center space-x-2"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            <span>Filters</span>
          </Button>
        </div>
        <div className="flex space-x-2">
          {!googleConnected ? (
            <Button 
              variant="outline" 
              onClick={handleGoogleAuth}
              disabled={isLoading}
            >
              <SiGoogle className="mr-2 h-4 w-4" />
              Connect with Google
            </Button>
          ) : (
            <Button 
              variant="outline" 
              onClick={syncWithGoogle}
              disabled={isLoading}
            >
              <RefreshCcw className="mr-2 h-4 w-4" />
              Sync with Google
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
                assignedStaff: [],
                assignedType: 'staff',
              });
              setShowAddEvent(true);
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            New Event
          </Button>
        </div>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <Card className="mb-4">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Staff Filter */}
              <div>
                <Label className="text-sm font-medium mb-2 block">Filter by Staff</Label>
                <div className="space-y-2">
                  {staff && staff.length > 0 ? (
                    staff.map((member) => (
                      <div key={member.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`staff-${member.id}`}
                          checked={selectedStaffFilter.includes(member.id.toString())}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedStaffFilter([...selectedStaffFilter, member.id.toString()]);
                            } else {
                              setSelectedStaffFilter(selectedStaffFilter.filter(id => id !== member.id.toString()));
                            }
                          }}
                        />
                        <Label htmlFor={`staff-${member.id}`} className="text-sm">
                          {member.name}
                        </Label>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500">No staff members available</p>
                  )}
                </div>
              </div>

              {/* Subcontractor Filter */}
              <div>
                <Label className="text-sm font-medium mb-2 block">Filter by Subcontractors</Label>
                <div className="space-y-2">
                  {subcontractors && subcontractors.length > 0 ? (
                    subcontractors.map((subcontractor) => (
                      <div key={subcontractor.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`subcontractor-${subcontractor.id}`}
                          checked={selectedSubcontractorFilter.includes(subcontractor.id.toString())}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedSubcontractorFilter([...selectedSubcontractorFilter, subcontractor.id.toString()]);
                            } else {
                              setSelectedSubcontractorFilter(selectedSubcontractorFilter.filter(id => id !== subcontractor.id.toString()));
                            }
                          }}
                        />
                        <Label htmlFor={`subcontractor-${subcontractor.id}`} className="text-sm">
                          {subcontractor.name}
                        </Label>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500">No subcontractors available</p>
                  )}
                </div>
              </div>
            </div>

            {/* Clear Filters Button */}
            <div className="flex justify-end mt-4 space-x-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  setSelectedStaffFilter([]);
                  setSelectedSubcontractorFilter([]);
                }}
              >
                Clear All Filters
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

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
              events={filteredEvents.filter(e => 
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
      <Dialog 
        open={showAddEvent} 
        onOpenChange={(open) => {
          setShowAddEvent(open);
          if (!open && onCloseAddEvent) {
            onCloseAddEvent();
          }
        }}
      >
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
            
            {/* Staff Assignment Type */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="assignment-type" className="text-right">
                Asignar a
              </Label>
              <div className="col-span-3">
                <Select 
                  value={newEvent.assignedType}
                  onValueChange={(value) => setNewEvent({...newEvent, assignedType: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="staff">Personal interno</SelectItem>
                    <SelectItem value="subcontractor">Subcontratista</SelectItem>
                    <SelectItem value="none">Sin asignar</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {/* Staff Selection */}
            {newEvent.assignedType === 'staff' && (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="assigned-staff" className="text-right">
                  Personal
                </Label>
                <div className="col-span-3">
                  <ScrollArea className="h-40 rounded-md border">
                    <div className="p-4">
                      {staff.map((staffMember) => (
                        <div key={staffMember.id} className="flex items-center space-x-2 mb-2">
                          <Checkbox 
                            id={`staff-${staffMember.id}`} 
                            checked={newEvent.assignedStaff.includes(staffMember.name)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setNewEvent({
                                  ...newEvent, 
                                  assignedStaff: [...newEvent.assignedStaff, staffMember.name]
                                });
                              } else {
                                setNewEvent({
                                  ...newEvent, 
                                  assignedStaff: newEvent.assignedStaff.filter(name => name !== staffMember.name)
                                });
                              }
                            }}
                          />
                          <Label htmlFor={`staff-${staffMember.id}`}>{staffMember.name}</Label>
                        </div>
                      ))}
                      {staff.length === 0 && (
                        <div className="text-center py-2 text-muted-foreground">
                          No hay personal disponible
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </div>
              </div>
            )}
            
            {/* Subcontractor Selection */}
            {newEvent.assignedType === 'subcontractor' && (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="assigned-subcontractor" className="text-right">
                  Subcontratista
                </Label>
                <div className="col-span-3">
                  <Select 
                    value={newEvent.assignedStaff.length > 0 ? newEvent.assignedStaff[0] : ""}
                    onValueChange={(value) => {
                      setNewEvent({
                        ...newEvent,
                        assignedStaff: [value]
                      });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar subcontratista" />
                    </SelectTrigger>
                    <SelectContent>
                      {subcontractors.length > 0 ? (
                        subcontractors.map((subcontractor) => (
                          <SelectItem 
                            key={subcontractor.id} 
                            value={subcontractor.name}
                          >
                            {subcontractor.name} ({subcontractor.company})
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="" disabled>
                          No hay subcontratistas disponibles
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
            
            {/* No Assignment Message */}
            {newEvent.assignedType === 'none' && (
              <div className="grid grid-cols-4 items-center gap-4">
                <div className="col-span-4 text-center py-2 text-muted-foreground">
                  Este evento no será asignado a ningún miembro del personal o subcontratista.
                </div>
              </div>
            )}
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
                    staffAssigned: newEvent.assignedStaff.length > 0 ? newEvent.assignedStaff : undefined,
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