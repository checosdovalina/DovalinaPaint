import { useState } from "react";
import { Quote, Project, Client } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FileDown, Printer, Eye, X, Check, ArrowRight } from "lucide-react";
import { format } from "date-fns";
import { enUS } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

// Import print styles
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

  // Mutation to approve the quote
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
        title: "Quote Approved",
        description: "The quote has been successfully approved.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/quotes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      onClose();
    },
    onError: (error) => {
      setIsApproving(false);
      toast({
        title: "Error",
        description: `Could not approve the quote: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  // Mutation to reject the quote
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
        title: "Quote Rejected",
        description: "The quote has been rejected.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/quotes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      onClose();
    },
    onError: (error) => {
      setIsRejecting(false);
      toast({
        title: "Error",
        description: `Could not reject the quote: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Conversion to service order mutation
  const convertToServiceOrderMutation = useMutation({
    mutationFn: async () => {
      // Function to remove price information from text
      const removePriceInfo = (text: string) => {
        return text
          // Remove lines with dollar amounts
          .replace(/.*\$[\d,]+\.?\d*.*\n?/g, '')
          // Remove "TOTAL PROJECT COST" lines
          .replace(/.*TOTAL PROJECT COST.*\n?/g, '')
          // Remove "Project Breakdown:" header
          .replace(/Project Breakdown:\s*\n/g, '')
          // Remove bullet points with price patterns
          .replace(/• .*\$[\d,]+\.?\d*.*/g, '')
          // Remove empty lines
          .replace(/\n\s*\n/g, '\n')
          .trim();
      };
      
      // Prepare detailed scope of work without costs
      let serviceOrderDetails = "";
      
      // Add basic project information
      if (project) {
        serviceOrderDetails += `PROJECT: ${project.title}\n`;
        serviceOrderDetails += `SERVICE TYPE: ${project.serviceType}\n`;
        if (project.description) {
          serviceOrderDetails += `DESCRIPTION: ${project.description}\n\n`;
        }
      }
      
      serviceOrderDetails += `WORK TO BE PERFORMED:\n\n`;
      
      // Add work details from materials and labor (descriptions only, no costs)
      if (Array.isArray(quote.materialsEstimate) && quote.materialsEstimate.length > 0) {
        serviceOrderDetails += `MATERIALS REQUIRED:\n`;
        quote.materialsEstimate.forEach((item: any, index: number) => {
          if (item.name) {
            serviceOrderDetails += `• ${item.name}${item.quantity ? ` (Qty: ${item.quantity})` : ''}\n`;
          }
        });
        serviceOrderDetails += `\n`;
      }
      
      if (Array.isArray(quote.laborEstimate) && quote.laborEstimate.length > 0) {
        serviceOrderDetails += `WORK TASKS:\n`;
        quote.laborEstimate.forEach((item: any, index: number) => {
          if (item.description) {
            serviceOrderDetails += `• ${item.description}${item.hours ? ` (Est. ${item.hours} hours)` : ''}\n`;
          }
        });
        serviceOrderDetails += `\n`;
      }
      
      // Add exterior breakdown if available
      if ((quote as any).exteriorBreakdown) {
        const exterior = (quote as any).exteriorBreakdown;
        serviceOrderDetails += `EXTERIOR WORK DETAILS:\n`;
        
        // Extract enabled modules without costs
        Object.entries(exterior).forEach(([key, module]: [string, any]) => {
          if (module.enabled && module.subtotal > 0) {
            const moduleName = key.charAt(0).toUpperCase() + key.slice(1);
            
            if (key === 'boxes') {
              serviceOrderDetails += `• ${moduleName} (Soffit, Facia, Gutters) - Quantity: ${module.quantity}\n`;
            } else if (key === 'dormer' && module.quantity > 0) {
              serviceOrderDetails += `• ${moduleName} - ${module.complexity || 'standard'} type - Quantity: ${module.quantity}\n`;
            } else if (key === 'shutters' && module.lines) {
              module.lines.forEach((line: any) => {
                if (line.quantity > 0) {
                  serviceOrderDetails += `• ${moduleName} (${line.type}) - Quantity: ${line.quantity}\n`;
                }
              });
            } else if (key === 'miscellaneous' && module.lines) {
              module.lines.forEach((line: any) => {
                if (line.description) {
                  serviceOrderDetails += `• ${line.description}\n`;
                }
              });
            }
          }
        });
        serviceOrderDetails += `\n`;
      }
      
      // Add filtered scope of work (remove price information)
      if (quote.scopeOfWork) {
        const filteredScope = removePriceInfo(quote.scopeOfWork);
        if (filteredScope) {
          serviceOrderDetails += `ADDITIONAL WORK DETAILS:\n${filteredScope}\n\n`;
        }
      }
      
      // Add standard services
      serviceOrderDetails += `INCLUDED SERVICES:\n`;
      serviceOrderDetails += `• Prep: Power washing as needed, scraping and sanding, removing old caulk and re-caulking gaps\n`;
      serviceOrderDetails += `• Protection: Cover and protect all landscaping, walkways, and adjacent surfaces\n`;
      serviceOrderDetails += `• Clean-up: Complete site clean-up and proper disposal of all materials\n\n`;
      
      // Add notes if available (filter out price info)
      if (quote.notes) {
        const filteredNotes = removePriceInfo(quote.notes);
        if (filteredNotes) {
          serviceOrderDetails += `ADDITIONAL NOTES:\n${filteredNotes}\n\n`;
        }
      }
      
      // Fallback if no content
      if (!serviceOrderDetails.trim()) {
        serviceOrderDetails = "Service order created from quote - please review and add specific work details.";
      }

      const res = await apiRequest("POST", "/api/service-orders", {
        projectId: quote.projectId,
        quoteId: quote.id,
        details: serviceOrderDetails.trim(),
        status: "pending",
        images: project?.images || [],
        documents: project?.documents || []
      });
      return res.json();
    },
    onSuccess: () => {
      // Update quote status to converted
      const updateStatusMutation = useMutation({
        mutationFn: async () => {
          return apiRequest("PUT", `/api/quotes/${quote.id}`, {
            ...quote,
            status: "converted"
          });
        },
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["/api/quotes"] });
          queryClient.invalidateQueries({ queryKey: ["/api/service-orders"] });
        }
      });
      updateStatusMutation.mutate();
      
      onClose();
      toast({
        title: "Service Order Created",
        description: "Quote has been converted to a service order successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Conversion Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Calculate materials total from the quote data
  const materialsTotal = Array.isArray(quote.materialsEstimate) 
    ? quote.materialsEstimate.reduce((sum, item) => sum + (item.total || 0), 0)
    : 0;
  
  // Calculate labor total from the quote data
  const laborTotal = Array.isArray(quote.laborEstimate) 
    ? quote.laborEstimate.reduce((sum, item) => sum + (item.total || 0), 0)
    : 0;
  
  // Calculate subtotal (materials + labor)
  const baseSubtotal = materialsTotal + laborTotal;
  
  // Calculate additional costs (if any)
  const additionalCosts = (quote as any).additionalCosts || 0;
  
  // Get the total amount directly from the quote or calculate it if needed
  const totalAmount = quote.totalEstimate || (baseSubtotal + additionalCosts);

  // Function to generate and download PDF
  const generatePDF = async () => {
    toast({
      title: "Generating PDF",
      description: "Please wait while your PDF is being generated...",
    });
    
    try {
      // Get the printable content element
      const printableContent = document.getElementById('quote-detail-printable');
      if (!printableContent) {
        throw new Error("Content element not found");
      }
      
      // Add print-specific classes to enhance PDF layout
      printableContent.classList.add('print-content');
      
      // Hide elements that shouldn't be in the PDF
      const elementsToHide = document.querySelectorAll('.print-hidden');
      elementsToHide.forEach(el => {
        (el as HTMLElement).style.display = 'none';
      });
      
      // Generate a filename for the PDF
      const filename = `Dovalina_Painting_Quote_${quote.id}_${project?.title || 'Project'}.pdf`.replace(/\s+/g, '_');
      
      // Capture the content as an image using html2canvas
      const canvas = await html2canvas(printableContent, {
        scale: 1.5, // Higher scale for better quality
        useCORS: true,
        allowTaint: true,
        logging: false, // Disable logging
      });
      
      // Create a new PDF document in portrait, using mm units
      const pdfWidth = 210; // A4 width in mm
      const pdfHeight = 297; // A4 height in mm
      const imgWidth = pdfWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      // Create new PDF
      const pdf = new jsPDF({
        orientation: imgHeight > imgWidth ? 'portrait' : 'landscape',
        unit: 'mm',
        format: 'a4',
      });
      
      // If content is larger than A4, split it into multiple pages
      if (imgHeight > pdfHeight) {
        let heightLeft = imgHeight;
        let position = 0;
        let page = 1;
        
        while (heightLeft > 0) {
          // Add page and add content
          if (page > 1) {
            pdf.addPage();
          }
          
          // Add image to the page
          pdf.addImage(
            canvas.toDataURL('image/jpeg', 0.95), // JPEG with 95% quality gives smaller file size
            'JPEG',
            0, // Left margin
            position, // Top position
            imgWidth,
            imgHeight
          );
          
          // Move to next page
          heightLeft -= pdfHeight;
          position -= pdfHeight;
          page++;
        }
      } else {
        // Content fits in one page
        pdf.addImage(
          canvas.toDataURL('image/jpeg', 0.95),
          'JPEG',
          0,
          0,
          imgWidth,
          imgHeight
        );
      }
      
      // Save the PDF file
      pdf.save(filename);
      
      // Restore the UI
      printableContent.classList.remove('print-content');
      elementsToHide.forEach(el => {
        (el as HTMLElement).style.display = '';
      });
      
      toast({
        title: "PDF Downloaded",
        description: "Your quote has been saved as a PDF file.",
      });
    } catch (error) {
      console.error("PDF generation error:", error);
      toast({
        title: "PDF Generation Failed",
        description: "There was a problem generating the PDF. Please try again.",
        variant: "destructive",
      });
      
      // Restore the UI in case of error
      const printableContent = document.getElementById('quote-detail-printable');
      if (printableContent) {
        printableContent.classList.remove('print-content');
      }
      
      const elementsToHide = document.querySelectorAll('.print-hidden');
      elementsToHide.forEach(el => {
        (el as HTMLElement).style.display = '';
      });
    }
  };

  // Function to print
  const printQuote = () => {
    window.print();
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl overflow-y-auto max-h-[90vh]">
        <DialogHeader className="print:hidden">
          <DialogTitle>Quote Details #{quote.id}</DialogTitle>
        </DialogHeader>
        
        <div className="p-4 print:p-6" id="quote-detail-printable">
          {/* Company information header */}
          <div className="flex justify-between items-start border-b pb-4 mb-6 company-header">
            <div>
              <h1 className="text-2xl font-bold company-name">DOVALINA PRO PAINTERS</h1>
              <p>3731 Aster Drive</p>
              <p>Charlotte, N.C. 28227</p>
              <p>704-506-9741</p>
              <p>d-dovalina@hotmail.com</p>
            </div>
            <div className="text-right quote-info">
              <h2 className="text-xl font-semibold">Quote #{quote.id}</h2>
              <p>Date: {quote.createdAt ? format(new Date(quote.createdAt), "PPP", { locale: enUS }) : 'N/A'}</p>
              <p>Status: <span className="font-medium">{quote.status === 'draft' ? 'Draft' : 
                quote.status === 'sent' ? 'Sent' : 
                quote.status === 'approved' ? 'Approved' : 
                quote.status === 'rejected' ? 'Rejected' : 'Unknown'}</span>
              </p>
              <p>Valid until: {quote.validUntil ? format(new Date(quote.validUntil), "PPP", { locale: enUS }) : 'N/A'}</p>
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
          
          {/* Cost breakdown */}
          <h3 className="text-lg font-semibold mb-3 cost-title">Cost Breakdown</h3>
          
          {/* Materials */}
          <Card className="mb-4 cost-section">
            <CardContent className="p-4">
              <h4 className="font-medium mb-2">Materials Cost</h4>
              <div className="border rounded-md overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted">
                    <tr>
                      <th className="py-2 px-3 text-left">Description</th>
                      <th className="py-2 px-3 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Array.isArray(quote.materialsEstimate) && quote.materialsEstimate.length > 0 ? (
                      quote.materialsEstimate.map((item, index) => (
                        <tr key={index} className="border-t">
                          <td className="py-2 px-3">{item.name}</td>
                          <td className="py-2 px-3 text-right">${(item.total || 0).toFixed(2)}</td>
                        </tr>
                      ))
                    ) : (
                      <tr className="border-t">
                        <td className="py-2 px-3 text-center" colSpan={2}>No material items found</td>
                      </tr>
                    )}
                    <tr className="border-t bg-muted">
                      <td className="py-2 px-3 font-medium text-right">Materials Subtotal:</td>
                      <td className="py-2 px-3 font-medium text-right">${materialsTotal.toFixed(2)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
          
          {/* Labor */}
          <Card className="mb-4 cost-section">
            <CardContent className="p-4">
              <h4 className="font-medium mb-2">Labor Cost</h4>
              <div className="border rounded-md overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted">
                    <tr>
                      <th className="py-2 px-3 text-left">Description</th>
                      <th className="py-2 px-3 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Array.isArray(quote.laborEstimate) && quote.laborEstimate.length > 0 ? (
                      quote.laborEstimate.map((item, index) => (
                        <tr key={index} className="border-t">
                          <td className="py-2 px-3">{item.description}</td>
                          <td className="py-2 px-3 text-right">${(item.total || 0).toFixed(2)}</td>
                        </tr>
                      ))
                    ) : (
                      <tr className="border-t">
                        <td className="py-2 px-3 text-center" colSpan={2}>No labor items found</td>
                      </tr>
                    )}
                    <tr className="border-t bg-muted">
                      <td className="py-2 px-3 font-medium text-right">Labor Subtotal:</td>
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
              <div className="flex justify-between items-center quote-total">
                <h3 className="text-lg font-semibold">Quote Total</h3>
                <p className="text-2xl font-bold">${(totalAmount).toFixed(2)}</p>
              </div>
            </CardContent>
          </Card>
          
          {/* Notes */}
          {quote.notes && (
            <Card className="mb-6">
              <CardContent className="p-4">
                <h3 className="text-lg font-semibold mb-2">Notes and Conditions</h3>
                <p className="whitespace-pre-line">{quote.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>
        
        {/* Action buttons - not printed */}
        <div className="flex justify-between items-center print:hidden">
          <div>
            <Button 
              variant="outline" 
              onClick={printQuote} 
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
                  {isApproving ? "Approving..." : "Approve Quote"}
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
                  {isRejecting ? "Rejecting..." : "Reject Quote"}
                </Button>
              </>
            )}
            
            {/* Convert to Service Order button - only show for approved quotes */}
            {quote.status === 'approved' && (
              <Button 
                variant="outline" 
                onClick={() => convertToServiceOrderMutation.mutate()}
                disabled={convertToServiceOrderMutation.isPending}
                className="mr-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200"
              >
                <ArrowRight className="mr-2 h-4 w-4" />
                {convertToServiceOrderMutation.isPending ? "Converting..." : "Convert to Service Order"}
              </Button>
            )}
            
            <Button 
              variant="outline" 
              onClick={onClose}
            >
              <X className="mr-2 h-4 w-4" />
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}