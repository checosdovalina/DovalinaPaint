import { useState } from "react";
import { Quote, Project, Client } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FileDown, Printer, Eye, X, Check } from "lucide-react";
import { format } from "date-fns";
import { enUS } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

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

  // Calculate totals
  const materialsTotal = quote.materialsEstimate && Array.isArray(quote.materialsEstimate) ? 
    quote.materialsEstimate.reduce((sum: number, item: any) => sum + (item.total || 0), 0) : 0;
  
  const laborTotal = quote.laborEstimate && Array.isArray(quote.laborEstimate) ? 
    quote.laborEstimate.reduce((sum: number, item: any) => sum + (item.total || 0), 0) : 0;
  
  // Calculate subtotal (materials + labor)
  const baseSubtotal = materialsTotal + laborTotal;
  
  // Calculate additional costs (if any)
  const additionalCosts = (quote as any).additionalCosts || 0;
  
  // Full subtotal including additional costs
  const subtotal = baseSubtotal + additionalCosts;
  
  // Get profit margin (if available) or use default 50%
  const profitMargin = 50;
  
  // Calculate profit amount for materials and labor separately
  const materialsProfitAmount = materialsTotal * (profitMargin / 100);
  const laborProfitAmount = laborTotal * (profitMargin / 100);
  
  // Total profit amount is the sum of both
  const profitAmount = materialsProfitAmount + laborProfitAmount;
  
  // Recalculate total estimate (this is just for validation, we'll display the stored value)
  const calculatedTotal = baseSubtotal + additionalCosts + profitAmount;

  // Function to generate PDF (using browser's print functionality)
  const generatePDF = () => {
    toast({
      title: "Generating PDF",
      description: "The quote PDF is being generated...",
    });
    
    // Save original styles
    const originalTitle = document.title;
    
    // Change title for printing
    document.title = `Quote #${quote.id} - ${project?.title || 'Project'}`;
    
    // Configure print options to save as PDF
    const printOptions = {
      destination: 'save-as-pdf',
    };
    
    // Start printing
    window.print();
    
    // Restore original title after a moment
    setTimeout(() => {
      document.title = originalTitle;
      
      toast({
        title: "PDF Generated",
        description: "The quote has been prepared to save as PDF",
      });
    }, 1000);
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
          <div className="flex justify-between items-start border-b pb-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold">DOVALINA PAINTING LLC</h1>
              <p>3731 Aster Drive</p>
              <p>Charlotte, N.C. 28227</p>
              <p>704-506-9741</p>
              <p>d-dovalina@hotmail.com</p>
            </div>
            <div className="text-right">
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <Card>
              <CardContent className="p-4">
                <h3 className="text-lg font-semibold mb-2">Project Information</h3>
                <p><span className="font-medium">Name:</span> {project?.title || 'N/A'}</p>
                <p><span className="font-medium">Address:</span> {project?.address || 'N/A'}</p>
                <p><span className="font-medium">Description:</span> {project?.description || 'N/A'}</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <h3 className="text-lg font-semibold mb-2">Client Information</h3>
                <p><span className="font-medium">Name:</span> {client?.name || 'N/A'}</p>
                <p><span className="font-medium">Email:</span> {client?.email || 'N/A'}</p>
                <p><span className="font-medium">Phone:</span> {client?.phone || 'N/A'}</p>
              </CardContent>
            </Card>
          </div>
          
          {/* Cost breakdown */}
          <h3 className="text-lg font-semibold mb-3">Cost Breakdown</h3>
          
          {/* Materials */}
          <Card className="mb-4">
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
                    {quote.materialsEstimate && Array.isArray(quote.materialsEstimate) && quote.materialsEstimate.length > 0 ? (
                      quote.materialsEstimate.map((item: any, index: number) => (
                        <tr key={index} className="border-t">
                          <td className="py-2 px-3">{item.name}</td>
                          <td className="py-2 px-3 text-right">${Number(item.total).toFixed(2)}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={2} className="py-2 px-3 text-center">No materials registered</td>
                      </tr>
                    )}
                    <tr className="border-t">
                      <td className="py-2 px-3 font-medium text-right">Materials Subtotal:</td>
                      <td className="py-2 px-3 font-medium text-right">${materialsTotal.toFixed(2)}</td>
                    </tr>
                    <tr className="border-t">
                      <td className="py-2 px-3 text-right">Profit Margin ({profitMargin}%):</td>
                      <td className="py-2 px-3 text-right">${materialsProfitAmount.toFixed(2)}</td>
                    </tr>
                    <tr className="border-t bg-muted">
                      <td className="py-2 px-3 font-medium text-right">Materials Total with Profit:</td>
                      <td className="py-2 px-3 font-medium text-right">${(materialsTotal + materialsProfitAmount).toFixed(2)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
          
          {/* Labor */}
          <Card className="mb-4">
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
                    {quote.laborEstimate && Array.isArray(quote.laborEstimate) && quote.laborEstimate.length > 0 ? (
                      quote.laborEstimate.map((item: any, index: number) => (
                        <tr key={index} className="border-t">
                          <td className="py-2 px-3">{item.description}</td>
                          <td className="py-2 px-3 text-right">${Number(item.total).toFixed(2)}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={2} className="py-2 px-3 text-center">No labor registered</td>
                      </tr>
                    )}
                    <tr className="border-t">
                      <td className="py-2 px-3 font-medium text-right">Labor Subtotal:</td>
                      <td className="py-2 px-3 font-medium text-right">${laborTotal.toFixed(2)}</td>
                    </tr>
                    <tr className="border-t">
                      <td className="py-2 px-3 text-right">Profit Margin ({profitMargin}%):</td>
                      <td className="py-2 px-3 text-right">${laborProfitAmount.toFixed(2)}</td>
                    </tr>
                    <tr className="border-t bg-muted">
                      <td className="py-2 px-3 font-medium text-right">Labor Total with Profit:</td>
                      <td className="py-2 px-3 font-medium text-right">${(laborTotal + laborProfitAmount).toFixed(2)}</td>
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
                <h3 className="text-lg font-semibold">Quote Total</h3>
                <p className="text-2xl font-bold">${quote.totalEstimate.toFixed(2)}</p>
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