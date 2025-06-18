import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, Edit, Trash2, FileText, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useState } from "react";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { es } from "date-fns/locale";

type PaymentListProps = {
  payments: any;
  isLoading: boolean;
  projects: any;
  onEdit: (payment: any) => void;
  refetch: () => void;
  filterType: string | null;
};

export default function PaymentList({
  payments,
  isLoading,
  projects,
  onEdit,
  refetch,
  filterType,
}: PaymentListProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<any>(null);
  const { toast } = useToast();

  // Filter payments based on the selected tab
  const filteredPayments = payments 
    ? filterType
      ? payments.filter((payment: any) => payment.recipientType === filterType)
      : payments
    : [];

  // Get project title by id
  const getProjectTitle = (projectId: number) => {
    if (!projects) return "Project not found";
    const project = projects.find((p: any) => p.id === projectId);
    return project ? project.title : "Project not found";
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  // Format a date using date-fns
  const formatDate = (date: string) => {
    return format(new Date(date), 'dd MMM yyyy', { locale: es });
  };

  // Get badge style based on recipient type
  const getRecipientTypeBadge = (type: string) => {
    switch (type) {
      case 'subcontractor':
        return 'bg-blue-100 text-blue-800';
      case 'employee':
        return 'bg-green-100 text-green-800';
      case 'supplier':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Get recipient type label
  const getRecipientTypeLabel = (type: string) => {
    switch (type) {
      case 'subcontractor':
        return 'Subcontractor';
      case 'employee':
        return 'Employee';
      case 'supplier':
        return 'Supplier';
      default:
        return 'Other';
    }
  };

  // Get payment method label
  const getPaymentMethodLabel = (method: string) => {
    switch (method) {
      case 'cash':
        return 'Cash';
      case 'check':
        return 'Check';
      case 'transfer':
        return 'Transfer';
      case 'credit_card':
        return 'Credit Card';
      case 'debit_card':
        return 'Debit Card';
      case 'venmo':
        return 'Venmo';
      case 'paypal':
        return 'PayPal';
      case 'zelle':
        return 'Zelle';
      default:
        return 'Other';
    }
  };

  const deletePaymentMutation = useMutation({
    mutationFn: async (paymentId: number) => {
      const response = await apiRequest(
        "DELETE",
        `/api/payments/${paymentId}`
      );
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error deleting payment");
      }
      
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Payment deleted successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/payments'] });
      refetch();
      setShowDeleteDialog(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Could not delete payment. Please try again.",
        variant: "destructive",
      });
      setShowDeleteDialog(false);
    },
  });

  const handleDeleteClick = (payment: any) => {
    setSelectedPayment(payment);
    setShowDeleteDialog(true);
  };

  const confirmDelete = () => {
    if (selectedPayment) {
      deletePaymentMutation.mutate(selectedPayment.id);
    }
  };

  // Calculate the total payments amount
  const calculateTotal = () => {
    if (!filteredPayments || filteredPayments.length === 0) return 0;
    return filteredPayments.reduce((total: number, payment: any) => total + payment.amount, 0);
  };
  
  if (isLoading) {
    return (
      <div className="space-y-3">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <Skeleton className="h-8 w-1/4" />
              <Skeleton className="h-10 w-28" />
            </div>
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <Card>
        <CardHeader className="py-4">
          <div className="flex justify-between items-center">
            <CardTitle className="text-xl">
              {filterType ? `Pagos a ${getRecipientTypeLabel(filterType)}` : "Todos los Pagos"}
            </CardTitle>
            <div className="text-lg font-semibold">
              Total: {formatCurrency(calculateTotal())}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {filteredPayments && filteredPayments.length > 0 ? (
            <div className="border rounded-md overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[120px]">Fecha</TableHead>
                    <TableHead>Destinatario</TableHead>
                    {!filterType && <TableHead>Tipo</TableHead>}
                    <TableHead>Monto</TableHead>
                    <TableHead>Método</TableHead>
                    <TableHead>Referencia</TableHead>
                    <TableHead>Proyecto</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPayments.map((payment: any) => (
                    <TableRow key={payment.id}>
                      <TableCell className="font-medium">
                        {formatDate(payment.date)}
                      </TableCell>
                      <TableCell>{payment.recipientName}</TableCell>
                      {!filterType && (
                        <TableCell>
                          <Badge className={getRecipientTypeBadge(payment.recipientType)}>
                            {getRecipientTypeLabel(payment.recipientType)}
                          </Badge>
                        </TableCell>
                      )}
                      <TableCell className="font-medium">
                        {formatCurrency(payment.amount)}
                      </TableCell>
                      <TableCell>{getPaymentMethodLabel(payment.paymentMethod)}</TableCell>
                      <TableCell>{payment.reference || "—"}</TableCell>
                      <TableCell>
                        {payment.projectId ? getProjectTitle(payment.projectId) : "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <ChevronDown className="h-4 w-4" />
                              <span className="sr-only">Acciones</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => onEdit(payment)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDeleteClick(payment)}
                              className="text-red-600"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Eliminar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="py-12 px-4 text-center">
              <AlertCircle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-1">No hay pagos</h3>
              <p className="text-gray-500">
                {filterType
                  ? `No se encontraron pagos para ${getRecipientTypeLabel(filterType)}.`
                  : "No se encontraron pagos registrados."}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Está seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará permanentemente el pago y no podrá ser recuperado.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletePaymentMutation.isPending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              disabled={deletePaymentMutation.isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {deletePaymentMutation.isPending ? 'Eliminando...' : 'Eliminar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}