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

  // Function to generate and download PDF - styled to match the reference format
  const generatePDF = async () => {
    toast({
      title: "Generating PDF",
      description: "Please wait while your PDF is being generated...",
    });
    
    try {
      // Create a new PDF document
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: true
      });
      
      // Generate a filename for the PDF
      const filename = `Dovalina_Painting_ServiceOrder_${serviceOrder.id}.pdf`;
      
      // Set margins
      const leftMargin = 15;
      const pageWidth = 210 - (leftMargin * 2); // A4 width minus margins
      let yPos = 15;
      
      // --------------------------------------------
      // HEADER SECTION
      // --------------------------------------------
      // Company info (left side)
      pdf.setFontSize(16);
      pdf.setFont('arial', 'bold');
      pdf.text("DOVALINA PAINTING LLC", leftMargin, yPos);
      
      // Service order info (right side)
      const rightColStart = 160;
      pdf.setFontSize(12);
      pdf.text(`Service Order #${serviceOrder.id}`, rightColStart, yPos, { align: 'right' });
      
      // Company details
      yPos += 5;
      pdf.setFontSize(10);
      pdf.setFont('arial', 'normal');
      pdf.text("3731 Aster Drive", leftMargin, yPos);
      
      // Order date
      pdf.text(`Date: ${serviceOrder.createdAt 
        ? format(new Date(serviceOrder.createdAt), "MMMM do, yyyy", { locale: enUS }) 
        : 'N/A'}`, 
        rightColStart, 
        yPos, 
        { align: 'right' }
      );
      
      // More company details
      yPos += 5;
      pdf.text("Charlotte, N.C. 28227", leftMargin, yPos);
      
      // Status
      pdf.text(`Status: ${serviceOrder.status || 'pending'}`, 
        rightColStart, 
        yPos, 
        { align: 'right' }
      );
      
      // Phone
      yPos += 5;
      pdf.text("704-506-9741", leftMargin, yPos);
      
      // Due date
      pdf.text(`Due Date: ${serviceOrder.dueDate 
        ? format(new Date(serviceOrder.dueDate), "MMMM do, yyyy", { locale: enUS }) 
        : 'N/A'}`, 
        rightColStart, 
        yPos, 
        { align: 'right' }
      );
      
      // Email
      yPos += 5;
      pdf.text("d-dovalina@hotmail.com", leftMargin, yPos);
      
      // Add horizontal line separator
      yPos += 10;
      pdf.setDrawColor(200, 200, 200);
      pdf.line(leftMargin, yPos, 195, yPos);
      
      // --------------------------------------------
      // PROJECT & CLIENT INFORMATION SECTIONS
      // --------------------------------------------
      yPos += 10;
      
      // PROJECT INFORMATION - Left box
      pdf.setFillColor(245, 245, 245);
      pdf.roundedRect(leftMargin, yPos, 85, 35, 1, 1, 'F');
      
      pdf.setFontSize(12);
      pdf.setFont('arial', 'bold');
      pdf.text("Project Information", leftMargin + 5, yPos + 7);
      
      pdf.setFontSize(10);
      pdf.setFont('arial', 'normal'); // Cambio a fuente Courier para consistencia
      pdf.text(`Name: ${project?.title || 'N/A'}`, leftMargin + 5, yPos + 15);
      pdf.text(`Address: ${project?.address || 'N/A'}`, leftMargin + 5, yPos + 22);
      
      const description = project?.description || 'N/A';
      const descSplit = pdf.splitTextToSize(`Description: ${description}`, 75);
      pdf.text(descSplit, leftMargin + 5, yPos + 29);
      
      // CLIENT INFORMATION - Right box
      pdf.setFillColor(245, 245, 245);
      pdf.roundedRect(leftMargin + 90, yPos, 85, 35, 1, 1, 'F');
      
      pdf.setFontSize(12);
      pdf.setFont('arial', 'bold');
      pdf.text("Client Information", leftMargin + 95, yPos + 7);
      
      pdf.setFontSize(10);
      pdf.setFont('arial', 'normal'); // Cambio a fuente Courier para consistencia
      pdf.text(`Name: ${client?.name || 'N/A'}`, leftMargin + 95, yPos + 15);
      pdf.text(`Email: ${client?.email || 'N/A'}`, leftMargin + 95, yPos + 22);
      pdf.text(`Phone: ${client?.phone || 'N/A'}`, leftMargin + 95, yPos + 29);
      
      // --------------------------------------------
      // SERVICE DETAILS SECTION
      // --------------------------------------------
      yPos += 45; // Space after the boxes
      
      // First calculate detailsHeight to see if we need special handling for long text
      let detailsTextHeight = 0;
      if (serviceOrder.details) {
        // Calculate space needed for details text
        const detailsTextLines = pdf.splitTextToSize(serviceOrder.details, pageWidth - 10);
        detailsTextHeight = detailsTextLines.length * 5; // Each line ~5mm tall
      }
      
      // Dynamic height for the service details box based on content
      const baseDetailsHeight = 60; // Minimum height with no details
      const detailsHeight = Math.max(
        baseDetailsHeight,
        detailsTextHeight > 0 ? 45 + detailsTextHeight : baseDetailsHeight
      );
      
      // Draw the service details box
      pdf.setFillColor(245, 245, 245);
      pdf.roundedRect(leftMargin, yPos, pageWidth, detailsHeight, 1, 1, 'F');
      
      // Title
      pdf.setFontSize(12);
      pdf.setFont('arial', 'bold');
      pdf.text("Service Details", leftMargin + 5, yPos + 7);
      
      // Basic info - regular size for headers
      pdf.setFontSize(10);
      pdf.setFont('arial', 'normal'); // Cambio a fuente Courier para consistencia
      pdf.text(`Assigned To: ${assignedTo || 'Not Assigned'}`, leftMargin + 5, yPos + 15);
      pdf.text(`Start Date: ${serviceOrder.startDate 
        ? format(new Date(serviceOrder.startDate), "MMMM d'th', yyyy", { locale: enUS }) 
        : 'N/A'}`, 
        leftMargin + 5, 
        yPos + 22
      );
      
      // Details field label
      pdf.text("Details:", leftMargin + 5, yPos + 29);
      
      // Handle details text with potential wrapping
      if (serviceOrder.details) {
        // Usar fuente monoespaciada para que coincida exactamente con la imagen
        pdf.setFontSize(10); // Tamaño de letra similar al resto del PDF
        pdf.setFont('arial', 'normal'); // Fuente monoespaciada tipo máquina de escribir
        
        // Calculate maximum width for text - provide enough margin
        const maxDetailsWidth = pageWidth - 20; // Wider margin for monospaced font
        
        // Espaciar manualmente cada caracter como en la imagen para simular el estilo de máquina de escribir
        const formattedDetails = serviceOrder.details
          .split('\n')
          .map(line => line.trim()) // Clean up each line
          .filter(line => line.length > 0) // Remove empty lines
          .map(line => {
            // If it already starts with quote marks like in the image, keep it
            if (line.startsWith("' ") || line.startsWith("''") || line.startsWith("'  ")) {
              return line;
            }
            // Add single quote and space exactly like in the image
            return "' " + line;
          })
          // No "spacear" el texto ya que la fuente courier ya lo hace naturalmente
          .join('\n');
          
        // Split formatted text into lines that fit the width
        const detailsLines = pdf.splitTextToSize(formattedDetails, maxDetailsWidth);
        
        // If there are too many lines, we need a new page
        if (detailsLines.length > 30) { // Arbitrary cutoff for what's too long
          // First part on this page - show only first lines
          const firstPageLines = detailsLines.slice(0, 20);
          pdf.text(firstPageLines, leftMargin + 5, yPos + 35);
          
          // Rest on new page
          pdf.addPage();
          
          // Add a header for continuation on new page
          pdf.setFontSize(12);
          pdf.setFont('arial', 'bold');
          pdf.text("Service Details (Continued)", leftMargin, 15);
          
          // Add a background for the continued text
          pdf.setFillColor(245, 245, 245);
          pdf.roundedRect(leftMargin, 20, pageWidth, 200, 1, 1, 'F');
          
          // Add the rest of the text
          pdf.setFontSize(10);
          pdf.setFont('arial', 'normal'); // Keep monospaced font consistent
          const remainingLines = detailsLines.slice(20);
          pdf.text(remainingLines, leftMargin + 5, 25);
          
          // Now we continue with the next section on the first page
          yPos += detailsHeight + 10;
        } else {
          // Text fits on current page
          pdf.text(detailsLines, leftMargin + 5, yPos + 35);
          yPos += detailsHeight + 10; // Move position for next section
        }
      } else {
        // No details provided
        pdf.setFont('arial', 'italic');
        pdf.text("No specific details provided.", leftMargin + 5, yPos + 35);
        yPos += detailsHeight + 10; // Move position for next section
      }
      
      // --------------------------------------------
      // MATERIALS REQUIRED SECTION (if present)
      // --------------------------------------------
      if (serviceOrder.materialsRequired) {
        // Ensure spacing after previous section
        if (yPos > 220) {
          pdf.addPage();
          yPos = 15;
        }
        
        // Use courier for materials to match details section styling 
        pdf.setFontSize(10);
        pdf.setFont('arial', 'normal'); // Use monospaced font for consistency with details
        
        // Calculate needed height for materials text with slightly narrower margin
        const materialsSplit = pdf.splitTextToSize(serviceOrder.materialsRequired, pageWidth - 20);
        const materialHeight = Math.min(10 + materialsSplit.length * 5, 60); // Header + content, max 60mm
        
        // Draw light gray background
        pdf.setFillColor(245, 245, 245);
        pdf.roundedRect(leftMargin, yPos, pageWidth, materialHeight, 1, 1, 'F');
        
        // Title
        pdf.setFontSize(12);
        pdf.setFont('arial', 'bold');
        pdf.text("Materials Required", leftMargin + 5, yPos + 7);
        
        // Content
        pdf.setFontSize(10); // Match details font size
        pdf.setFont('arial', 'normal'); // Use monospaced font for consistent appearance
        pdf.text(materialsSplit, leftMargin + 5, yPos + 15);
        
        // Update position for next section
        yPos += materialHeight + 10;
      }
      
      // --------------------------------------------
      // CLIENT SIGNATURE SECTION
      // --------------------------------------------
      // Check if we need to add a new page for signature
      if (yPos > 220) {
        pdf.addPage();
        yPos = 15;
      }
      
      // Draw the client approval section box
      pdf.setFillColor(245, 245, 245);
      pdf.roundedRect(leftMargin, yPos, pageWidth, 70, 1, 1, 'F');
      
      // Title
      pdf.setFontSize(12);
      pdf.setFont('arial', 'bold');
      pdf.text("Client Approval", leftMargin + 5, yPos + 7);
      
      if (clientSignature) {
        // Signature date
        pdf.setFontSize(10);
        pdf.setFont('arial', 'normal');
        pdf.text(
          `Signed by client on: ${serviceOrder.signedDate 
            ? format(new Date(serviceOrder.signedDate), "MMMM d'th', yyyy", { locale: enUS }) 
            : format(new Date(), "MMMM d'th', yyyy", { locale: enUS })}`, 
          leftMargin + 5, 
          yPos + 15
        );
        
        // Add signature image
        try {
          // Center the signature horizontally in the box and give it plenty of vertical space
          const sigWidth = 140; // Width of signature image
          const sigHeight = 45; // Height of signature image
          const sigX = leftMargin + 5; // Left aligned
          const sigY = yPos + 20; // Position below text
          
          pdf.addImage(
            clientSignature,
            'PNG',
            sigX,
            sigY,
            sigWidth,
            sigHeight
          );
        } catch (e) {
          console.error("Error adding signature to PDF:", e);
          pdf.setFontSize(9);
          pdf.setFont('arial', 'italic');
          pdf.text("Error displaying signature image", leftMargin + 5, yPos + 25);
        }
      } else {
        pdf.setFontSize(10);
        pdf.setFont('arial', 'italic');
        pdf.text("Not yet signed by client", leftMargin + 5, yPos + 15);
      }
      
      // Add footer with page number
      pdf.setFontSize(8);
      pdf.setFont('arial', 'normal');
      pdf.text(
        `Generated on ${format(new Date(), "MMMM d'th', yyyy", { locale: enUS })}`,
        105,
        285,
        { align: "center" }
      );
      
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
              <p>Date: {serviceOrder.createdAt ? format(new Date(serviceOrder.createdAt), "MMMM d'th', yyyy", { locale: enUS }) : 'N/A'}</p>
              <p>Status: <span className="font-medium">{serviceOrder.status || 'Pending'}</span></p>
              <p>Due Date: {serviceOrder.dueDate ? format(new Date(serviceOrder.dueDate), "MMMM d'th', yyyy", { locale: enUS }) : 'N/A'}</p>
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
              <p><span className="font-medium">Start Date:</span> {serviceOrder.startDate ? format(new Date(serviceOrder.startDate), "MMMM d'th', yyyy", { locale: enUS }) : 'N/A'}</p>
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
                    ? format(new Date(serviceOrder.signedDate), "MMMM d'th', yyyy", { locale: enUS }) 
                    : format(new Date(), "MMMM d'th', yyyy", { locale: enUS })}</p>
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