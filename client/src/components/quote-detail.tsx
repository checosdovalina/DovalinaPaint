import { useState } from "react";
import { Quote, Project, Client } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FileDown, Printer, Eye, X, Check } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

// Importar estilos de impresión
import "./quote-print.css";

interface QuoteDetailProps {
  quote: Quote;
  project?: Project;
  client?: Client;
  onClose: () => void;
  open: boolean;
}

export function QuoteDetail({ quote, project, client, onClose, open }: QuoteDetailProps) {
  const { toast } = useToast();
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);

  // Mutation para aprobar la cotización
  const approvalMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("PUT", `/api/quotes/${quote.id}`, {
        ...quote,
        status: "approved",
        approvedDate: new Date()
      });
    },
    onSuccess: () => {
      toast({
        title: "Cotización aprobada",
        description: "La cotización ha sido aprobada exitosamente.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/quotes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      onClose();
    },
    onError: (error) => {
      setIsApproving(false);
      toast({
        title: "Error",
        description: `No se pudo aprobar la cotización: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  // Mutation para rechazar la cotización
  const rejectionMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("PUT", `/api/quotes/${quote.id}`, {
        ...quote,
        status: "rejected",
        rejectedDate: new Date()
      });
    },
    onSuccess: () => {
      toast({
        title: "Cotización rechazada",
        description: "La cotización ha sido rechazada.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/quotes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      onClose();
    },
    onError: (error) => {
      setIsRejecting(false);
      toast({
        title: "Error",
        description: `No se pudo rechazar la cotización: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Calcular totales
  const materialsTotal = quote.materialsEstimate && Array.isArray(quote.materialsEstimate) ? 
    quote.materialsEstimate.reduce((sum: number, item: any) => sum + (item.total || 0), 0) : 0;
  
  const laborTotal = quote.laborEstimate && Array.isArray(quote.laborEstimate) ? 
    quote.laborEstimate.reduce((sum: number, item: any) => sum + (item.total || 0), 0) : 0;
  
  // Si no hay margen de ganancia definido, usar 0
  const profitMargin = (quote as any).profitMargin || 0;
  const subtotal = materialsTotal + laborTotal;
  const profitAmount = subtotal * (profitMargin / 100);

  // Función para generar PDF (usando la funcionalidad de impresión del navegador)
  const generatePDF = () => {
    toast({
      title: "Generando PDF",
      description: "El PDF de la cotización se está generando...",
    });
    
    // Guardar estilos originales
    const originalTitle = document.title;
    
    // Cambiar título para la impresión
    document.title = `Cotización #${quote.id} - ${project?.title || 'Proyecto'}`;
    
    // Configurar opciones de impresión para guardar como PDF
    const printOptions = {
      destination: 'save-as-pdf',
    };
    
    // Iniciar impresión
    window.print();
    
    // Restaurar título original después de un momento
    setTimeout(() => {
      document.title = originalTitle;
      
      toast({
        title: "PDF Generado",
        description: "La cotización ha sido preparada para guardar como PDF",
      });
    }, 1000);
  };

  // Función para imprimir
  const printQuote = () => {
    window.print();
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl overflow-y-auto max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Detalles de Cotización #{quote.id}</DialogTitle>
        </DialogHeader>
        
        <div className="p-4 print:p-0" id="quote-detail-printable">
          {/* Cabecera con información de la empresa */}
          <div className="flex justify-between items-start border-b pb-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold">DOVALINA PAINTING LLC</h1>
              <p>3731 Aster Drive</p>
              <p>Charlotte, N.C. 28227</p>
              <p>704-506-9741</p>
              <p>d-dovalina@hotmail.com</p>
            </div>
            <div className="text-right">
              <h2 className="text-xl font-semibold">Cotización #{quote.id}</h2>
              <p>Fecha: {quote.createdAt ? format(new Date(quote.createdAt), "PPP", { locale: es }) : 'N/A'}</p>
              <p>Estado: <span className="font-medium">{quote.status === 'draft' ? 'Borrador' : 
                quote.status === 'sent' ? 'Enviada' : 
                quote.status === 'approved' ? 'Aprobada' : 
                quote.status === 'rejected' ? 'Rechazada' : 'Desconocido'}</span>
              </p>
              <p>Válida hasta: {quote.validUntil ? format(new Date(quote.validUntil), "PPP", { locale: es }) : 'N/A'}</p>
            </div>
          </div>
          
          {/* Información del proyecto y cliente */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <Card>
              <CardContent className="p-4">
                <h3 className="text-lg font-semibold mb-2">Información del Proyecto</h3>
                <p><span className="font-medium">Nombre:</span> {project?.title || 'N/A'}</p>
                <p><span className="font-medium">Dirección:</span> {project?.address || 'N/A'}</p>
                <p><span className="font-medium">Descripción:</span> {project?.description || 'N/A'}</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <h3 className="text-lg font-semibold mb-2">Información del Cliente</h3>
                <p><span className="font-medium">Nombre:</span> {client?.name || 'N/A'}</p>
                <p><span className="font-medium">Email:</span> {client?.email || 'N/A'}</p>
                <p><span className="font-medium">Teléfono:</span> {client?.phone || 'N/A'}</p>
              </CardContent>
            </Card>
          </div>
          
          {/* Desglose de costos */}
          <h3 className="text-lg font-semibold mb-3">Desglose de Costos</h3>
          
          {/* Materiales */}
          <Card className="mb-4">
            <CardContent className="p-4">
              <h4 className="font-medium mb-2">Costo de Materiales</h4>
              <div className="border rounded-md overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted">
                    <tr>
                      <th className="py-2 px-3 text-left">Descripción</th>
                      <th className="py-2 px-3 text-right">Cantidad</th>
                      <th className="py-2 px-3 text-right">Precio Unitario</th>
                      <th className="py-2 px-3 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {quote.materialsEstimate && Array.isArray(quote.materialsEstimate) && quote.materialsEstimate.length > 0 ? (
                      quote.materialsEstimate.map((item: any, index: number) => (
                        <tr key={index} className="border-t">
                          <td className="py-2 px-3">{item.name}</td>
                          <td className="py-2 px-3 text-right">{item.quantity}</td>
                          <td className="py-2 px-3 text-right">${Number(item.unitPrice).toFixed(2)}</td>
                          <td className="py-2 px-3 text-right">${Number(item.total).toFixed(2)}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="py-2 px-3 text-center">No hay materiales registrados</td>
                      </tr>
                    )}
                    <tr className="border-t bg-muted">
                      <td colSpan={3} className="py-2 px-3 font-medium text-right">Subtotal Materiales:</td>
                      <td className="py-2 px-3 font-medium text-right">${materialsTotal.toFixed(2)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
          
          {/* Mano de obra */}
          <Card className="mb-4">
            <CardContent className="p-4">
              <h4 className="font-medium mb-2">Costo de Mano de Obra</h4>
              <div className="border rounded-md overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted">
                    <tr>
                      <th className="py-2 px-3 text-left">Descripción</th>
                      <th className="py-2 px-3 text-right">Horas</th>
                      <th className="py-2 px-3 text-right">Tarifa/Hora</th>
                      <th className="py-2 px-3 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {quote.laborEstimate && Array.isArray(quote.laborEstimate) && quote.laborEstimate.length > 0 ? (
                      quote.laborEstimate.map((item: any, index: number) => (
                        <tr key={index} className="border-t">
                          <td className="py-2 px-3">{item.description}</td>
                          <td className="py-2 px-3 text-right">{item.hours}</td>
                          <td className="py-2 px-3 text-right">${Number(item.hourlyRate).toFixed(2)}</td>
                          <td className="py-2 px-3 text-right">${Number(item.total).toFixed(2)}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="py-2 px-3 text-center">No hay mano de obra registrada</td>
                      </tr>
                    )}
                    <tr className="border-t bg-muted">
                      <td colSpan={3} className="py-2 px-3 font-medium text-right">Subtotal Mano de Obra:</td>
                      <td className="py-2 px-3 font-medium text-right">${laborTotal.toFixed(2)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
          
          {/* Total */}
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Total de la Cotización</h3>
                <p className="text-2xl font-bold">${quote.totalEstimate.toFixed(2)}</p>
              </div>
            </CardContent>
          </Card>
          
          {/* Notas */}
          {quote.notes && (
            <Card className="mb-6">
              <CardContent className="p-4">
                <h3 className="text-lg font-semibold mb-2">Notas y Condiciones</h3>
                <p className="whitespace-pre-line">{quote.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>
        
        {/* Botones de acción - no se imprimen */}
        <div className="flex justify-between items-center print:hidden">
          <div>
            <Button 
              variant="outline" 
              onClick={printQuote} 
              className="mr-2"
            >
              <Printer className="mr-2 h-4 w-4" />
              Imprimir
            </Button>
            <Button 
              variant="outline" 
              onClick={generatePDF}
            >
              <FileDown className="mr-2 h-4 w-4" />
              Descargar PDF
            </Button>
          </div>
          
          <div>
            {quote.status !== 'approved' && quote.status !== 'rejected' && (
              <>
                <Button 
                  variant="default" 
                  onClick={() => {
                    setIsApproving(true);
                    approvalMutation.mutate();
                  }}
                  disabled={isApproving || isRejecting}
                  className="mr-2 bg-green-600 hover:bg-green-700"
                >
                  <Check className="mr-2 h-4 w-4" />
                  {isApproving ? "Aprobando..." : "Aprobar Cotización"}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setIsRejecting(true);
                    rejectionMutation.mutate();
                  }}
                  disabled={isRejecting || isApproving}
                  className="mr-2 text-red-600 border-red-600 hover:bg-red-50"
                >
                  <X className="mr-2 h-4 w-4" />
                  {isRejecting ? "Rechazando..." : "Rechazar Cotización"}
                </Button>
              </>
            )}
            <Button 
              variant="outline" 
              onClick={onClose}
            >
              <X className="mr-2 h-4 w-4" />
              Cerrar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}