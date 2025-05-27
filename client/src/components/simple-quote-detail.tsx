import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileDown, Printer, Eye } from "lucide-react";
import { format } from "date-fns";
import logoPath from "@assets/78c08020-ed9d-43be-8936-ddbc8089b6c3.jpeg";
import jsPDF from "jspdf";

interface SimpleQuoteDetailProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quote: any;
  onEdit?: (quote: any) => void;
}

export function SimpleQuoteDetail({ open, onOpenChange, quote, onEdit }: SimpleQuoteDetailProps) {
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  // Fetch project and client data
  const { data: projects = [] } = useQuery({
    queryKey: ["/api/projects"],
  });

  const { data: clients = [] } = useQuery({
    queryKey: ["/api/clients"],
  });

  if (!quote) return null;

  const project = projects.find((p: any) => p.id === quote.projectId);
  const client = clients.find((c: any) => c.id === project?.clientId);

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
      const margin = 20;
      let yPosition = margin;

      // Company Header
      pdf.setFontSize(20);
      pdf.setFont("helvetica", "bold");
      pdf.text("Dovalina Painting LLC", margin, yPosition);
      yPosition += 10;

      pdf.setFontSize(12);
      pdf.setFont("helvetica", "normal");
      pdf.text("Professional Painting Services", margin, yPosition);
      yPosition += 20;

      // Quote Title
      pdf.setFontSize(16);
      pdf.setFont("helvetica", "bold");
      pdf.text("QUOTE", margin, yPosition);
      yPosition += 15;

      // Quote Details
      pdf.setFontSize(11);
      pdf.setFont("helvetica", "normal");
      
      pdf.text(`Quote #: ${quote.id}`, margin, yPosition);
      pdf.text(`Date: ${format(new Date(quote.createdAt), "MM/dd/yyyy")}`, pageWidth - 80, yPosition);
      yPosition += 8;

      if (quote.validUntil) {
        pdf.text(`Valid Until: ${format(new Date(quote.validUntil), "MM/dd/yyyy")}`, pageWidth - 80, yPosition);
        yPosition += 8;
      }

      yPosition += 5;

      // Client Information
      pdf.setFont("helvetica", "bold");
      pdf.text("Client Information:", margin, yPosition);
      yPosition += 8;

      pdf.setFont("helvetica", "normal");
      if (client) {
        pdf.text(`Name: ${client.name}`, margin, yPosition);
        yPosition += 6;
        if (client.email) {
          pdf.text(`Email: ${client.email}`, margin, yPosition);
          yPosition += 6;
        }
        if (client.phone) {
          pdf.text(`Phone: ${client.phone}`, margin, yPosition);
          yPosition += 6;
        }
        if (client.address) {
          pdf.text(`Address: ${client.address}`, margin, yPosition);
          yPosition += 6;
        }
      }

      yPosition += 10;

      // Project Information
      pdf.setFont("helvetica", "bold");
      pdf.text("Project:", margin, yPosition);
      yPosition += 8;

      pdf.setFont("helvetica", "normal");
      if (project) {
        pdf.text(`Title: ${project.title}`, margin, yPosition);
        yPosition += 6;
      }

      yPosition += 10;

      // Scope of Work
      pdf.setFont("helvetica", "bold");
      pdf.text("Scope of Work:", margin, yPosition);
      yPosition += 8;

      pdf.setFont("helvetica", "normal");
      const scopeLines = quote.scopeOfWork.split('\n');
      scopeLines.forEach((line: string) => {
        if (yPosition > 250) {
          pdf.addPage();
          yPosition = margin;
        }
        
        const bulletRegex = /^[\s]*[•\-\*✓]\s*/;
        if (bulletRegex.test(line)) {
          const cleanLine = line.replace(bulletRegex, '').trim();
          pdf.text(`• ${cleanLine}`, margin + 5, yPosition);
        } else {
          pdf.text(line, margin, yPosition);
        }
        yPosition += 6;
      });

      yPosition += 15;

      // Total
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(14);
      pdf.text("Total Project Cost:", margin, yPosition);
      pdf.text(`$${quote.totalEstimate.toLocaleString()}`, pageWidth - 80, yPosition);

      yPosition += 20;

      // Footer
      pdf.setFontSize(10);
      pdf.setFont("helvetica", "normal");
      pdf.text("Thank you for choosing Dovalina Painting LLC!", margin, yPosition);
      yPosition += 6;
      pdf.text("This quote is valid for 30 days from the date above.", margin, yPosition);

      // Save the PDF
      pdf.save(`Quote-${quote.id}-${project?.title || 'Project'}.pdf`);
    } catch (error) {
      console.error("Error generating PDF:", error);
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
              <div className="flex space-x-1">
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
                  alt="Dovalina Painting LLC Logo" 
                  className="h-16 w-16 object-contain"
                />
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">DOVALINA PAINTING LLC</h1>
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