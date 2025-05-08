import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Client, Project, insertInvoiceSchema } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import {
  Form,
  FormControl,
  FormDescription,
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
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { CalendarIcon } from "lucide-react";

// Form schema
const invoiceFormSchema = insertInvoiceSchema
  .omit({ invoiceNumber: true })
  .extend({
    issueDate: z.date(),
    dueDate: z.date(),
    totalAmount: z.coerce.number().positive({ message: "El importe debe ser positivo" }),
    status: z.string().optional(),
    notes: z.string().optional(),
  });

type InvoiceFormValues = z.infer<typeof invoiceFormSchema>;

interface InvoiceFormProps {
  invoiceId?: number;
  defaultValues?: Partial<InvoiceFormValues>;
  duplicateFrom?: Invoice;
  onSuccess: () => void;
  onCancel: () => void;
}

export function InvoiceForm({ 
  invoiceId, 
  defaultValues, 
  duplicateFrom,
  onSuccess, 
  onCancel 
}: InvoiceFormProps) {
  const { toast } = useToast();
  
  // Initialize the form with default values
  const form = useForm<InvoiceFormValues>({
    resolver: zodResolver(invoiceFormSchema),
    defaultValues: {
      clientId: defaultValues?.clientId || 0,
      projectId: defaultValues?.projectId || 0,
      totalAmount: defaultValues?.totalAmount || 0,
      issueDate: defaultValues?.issueDate || new Date(),
      dueDate: defaultValues?.dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      status: defaultValues?.status || "draft",
      notes: defaultValues?.notes || "",
    },
  });
  
  // Fetch clients for dropdown
  const { data: clients, isLoading: isLoadingClients } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
  });
  
  // Fetch projects for dropdown, filtered by selected client if any
  const selectedClientId = form.watch("clientId");
  const { data: projects, isLoading: isLoadingProjects } = useQuery<Project[]>({
    queryKey: ["/api/projects", { clientId: selectedClientId }],
    queryFn: async () => {
      if (!selectedClientId) return [];
      const response = await fetch(`/api/projects?clientId=${selectedClientId}`);
      if (!response.ok) throw new Error("Failed to fetch projects");
      return response.json();
    },
    enabled: !!selectedClientId,
  });
  
  // Reset project when client changes
  useEffect(() => {
    if (selectedClientId) {
      form.setValue("projectId", 0);
    }
  }, [selectedClientId, form]);
  
  // Create/update invoice mutation
  const mutation = useMutation({
    mutationFn: async (values: InvoiceFormValues) => {
      if (invoiceId) {
        // Update
        await apiRequest("PUT", `/api/invoices/${invoiceId}`, values);
      } else {
        // Create
        await apiRequest("POST", "/api/invoices", values);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      toast({
        title: invoiceId ? "Factura actualizada" : "Factura creada",
        description: invoiceId
          ? "La factura se ha actualizado correctamente."
          : "La factura se ha creado correctamente.",
      });
      onSuccess();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Error al ${invoiceId ? "actualizar" : "crear"} la factura: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  // Form submission handler
  const onSubmit = (values: InvoiceFormValues) => {
    mutation.mutate(values);
  };
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {/* Client selection */}
          <FormField
            control={form.control}
            name="clientId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Cliente</FormLabel>
                <Select
                  value={field.value.toString()}
                  onValueChange={(value) => field.onChange(parseInt(value))}
                  disabled={isLoadingClients}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar cliente" />
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
          
          {/* Project selection */}
          <FormField
            control={form.control}
            name="projectId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Proyecto</FormLabel>
                <Select
                  value={field.value.toString()}
                  onValueChange={(value) => field.onChange(parseInt(value))}
                  disabled={!selectedClientId || isLoadingProjects}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar proyecto" />
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
        </div>
        
        <Separator />
        
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {/* Issue Date */}
          <FormField
            control={form.control}
            name="issueDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Fecha de emisión</FormLabel>
                <Popover>
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
                          format(field.value, "PPP")
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
                      onSelect={field.onChange}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
          
          {/* Due Date */}
          <FormField
            control={form.control}
            name="dueDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Fecha de vencimiento</FormLabel>
                <Popover>
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
                          format(field.value, "PPP")
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
        
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {/* Total Amount */}
          <FormField
            control={form.control}
            name="totalAmount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Importe total</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    {...field}
                    onChange={(e) => {
                      const value = e.target.value === "" ? "0" : e.target.value;
                      field.onChange(parseFloat(value));
                    }}
                  />
                </FormControl>
                <FormDescription>
                  Importe total de la factura sin impuestos
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          {/* Status */}
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Estado</FormLabel>
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar estado" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="draft">Borrador</SelectItem>
                    <SelectItem value="sent">Enviada</SelectItem>
                    <SelectItem value="paid">Pagada</SelectItem>
                    <SelectItem value="overdue">Vencida</SelectItem>
                    <SelectItem value="cancelled">Cancelada</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        {/* Notes */}
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notas</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Añadir notas o información adicional para esta factura"
                  className="min-h-[100px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="flex justify-end space-x-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            {invoiceId ? "Actualizar factura" : "Crear factura"}
          </Button>
        </div>
      </form>
    </Form>
  );
}