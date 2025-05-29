import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { insertProjectSchema } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarIcon, Upload, X, FileText, Image } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { StaffAssignment } from "@/components/staff-assignment";
import { ImageUpload } from "@/components/ui/image-upload";

// Extend the schema to handle the form
const formSchema = insertProjectSchema
  .extend({
    startDate: z.date().optional(),
    dueDate: z.date().optional(),
  })
  .omit({ 
    assignedStaff: true,
    images: true,
    documents: true
  });

type ProjectFormValues = z.infer<typeof formSchema>;

interface ProjectFormProps {
  initialData?: ProjectFormValues & { id?: number; assignedStaff?: number[] };
  onSuccess: () => void;
}

export function ProjectForm({ initialData, onSuccess }: ProjectFormProps) {
  const { toast } = useToast();
  const [assignedStaff, setAssignedStaff] = useState<number[]>(
    initialData?.assignedStaff || []
  );
  const [images, setImages] = useState<string[]>(
    initialData?.images as string[] || []
  );
  const [documents, setDocuments] = useState<any[]>(
    initialData?.documents as any[] || []
  );

  // Fetch clients for the dropdown
  const { data: clients } = useQuery({
    queryKey: ["/api/clients"],
    queryFn: async () => {
      const res = await fetch("/api/clients");
      if (!res.ok) throw new Error("Failed to fetch clients");
      return res.json();
    },
  });

  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData || {
      title: "",
      description: "",
      address: "",
      serviceType: "",
      status: "pending",
      priority: "medium",
      progress: 0,
    },
  });

  // Create or update mutation
  const mutation = useMutation({
    mutationFn: async (data: ProjectFormValues) => {
      // Include images and documents in the submission
      const projectData = {
        ...data,
        assignedStaff,
        images,
        documents,
      };

      if (initialData?.id) {
        // Update
        return apiRequest("PUT", `/api/projects/${initialData.id}`, projectData);
      } else {
        // Create
        return apiRequest("POST", "/api/projects", projectData);
      }
    },
    onSuccess: () => {
      toast({
        title: initialData?.id
          ? "Proyecto actualizado"
          : "Proyecto creado",
        description: initialData?.id
          ? "El proyecto ha sido actualizado exitosamente"
          : "El proyecto ha sido creado exitosamente",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      onSuccess();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `No se pudo ${initialData?.id ? "actualizar" : "crear"} el proyecto: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ProjectFormValues) => {
    // Asegurarse de que las fechas sean instancias de Date antes de enviarlas
    // El backend espera objetos Date, no strings
    mutation.mutate({
      ...data,
      startDate: data.startDate instanceof Date ? data.startDate : undefined,
      dueDate: data.dueDate instanceof Date ? data.dueDate : undefined,
      assignedStaff,
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Título del Proyecto</FormLabel>
                <FormControl>
                  <Input placeholder="Ej: Pintura Casa Familia Torres" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="clientId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Cliente</FormLabel>
                <Select
                  onValueChange={(value) => {
                    const clientId = parseInt(value);
                    field.onChange(clientId);
                    
                    // Auto-populate address when client is selected
                    const selectedClient = clients?.find(client => client.id === clientId);
                    if (selectedClient?.address) {
                      form.setValue('address', selectedClient.address);
                    }
                  }}
                  value={field.value?.toString()}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccione un cliente" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {clients?.map((client) => (
                      <SelectItem key={client.id} value={client.id.toString()}>
                        {client.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descripción</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Describa el proyecto y sus detalles"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Dirección</FormLabel>
              <FormControl>
                <Input
                  placeholder="Dirección completa del proyecto"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="serviceType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo de Servicio</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccione el tipo de servicio" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Pintura Interior">Pintura Interior</SelectItem>
                    <SelectItem value="Pintura Exterior">Pintura Exterior</SelectItem>
                    <SelectItem value="Pintura Interior y Exterior">Pintura Interior y Exterior</SelectItem>
                    <SelectItem value="Pintura Industrial">Pintura Industrial</SelectItem>
                    <SelectItem value="Pintura Comercial">Pintura Comercial</SelectItem>
                    <SelectItem value="Pintura Residencial">Pintura Residencial</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="projectType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo de Proyecto</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccione el tipo de proyecto" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="residential">Residencial</SelectItem>
                    <SelectItem value="commercial">Comercial</SelectItem>
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
            name="priority"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Prioridad</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccione la prioridad" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="high">Alta</SelectItem>
                    <SelectItem value="medium">Media</SelectItem>
                    <SelectItem value="low">Baja</SelectItem>
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
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Estado</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccione el estado" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
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
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="progress"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Progreso (%)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    {...field}
                    onChange={(e) => field.onChange(parseInt(e.target.value || "0"))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="startDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Fecha de Inicio</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "PPP", { locale: es })
                        ) : (
                          <span>Seleccione una fecha</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="dueDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Fecha de Entrega</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "PPP", { locale: es })
                        ) : (
                          <span>Seleccione una fecha</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Project Images Section */}
        <div className="space-y-4">
          <FormLabel className="text-base font-semibold">Imágenes del Proyecto</FormLabel>
          <div className="grid gap-4">
            <ImageUpload
              value={images}
              onChange={setImages}
              label="Agregar imágenes"
            />
          </div>
        </div>

        {/* Project Documents Section */}
        <div className="space-y-4">
          <FormLabel className="text-base font-semibold">Documentos del Proyecto</FormLabel>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
            <div className="text-center">
              <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <div className="flex flex-col items-center">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.multiple = true;
                    input.accept = '.pdf,.doc,.docx,.txt,.xls,.xlsx';
                    input.onchange = (e) => {
                      const files = Array.from((e.target as HTMLInputElement).files || []);
                      const newDocs = files.map(file => ({
                        name: file.name,
                        size: file.size,
                        type: file.type,
                        url: URL.createObjectURL(file)
                      }));
                      setDocuments([...documents, ...newDocs]);
                    };
                    input.click();
                  }}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Subir Documentos
                </Button>
                <p className="text-sm text-gray-500 mt-2">
                  PDF, DOC, DOCX, TXT, XLS, XLSX (máx. 10MB por archivo)
                </p>
              </div>
            </div>
            
            {/* Display uploaded documents */}
            {documents.length > 0 && (
              <div className="mt-4 space-y-2">
                <h4 className="font-medium text-sm text-gray-700">Documentos subidos:</h4>
                {documents.map((doc, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <div className="flex items-center space-x-2">
                      <FileText className="h-4 w-4 text-gray-500" />
                      <span className="text-sm">{doc.name}</span>
                      <span className="text-xs text-gray-400">
                        ({Math.round(doc.size / 1024)} KB)
                      </span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setDocuments(documents.filter((_, i) => i !== index));
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div>
          <FormLabel>Personal Asignado</FormLabel>
          <StaffAssignment
            selectedStaff={assignedStaff}
            onChange={setAssignedStaff}
          />
        </div>

        <div className="flex justify-end space-x-2">
          <Button
            type="button"
            variant="outline"
            onClick={onSuccess}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={mutation.isPending}
          >
            {mutation.isPending
              ? "Guardando..."
              : initialData?.id
              ? "Actualizar Proyecto"
              : "Crear Proyecto"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
