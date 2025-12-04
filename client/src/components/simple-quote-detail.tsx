import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileDown, Printer, Eye, Check, X, ArrowRight } from "lucide-react";
import { format } from "date-fns";
import logoPath from "@assets/JPG_1_1764824638626.jpg";
import jsPDF from "jspdf";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface SimpleQuoteDetailProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quote: any;
  onEdit?: (quote: any) => void;
}

export function SimpleQuoteDetail({ open, onOpenChange, quote, onEdit }: SimpleQuoteDetailProps) {
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const { toast } = useToast();

  // Fetch project and client data
  const { data: projects = [] } = useQuery({
    queryKey: ["/api/projects"],
  });

  const { data: clients = [] } = useQuery({
    queryKey: ["/api/clients"],
  });

  // Mutations for status changes
  const updateStatusMutation = useMutation({
    mutationFn: async (newStatus: string) => {
      const res = await apiRequest("PUT", `/api/simple-quotes/${quote.id}`, {
        ...quote,
        status: newStatus
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/quotes"] });
      onOpenChange(false); // Cerrar el diálogo para forzar re-render
      toast({
        title: "Status Updated",
        description: "Quote status has been updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

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
      
      // Add project information first
      const project = Array.isArray(projects) ? projects.find((p: any) => p.id === quote.projectId) : null;
      if (project) {
        serviceOrderDetails += `PROJECT: ${project.title}\n`;
        serviceOrderDetails += `SERVICE TYPE: ${project.serviceType}\n`;
        if (project.description) {
          serviceOrderDetails += `DESCRIPTION: ${project.description}\n\n`;
        }
      }
      
      // Process exterior breakdown if available to extract work items
      if (quote.exteriorBreakdown) {
        const exterior = quote.exteriorBreakdown;
        serviceOrderDetails += `WORK TO BE PERFORMED:\n\n`;
        
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
      updateStatusMutation.mutate("converted");
      queryClient.invalidateQueries({ queryKey: ["/api/service-orders"] });
      onOpenChange(false); // Cerrar el diálogo
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

  if (!quote) return null;

  const project = (projects as any[])?.find((p: any) => p.id === quote.projectId) || null;
  const client = (clients as any[])?.find((c: any) => c.id === project?.clientId) || null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "draft":
        return "bg-gray-100 text-gray-800";
      case "sent":
        return "bg-blue-100 text-blue-800";
      case "approved":
        return "bg-green-100 text-green-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "draft":
        return "Draft";
      case "sent":
        return "Sent";
      case "approved":
        return "Approved";
      case "rejected":
        return "Rejected";
      default:
        return status;
    }
  };

  const formatText = (text: string) => {
    if (!text) return "";
    
    return text.split('\n').map((line, index) => {
      // Check if line starts with bullet point indicators
      const bulletRegex = /^[\s]*[•\-\*✓]\s*/;
      if (bulletRegex.test(line)) {
        const cleanLine = line.replace(bulletRegex, '').trim();
        return (
          <div key={index} className="flex items-start mb-1">
            <span className="text-blue-600 mr-2 mt-1">•</span>
            <span>{cleanLine}</span>
          </div>
        );
      }
      return (
        <div key={index} className={line.trim() ? "mb-1" : "mb-2"}>
          {line.trim() || <span className="h-2 block" />}
        </div>
      );
    });
  };

  const generatePDF = async () => {
    setIsGeneratingPDF(true);
    
    try {
      const pdf = new jsPDF();
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 15;
      let yPosition = margin;

      // Helper function to check if we need a new page
      const checkNewPage = (requiredSpace: number = 20) => {
        if (yPosition + requiredSpace > pageHeight - margin) {
          pdf.addPage();
          yPosition = margin;
          return true;
        }
        return false;
      };

      // Add logo
      try {
        const img = new Image();
        img.crossOrigin = "anonymous";
        
        const logoPromise = new Promise((resolve, reject) => {
          img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = img.width;
            canvas.height = img.height;
            ctx?.drawImage(img, 0, 0);
            const logoData = canvas.toDataURL('image/jpeg');
            resolve(logoData);
          };
          img.onerror = reject;
        });
        
        img.src = logoPath;
        const logoData = await logoPromise;
        
        // Add logo to PDF
        pdf.addImage(logoData as string, 'JPEG', margin, yPosition, 18, 18);
      } catch (error) {
        console.log('Logo loading failed, continuing without logo');
      }

      // Company Header (next to logo)
      pdf.setFontSize(16);
      pdf.setFont("helvetica", "bold");
      pdf.text("DOVALINA PRO PAINTERS", margin + 22, yPosition + 6);
      
      pdf.setFontSize(9);
      pdf.setFont("helvetica", "normal");
      pdf.text("3731 Aster Drive", margin + 22, yPosition + 11);
      pdf.text("Charlotte, N.C. 28227", margin + 22, yPosition + 15);
      pdf.text("704-506-9741", margin + 22, yPosition + 19);
      pdf.text("d-dovalina@hotmail.com", margin + 22, yPosition + 23);

      // Quote number and details (right aligned)
      const rightX = pageWidth - margin;
      pdf.setFontSize(14);
      pdf.setFont("helvetica", "bold");
      pdf.text(`Quote #${quote.id}`, rightX, yPosition + 6, { align: 'right' });
      
      pdf.setFontSize(9);
      pdf.setFont("helvetica", "normal");
      pdf.text(`Date: ${format(new Date(quote.createdAt), "MMMM do, yyyy")}`, rightX, yPosition + 11, { align: 'right' });
      pdf.text(`Status: ${getStatusLabel(quote.status)}`, rightX, yPosition + 15, { align: 'right' });
      if (quote.validUntil) {
        pdf.text(`Valid until: ${format(new Date(quote.validUntil), "MMMM do, yyyy")}`, rightX, yPosition + 19, { align: 'right' });
      }

      // Line separator
      yPosition += 30;
      pdf.setDrawColor(200, 200, 200);
      pdf.setLineWidth(0.5);
      pdf.line(margin, yPosition, pageWidth - margin, yPosition);
      yPosition += 10;

      // Project and Client Information Boxes
      const leftColumnX = margin;
      const rightColumnX = pageWidth / 2 + 5;
      const boxWidth = (pageWidth / 2) - margin - 5;
      
      // Calculate actual box heights based on content
      pdf.setFontSize(9);
      let projectContentHeight = 13; // Start after header
      if (project) {
        const projectNameLines = pdf.splitTextToSize(`Name: ${project.title}`, boxWidth - 6);
        projectContentHeight += projectNameLines.length * 4;
        
        const addressLines = pdf.splitTextToSize(`Address: ${project.address || "N/A"}`, boxWidth - 6);
        projectContentHeight += addressLines.length * 4;
      }
      const projectBoxHeight = Math.max(30, projectContentHeight + 5); // Min 30, +5 for padding
      
      let clientContentHeight = 13; // Start after header
      if (client) {
        clientContentHeight += 4; // Name line
        if (client.email) {
          const emailLines = pdf.splitTextToSize(`Email: ${client.email}`, boxWidth - 6);
          clientContentHeight += emailLines.length * 4;
        }
        if (client.phone) {
          clientContentHeight += 4; // Phone line
        }
        if (client.address) {
          const addressLines = pdf.splitTextToSize(`Address: ${client.address}`, boxWidth - 6);
          clientContentHeight += addressLines.length * 4;
        }
      }
      const clientBoxHeight = Math.max(30, clientContentHeight + 5); // Min 30, +5 for padding

      // Draw Project Information Box
      pdf.setDrawColor(150, 150, 150);
      pdf.setLineWidth(0.3);
      pdf.rect(leftColumnX, yPosition, boxWidth, projectBoxHeight);
      
      pdf.setFillColor(240, 240, 240);
      pdf.rect(leftColumnX, yPosition, boxWidth, 8, 'F');
      
      pdf.setFontSize(11);
      pdf.setFont("helvetica", "bold");
      pdf.text("Project Information", leftColumnX + 3, yPosition + 5.5);
      
      pdf.setFontSize(9);
      pdf.setFont("helvetica", "normal");
      let projectY = yPosition + 13;
      if (project) {
        const projectNameLines = pdf.splitTextToSize(`Name: ${project.title}`, boxWidth - 6);
        projectNameLines.forEach((line: string) => {
          pdf.text(line, leftColumnX + 3, projectY);
          projectY += 4;
        });
        
        const addressLines = pdf.splitTextToSize(`Address: ${project.address || "N/A"}`, boxWidth - 6);
        addressLines.forEach((line: string) => {
          pdf.text(line, leftColumnX + 3, projectY);
          projectY += 4;
        });
      }

      // Draw Client Information Box (Right)
      pdf.rect(rightColumnX, yPosition, boxWidth, clientBoxHeight);
      
      pdf.setFillColor(240, 240, 240);
      pdf.rect(rightColumnX, yPosition, boxWidth, 8, 'F');
      
      pdf.setFontSize(11);
      pdf.setFont("helvetica", "bold");
      pdf.text("Client Information", rightColumnX + 3, yPosition + 5.5);
      
      pdf.setFontSize(9);
      pdf.setFont("helvetica", "normal");
      let clientY = yPosition + 13;
      if (client) {
        pdf.text(`Name: ${client.name}`, rightColumnX + 3, clientY);
        clientY += 4;
        if (client.email) {
          const emailLines = pdf.splitTextToSize(`Email: ${client.email}`, boxWidth - 6);
          emailLines.forEach((line: string) => {
            pdf.text(line, rightColumnX + 3, clientY);
            clientY += 4;
          });
        }
        if (client.phone) {
          pdf.text(`Phone: ${client.phone}`, rightColumnX + 3, clientY);
          clientY += 4;
        }
        if (client.address) {
          const addressLines = pdf.splitTextToSize(`Address: ${client.address}`, boxWidth - 6);
          addressLines.forEach((line: string) => {
            pdf.text(line, rightColumnX + 3, clientY);
            clientY += 4;
          });
        }
      }

      yPosition += Math.max(projectBoxHeight, clientBoxHeight) + 12;
      checkNewPage(30);

      // Scope of Work Section
      if (quote.scopeOfWork && quote.scopeOfWork.trim()) {
        pdf.setFillColor(245, 245, 245);
        pdf.rect(margin, yPosition, pageWidth - (2 * margin), 8, 'F');
        
        pdf.setFontSize(12);
        pdf.setFont("helvetica", "bold");
        pdf.text("Scope of Work", margin + 3, yPosition + 5.5);
        yPosition += 12;

        pdf.setFontSize(9);
        pdf.setFont("helvetica", "normal");
        const scopeLines = quote.scopeOfWork.split('\n');
        const maxWidth = pageWidth - (2 * margin) - 6;
        
        scopeLines.forEach((line: string) => {
          if (!line.trim()) {
            yPosition += 3;
            return;
          }
          
          checkNewPage();
          
          const bulletRegex = /^[\s]*[•\-\*✓]\s*/;
          if (bulletRegex.test(line)) {
            const cleanLine = line.replace(bulletRegex, '').trim();
            const wrappedLines = pdf.splitTextToSize(cleanLine, maxWidth - 8);
            wrappedLines.forEach((wrappedLine: string, index: number) => {
              checkNewPage();
              if (index === 0) {
                pdf.text('•', margin + 5, yPosition);
                pdf.text(wrappedLine, margin + 10, yPosition);
              } else {
                pdf.text(wrappedLine, margin + 10, yPosition);
              }
              yPosition += 4.5;
            });
          } else {
            const wrappedLines = pdf.splitTextToSize(line, maxWidth);
            wrappedLines.forEach((wrappedLine: string) => {
              checkNewPage();
              pdf.text(wrappedLine, margin + 3, yPosition);
              yPosition += 4.5;
            });
          }
        });

        yPosition += 8;
      }

      // Project Description (if exists and different from scope)
      if (project?.description && project.description.trim() && project.description !== quote.scopeOfWork) {
        checkNewPage(20);
        
        pdf.setFillColor(245, 245, 245);
        pdf.rect(margin, yPosition, pageWidth - (2 * margin), 8, 'F');
        
        pdf.setFontSize(12);
        pdf.setFont("helvetica", "bold");
        pdf.text("Project Description", margin + 3, yPosition + 5.5);
        yPosition += 12;

        pdf.setFontSize(9);
        pdf.setFont("helvetica", "normal");
        const descLines = pdf.splitTextToSize(project.description, pageWidth - (2 * margin) - 6);
        descLines.forEach((line: string) => {
          checkNewPage();
          pdf.text(line, margin + 3, yPosition);
          yPosition += 4.5;
        });

        yPosition += 8;
      }

      // Add Project Images if available
      if (project?.images && Array.isArray(project.images) && project.images.length > 0) {
        checkNewPage(60);

        pdf.setFillColor(245, 245, 245);
        pdf.rect(margin, yPosition, pageWidth - (2 * margin), 8, 'F');
        
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(12);
        pdf.text("Project Images", margin + 3, yPosition + 5.5);
        yPosition += 15;

        // Add each image
        const imgWidth = 65;
        const imgHeight = 50;
        const imagesPerRow = 2;
        const horizontalGap = 10;
        let currentCol = 0;

        for (let i = 0; i < project.images.length; i++) {
          try {
            const xPos = margin + (currentCol * (imgWidth + horizontalGap));

            if (yPosition + imgHeight > pageHeight - margin) {
              pdf.addPage();
              yPosition = margin;
              
              pdf.setFillColor(245, 245, 245);
              pdf.rect(margin, yPosition, pageWidth - (2 * margin), 8, 'F');
              pdf.setFont("helvetica", "bold");
              pdf.setFontSize(12);
              pdf.text("Project Images (continued)", margin + 3, yPosition + 5.5);
              yPosition += 15;
            }

            pdf.addImage(
              project.images[i],
              'JPEG',
              xPos,
              yPosition,
              imgWidth,
              imgHeight,
              undefined,
              'NONE',
              0
            );

            pdf.setDrawColor(200, 200, 200);
            pdf.setLineWidth(0.3);
            pdf.rect(xPos, yPosition, imgWidth, imgHeight);

            currentCol++;
            if (currentCol >= imagesPerRow) {
              currentCol = 0;
              yPosition += imgHeight + 8;
            }
          } catch (error) {
            console.error("Error adding image to PDF:", error);
          }
        }

        if (currentCol !== 0) {
          yPosition += imgHeight + 8;
        }

        yPosition += 5;
      }

      // Total Section
      checkNewPage(25);
      
      pdf.setDrawColor(200, 200, 200);
      pdf.setLineWidth(0.5);
      pdf.line(margin, yPosition, pageWidth - margin, yPosition);
      yPosition += 8;

      pdf.setFontSize(14);
      pdf.setFont("helvetica", "bold");
      pdf.text("Total Project Cost:", margin, yPosition);
      pdf.text(`$${quote.totalEstimate.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, rightX, yPosition, { align: 'right' });

      yPosition += 15;

      // Footer
      checkNewPage(15);
      pdf.setDrawColor(200, 200, 200);
      pdf.setLineWidth(0.3);
      pdf.line(margin, yPosition, pageWidth - margin, yPosition);
      yPosition += 6;

      pdf.setFontSize(9);
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(100, 100, 100);
      pdf.text("Thank you for choosing Dovalina Pro Painters!", margin, yPosition);
      yPosition += 5;
      pdf.text("This quote is valid for 30 days from the date above.", margin, yPosition);

      // Save the PDF
      const fileName = `Quote-${quote.id}-${project?.title?.substring(0, 30) || 'Project'}.pdf`;
      pdf.save(fileName);
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast({
        title: "PDF Generation Failed",
        description: "There was an error generating the PDF. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-bold">
              Quote #{quote.id}
            </DialogTitle>
            <div className="flex items-center space-x-2">
              <Badge className={getStatusColor(quote.status)}>
                {getStatusLabel(quote.status)}
              </Badge>
              <div className="flex flex-wrap gap-2">
                {/* Status action buttons */}
                {quote.status === "draft" && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => updateStatusMutation.mutate("sent")}
                    disabled={updateStatusMutation.isPending}
                  >
                    Send to Client
                  </Button>
                )}
                
                {quote.status === "sent" && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateStatusMutation.mutate("approved")}
                      disabled={updateStatusMutation.isPending}
                      className="bg-green-50 hover:bg-green-100 text-green-700 border-green-200"
                    >
                      <Check className="h-4 w-4 mr-1" />
                      Approve
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateStatusMutation.mutate("rejected")}
                      disabled={updateStatusMutation.isPending}
                      className="bg-red-50 hover:bg-red-100 text-red-700 border-red-200"
                    >
                      <X className="h-4 w-4 mr-1" />
                      Reject
                    </Button>
                  </>
                )}

                {quote.status === "approved" && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => convertToServiceOrderMutation.mutate()}
                    disabled={convertToServiceOrderMutation.isPending}
                    className="bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200"
                  >
                    <ArrowRight className="h-4 w-4 mr-1" />
                    {convertToServiceOrderMutation.isPending ? "Converting..." : "Convert to Service Order"}
                  </Button>
                )}

                {/* Standard action buttons */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={generatePDF}
                  disabled={isGeneratingPDF}
                >
                  <FileDown className="h-4 w-4 mr-1" />
                  {isGeneratingPDF ? "Generating..." : "PDF"}
                </Button>
                {onEdit && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onEdit(quote)}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                )}
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Company Header */}
          <div className="border-b pb-6">
            <div className="flex justify-between items-start">
              <div className="flex items-start space-x-4">
                <img 
                  src={logoPath} 
                  alt="Dovalina Pro Painters Logo" 
                  className="h-16 w-16 object-contain"
                />
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">DOVALINA PRO PAINTERS</h1>
                  <div className="mt-2 text-sm text-gray-600 space-y-1">
                    <p>3731 Aster Drive</p>
                    <p>Charlotte, N.C. 28227</p>
                    <p>704-506-9741</p>
                    <p>d-dovalina@hotmail.com</p>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <h2 className="text-2xl font-bold text-gray-900">Quote #{quote.id}</h2>
                <div className="mt-2 text-sm text-gray-600 space-y-1">
                  <p><span className="font-medium">Date:</span> {format(new Date(quote.createdAt), "MMMM do, yyyy")}</p>
                  <p><span className="font-medium">Status:</span> <span className={`inline-flex px-2 py-1 text-xs rounded-full ${getStatusColor(quote.status)}`}>{getStatusLabel(quote.status)}</span></p>
                  {quote.validUntil && (
                    <p><span className="font-medium">Valid until:</span> {format(new Date(quote.validUntil), "MMMM do, yyyy")}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Project and Client Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Project Information</h3>
              <div className="space-y-3">
                <div>
                  <span className="font-medium text-gray-700">Name:</span>
                  <p className="text-gray-900">{project?.title || "N/A"}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Address:</span>
                  <p className="text-gray-900">{project?.address || "N/A"}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Description:</span>
                  <p className="text-gray-900">{project?.description || "N/A"}</p>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Client Information</h3>
              <div className="space-y-3">
                <div>
                  <span className="font-medium text-gray-700">Name:</span>
                  <p className="text-gray-900">{client?.name || "N/A"}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Email:</span>
                  <p className="text-gray-900">{client?.email || "N/A"}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Phone:</span>
                  <p className="text-gray-900">{client?.phone || "N/A"}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Address:</span>
                  <p className="text-gray-900">{client?.address || "N/A"}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Scope of Work */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Scope of Work</h3>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-sm text-gray-900 leading-relaxed">
                {formatText(quote.scopeOfWork)}
              </div>
            </div>
          </div>

          {/* Total */}
          <div className="border-t pt-4">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-900">Total Project Cost:</h3>
              <span className="text-2xl font-bold text-green-600">
                ${quote.totalEstimate.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Notes */}
          {quote.notes && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Internal Notes</h3>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-sm text-gray-700">{quote.notes}</p>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}