import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { insertQuoteSchema } from "@shared/schema";
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
import { Calendar as CalendarIcon, FileDown, Printer } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";

// Extend the schema to handle the form
const formSchema = insertQuoteSchema
  .extend({
    sentDate: z.date().optional(),
    validUntil: z.date().optional(),
    // For materials and labor estimates
    materialItems: z.array(
      z.object({
        id: z.string().optional(), // Unique ID for each material item
        name: z.string().min(1, "El nombre del material es requerido"),
        quantity: z.number().min(0.01, "La cantidad debe ser mayor a 0"),
        unitPrice: z.number().min(0.01, "El precio unitario debe ser mayor a 0"),
        total: z.number().optional(),
      })
    ).optional().default([]),
    laborItems: z.array(
      z.object({
        id: z.string().optional(), // Unique ID for each labor item
        description: z.string().min(1, "La descripción es requerida"),
        hours: z.number().min(0.1, "Las horas deben ser mayores a 0"),
        hourlyRate: z.number().min(0.01, "La tarifa por hora debe ser mayor a 0"),
        total: z.number().optional(),
      })
    ).optional().default([]),
    additionalCosts: z.number().min(0).default(0),
    profitMargin: z.number().min(0).max(100).default(25),
    subtotal: z.number().optional(),
  })
  .transform((data) => {
    // Transform the nested structures to JSON compatible types
    const materialItems = Array.isArray(data.materialItems) ? data.materialItems.map(item => ({
      ...item,
      total: item.total ?? (item.quantity * item.unitPrice)
    })) : [];
    
    const laborItems = Array.isArray(data.laborItems) ? data.laborItems.map(item => ({
      ...item,
      total: item.total ?? (item.hours * item.hourlyRate)
    })) : [];
    
    // Calculate subtotals
    const materialsSubtotal = materialItems.reduce((sum, item) => sum + (item.total || 0), 0);
    const laborSubtotal = laborItems.reduce((sum, item) => sum + (item.total || 0), 0);
    
    // Calculate the raw subtotal
    const subtotal = materialsSubtotal + laborSubtotal + (data.additionalCosts || 0);
    
    // Calculate the subtotal without additional costs for profit margin calculation
    const baseSubtotal = materialsSubtotal + laborSubtotal;
    
    // Apply profit margin to base subtotal (materials + labor only)
    const profitAmount = baseSubtotal * (data.profitMargin / 100);
    
    // Calculate total with additional costs and profit margin
    const totalEstimate = baseSubtotal + (data.additionalCosts || 0) + profitAmount;
    
    return {
      ...data,
      materialsEstimate: materialItems,
      laborEstimate: laborItems,
      totalEstimate: Math.round(totalEstimate * 100) / 100, // Round to 2 decimal places
    };
  });

type QuoteFormValues = z.infer<typeof formSchema>;

interface MaterialItem {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface LaborItem {
  id: string;
  description: string;
  hours: number;
  hourlyRate: number;
  total: number;
}

interface QuoteFormProps {
  initialData?: QuoteFormValues & { id?: number };
  onSuccess: () => void;
}

export function QuoteForm({ initialData, onSuccess }: QuoteFormProps) {
  const { toast } = useToast();
  const [materialItems, setMaterialItems] = useState<MaterialItem[]>(
    (initialData?.materialsEstimate as any) || [
      { id: "1", name: "", quantity: 0, unitPrice: 0, total: 0 },
    ]
  );
  const [laborItems, setLaborItems] = useState<LaborItem[]>(
    (initialData?.laborEstimate as any) || [
      { id: "1", description: "", hours: 0, hourlyRate: 0, total: 0 },
    ]
  );
  const [profitMargin, setProfitMargin] = useState<number>(
    initialData?.profitMargin || 25
  );
  const [additionalCosts, setAdditionalCosts] = useState<number>(
    initialData?.additionalCosts || 0
  );

  // Calculate totals
  const materialsTotal = materialItems.reduce((sum, item) => sum + item.total, 0);
  const laborTotal = laborItems.reduce((sum, item) => sum + item.total, 0);
  
  // Base subtotal for profit margin calculation (materials + labor only)
  const baseSubtotal = materialsTotal + laborTotal;
  
  // Full subtotal including additional costs
  const subtotal = baseSubtotal + additionalCosts;
  
  // Calculate profit amount based on materials and labor only
  const profitAmount = baseSubtotal * (profitMargin / 100);
  
  // Total estimate includes materials, labor, additional costs, and profit
  const totalEstimate = baseSubtotal + additionalCosts + profitAmount;

  // Fetch projects for the dropdown
  const { data: projects } = useQuery({
    queryKey: ["/api/projects"],
    queryFn: async () => {
      const res = await fetch("/api/projects");
      if (!res.ok) throw new Error("Failed to fetch projects");
      return res.json();
    },
  });

  const form = useForm<QuoteFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      ...initialData,
      totalEstimate: initialData?.totalEstimate || 0,
    },
  });

  // Create or update mutation
  const mutation = useMutation({
    mutationFn: async (data: QuoteFormValues) => {
      // Prepare the data
      const quoteData = {
        ...data,
        materialsEstimate: materialItems,
        laborEstimate: laborItems,
        profitMargin,
        totalEstimate,
      };
      
      console.log("Enviando datos al servidor:", quoteData);

      if (initialData?.id) {
        // Update
        return apiRequest("PUT", `/api/quotes/${initialData.id}`, quoteData);
      } else {
        // Create
        return apiRequest("POST", "/api/quotes", quoteData);
      }
    },
    onSuccess: () => {
      toast({
        title: initialData?.id
          ? "Presupuesto actualizado"
          : "Presupuesto creado",
        description: initialData?.id
          ? "El presupuesto ha sido actualizado exitosamente"
          : "El presupuesto ha sido creado exitosamente",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/quotes"] });
      onSuccess();
    },
    onError: (error: any) => {
      console.error("Error details:", error);
      
      // Intenta analizar la respuesta del error para obtener los detalles del servidor
      let errorMessage = error.message;
      try {
        if (error.response) {
          const data = error.response.json();
          if (data && data.errors) {
            console.error("Validation errors:", data.errors);
            errorMessage += " - " + JSON.stringify(data.errors);
          }
        }
      } catch (parseError) {
        console.error("Error parsing error response:", parseError);
      }
      
      toast({
        title: "Error",
        description: `No se pudo ${initialData?.id ? "actualizar" : "crear"} el presupuesto: ${errorMessage}`,
        variant: "destructive",
      });
    },
  });

  const addMaterialItem = () => {
    setMaterialItems([
      ...materialItems,
      {
        id: Date.now().toString(),
        name: "",
        quantity: 0,
        unitPrice: 0,
        total: 0,
      },
    ]);
  };

  const updateMaterialItem = (id: string, field: keyof MaterialItem, value: string | number) => {
    setMaterialItems(
      materialItems.map((item) => {
        if (item.id === id) {
          const updated = { ...item, [field]: value };
          
          // Recalculate total if quantity or unitPrice was changed
          if (field === "quantity" || field === "unitPrice") {
            updated.total = updated.quantity * updated.unitPrice;
          }
          
          return updated;
        }
        return item;
      })
    );
  };

  const removeMaterialItem = (id: string) => {
    if (materialItems.length > 1) {
      setMaterialItems(materialItems.filter((item) => item.id !== id));
    }
  };

  const addLaborItem = () => {
    setLaborItems([
      ...laborItems,
      {
        id: Date.now().toString(),
        description: "",
        hours: 0,
        hourlyRate: 0,
        total: 0,
      },
    ]);
  };

  const updateLaborItem = (id: string, field: keyof LaborItem, value: string | number) => {
    setLaborItems(
      laborItems.map((item) => {
        if (item.id === id) {
          const updated = { ...item, [field]: value };
          
          // Recalculate total if hours or hourlyRate was changed
          if (field === "hours" || field === "hourlyRate") {
            updated.total = updated.hours * updated.hourlyRate;
          }
          
          return updated;
        }
        return item;
      })
    );
  };

  const removeLaborItem = (id: string) => {
    if (laborItems.length > 1) {
      setLaborItems(laborItems.filter((item) => item.id !== id));
    }
  };

  const onSubmit = (data: QuoteFormValues) => {
    // materialItems y laborItems se convierten en materialsEstimate y laborEstimate mediante la transformación de formSchema
    const formData = {
      ...data,
      materialItems: materialItems, // Estos se convertirán a materialsEstimate
      laborItems: laborItems,       // Estos se convertirán a laborEstimate
      additionalCosts: additionalCosts,
      profitMargin: profitMargin,
      totalEstimate: totalEstimate,
    };
    
    mutation.mutate(formData);
  };

  // Función para generar el PDF de la cotización
  const generateQuotePDF = () => {
    // Esta función se implementará más adelante
    toast({
      title: "Generando PDF",
      description: "El PDF de la cotización se está generando...",
    });
    // TODO: Implementar la generación de PDF usando una librería como jsPDF o React-PDF
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="max-h-[70vh] overflow-y-auto pr-2">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-xl font-semibold">
                {initialData?.id ? "Editar Cotización" : "Crear Nueva Cotización"}
              </h2>
              <p className="text-gray-600 mt-1">
                Completa los detalles para la cotización del cliente
              </p>
            </div>
            {initialData?.id && (
              <div className="flex gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={generateQuotePDF} 
                  className="flex items-center gap-2"
                >
                  <FileDown className="h-4 w-4" />
                  Descargar PDF
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={generateQuotePDF} 
                  className="flex items-center gap-2"
                >
                  <Printer className="h-4 w-4" />
                  Imprimir
                </Button>
              </div>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <FormField
              control={form.control}
              name="projectId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Proyecto</FormLabel>
                  <Select
                    onValueChange={(value) => field.onChange(parseInt(value))}
                    defaultValue={field.value?.toString()}
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
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Estado</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccione el estado" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="draft">Borrador</SelectItem>
                      <SelectItem value="sent">Enviado</SelectItem>
                      <SelectItem value="approved">Aprobado</SelectItem>
                      <SelectItem value="rejected">Rechazado</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <FormField
              control={form.control}
              name="sentDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Fecha de Envío</FormLabel>
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
              name="validUntil"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Válido Hasta</FormLabel>
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
          
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="mb-6">
                <h3 className="text-lg font-medium mb-3">Desglose de Materiales</h3>
                <div className="space-y-3">
                  {materialItems.map((item) => (
                    <div key={item.id} className="grid grid-cols-12 gap-2 items-center">
                      <div className="col-span-5">
                        <Input
                          placeholder="Descripción del material"
                          value={item.name}
                          onChange={(e) => updateMaterialItem(item.id, "name", e.target.value)}
                        />
                      </div>
                      <div className="col-span-2">
                        <Input
                          type="number"
                          min="0.01"
                          step="0.01"
                          placeholder="Cantidad"
                          value={item.quantity}
                          onChange={(e) => {
                            const numValue = e.target.value === '' ? 0 : Number(e.target.value);
                            updateMaterialItem(item.id, "quantity", numValue);
                          }}
                        />
                      </div>
                      <div className="col-span-2">
                        <Input
                          type="number"
                          min="0.01"
                          step="0.01"
                          placeholder="Precio unitario"
                          value={item.unitPrice}
                          onChange={(e) => {
                            const numValue = e.target.value === '' ? 0 : Number(e.target.value);
                            updateMaterialItem(item.id, "unitPrice", numValue);
                          }}
                        />
                      </div>
                      <div className="col-span-2">
                        <Input
                          type="number"
                          placeholder="Total"
                          value={item.total.toFixed(2)}
                          readOnly
                          className="bg-gray-50"
                        />
                      </div>
                      <div className="col-span-1 flex justify-center">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeMaterialItem(item.id)}
                          disabled={materialItems.length <= 1}
                          className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          ✕
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addMaterialItem}
                  className="mt-3"
                >
                  + Agregar Material
                </Button>
                <div className="flex justify-end mt-3">
                  <div className="text-sm font-medium">
                    Subtotal Materiales: ${materialsTotal.toFixed(2)}
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="text-lg font-medium mb-3">Desglose de Mano de Obra</h3>
                <div className="space-y-3">
                  {laborItems.map((item) => (
                    <div key={item.id} className="grid grid-cols-12 gap-2 items-center">
                      <div className="col-span-5">
                        <Input
                          placeholder="Descripción del trabajo"
                          value={item.description}
                          onChange={(e) => updateLaborItem(item.id, "description", e.target.value)}
                        />
                      </div>
                      <div className="col-span-2">
                        <Input
                          type="number"
                          min="0.1"
                          step="0.1"
                          placeholder="Horas"
                          value={item.hours}
                          onChange={(e) => {
                            // Validar y convertir el valor a número
                            const numValue = e.target.value === '' ? 0 : Number(e.target.value);
                            updateLaborItem(item.id, "hours", numValue);
                          }}
                        />
                      </div>
                      <div className="col-span-2">
                        <Input
                          type="number"
                          min="0.01"
                          step="0.01"
                          placeholder="Tarifa por hora"
                          value={item.hourlyRate}
                          onChange={(e) => {
                            const numValue = e.target.value === '' ? 0 : Number(e.target.value);
                            updateLaborItem(item.id, "hourlyRate", numValue);
                          }}
                        />
                      </div>
                      <div className="col-span-2">
                        <Input
                          type="number"
                          placeholder="Total"
                          value={item.total.toFixed(2)}
                          readOnly
                          className="bg-gray-50"
                        />
                      </div>
                      <div className="col-span-1 flex justify-center">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeLaborItem(item.id)}
                          disabled={laborItems.length <= 1}
                          className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          ✕
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addLaborItem}
                  className="mt-3 text-xs"
                >
                  + Agregar Mano de Obra
                </Button>
                <div className="flex justify-end mt-3">
                  <div className="text-sm font-medium">
                    Subtotal Mano de Obra: ${laborTotal.toFixed(2)}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <h4 className="text-sm font-medium mb-2">Costos Adicionales ($)</h4>
                  <Input 
                    type="number" 
                    min="0"
                    step="0.01"
                    value={additionalCosts} 
                    onChange={(e) => {
                      const numValue = e.target.value === '' ? 0 : Number(e.target.value);
                      setAdditionalCosts(numValue);
                    }} 
                  />
                </div>
                <div>
                  <h4 className="text-sm font-medium mb-2">
                    Margen de Ganancia (%) 
                    <span className="text-xs text-gray-500 ml-2">(Solo visible internamente)</span>
                  </h4>
                  <Input 
                    type="number" 
                    min="0"
                    max="100"
                    step="1"
                    value={profitMargin} 
                    onChange={(e) => {
                      const numValue = e.target.value === '' ? 0 : Number(e.target.value);
                      setProfitMargin(numValue);
                    }} 
                  />
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between mt-2 text-lg font-bold">
                  <span>Total Cotización:</span>
                  <span>${totalEstimate.toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Notas y Condiciones</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Añade detalles adicionales o comentarios sobre la cotización"
                    value={field.value || ''}
                    onChange={field.onChange}
                    className="min-h-[100px]"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end space-x-3 pt-4 border-t">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => onSuccess()}
          >
            Cancelar
          </Button>
          <Button 
            type="submit" 
            disabled={mutation.isPending}
          >
            {mutation.isPending ? (
              <>Guardando...</>
            ) : initialData?.id ? (
              <>Actualizar Cotización</>
            ) : (
              <>Crear Cotización</>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}