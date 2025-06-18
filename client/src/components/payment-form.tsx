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
import { useAuth } from "@/hooks/use-auth";

// Define the form validation schema
const paymentFormSchema = z.object({
  date: z.date({
    required_error: "Payment date is required.",
  }),
  amount: z.string().min(1, "Amount is required."),
  recipientType: z.string().min(1, "Recipient type is required."),
  recipientId: z.string().min(1, "Recipient is required."),
  categoryId: z.string().min(1, "Category is required."),
  projectId: z.string().optional(),
  purchaseOrderId: z.string().optional(),
  description: z.string().optional(),
  reference: z.string().optional(),
  paymentMethod: z.string().min(1, "Payment method is required."),
});

const paymentMethods = [
  { id: "cash", name: "Cash" },
  { id: "check", name: "Check" },
  { id: "transfer", name: "Bank Transfer" },
  { id: "credit_card", name: "Credit Card" },
  { id: "debit_card", name: "Debit Card" },
  { id: "venmo", name: "Venmo" },
  { id: "paypal", name: "PayPal" },
  { id: "zelle", name: "Zelle" },
  { id: "other", name: "Other" },
];

const recipientTypes = [
  { id: "subcontractor", name: "Subcontractor" },
  { id: "employee", name: "Employee" },
  { id: "supplier", name: "Supplier" },
  { id: "other", name: "Other" },
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
  const { user } = useAuth(); // Get the authenticated user
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
      // Prepare payment data according to the expected schema
      // Only proceed if user is available
      if (!user) {
        throw new Error("No hay un usuario autenticado.");
      }
      
      const paymentData = {
        // Required fields from schema
        amount: parseFloat(data.amount), // Convert to number
        date: data.date.toISOString(), // Convert Date to ISO string
        description: data.description || "Payment registered",
        paymentMethod: data.paymentMethod, // Use paymentMethod directly
        paymentType: "general", // Default payment type
        status: "completed", // Default status
        recipientType: data.recipientType,
        recipientId: parseInt(data.recipientId),
        // Optional fields
        categoryId: data.categoryId ? parseInt(data.categoryId) : undefined,
        reference: data.reference,
        projectId: data.projectId ? parseInt(data.projectId) : undefined,
        purchaseOrderId: data.purchaseOrderId ? parseInt(data.purchaseOrderId) : undefined,
        createdBy: user.id, // Use authenticated user ID
      };
      
      const response = await apiRequest(
        "POST",
        "/api/payments",
        paymentData
      );
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error creating payment");
      }
      
      // Si el pago está asociado a una orden de compra, también actualizar el estado de la orden
      if (data.purchaseOrderId) {
        try {
          await apiRequest(
            "PATCH",
            `/api/purchase-orders/${data.purchaseOrderId}`,
            { status: "paid" }
          );
          
          // Invalidar también la caché de órdenes de compra
          queryClient.invalidateQueries({ queryKey: ['/api/purchase-orders'] });
        } catch (error) {
          console.error("Error al actualizar el estado de la orden de compra:", error);
        }
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
      // Prepare payment data according to the expected schema
      // Only proceed if user is available
      if (!user) {
        throw new Error("No hay un usuario autenticado.");
      }
      
      const paymentData = {
        // Required fields from schema
        amount: parseFloat(data.amount), // Convert to number
        date: data.date.toISOString(), // Convert Date to ISO string
        description: data.description || "Pago actualizado",
        paymentMethod: data.paymentMethod, // Use paymentMethod directly
        paymentType: "general", // Default payment type
        status: "completed", // Default status
        recipientType: data.recipientType,
        recipientId: parseInt(data.recipientId),
        // Optional fields
        categoryId: data.categoryId ? parseInt(data.categoryId) : undefined,
        reference: data.reference,
        projectId: data.projectId ? parseInt(data.projectId) : undefined,
        purchaseOrderId: data.purchaseOrderId ? parseInt(data.purchaseOrderId) : undefined,
        createdBy: user.id, // Use authenticated user ID
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
      
      // Si el pago está asociado a una orden de compra, también actualizar el estado de la orden
      if (data.purchaseOrderId) {
        try {
          await apiRequest(
            "PATCH",
            `/api/purchase-orders/${data.purchaseOrderId}`,
            { status: "paid" }
          );
          
          // Invalidar también la caché de órdenes de compra
          queryClient.invalidateQueries({ queryKey: ['/api/purchase-orders'] });
        } catch (error) {
          console.error("Error al actualizar el estado de la orden de compra:", error);
        }
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
              {error.message || "An error occurred. Please try again."}
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
                  <FormLabel>Payment Date</FormLabel>
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
                  <FormLabel>Amount ($)</FormLabel>
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
                  <FormLabel>Payment Method</FormLabel>
                  <Select
                    disabled={isLoading}
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select payment method" />
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
                  <FormLabel>Reference/Check Number (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Reference or check number"
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
                  <FormLabel>Recipient Type</FormLabel>
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
                        <SelectValue placeholder="Select type" />
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
                  <FormLabel>Recipient</FormLabel>
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
                        <SelectValue placeholder="Select recipient" />
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
                  <FormLabel>Category</FormLabel>
                  <Select
                    disabled={isLoading || !categories}
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
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
                  <FormLabel>Project (Optional)</FormLabel>
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
                        <SelectValue placeholder="Select project" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
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
                    <FormLabel>Purchase Order</FormLabel>
                    <Select
                      disabled={isLoading || !supplierPurchaseOrders.length}
                      onValueChange={(value) => {
                        if (value === 'none') {
                          field.onChange(undefined);
                        } else {
                          field.onChange(value);
                          // If we select a purchase order, set the amount automatically
                          const selectedOrder = supplierPurchaseOrders.find(
                            (order) => String(order.id) === value
                          );
                          if (selectedOrder) {
                            form.setValue("amount", String(selectedOrder.totalAmount || 0));
                            form.setValue("description", `Payment for purchase order #${selectedOrder.orderNumber}`);
                          }
                        }
                      }}
                      defaultValue={field.value || 'none'}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select purchase order" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {supplierPurchaseOrders.map((order: any) => (
                          <SelectItem key={order.id} value={String(order.id)}>
                            #{order.orderNumber} - ${order.totalAmount || 0} ({new Date(order.issueDate).toLocaleDateString()})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      When selecting a purchase order, it will be marked as paid.
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