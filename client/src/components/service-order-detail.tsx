import { useState, useRef } from "react";
import { ServiceOrder, Project, Client, Staff, Subcontractor } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FileDown, Printer, Check, X, Save } from "lucide-react";
import { format } from "date-fns";
import { enUS } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

// Import print styles
import "./service-order-print.css";

// Simple signature pad component
interface SignaturePadProps {
  onSave: (signatureDataUrl: string) => void;
}

function SignaturePad({ onSave }: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    setIsDrawing(true);
    
    // Get position
    let clientX: number, clientY: number;
    
    if ('touches' in e) {
      // Touch event
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      // Mouse event
      clientX = e.clientX;
      clientY = e.clientY;
    }
    
    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Get position
    let clientX: number, clientY: number;
    
    if ('touches' in e) {
      e.preventDefault(); // Prevent scrolling when drawing on touch devices
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    
    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#000';
    
    ctx.lineTo(x, y);
    ctx.stroke();
    
    setHasSignature(true);
  };

  const endDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  };

  const saveSignature = () => {
    if (!hasSignature) {
      return;
    }
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const dataUrl = canvas.toDataURL('image/png');
    onSave(dataUrl);
  };

  return (
    <div className="mt-4">
      <p className="mb-2 font-medium">Client Signature:</p>
      <div className="border rounded-md p-2">
        <canvas
          ref={canvasRef}
          width={400}
          height={200}
          className="border border-gray-300 rounded w-full touch-none"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={endDrawing}
          onMouseLeave={endDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={endDrawing}
        />
        <div className="flex space-x-2 mt-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={clearSignature}
          >
            Clear
          </Button>
          <Button
            type="button"
            variant="default"
            size="sm"
            onClick={saveSignature}
            disabled={!hasSignature}
          >
            <Save className="mr-2 h-4 w-4" />
            Save Signature
          </Button>
        </div>
      </div>
    </div>
  );
}

interface ServiceOrderDetailProps {
  serviceOrder: ServiceOrder;
  project?: Project;
  client?: Client;
  staff?: Staff[];
  subcontractors?: Subcontractor[];
  onClose: () => void;
  open: boolean;
}

export function ServiceOrderDetail({ 
  serviceOrder, 
  project, 
  client, 
  staff,
  subcontractors,
  onClose, 
  open 
}: ServiceOrderDetailProps) {
  const { toast } = useToast();
  const [showSignaturePad, setShowSignaturePad] = useState(false);
  const [clientSignature, setClientSignature] = useState<string | null>(serviceOrder.clientSignature || null);
  
  // Find assigned staff or subcontractor
  const assignedTo = serviceOrder.assignedTo && serviceOrder.assignedType === 'staff'
    ? staff?.find(s => s.id === serviceOrder.assignedTo)?.name || 'Unknown Staff'
    : serviceOrder.assignedTo && serviceOrder.assignedType === 'subcontractor'
    ? subcontractors?.find(s => s.id === serviceOrder.assignedTo)?.name || 'Unknown Subcontractor'
    : 'Not Assigned';

  // Mutation to save the signature
  const signatureMutation = useMutation({
    mutationFn: async (signatureDataUrl: string) => {
      return apiRequest("PUT", `/api/service-orders/${serviceOrder.id}`, {
        ...serviceOrder,
        clientSignature: signatureDataUrl,
        signedDate: new Date()
      });
    },
    onSuccess: () => {
      toast({
        title: "Signature Saved",
        description: "The service order has been signed successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/service-orders"] });
      setShowSignaturePad(false);
      // Update local state so we don't need to refetch
      setClientSignature(serviceOrder.clientSignature);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Could not save signature: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Handle signature save
  const handleSignatureSave = (signatureDataUrl: string) => {
    setClientSignature(signatureDataUrl);
    signatureMutation.mutate(signatureDataUrl);
  };

  // Function to generate and download PDF - super simple approach
  const generatePDF = async () => {
    toast({
      title: "Generating PDF",
      description: "Please wait while your PDF is being generated...",
    });
    
    try {
      // Create a new PDF document
      const pdf = new jsPDF();
      
      // Generate a filename for the PDF
      const filename = `ServiceOrder_${serviceOrder.id}.pdf`;
      
      // Add company header
      pdf.setFontSize(16);
      pdf.text("DOVALINA PAINTING LLC", 105, 15, { align: "center" });
      
      pdf.setFontSize(10);
      pdf.text("3731 Aster Drive, Charlotte, N.C. 28227", 105, 20, { align: "center" });
      pdf.text("704-506-9741 | d-dovalina@hotmail.com", 105, 25, { align: "center" });
      
      // Add title
      pdf.setFontSize(14);
      pdf.text(`SERVICE ORDER #${serviceOrder.id}`, 105, 35, { align: "center" });
      
      // Add basic info
      pdf.setFontSize(10);
      pdf.text(`Date: ${serviceOrder.createdAt ? format(new Date(serviceOrder.createdAt), "MM/dd/yyyy") : 'N/A'}`, 15, 45);
      pdf.text(`Status: ${serviceOrder.status || 'Pending'}`, 15, 50);
      
      // Project info
      pdf.setFontSize(12);
      pdf.text("Project Information:", 15, 60);
      
      pdf.setFontSize(10);
      pdf.text(`Project: ${project?.title || 'N/A'}`, 20, 65);
      pdf.text(`Address: ${project?.address || 'N/A'}`, 20, 70);
      
      // Client info
      pdf.setFontSize(12);
      pdf.text("Client Information:", 15, 80);
      
      pdf.setFontSize(10);
      pdf.text(`Name: ${client?.name || 'N/A'}`, 20, 85);
      pdf.text(`Phone: ${client?.phone || 'N/A'}`, 20, 90);
      pdf.text(`Email: ${client?.email || 'N/A'}`, 20, 95);
      
      // Service details
      pdf.setFontSize(12);
      pdf.text("Service Details:", 15, 105);
      
      pdf.setFontSize(10);
      pdf.text(`Assigned To: ${assignedTo || 'Not assigned'}`, 20, 110);
      
      if (serviceOrder.details) {
        pdf.text("Details:", 20, 115);
        
        const lines = pdf.splitTextToSize(serviceOrder.details, 170);
        pdf.text(lines, 20, 120);
      }
      
      // Save the PDF file
      pdf.save(filename);
      
      toast({
        title: "PDF Downloaded",
        description: "Your service order has been saved as a PDF file.",
      });
    } catch (error) {
      console.error("PDF generation error:", error);
      
      toast({
        title: "PDF Generation Failed",
        description: "There was a problem generating the PDF. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Function to print
  const printServiceOrder = () => {
    window.print();
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] h-[90vh] flex flex-col overflow-hidden">
        <DialogHeader className="print:hidden">
          <DialogTitle>Service Order #{serviceOrder.id}</DialogTitle>
        </DialogHeader>
        
        <div className="p-4 print:p-6 overflow-y-auto flex-grow" id="service-order-printable">
          {/* Company information header */}
          <div className="flex justify-between items-start border-b pb-4 mb-6 company-header">
            <div>
              <h1 className="text-2xl font-bold company-name">DOVALINA PAINTING LLC</h1>
              <p>3731 Aster Drive</p>
              <p>Charlotte, N.C. 28227</p>
              <p>704-506-9741</p>
              <p>d-dovalina@hotmail.com</p>
            </div>
            <div className="text-right service-order-info">
              <h2 className="text-xl font-semibold">Service Order #{serviceOrder.id}</h2>
              <p>Date: {serviceOrder.createdAt ? format(new Date(serviceOrder.createdAt), "PPP", { locale: enUS }) : 'N/A'}</p>
              <p>Status: <span className="font-medium">{serviceOrder.status || 'Pending'}</span></p>
              <p>Due Date: {serviceOrder.dueDate ? format(new Date(serviceOrder.dueDate), "PPP", { locale: enUS }) : 'N/A'}</p>
            </div>
          </div>
          
          {/* Project and client information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 info-grid">
            <Card className="info-card">
              <CardContent className="p-4">
                <h3 className="text-lg font-semibold mb-2">Project Information</h3>
                <p><span className="font-medium">Name:</span> {project?.title || 'N/A'}</p>
                <p><span className="font-medium">Address:</span> {project?.address || 'N/A'}</p>
                <p><span className="font-medium">Description:</span> {project?.description || 'N/A'}</p>
              </CardContent>
            </Card>
            
            <Card className="info-card">
              <CardContent className="p-4">
                <h3 className="text-lg font-semibold mb-2">Client Information</h3>
                <p><span className="font-medium">Name:</span> {client?.name || 'N/A'}</p>
                <p><span className="font-medium">Email:</span> {client?.email || 'N/A'}</p>
                <p><span className="font-medium">Phone:</span> {client?.phone || 'N/A'}</p>
              </CardContent>
            </Card>
          </div>
          
          {/* Service Order Details */}
          <Card className="mb-6">
            <CardContent className="p-4">
              <h3 className="text-lg font-semibold mb-2">Service Details</h3>
              <p><span className="font-medium">Assigned To:</span> {assignedTo}</p>
              <p><span className="font-medium">Start Date:</span> {serviceOrder.startDate ? format(new Date(serviceOrder.startDate), "PPP", { locale: enUS }) : 'N/A'}</p>
              <p><span className="font-medium">Details:</span></p>
              <p className="whitespace-pre-line mt-1">{serviceOrder.details || 'No specific details provided.'}</p>
            </CardContent>
          </Card>
          
          {/* Materials Required */}
          {serviceOrder.materialsRequired && (
            <Card className="mb-6">
              <CardContent className="p-4">
                <h3 className="text-lg font-semibold mb-2">Materials Required</h3>
                <p className="whitespace-pre-line">{serviceOrder.materialsRequired}</p>
              </CardContent>
            </Card>
          )}
          
          {/* Special Instructions */}
          {serviceOrder.specialInstructions && (
            <Card className="mb-6">
              <CardContent className="p-4">
                <h3 className="text-lg font-semibold mb-2">Special Instructions</h3>
                <p className="whitespace-pre-line">{serviceOrder.specialInstructions}</p>
              </CardContent>
            </Card>
          )}
          
          {/* Safety Requirements */}
          {serviceOrder.safetyRequirements && (
            <Card className="mb-6">
              <CardContent className="p-4">
                <h3 className="text-lg font-semibold mb-2">Safety Requirements</h3>
                <p className="whitespace-pre-line">{serviceOrder.safetyRequirements}</p>
              </CardContent>
            </Card>
          )}
          
          {/* Project Images */}
          {(Array.isArray(serviceOrder.beforeImages) && serviceOrder.beforeImages.length > 0 ||
            Array.isArray(serviceOrder.afterImages) && serviceOrder.afterImages.length > 0) && (
            <Card className="mb-6">
              <CardContent className="p-4">
                <h3 className="text-lg font-semibold mb-2">Project Images</h3>
                
                {Array.isArray(serviceOrder.beforeImages) && serviceOrder.beforeImages.length > 0 && (
                  <div className="mb-4">
                    <h4 className="font-medium mb-2">Before Images</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                      {serviceOrder.beforeImages.map((image: string, index: number) => (
                        <div key={`before-${index}`} className="border rounded-md overflow-hidden">
                          <img 
                            src={image} 
                            alt={`Before image ${index + 1}`} 
                            className="w-full h-32 object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {Array.isArray(serviceOrder.afterImages) && serviceOrder.afterImages.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">After Images</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                      {serviceOrder.afterImages.map((image: string, index: number) => (
                        <div key={`after-${index}`} className="border rounded-md overflow-hidden">
                          <img 
                            src={image} 
                            alt={`After image ${index + 1}`} 
                            className="w-full h-32 object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
          
          {/* Client Signature */}
          <Card className="mb-6">
            <CardContent className="p-4">
              <h3 className="text-lg font-semibold mb-2">Client Approval</h3>
              {clientSignature ? (
                <div>
                  <p className="mb-2">Signed by client on: {serviceOrder.signedDate 
                    ? format(new Date(serviceOrder.signedDate), "PPP", { locale: enUS }) 
                    : format(new Date(), "PPP", { locale: enUS })}</p>
                  <div className="border rounded-md p-2 bg-gray-50">
                    <img src={clientSignature} alt="Client Signature" className="max-h-36" />
                  </div>
                </div>
              ) : (
                <div>
                  <p className="text-gray-500 italic mb-2">Not yet signed by client</p>
                  
                  {showSignaturePad ? (
                    <div className="print-hidden">
                      <SignaturePad onSave={handleSignatureSave} />
                    </div>
                  ) : (
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setShowSignaturePad(true)}
                      className="print-hidden"
                    >
                      <Check className="mr-2 h-4 w-4" />
                      Add Signature
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        
        {/* Action buttons - not printed */}
        <div className="flex justify-between items-center print:hidden">
          <div>
            <Button 
              variant="outline" 
              onClick={printServiceOrder} 
              className="mr-2"
            >
              <Printer className="mr-2 h-4 w-4" />
              Print
            </Button>
            <Button 
              variant="outline" 
              onClick={generatePDF}
            >
              <FileDown className="mr-2 h-4 w-4" />
              Download PDF
            </Button>
          </div>
          
          <Button 
            variant="outline" 
            onClick={onClose}
          >
            <X className="mr-2 h-4 w-4" />
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}