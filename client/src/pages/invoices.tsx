import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Invoice } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, FileText } from "lucide-react";
import { InvoiceList } from "@/components/invoice-list";
import { InvoiceDetail } from "@/components/invoice-detail";
import { InvoiceForm } from "@/components/invoice-form";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

export default function InvoicesPage() {
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<number | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const { toast } = useToast();

  // Fetch all invoices
  const {
    data: invoices,
    isLoading,
    isError,
    refetch,
  } = useQuery<Invoice[]>({
    queryKey: ["/api/invoices"],
  });

  // Handle invoice selection
  const handleSelectInvoice = (invoiceId: number) => {
    setSelectedInvoiceId(invoiceId);
    setIsViewModalOpen(true);
  };

  // Close all modals
  const handleCloseModals = () => {
    setIsCreateModalOpen(false);
    setIsViewModalOpen(false);
    setSelectedInvoiceId(null);
  };

  // After successful creation/update, refresh the list
  const handleSuccess = () => {
    refetch();
    handleCloseModals();
    toast({
      title: "Éxito",
      description: "La factura se ha guardado correctamente.",
    });
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-6">
        <div className="mb-6 rounded-md bg-destructive/15 p-4 text-destructive">
          <p>Error al cargar las facturas. Por favor, inténtelo de nuevo.</p>
        </div>
        <Button onClick={() => refetch()}>Reintentar</Button>
      </div>
    );
  }

  const selectedInvoice = selectedInvoiceId 
    ? invoices?.find(invoice => invoice.id === selectedInvoiceId) 
    : null;

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Facturas</h1>
          <p className="text-muted-foreground">
            Gestión de facturas para clientes y proyectos
          </p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nueva Factura
        </Button>
      </div>

      {/* Invoice List */}
      {invoices && invoices.length > 0 ? (
        <InvoiceList invoices={invoices} onSelectInvoice={handleSelectInvoice} />
      ) : (
        <div className="flex flex-col items-center justify-center rounded-md border border-dashed p-12">
          <FileText className="mb-4 h-12 w-12 text-muted-foreground" />
          <h3 className="mb-2 text-xl font-semibold">No hay facturas</h3>
          <p className="mb-4 text-center text-muted-foreground">
            No se han creado facturas todavía. Crea una nueva factura para comenzar.
          </p>
          <Button onClick={() => setIsCreateModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Nueva Factura
          </Button>
        </div>
      )}

      {/* Create Invoice Modal */}
      <Sheet open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <SheetContent className="w-full max-w-3xl sm:max-w-xl md:max-w-2xl lg:max-w-3xl">
          <SheetHeader>
            <SheetTitle>Nueva Factura</SheetTitle>
            <SheetDescription>
              Crear una nueva factura para un proyecto.
            </SheetDescription>
          </SheetHeader>
          <div className="py-4">
            <InvoiceForm onSuccess={handleSuccess} onCancel={handleCloseModals} />
          </div>
        </SheetContent>
      </Sheet>

      {/* View Invoice Modal */}
      <Sheet open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <SheetContent className="w-full max-w-3xl sm:max-w-xl md:max-w-2xl lg:max-w-3xl">
          <SheetHeader>
            <SheetTitle>Detalles de Factura</SheetTitle>
          </SheetHeader>
          <div className="py-4">
            {selectedInvoice && (
              <InvoiceDetail 
                invoice={selectedInvoice} 
                onClose={handleCloseModals}
                onSuccess={handleSuccess}
              />
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}