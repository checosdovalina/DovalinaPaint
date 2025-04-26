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
import { Calendar as CalendarIcon } from "lucide-react";
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
        name: z.string(),
        quantity: z.number(),
        unitPrice: z.number(),
        total: z.number(),
      })
    ).optional(),
    laborItems: z.array(
      z.object({
        description: z.string(),
        hours: z.number(),
        hourlyRate: z.number(),
        total: z.number(),
      })
    ).optional(),
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

  // Calculate totals
  const materialsTotal = materialItems.reduce((sum, item) => sum + item.total, 0);
  const laborTotal = laborItems.reduce((sum, item) => sum + item.total, 0);
  const totalEstimate = materialsTotal + laborTotal;

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
        totalEstimate,
      };

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
    onError: (error) => {
      toast({
        title: "Error",
        description: `No se pudo ${initialData?.id ? "actualizar" : "crear"} el presupuesto: ${error.message}`,
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
    mutation.mutate({
      ...data,
      totalEstimate,
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                  {projects?.map((project) => (
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notas</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Notas o condiciones adicionales del presupuesto"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Card>
          <CardContent className="pt-6">
            <div className="mb-4">
              <h3 className="text-lg font-medium">Materiales</h3>
              <div className="space-y-2 mt-3">
                {materialItems.map((item, index) => (
                  <div key={item.id} className="grid grid-cols-12 gap-2 items-center">
                    <div className="col-span-4">
                      <Input
                        placeholder="Descripción"
                        value={item.name}
                        onChange={(e) =>
                          updateMaterialItem(item.id, "name", e.target.value)
                        }
                      />
                    </div>
                    <div className="col-span-2">
                      <Input
                        type="number"
                        placeholder="Cantidad"
                        value={item.quantity}
                        onChange={(e) =>
                          updateMaterialItem(
                            item.id,
                            "quantity",
                            parseFloat(e.target.value) || 0
                          )
                        }
                      />
                    </div>
                    <div className="col-span-2">
                      <Input
                        type="number"
                        placeholder="Precio unitario"
                        value={item.unitPrice}
                        onChange={(e) =>
                          updateMaterialItem(
                            item.id,
                            "unitPrice",
                            parseFloat(e.target.value) || 0
                          )
                        }
                      />
                    </div>
                    <div className="col-span-3">
                      <Input
                        type="number"
                        placeholder="Total"
                        value={item.total}
                        readOnly
                      />
                    </div>
                    <div className="col-span-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeMaterialItem(item.id)}
                        disabled={materialItems.length <= 1}
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
                className="mt-2"
              >
                + Agregar Material
              </Button>
              <div className="flex justify-end mt-2">
                <div className="text-sm font-medium">
                  Subtotal Materiales: ${materialsTotal.toFixed(2)}
                </div>
              </div>
            </div>

            <div className="mb-4">
              <h3 className="text-lg font-medium">Mano de Obra</h3>
              <div className="space-y-2 mt-3">
                {laborItems.map((item, index) => (
                  <div key={item.id} className="grid grid-cols-12 gap-2 items-center">
                    <div className="col-span-4">
                      <Input
                        placeholder="Descripción"
                        value={item.description}
                        onChange={(e) =>
                          updateLaborItem(item.id, "description", e.target.value)
                        }
                      />
                    </div>
                    <div className="col-span-2">
                      <Input
                        type="number"
                        placeholder="Horas"
                        value={item.hours}
                        onChange={(e) =>
                          updateLaborItem(
                            item.id,
                            "hours",
                            parseFloat(e.target.value) || 0
                          )
                        }
                      />
                    </div>
                    <div className="col-span-2">
                      <Input
                        type="number"
                        placeholder="Precio por hora"
                        value={item.hourlyRate}
                        onChange={(e) =>
                          updateLaborItem(
                            item.id,
                            "hourlyRate",
                            parseFloat(e.target.value) || 0
                          )
                        }
                      />
                    </div>
                    <div className="col-span-3">
                      <Input
                        type="number"
                        placeholder="Total"
                        value={item.total}
                        readOnly
                      />
                    </div>
                    <div className="col-span-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeLaborItem(item.id)}
                        disabled={laborItems.length <= 1}
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
                className="mt-2"
              >
                + Agregar Mano de Obra
              </Button>
              <div className="flex justify-end mt-2">
                <div className="text-sm font-medium">
                  Subtotal Mano de Obra: ${laborTotal.toFixed(2)}
                </div>
              </div>
            </div>

            <div className="border-t pt-4 flex justify-between items-center">
              <h3 className="text-lg font-bold">Total del Presupuesto</h3>
              <div className="text-xl font-bold">${totalEstimate.toFixed(2)}</div>
            </div>
          </CardContent>
        </Card>

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
              ? "Actualizar Presupuesto"
              : "Crear Presupuesto"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
