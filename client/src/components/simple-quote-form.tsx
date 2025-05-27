import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery } from "@tanstack/react-query";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
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
import { Calendar as CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useState } from "react";

// Simplified quote schema without cost breakdown
const simpleQuoteSchema = z.object({
  projectId: z.number().min(1, "Debe seleccionar un proyecto"),
  totalEstimate: z.number().min(0, "El total estimado debe ser mayor o igual a 0"),
  scopeOfWork: z.string().min(1, "El alcance del trabajo es requerido"),
  notes: z.string().optional(),
  validUntil: z.date().optional(),
  sentDate: z.date().optional(),
});

type SimpleQuoteFormData = z.infer<typeof simpleQuoteSchema>;

interface SimpleQuoteFormProps {
  initialData?: any;
  onSuccess: () => void;
}

export function SimpleQuoteForm({ initialData, onSuccess }: SimpleQuoteFormProps) {
  const { toast } = useToast();
  const [validUntilOpen, setValidUntilOpen] = useState(false);
  const [sentDateOpen, setSentDateOpen] = useState(false);

  const form = useForm<SimpleQuoteFormData>({
    resolver: zodResolver(simpleQuoteSchema),
    defaultValues: {
      projectId: initialData?.projectId || 0,
      totalEstimate: initialData?.totalEstimate || 0,
      scopeOfWork: initialData?.scopeOfWork || "",
      notes: initialData?.notes || "",
      validUntil: initialData?.validUntil ? new Date(initialData.validUntil) : undefined,
      sentDate: initialData?.sentDate ? new Date(initialData.sentDate) : undefined,
    },
  });

  // Fetch projects
  const { data: projects } = useQuery({
    queryKey: ["/api/projects"],
  });

  const mutation = useMutation({
    mutationFn: async (data: SimpleQuoteFormData) => {
      const endpoint = initialData?.id ? `/api/quotes/${initialData.id}` : "/api/simple-quotes";
      const method = initialData?.id ? "PATCH" : "POST";
      
      const payload = {
        ...data,
        status: "draft",
        // Convert to the format expected by the backend
        materialsEstimate: [],
        laborEstimate: [],
        additionalCosts: [],
        profitMargin: 0,
      };

      const response = await apiRequest(method, endpoint, payload);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/quotes"] });
      toast({
        title: "Éxito",
        description: initialData?.id 
          ? "Presupuesto actualizado exitosamente" 
          : "Presupuesto creado exitosamente",
      });
      onSuccess();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Error al guardar el presupuesto",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: SimpleQuoteFormData) => {
    mutation.mutate(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 max-h-[80vh] overflow-y-auto">
        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="projectId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Proyecto</FormLabel>
                <Select
                  onValueChange={(value) => field.onChange(parseInt(value))}
                  value={field.value?.toString()}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccione un proyecto" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {projects?.map((project: any) => (
                      <SelectItem key={project.id} value={project.id.toString()}>
                        {project.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="totalEstimate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Total Estimado ($)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    {...field}
                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="scopeOfWork"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Alcance del Trabajo</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Describa detalladamente el alcance del trabajo a realizar..."
                  className="min-h-[120px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
              <div className="text-xs text-gray-500 mt-1">
                Puede usar viñetas con "•", "-", "*", o "✓" para crear listas
              </div>
            </FormItem>
          )}
        />

        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="validUntil"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Válido Hasta</FormLabel>
                <Popover open={validUntilOpen} onOpenChange={setValidUntilOpen}>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "PPP", { locale: es })
                        ) : (
                          <span>Seleccionar fecha</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={(date) => {
                        field.onChange(date);
                        setValidUntilOpen(false);
                      }}
                      disabled={(date) => date < new Date()}
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
            name="sentDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Fecha de Envío</FormLabel>
                <Popover open={sentDateOpen} onOpenChange={setSentDateOpen}>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "PPP", { locale: es })
                        ) : (
                          <span>Seleccionar fecha</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={(date) => {
                        field.onChange(date);
                        setSentDateOpen(false);
                      }}
                      disabled={(date) => date > new Date()}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Editable Total Section */}
        <div className="bg-gray-50 p-4 rounded-lg border">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold text-gray-800">Resumen del Presupuesto</h3>
          </div>
          <div className="grid gap-3">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-600">Total del Proyecto:</span>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-500">$</span>
                <FormField
                  control={form.control}
                  name="totalEstimate"
                  render={({ field }) => (
                    <Input
                      type="number"
                      step="0.01"
                      className="w-32 text-right font-semibold"
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    />
                  )}
                />
              </div>
            </div>
            <div className="text-xs text-gray-500">
              El total puede ser editado directamente según las necesidades del proyecto
            </div>
          </div>
        </div>

        {/* Notes Mini Module */}
        <div className="space-y-4">
          <div className="border rounded-lg p-4">
            <h3 className="text-md font-semibold text-gray-800 mb-3">Notas del Presupuesto</h3>
            
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">Notas Internas</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Notas para uso interno del equipo..."
                      className="min-h-[80px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                  <div className="text-xs text-gray-500 mt-1">
                    Estas notas son solo para uso interno y no aparecerán en el presupuesto del cliente
                  </div>
                </FormItem>
              )}
            />

            <div className="mt-4 p-3 bg-blue-50 rounded border border-blue-200">
              <h4 className="text-sm font-medium text-blue-800 mb-2">💡 Consejos para las notas:</h4>
              <ul className="text-xs text-blue-700 space-y-1">
                <li>• Incluye detalles sobre materiales especiales requeridos</li>
                <li>• Menciona consideraciones especiales del cliente</li>
                <li>• Anota cualquier factor que pueda afectar el cronograma</li>
                <li>• Registra conversaciones importantes con el cliente</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-2 pt-4">
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
              ? "Actualizar Presupuesto"
              : "Crear Presupuesto"}
          </Button>
        </div>
      </form>
    </Form>
  );
}