import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { DatePicker } from "@/components/ui/date-picker";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
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
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, AlertCircle } from "lucide-react";

// Define the form validation schema
const paymentFormSchema = z.object({
  date: z.date({
    required_error: "La fecha de pago es requerida.",
  }),
  amount: z.string().min(1, "El monto es requerido."),
  recipientType: z.string().min(1, "El tipo de destinatario es requerido."),
  recipientId: z.string().min(1, "El destinatario es requerido."),
  categoryId: z.string().min(1, "La categoría es requerida."),
  projectId: z.string().optional(),
  purchaseOrderId: z.string().optional(),
  description: z.string().optional(),
  reference: z.string().optional(),
  paymentMethod: z.string().min(1, "El método de pago es requerido."),
});

const paymentMethods = [
  { id: "cash", name: "Efectivo" },
  { id: "check", name: "Cheque" },
  { id: "transfer", name: "Transferencia Bancaria" },
  { id: "credit_card", name: "Tarjeta de Crédito" },
  { id: "debit_card", name: "Tarjeta de Débito" },
  { id: "venmo", name: "Venmo" },
  { id: "paypal", name: "PayPal" },
  { id: "zelle", name: "Zelle" },
  { id: "other", name: "Otro" },
];

const recipientTypes = [
  { id: "subcontractor", name: "Subcontratista" },
  { id: "employee", name: "Empleado" },
  { id: "supplier", name: "Proveedor" },
  { id: "other", name: "Otro" },
];

type PaymentFormProps = {
  payment?: any;
  recipients?: any;
  projects?: any;
  categories?: any;
  onSubmit: () => void;
  onCancel: () => void;
};

export default function PaymentForm({
  payment,
  recipients,
  projects,
  categories,
  onSubmit,
  onCancel,
}: PaymentFormProps) {
  const [selectedRecipientType, setSelectedRecipientType] = useState<string>(
    payment?.recipientType || ""
  );
  const [selectedRecipientId, setSelectedRecipientId] = useState<number | null>(
    payment?.recipientId ? Number(payment.recipientId) : null
  );
  const [filteredRecipients, setFilteredRecipients] = useState<any[]>([]);
  const [supplierPurchaseOrders, setSupplierPurchaseOrders] = useState<any[]>([]);

  // Initialize the form with default values or payment data if editing
  const form = useForm<z.infer<typeof paymentFormSchema>>({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: {
      date: payment ? new Date(payment.date) : new Date(),
      amount: payment ? String(payment.amount) : "",
      recipientType: payment?.recipientType || "",
      recipientId: payment ? String(payment.recipientId) : "",
      categoryId: payment ? String(payment.categoryId) : "",
      projectId: payment?.projectId ? String(payment.projectId) : undefined,
      purchaseOrderId: payment?.purchaseOrderId ? String(payment.purchaseOrderId) : undefined,
      description: payment?.description || "",
      reference: payment?.reference || "",
      paymentMethod: payment?.paymentMethod || "",
    },
  });

  const createPaymentMutation = useMutation({
    mutationFn: async (data: z.infer<typeof paymentFormSchema>) => {
      // Convert amount from string to number
      const paymentData = {
        ...data,
        amount: parseFloat(data.amount),
        // Convert string IDs to numbers where appropriate
        recipientId: parseInt(data.recipientId),
        categoryId: parseInt(data.categoryId),
        projectId: data.projectId ? parseInt(data.projectId) : undefined,
      };
      
      const response = await apiRequest(
        "POST",
        "/api/payments",
        paymentData
      );
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error al crear el pago");
      }
      
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/payments'] });
      onSubmit();
    },
  });

  const updatePaymentMutation = useMutation({
    mutationFn: async (data: z.infer<typeof paymentFormSchema>) => {
      // Convert amount from string to number
      const paymentData = {
        ...data,
        amount: parseFloat(data.amount),
        // Convert string IDs to numbers where appropriate
        recipientId: parseInt(data.recipientId),
        categoryId: parseInt(data.categoryId),
        projectId: data.projectId ? parseInt(data.projectId) : undefined,
      };
      
      const response = await apiRequest(
        "PATCH",
        `/api/payments/${payment.id}`,
        paymentData
      );
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error al actualizar el pago");
      }
      
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/payments'] });
      onSubmit();
    },
  });

  // Watch for changes in recipientType to filter recipients
  useEffect(() => {
    if (recipients && selectedRecipientType) {
      setFilteredRecipients(
        recipients.filter((r: any) => r.type === selectedRecipientType)
      );
    } else {
      setFilteredRecipients([]);
    }
  }, [selectedRecipientType, recipients]);
  
  // Cuando se selecciona un proveedor, cargar sus órdenes de compra pendientes
  useEffect(() => {
    const fetchPurchaseOrders = async () => {
      if (selectedRecipientType === 'supplier' && selectedRecipientId) {
        try {
          const response = await apiRequest('GET', `/api/purchase-orders?supplierId=${selectedRecipientId}&status=draft`);
          const data = await response.json();
          setSupplierPurchaseOrders(data || []);
        } catch (error) {
          console.error('Error fetching purchase orders:', error);
          setSupplierPurchaseOrders([]);
        }
      } else {
        setSupplierPurchaseOrders([]);
      }
    };

    fetchPurchaseOrders();
  }, [selectedRecipientType, selectedRecipientId]);

  // Handle form submission
  const onFormSubmit = (data: z.infer<typeof paymentFormSchema>) => {
    if (payment) {
      updatePaymentMutation.mutate(data);
    } else {
      createPaymentMutation.mutate(data);
    }
  };

  // Handle recipient type change
  const handleRecipientTypeChange = (value: string) => {
    setSelectedRecipientType(value);
    setSelectedRecipientId(null);
    form.setValue("recipientId", "");
    form.setValue("purchaseOrderId", undefined);
  };
  
  // Handle recipient selection
  const handleRecipientChange = (value: string) => {
    const recipientId = parseInt(value);
    setSelectedRecipientId(recipientId);
    form.setValue("recipientId", value);
    
    // Resetear la orden de compra si cambia el destinatario
    form.setValue("purchaseOrderId", undefined);
  };

  const isLoading = createPaymentMutation.isPending || updatePaymentMutation.isPending;
  const error = createPaymentMutation.error || updatePaymentMutation.error;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onFormSubmit)} className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {error.message || "Ocurrió un error. Intente de nuevo."}
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-6">
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Fecha de Pago</FormLabel>
                  <FormControl>
                    <DatePicker
                      date={field.value}
                      setDate={field.onChange}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Monto ($)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="0.00"
                      {...field}
                      type="number"
                      step="0.01"
                      min="0"
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="paymentMethod"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Método de Pago</FormLabel>
                  <Select
                    disabled={isLoading}
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar método de pago" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {paymentMethods.map((method) => (
                        <SelectItem key={method.id} value={method.id}>
                          {method.name}
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
              name="reference"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Referencia/No. de Cheque (Opcional)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Número de referencia o de cheque"
                      {...field}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="space-y-6">
            <FormField
              control={form.control}
              name="recipientType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de Destinatario</FormLabel>
                  <Select
                    disabled={isLoading}
                    onValueChange={(value) => {
                      field.onChange(value);
                      handleRecipientTypeChange(value);
                    }}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar tipo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {recipientTypes.map((type) => (
                        <SelectItem key={type.id} value={type.id}>
                          {type.name}
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
              name="recipientId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Destinatario</FormLabel>
                  <Select
                    disabled={
                      isLoading || !selectedRecipientType || filteredRecipients.length === 0
                    }
                    onValueChange={(value) => {
                      field.onChange(value);
                      handleRecipientChange(value);
                    }}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar destinatario" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {filteredRecipients.map((recipient: any) => (
                        <SelectItem key={recipient.id} value={String(recipient.id)}>
                          {recipient.name}
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
              name="categoryId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Categoría</FormLabel>
                  <Select
                    disabled={isLoading || !categories}
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar categoría" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {categories?.map((category: any) => (
                        <SelectItem key={category.id} value={String(category.id)}>
                          {category.name}
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
              name="projectId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Proyecto (Opcional)</FormLabel>
                  <Select
                    disabled={isLoading || !projects}
                    onValueChange={(value) => {
                      if (value === 'none') {
                        field.onChange(undefined);
                      } else {
                        field.onChange(value);
                      }
                    }}
                    defaultValue={field.value || 'none'}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar proyecto" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">Ninguno</SelectItem>
                      {projects?.map((project: any) => (
                        <SelectItem key={project.id} value={String(project.id)}>
                          {project.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {selectedRecipientType === 'supplier' && supplierPurchaseOrders.length > 0 && (
              <FormField
                control={form.control}
                name="purchaseOrderId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Orden de Compra</FormLabel>
                    <Select
                      disabled={isLoading || !supplierPurchaseOrders.length}
                      onValueChange={(value) => {
                        if (value === 'none') {
                          field.onChange(undefined);
                        } else {
                          field.onChange(value);
                          // Si seleccionamos una orden de compra, establecer el monto automáticamente
                          const selectedOrder = supplierPurchaseOrders.find(
                            (order) => String(order.id) === value
                          );
                          if (selectedOrder) {
                            form.setValue("amount", String(selectedOrder.total || 0));
                            form.setValue("description", `Pago por orden de compra #${selectedOrder.orderNumber}`);
                          }
                        }
                      }}
                      defaultValue={field.value || 'none'}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar orden de compra" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">Ninguna</SelectItem>
                        {supplierPurchaseOrders.map((order: any) => (
                          <SelectItem key={order.id} value={String(order.id)}>
                            #{order.orderNumber} - ${order.total || 0} ({new Date(order.issueDate).toLocaleDateString()})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Al seleccionar una orden de compra, se marcará como pagada.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </div>
        </div>

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descripción (Opcional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Detalles adicionales sobre este pago"
                  {...field}
                  disabled={isLoading}
                  rows={3}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-4 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {payment ? "Actualizar Pago" : "Registrar Pago"}
          </Button>
        </div>
      </form>
    </Form>
  );
}