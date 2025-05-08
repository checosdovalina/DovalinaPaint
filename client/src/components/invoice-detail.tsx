import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Invoice, Client, Project } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Check, X, CreditCard } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription 
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { useStripe, Elements, PaymentElement, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';

// Initialize Stripe outside component
const stripePromise = import.meta.env.VITE_STRIPE_PUBLIC_KEY
  ? loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY)
  : null;

interface InvoiceDetailProps {
  invoice: Invoice;
  onClose: () => void;
  onSuccess: () => void;
}

export function InvoiceDetail({ invoice, onClose, onSuccess }: InvoiceDetailProps) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const { toast } = useToast();
  
  // Fetch related data
  const { data: client } = useQuery<Client>({
    queryKey: ["/api/clients", invoice.clientId],
    enabled: !!invoice.clientId,
  });
  
  const { data: project } = useQuery<Project>({
    queryKey: ["/api/projects", invoice.projectId],
    enabled: !!invoice.projectId,
  });
  
  // Delete invoice mutation
  const deleteMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", `/api/invoices/${invoice.id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      toast({
        title: "Factura eliminada",
        description: "La factura ha sido eliminada correctamente.",
      });
      onSuccess();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `No se pudo eliminar la factura: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  // Update invoice status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async (status: string) => {
      await apiRequest("PUT", `/api/invoices/${invoice.id}`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      toast({
        title: "Estado actualizado",
        description: "El estado de la factura ha sido actualizado.",
      });
      onSuccess();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `No se pudo actualizar el estado de la factura: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  // Initialize payment
  const handleInitiatePayment = async () => {
    try {
      if (!stripePromise) {
        toast({
          title: "Error",
          description: "La clave pública de Stripe no está configurada.",
          variant: "destructive",
        });
        return;
      }
      
      const response = await apiRequest("POST", "/api/create-payment-intent", {
        amount: invoice.totalAmount,
        invoiceId: invoice.id
      });
      
      const data = await response.json();
      setClientSecret(data.clientSecret);
      setIsPaymentDialogOpen(true);
    } catch (error) {
      toast({
        title: "Error",
        description: `No se pudo iniciar el pago: ${error.message}`,
        variant: "destructive",
      });
    }
  };
  
  // Format date for display
  const formatDate = (dateString: string | Date | null) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(date);
  };
  
  // Get badge color based on status
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "draft":
        return <Badge variant="outline">Borrador</Badge>;
      case "sent":
        return <Badge variant="secondary">Enviada</Badge>;
      case "paid":
        return <Badge variant="success">Pagada</Badge>;
      case "overdue":
        return <Badge variant="destructive">Vencida</Badge>;
      case "cancelled":
        return <Badge variant="destructive">Cancelada</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-start justify-between space-y-0">
          <div>
            <CardTitle className="text-2xl font-bold">{invoice.invoiceNumber}</CardTitle>
            <CardDescription>
              Creada el {formatDate(invoice.issueDate)}
            </CardDescription>
          </div>
          <div>{getStatusBadge(invoice.status)}</div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <h3 className="mb-2 text-sm font-medium text-muted-foreground">Cliente</h3>
              <p className="font-medium">{client?.name || "Cargando..."}</p>
              <p>{client?.email || ""}</p>
              <p>{client?.phone || ""}</p>
            </div>
            <div>
              <h3 className="mb-2 text-sm font-medium text-muted-foreground">Proyecto</h3>
              <p className="font-medium">{project?.title || "Cargando..."}</p>
              <p className="text-sm text-muted-foreground">{project?.address || ""}</p>
            </div>
          </div>
          
          <Separator />
          
          <div>
            <h3 className="mb-2 text-sm font-medium text-muted-foreground">Detalles</h3>
            <div className="rounded-md border border-border">
              <div className="grid grid-cols-1 p-4 sm:grid-cols-2">
                <div>
                  <p className="text-sm text-muted-foreground">Fecha de emisión</p>
                  <p className="font-medium">{formatDate(invoice.issueDate)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Fecha de vencimiento</p>
                  <p className="font-medium">{formatDate(invoice.dueDate)}</p>
                </div>
              </div>
              
              <Separator />
              
              <div className="p-4">
                <p className="text-sm text-muted-foreground">Notas</p>
                <p>{invoice.notes || "Sin notas"}</p>
              </div>
            </div>
          </div>
          
          <Separator />
          
          <div>
            <h3 className="mb-2 text-sm font-medium text-muted-foreground">Resumen</h3>
            <div className="rounded-md border border-border p-4">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatCurrency(Number(invoice.totalAmount))}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Impuestos</span>
                <span>{formatCurrency(0)}</span>
              </div>
              <Separator className="my-2" />
              <div className="flex justify-between font-bold">
                <span>Total</span>
                <span>{formatCurrency(Number(invoice.totalAmount))}</span>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <div className="flex space-x-2">
            <Button variant="outline" onClick={onClose}>
              Cerrar
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => setIsDeleteDialogOpen(true)}
              disabled={invoice.status === "paid" || deleteMutation.isPending}
            >
              {deleteMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <X className="mr-2 h-4 w-4" />
              )}
              Eliminar
            </Button>
          </div>
          <div className="flex space-x-2">
            <Button
              variant="secondary"
              onClick={() => onDuplicate(invoice)}
            >
              <CopyIcon className="mr-2 h-4 w-4" />
              Factura Igual
            </Button>
            {invoice.status !== "paid" && (
              <Button 
                variant="default" 
                onClick={handleInitiatePayment}
                disabled={!stripePromise}
              >
                <CreditCard className="mr-2 h-4 w-4" />
                Procesar pago
              </Button>
            )}
            {invoice.status === "draft" && (
              <Button
                onClick={() => updateStatusMutation.mutate("sent")}
                disabled={updateStatusMutation.isPending}
              >
                {updateStatusMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Check className="mr-2 h-4 w-4" />
                )}
                Marcar como enviada
              </Button>
            )}
          </div>
        </CardFooter>
      </Card>
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará permanentemente la factura {invoice.invoiceNumber}.
              No se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteMutation.mutate()}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Payment Dialog */}
      <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Pago de factura</DialogTitle>
            <DialogDescription>
              Proceder al pago de la factura {invoice.invoiceNumber} por un total de {formatCurrency(Number(invoice.totalAmount))}.
            </DialogDescription>
          </DialogHeader>
          
          {clientSecret && stripePromise ? (
            <Elements stripe={stripePromise} options={{ clientSecret }}>
              <PaymentForm 
                onSuccess={() => {
                  updateStatusMutation.mutate("paid");
                  setIsPaymentDialogOpen(false);
                }}
                onCancel={() => setIsPaymentDialogOpen(false)}
              />
            </Elements>
          ) : (
            <div className="flex justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Payment form component using Stripe Elements
function PaymentForm({ onSuccess, onCancel }: { onSuccess: () => void, onCancel: () => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { toast } = useToast();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!stripe || !elements) {
      return;
    }
    
    setIsProcessing(true);
    setErrorMessage(null);
    
    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      redirect: 'if_required',
    });
    
    setIsProcessing(false);
    
    if (error) {
      setErrorMessage(error.message || "Error al procesar el pago");
      toast({
        title: "Error en el pago",
        description: error.message || "Error al procesar el pago",
        variant: "destructive",
      });
    } else if (paymentIntent && paymentIntent.status === 'succeeded') {
      toast({
        title: "Pago procesado",
        description: "El pago ha sido procesado exitosamente",
        variant: "default",
      });
      onSuccess();
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      
      {errorMessage && (
        <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
          {errorMessage}
        </div>
      )}
      
      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isProcessing}>
          Cancelar
        </Button>
        <Button 
          type="submit" 
          disabled={!stripe || isProcessing}
        >
          {isProcessing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Procesando...
            </>
          ) : (
            "Pagar ahora"
          )}
        </Button>
      </div>
    </form>
  );
}