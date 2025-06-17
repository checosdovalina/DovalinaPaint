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
      pdf.setFont('helvetica', 'bold');
      pdf.text("DOVALINA PAINTING LLC", leftMargin, yPos);
      
      // Service order info (right side)
      const rightColStart = 160;
      pdf.setFontSize(12);
      pdf.text(`Service Order #${serviceOrder.id}`, rightColStart, yPos, { align: 'right' });
      
      // Company details
      yPos += 5;
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.text("3731 Aster Drive", leftMargin, yPos);
      
      // Order date
      pdf.text(`Date: ${serviceOrder.createdAt 
        ? format(new Date(serviceOrder.createdAt), "MMMM d'th', yyyy", { locale: enUS }) 
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
        ? format(new Date(serviceOrder.dueDate), "MMMM d'th', yyyy", { locale: enUS }) 
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
      pdf.setFont('helvetica', 'bold');
      pdf.text("Project Information", leftMargin + 5, yPos + 7);
      
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Name: ${project?.title || 'N/A'}`, leftMargin + 5, yPos + 15);
      pdf.text(`Address: ${project?.address || 'N/A'}`, leftMargin + 5, yPos + 22);
      
      const description = project?.description || 'N/A';
      const descSplit = pdf.splitTextToSize(`Description: ${description}`, 75);
      pdf.text(descSplit, leftMargin + 5, yPos + 29);
      
      // CLIENT INFORMATION - Right box
      pdf.setFillColor(245, 245, 245);
      pdf.roundedRect(leftMargin + 90, yPos, 85, 35, 1, 1, 'F');
      
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text("Client Information", leftMargin + 95, yPos + 7);
      
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
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
      pdf.setFont('helvetica', 'bold');
      pdf.text("Service Details", leftMargin + 5, yPos + 7);
      
      // Basic info - regular size for headers
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Assigned To: ${assignedTo || 'Not Assigned'}`, leftMargin + 5, yPos + 15);
      pdf.text(`Start Date: ${serviceOrder.startDate 
        ? format(new Date(serviceOrder.startDate), "MMMM d'th', yyyy", { locale: enUS }) 
        : 'N/A'}`, 
        leftMargin + 5, 
        yPos + 22
      );
      
      // Details field with smaller font size
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'medium');
      pdf.text("Details:", leftMargin + 5, yPos + 29);
      
      // Handle details text
      if (serviceOrder.details) {
        // Use a smaller font size for the details text
        pdf.setFontSize(8);
        pdf.setFont('helvetica', 'normal');
        
        // Calculate maximum width for text - entire page width almost
        const maxDetailsWidth = pageWidth - 15;
        
        // Offset for details content
        const contentStartX = leftMargin + 10;
        const contentStartY = yPos + 35;
        
        // Process each line of the details
        const detailsLines = serviceOrder.details.split('\n');
        let lineY = contentStartY;
        
        for (let i = 0; i < detailsLines.length; i++) {
          const line = detailsLines[i];
          // Si la línea comienza con un punto, asterisco o guión, mostrarla como un ítem de lista
          const isListItem = /^\s*[\•\-\*\✓]\s+/.test(line);
          
          if (isListItem) {
            // For list items, add a bullet point
            const bulletX = contentStartX;
            const textX = contentStartX + 3;
            
            // Clean the text by removing bullet markers
            const cleanText = line.replace(/^\s*[\•\-\*\✓]\s+/, '');
            
            // Split text to fit width
            const textLines = pdf.splitTextToSize(cleanText, maxDetailsWidth - 15);
            
            // Add bullet
            pdf.text("•", bulletX, lineY);
            
            // Add text after bullet
            pdf.text(textLines, textX, lineY);
            
            // Move position down for next line
            lineY += textLines.length * 4;
          } else {
            // Regular paragraph
            const textLines = pdf.splitTextToSize(line, maxDetailsWidth - 10);
            pdf.text(textLines, contentStartX, lineY);
            lineY += textLines.length * 4;
          }
          
          // Add small space between items
          lineY += 1;
          
          // Check if we need a new page
          if (lineY > 260) {
            pdf.addPage();
            lineY = 20;
          }
        }
        
        // Move to next section with enough space
        yPos = lineY + 5;
      } else {
        // No details provided
        pdf.setFontSize(8);
        pdf.setFont('helvetica', 'italic');
        pdf.text("No specific details provided.", leftMargin + 5 + 45, yPos + 29);
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
        
        // Draw light gray background - use dynamic height later
        const initialMaterialHeight = 60;
        pdf.setFillColor(245, 245, 245);
        pdf.roundedRect(leftMargin, yPos, pageWidth, initialMaterialHeight, 1, 1, 'F');
        
        // Title
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'bold');
        pdf.text("Materials Required", leftMargin + 5, yPos + 7);
        
        // Content with formatting
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'normal');
        
        // Offset for content
        const contentStartX = leftMargin + 10;
        const contentStartY = yPos + 15;
        
        // Process each line of the materials
        const materialsLines = serviceOrder.materialsRequired.split('\n');
        let lineY = contentStartY;
        
        for (let i = 0; i < materialsLines.length; i++) {
          const line = materialsLines[i];
          // Si la línea comienza con un punto, asterisco o guión, mostrarla como un ítem de lista
          const isListItem = /^\s*[\•\-\*\✓]\s+/.test(line);
          
          if (isListItem) {
            // For list items, add a bullet point
            const bulletX = contentStartX;
            const textX = contentStartX + 3;
            
            // Clean the text by removing bullet markers
            const cleanText = line.replace(/^\s*[\•\-\*\✓]\s+/, '');
            
            // Split text to fit width
            const textLines = pdf.splitTextToSize(cleanText, pageWidth - 25);
            
            // Add bullet
            pdf.text("•", bulletX, lineY);
            
            // Add text after bullet
            pdf.text(textLines, textX, lineY);
            
            // Move position down for next line
            lineY += textLines.length * 4;
          } else {
            // Regular paragraph
            const textLines = pdf.splitTextToSize(line, pageWidth - 20);
            pdf.text(textLines, contentStartX, lineY);
            lineY += textLines.length * 4;
          }
          
          // Add small space between items
          lineY += 1;
          
          // Check if we need a new page
          if (lineY > 260) {
            pdf.addPage();
            lineY = 20;
          }
        }
        
        // Calculate actual height used
        const actualHeight = Math.min(lineY - contentStartY + 10, initialMaterialHeight);
        
        // Redraw the background with correct height
        pdf.setFillColor(245, 245, 245);
        pdf.roundedRect(leftMargin, yPos, pageWidth, actualHeight, 1, 1, 'F');
        
        // Update position for next section
        yPos = lineY + 5;
      }
      
      // --------------------------------------------
      // SPECIAL INSTRUCTIONS (if present)
      // --------------------------------------------
      if (serviceOrder.specialInstructions) {
        // Ensure spacing after previous section
        if (yPos > 220) {
          pdf.addPage();
          yPos = 15;
        }
        
        // Draw light gray background - use dynamic height later
        const initialInstructionsHeight = 60;
        pdf.setFillColor(245, 245, 245);
        pdf.roundedRect(leftMargin, yPos, pageWidth, initialInstructionsHeight, 1, 1, 'F');
        
        // Title
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'bold');
        pdf.text("Special Instructions", leftMargin + 5, yPos + 7);
        
        // Content with formatting
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'normal');
        
        // Offset for content
        const contentStartX = leftMargin + 10;
        const contentStartY = yPos + 15;
        
        // Process each line of the instructions
        const instructionsLines = serviceOrder.specialInstructions.split('\n');
        let lineY = contentStartY;
        
        for (let i = 0; i < instructionsLines.length; i++) {
          const line = instructionsLines[i];
          // Si la línea comienza con un punto, asterisco o guión, mostrarla como un ítem de lista
          const isListItem = /^\s*[\•\-\*\✓]\s+/.test(line);
          
          if (isListItem) {
            // For list items, add a bullet point
            const bulletX = contentStartX;
            const textX = contentStartX + 3;
            
            // Clean the text by removing bullet markers
            const cleanText = line.replace(/^\s*[\•\-\*\✓]\s+/, '');
            
            // Split text to fit width
            const textLines = pdf.splitTextToSize(cleanText, pageWidth - 25);
            
            // Add bullet
            pdf.text("•", bulletX, lineY);
            
            // Add text after bullet
            pdf.text(textLines, textX, lineY);
            
            // Move position down for next line
            lineY += textLines.length * 4;
          } else {
            // Regular paragraph
            const textLines = pdf.splitTextToSize(line, pageWidth - 20);
            pdf.text(textLines, contentStartX, lineY);
            lineY += textLines.length * 4;
          }
          
          // Add small space between items
          lineY += 1;
          
          // Check if we need a new page
          if (lineY > 260) {
            pdf.addPage();
            lineY = 20;
          }
        }
        
        // Calculate actual height used
        const actualHeight = Math.min(lineY - contentStartY + 10, initialInstructionsHeight);
        
        // Redraw the background with correct height
        pdf.setFillColor(245, 245, 245);
        pdf.roundedRect(leftMargin, yPos, pageWidth, actualHeight, 1, 1, 'F');
        
        // Update position for next section
        yPos = lineY + 5;
      }
      
      // --------------------------------------------
      // SAFETY REQUIREMENTS (if present)
      // --------------------------------------------
      if (serviceOrder.safetyRequirements) {
        // Ensure spacing after previous section
        if (yPos > 220) {
          pdf.addPage();
          yPos = 15;
        }
        
        // Draw light gray background - use dynamic height later
        const initialSafetyHeight = 60;
        pdf.setFillColor(245, 245, 245);
        pdf.roundedRect(leftMargin, yPos, pageWidth, initialSafetyHeight, 1, 1, 'F');
        
        // Title
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'bold');
        pdf.text("Safety Requirements", leftMargin + 5, yPos + 7);
        
        // Content with formatting
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'normal');
        
        // Offset for content
        const contentStartX = leftMargin + 10;
        const contentStartY = yPos + 15;
        
        // Process each line of the safety requirements
        const safetyLines = serviceOrder.safetyRequirements.split('\n');
        let lineY = contentStartY;
        
        for (let i = 0; i < safetyLines.length; i++) {
          const line = safetyLines[i];
          // Si la línea comienza con un punto, asterisco o guión, mostrarla como un ítem de lista
          const isListItem = /^\s*[\•\-\*\✓]\s+/.test(line);
          
          if (isListItem) {
            // For list items, add a bullet point
            const bulletX = contentStartX;
            const textX = contentStartX + 3;
            
            // Clean the text by removing bullet markers
            const cleanText = line.replace(/^\s*[\•\-\*\✓]\s+/, '');
            
            // Split text to fit width
            const textLines = pdf.splitTextToSize(cleanText, pageWidth - 25);
            
            // Add bullet
            pdf.text("•", bulletX, lineY);
            
            // Add text after bullet
            pdf.text(textLines, textX, lineY);
            
            // Move position down for next line
            lineY += textLines.length * 4;
          } else {
            // Regular paragraph
            const textLines = pdf.splitTextToSize(line, pageWidth - 20);
            pdf.text(textLines, contentStartX, lineY);
            lineY += textLines.length * 4;
          }
          
          // Add small space between items
          lineY += 1;
          
          // Check if we need a new page
          if (lineY > 260) {
            pdf.addPage();
            lineY = 20;
          }
        }
        
        // Calculate actual height used
        const actualHeight = Math.min(lineY - contentStartY + 10, initialSafetyHeight);
        
        // Redraw the background with correct height
        pdf.setFillColor(245, 245, 245);
        pdf.roundedRect(leftMargin, yPos, pageWidth, actualHeight, 1, 1, 'F');
        
        // Update position for next section
        yPos = lineY + 5;
      }
      
      // --------------------------------------------
      // PROJECT IMAGES FROM INHERITED PROJECT (if present)
      // --------------------------------------------
      if (project?.images && Array.isArray(project.images) && project.images.length > 0) {
        // Add a new page for project images
        pdf.addPage();
        yPos = 15;
        
        // Title
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'bold');
        pdf.text("Project Reference Images", leftMargin, yPos);
        yPos += 10;
        
        // Add project images
        const imgWidth = 80; // Width of each image in mm
        const imgHeight = 60; // Height of each image in mm
        const imagesPerRow = 2; // Number of images per row
        
        for (let i = 0; i < project.images.length; i++) {
          try {
            const xPos = leftMargin + (i % imagesPerRow) * (imgWidth + 5);
            
            // If we need to start a new row
            if (i > 0 && i % imagesPerRow === 0) {
              yPos += imgHeight + 10;
            }
            
            // If we're about to go off the page, add a new page
            if (yPos + imgHeight > 270) {
              pdf.addPage();
              yPos = 15;
            }
            
            pdf.setFillColor(255, 255, 255);
            pdf.roundedRect(xPos, yPos, imgWidth, imgHeight, 3, 3, 'F');
            
            // Add the image with rounded corners
            pdf.addImage(
              project.images[i],
              'JPEG',
              xPos,
              yPos,
              imgWidth,
              imgHeight,
              undefined,
              'NONE',
              0
            );
            
            // Draw a border around the image
            pdf.setDrawColor(220, 220, 220);
            pdf.roundedRect(xPos, yPos, imgWidth, imgHeight, 3, 3, 'S');
            
          } catch (e) {
            console.error("Error adding project image to PDF:", e);
          }
        }
        
        // Move position down after images section
        yPos += imgHeight + 15;
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
      pdf.setFont('helvetica', 'bold');
      pdf.text("Client Approval", leftMargin + 5, yPos + 7);
      
      if (clientSignature) {
        // Signature date
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
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
          pdf.setFont('helvetica', 'italic');
          pdf.text("Error displaying signature image", leftMargin + 5, yPos + 25);
        }
      } else {
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'italic');
        pdf.text("Not yet signed by client", leftMargin + 5, yPos + 15);
      }
      
      // --------------------------------------------
      // PROJECT IMAGES SECTION (if present)
      // --------------------------------------------
      if (Array.isArray(serviceOrder.beforeImages) && serviceOrder.beforeImages.length > 0 ||
          Array.isArray(serviceOrder.afterImages) && serviceOrder.afterImages.length > 0) {
        
        // Add a new page for images
        pdf.addPage();
        yPos = 15;
        
        // Title
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'bold');
        pdf.text("Project Images", leftMargin, yPos);
        yPos += 10;
        
        // Before Images
        if (Array.isArray(serviceOrder.beforeImages) && serviceOrder.beforeImages.length > 0) {
          pdf.setFontSize(10);
          pdf.setFont('helvetica', 'bold');
          pdf.text("Before Images:", leftMargin, yPos);
          yPos += 8;
          
          // Add each image
          const imgWidth = 80; // Width of each image in mm
          const imgHeight = 60; // Height of each image in mm
          const imagesPerRow = 2; // Number of images per row
          
          for (let i = 0; i < serviceOrder.beforeImages.length; i++) {
            try {
              const xPos = leftMargin + (i % imagesPerRow) * (imgWidth + 5);
              
              // If we need to start a new row
              if (i > 0 && i % imagesPerRow === 0) {
                yPos += imgHeight + 10;
              }
              
              // If we're about to go off the page, add a new page
              if (yPos + imgHeight > 270) {
                pdf.addPage();
                yPos = 15;
              }
              
              pdf.setFillColor(255, 255, 255);
              pdf.roundedRect(xPos, yPos, imgWidth, imgHeight, 3, 3, 'F');
              
              // Add the image with rounded corners
              pdf.addImage(
                serviceOrder.beforeImages[i],
                'JPEG',
                xPos,
                yPos,
                imgWidth,
                imgHeight,
                undefined,
                'NONE',
                0
              );
              
              // Draw a border around the image
              pdf.setDrawColor(220, 220, 220);
              pdf.roundedRect(xPos, yPos, imgWidth, imgHeight, 3, 3, 'S');
              
            } catch (e) {
              console.error("Error adding before image to PDF:", e);
            }
          }
          
          // Move position down for next section
          yPos += imgHeight + 15;
        }
        
        // After Images
        if (Array.isArray(serviceOrder.afterImages) && serviceOrder.afterImages.length > 0) {
          // If we're about to go off the page, add a new page
          if (yPos > 220) {
            pdf.addPage();
            yPos = 15;
          }
          
          pdf.setFontSize(10);
          pdf.setFont('helvetica', 'bold');
          pdf.text("After Images:", leftMargin, yPos);
          yPos += 8;
          
          // Add each image
          const imgWidth = 80; // Width of each image in mm
          const imgHeight = 60; // Height of each image in mm
          const imagesPerRow = 2; // Number of images per row
          
          for (let i = 0; i < serviceOrder.afterImages.length; i++) {
            try {
              const xPos = leftMargin + (i % imagesPerRow) * (imgWidth + 5);
              
              // If we need to start a new row
              if (i > 0 && i % imagesPerRow === 0) {
                yPos += imgHeight + 10;
              }
              
              // If we're about to go off the page, add a new page
              if (yPos + imgHeight > 270) {
                pdf.addPage();
                yPos = 15;
              }
              
              pdf.setFillColor(255, 255, 255);
              pdf.roundedRect(xPos, yPos, imgWidth, imgHeight, 3, 3, 'F');
              
              // Add the image with rounded corners
              pdf.addImage(
                serviceOrder.afterImages[i],
                'JPEG',
                xPos,
                yPos,
                imgWidth,
                imgHeight,
                undefined,
                'NONE',
                0
              );
              
              // Draw a border around the image
              pdf.setDrawColor(220, 220, 220);
              pdf.roundedRect(xPos, yPos, imgWidth, imgHeight, 3, 3, 'S');
              
            } catch (e) {
              console.error("Error adding after image to PDF:", e);
            }
          }
        }
      }
      
      // Add footer on current page
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'normal');
      pdf.text(
        `Generated on ${format(new Date(), "MMMM d'th', yyyy", { locale: enUS })}`,
        pdf.internal.pageSize.getWidth() / 2,
        pdf.internal.pageSize.getHeight() - 10,
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
              <div>
                <p className="font-medium mb-1">Details:</p>
                {serviceOrder.details ? (
                  <div className="ml-2 text-sm">
                    {serviceOrder.details.split('\n').map((line, index) => {
                      // Si la línea comienza con un punto, asterisco o guión, mostrarla como un ítem de lista
                      const isListItem = /^\s*[\•\-\*\✓]\s+/.test(line);
                      return isListItem ? (
                        <div key={index} className="flex items-start mb-0.5">
                          <span className="mr-1">•</span>
                          <span>{line.replace(/^\s*[\•\-\*\✓]\s+/, '')}</span>
                        </div>
                      ) : (
                        <p key={index} className="mb-0.5">{line || ' '}</p>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm italic ml-2">No specific details provided.</p>
                )}
              </div>
            </CardContent>
          </Card>
          
          {/* Materials Required */}
          {serviceOrder.materialsRequired && (
            <Card className="mb-6">
              <CardContent className="p-4">
                <h3 className="text-lg font-semibold mb-2">Materials Required</h3>
                <div className="ml-2 text-sm">
                  {serviceOrder.materialsRequired.split('\n').map((line, index) => {
                    // Si la línea comienza con un punto, asterisco o guión, mostrarla como un ítem de lista
                    const isListItem = /^\s*[\•\-\*\✓]\s+/.test(line);
                    return isListItem ? (
                      <div key={index} className="flex items-start mb-0.5">
                        <span className="mr-1">•</span>
                        <span>{line.replace(/^\s*[\•\-\*\✓]\s+/, '')}</span>
                      </div>
                    ) : (
                      <p key={index} className="mb-0.5">{line || ' '}</p>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* Special Instructions */}
          {serviceOrder.specialInstructions && (
            <Card className="mb-6">
              <CardContent className="p-4">
                <h3 className="text-lg font-semibold mb-2">Special Instructions</h3>
                <div className="ml-2 text-sm">
                  {serviceOrder.specialInstructions.split('\n').map((line, index) => {
                    // Si la línea comienza con un punto, asterisco o guión, mostrarla como un ítem de lista
                    const isListItem = /^\s*[\•\-\*\✓]\s+/.test(line);
                    return isListItem ? (
                      <div key={index} className="flex items-start mb-0.5">
                        <span className="mr-1">•</span>
                        <span>{line.replace(/^\s*[\•\-\*\✓]\s+/, '')}</span>
                      </div>
                    ) : (
                      <p key={index} className="mb-0.5">{line || ' '}</p>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* Safety Requirements */}
          {serviceOrder.safetyRequirements && (
            <Card className="mb-6">
              <CardContent className="p-4">
                <h3 className="text-lg font-semibold mb-2">Safety Requirements</h3>
                <div className="ml-2 text-sm">
                  {serviceOrder.safetyRequirements.split('\n').map((line, index) => {
                    // Si la línea comienza con un punto, asterisco o guión, mostrarla como un ítem de lista
                    const isListItem = /^\s*[\•\-\*\✓]\s+/.test(line);
                    return isListItem ? (
                      <div key={index} className="flex items-start mb-0.5">
                        <span className="mr-1">•</span>
                        <span>{line.replace(/^\s*[\•\-\*\✓]\s+/, '')}</span>
                      </div>
                    ) : (
                      <p key={index} className="mb-0.5">{line || ' '}</p>
                    );
                  })}
                </div>
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