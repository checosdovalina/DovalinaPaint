import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Staff } from "@shared/schema";
import { Layout } from "@/components/layout";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { insertStaffSchema } from "@shared/schema";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  Plus,
  Mail,
  Phone,
  Edit,
  Trash,
  CheckCircle,
  XCircle,
  Clock,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import worker1 from "@/assets/images/worker1.svg";
import worker2 from "@/assets/images/worker2.svg";
import worker3 from "@/assets/images/worker3.svg";
import worker4 from "@/assets/images/worker4.svg";

// Extend the schema to handle the form
const formSchema = insertStaffSchema.extend({
  skills: z.array(z.string()).optional(),
});

type StaffFormValues = z.infer<typeof formSchema>;

export default function Personnel() {
  const [showStaffForm, setShowStaffForm] = useState(false);
  const [staffToEdit, setStaffToEdit] = useState<Staff | null>(null);
  const [staffToDelete, setStaffToDelete] = useState<Staff | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [availabilityFilter, setAvailabilityFilter] = useState("all");
  const { toast } = useToast();

  // Fetch staff members
  const { data: staffMembers, isLoading } = useQuery<Staff[]>({
    queryKey: ["/api/staff"],
    queryFn: async () => {
      const res = await fetch("/api/staff");
      if (!res.ok) throw new Error("Failed to fetch staff");
      return res.json();
    },
  });

  const form = useForm<StaffFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      role: "",
      email: "",
      phone: "",
      availability: "available",
      skills: [],
      avatar: "",
    },
  });

  // Reset form when staffToEdit changes
  useEffect(() => {
    if (staffToEdit) {
      form.reset({
        name: staffToEdit.name,
        role: staffToEdit.role,
        email: staffToEdit.email || "",
        phone: staffToEdit.phone,
        availability: staffToEdit.availability,
        skills: staffToEdit.skills as string[] || [],
        avatar: staffToEdit.avatar || "",
      });
    } else {
      form.reset({
        name: "",
        role: "",
        email: "",
        phone: "",
        availability: "available",
        skills: [],
        avatar: "",
      });
    }
  }, [staffToEdit, form]);

  const mutation = useMutation({
    mutationFn: async (data: StaffFormValues) => {
      if (staffToEdit?.id) {
        // Update
        return apiRequest("PUT", `/api/staff/${staffToEdit.id}`, data);
      } else {
        // Create
        return apiRequest("POST", "/api/staff", data);
      }
    },
    onSuccess: () => {
      toast({
        title: staffToEdit?.id
          ? "Personal actualizado"
          : "Personal creado",
        description: staffToEdit?.id
          ? "El miembro del personal ha sido actualizado exitosamente"
          : "El miembro del personal ha sido añadido exitosamente",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/staff"] });
      handleCloseForm();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `No se pudo ${staffToEdit?.id ? "actualizar" : "crear"} el miembro del personal: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const handleEditStaff = (staff: Staff) => {
    setStaffToEdit(staff);
    setShowStaffForm(true);
  };

  const handleNewStaff = () => {
    setStaffToEdit(null);
    setShowStaffForm(true);
  };

  const handleCloseForm = () => {
    setShowStaffForm(false);
    setStaffToEdit(null);
  };

  const handleDeleteClick = (staff: Staff) => {
    setStaffToDelete(staff);
  };

  const handleDeleteConfirm = async () => {
    if (!staffToDelete) return;

    try {
      await apiRequest("DELETE", `/api/staff/${staffToDelete.id}`, undefined);
      
      toast({
        title: "Personal eliminado",
        description: "El miembro del personal ha sido eliminado exitosamente",
      });
      
      queryClient.invalidateQueries({ queryKey: ["/api/staff"] });
    } catch (error) {
      toast({
        title: "Error",
        description: `No se pudo eliminar el miembro del personal: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setStaffToDelete(null);
    }
  };

  const onSubmit = (data: StaffFormValues) => {
    mutation.mutate(data);
  };

  // Filter staff members
  const filteredStaff = staffMembers?.filter(staff => {
    // Filter by availability
    if (availabilityFilter !== "all" && staff.availability !== availabilityFilter) {
      return false;
    }
    
    // Filter by search term
    if (searchTerm) {
      const searchTermLower = searchTerm.toLowerCase();
      return (
        staff.name.toLowerCase().includes(searchTermLower) ||
        staff.role.toLowerCase().includes(searchTermLower) ||
        (staff.email && staff.email.toLowerCase().includes(searchTermLower)) ||
        staff.phone.toLowerCase().includes(searchTermLower)
      );
    }
    
    return true;
  });

  // Helper to get availability badge
  const getAvailabilityBadge = (availability: string) => {
    switch (availability) {
      case "available":
        return <Badge className="bg-green-100 text-green-800">Disponible</Badge>;
      case "assigned":
        return <Badge className="bg-blue-100 text-blue-800">Asignado</Badge>;
      case "on_leave":
        return <Badge className="bg-yellow-100 text-yellow-800">Permiso</Badge>;
      default:
        return <Badge variant="outline">{availability}</Badge>;
    }
  };

  // Helper to get availability label
  const getAvailabilityLabel = (availability: string) => {
    switch (availability) {
      case "available":
        return "Disponible";
      case "assigned":
        return "Asignado";
      case "on_leave":
        return "Permiso";
      default:
        return availability;
    }
  };

  // Helper to get staff avatar
  const getStaffAvatar = (staff: Staff) => {
    if (staff.avatar) {
      return staff.avatar;
    }
    
    // Map staff id to avatar images
    switch (staff.id % 4) {
      case 0: return worker1;
      case 1: return worker2;
      case 2: return worker3;
      case 3: return worker4;
      default: return worker1;
    }
  };

  return (
    <Layout title="Control de Personal">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-2 w-full max-w-md">
          <div className="relative w-full">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar personal..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
          <Select
            value={availabilityFilter}
            onValueChange={setAvailabilityFilter}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Disponibilidad" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="available">Disponible</SelectItem>
              <SelectItem value="assigned">Asignado</SelectItem>
              <SelectItem value="on_leave">Permiso</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={handleNewStaff}>
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Personal
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
        </div>
      ) : filteredStaff && filteredStaff.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStaff.map((staff) => (
            <Card key={staff.id} className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={getStaffAvatar(staff)} alt={staff.name} />
                      <AvatarFallback>
                        {staff.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-lg">{staff.name}</CardTitle>
                      <p className="text-sm text-gray-500">{staff.role}</p>
                    </div>
                  </div>
                  {getAvailabilityBadge(staff.availability)}
                </div>
              </CardHeader>
              <CardContent className="pb-2 space-y-2">
                {staff.email && (
                  <div className="flex items-center text-sm">
                    <Mail className="h-4 w-4 mr-2 text-gray-400" />
                    <span>{staff.email}</span>
                  </div>
                )}
                <div className="flex items-center text-sm">
                  <Phone className="h-4 w-4 mr-2 text-gray-400" />
                  <span>{staff.phone}</span>
                </div>
                {staff.skills && (staff.skills as string[]).length > 0 && (
                  <div className="mt-3">
                    <Label className="text-xs text-gray-500 mb-1 block">Habilidades:</Label>
                    <div className="flex flex-wrap gap-1">
                      {(staff.skills as string[]).map((skill, index) => (
                        <Badge key={index} variant="outline" className="text-xs bg-gray-50">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
              <CardFooter className="pt-2 flex justify-end space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  onClick={() => handleDeleteClick(staff)}
                >
                  <Trash className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEditStaff(staff)}
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Editar
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 text-gray-500">
          {searchTerm || availabilityFilter !== "all"
            ? "No se encontraron miembros del personal con los filtros aplicados"
            : "No hay miembros del personal registrados. Cree uno nuevo haciendo clic en 'Nuevo Personal'"}
        </div>
      )}

      {/* Staff Form Dialog */}
      <Dialog open={showStaffForm} onOpenChange={setShowStaffForm}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {staffToEdit ? "Editar Personal" : "Nuevo Personal"}
            </DialogTitle>
            <DialogDescription>
              {staffToEdit
                ? "Modifique los datos del miembro del personal según sea necesario"
                : "Complete el formulario para registrar un nuevo miembro del personal"}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre Completo</FormLabel>
                      <FormControl>
                        <Input placeholder="Juan Pérez" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cargo / Rol</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccione un rol" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Painter">Pintor</SelectItem>
                          <SelectItem value="Project Manager">Gerente de Proyecto</SelectItem>
                          <SelectItem value="Assistant">Asistente</SelectItem>
                          <SelectItem value="Supervisor">Supervisor</SelectItem>
                          <SelectItem value="Technician">Técnico</SelectItem>
                          <SelectItem value="Administrative">Administrativo</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Correo Electrónico</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="correo@ejemplo.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Teléfono</FormLabel>
                      <FormControl>
                        <Input placeholder="555-1234" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="availability"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Disponibilidad</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccione la disponibilidad" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="available">Disponible</SelectItem>
                        <SelectItem value="assigned">Asignado</SelectItem>
                        <SelectItem value="on_leave">Permiso</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="skills"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Habilidades</FormLabel>
                    <div className="space-y-2">
                      <div className="flex flex-wrap gap-2">
                        {["interior", "exterior", "commercial", "industrial", "residential", "management", "client relations"].map((skill) => (
                          <Label
                            key={skill}
                            className={`px-3 py-1 rounded-full text-xs cursor-pointer border transition-colors ${
                              field.value?.includes(skill)
                                ? "bg-primary text-white border-primary"
                                : "bg-white text-gray-800 border-gray-300 hover:bg-gray-50"
                            }`}
                            onClick={() => {
                              const currentSkills = field.value || [];
                              if (currentSkills.includes(skill)) {
                                field.onChange(currentSkills.filter(s => s !== skill));
                              } else {
                                field.onChange([...currentSkills, skill]);
                              }
                            }}
                          >
                            {skill}
                          </Label>
                        ))}
                      </div>
                      <p className="text-xs text-gray-500">Haga clic en las habilidades para seleccionarlas/deseleccionarlas</p>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCloseForm}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={mutation.isPending}
                >
                  {mutation.isPending
                    ? "Guardando..."
                    : staffToEdit?.id
                    ? "Actualizar Personal"
                    : "Crear Personal"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!staffToDelete}
        onOpenChange={(open) => !open && setStaffToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar Personal?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El miembro del personal será eliminado permanentemente del sistema.
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
