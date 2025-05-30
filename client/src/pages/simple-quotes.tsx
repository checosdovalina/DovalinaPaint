import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus, Eye, Edit, Trash2, FileDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SimpleQuoteForm } from "@/components/simple-quote-form";
import { SimpleQuoteDetail } from "@/components/simple-quote-detail";
import { Layout } from "@/components/layout";
import PageHeader from "@/components/page-header";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { format } from "date-fns";

export default function SimpleQuotes() {
  const [showQuoteForm, setShowQuoteForm] = useState(false);
  const [quoteToEdit, setQuoteToEdit] = useState<any>(null);
  const [quoteToDelete, setQuoteToDelete] = useState<any>(null);
  const [viewingQuote, setViewingQuote] = useState<any>(null);
  const { toast } = useToast();

  // Fetch quotes and projects
  const { data: quotes = [], isLoading } = useQuery({
    queryKey: ["/api/quotes"],
  });

  const { data: projects = [] } = useQuery({
    queryKey: ["/api/projects"],
  });

  const { data: clients = [] } = useQuery({
    queryKey: ["/api/clients"],
  });

  // Filter only simple quotes (those with scopeOfWork)
  const simpleQuotes = quotes.filter((quote: any) => quote.scopeOfWork) || [];

  // Separate quotes by project type (residential vs commercial)
  const getQuotesByType = (type: string) => {
    return simpleQuotes.filter((quote: any) => {
      const project = projects.find((p: any) => p.id === quote.projectId);
      if (!project) return false;
      // First check if the project has a projectType field
      if (project.projectType) {
        return project.projectType === type;
      }
      // Fallback to client classification for existing projects
      const client = clients.find((c: any) => c.id === project.clientId);
      return client?.classification === type;
    });
  };

  const residentialQuotes = getQuotesByType('residential');
  const commercialQuotes = getQuotesByType('commercial');

  const handleNewQuote = () => {
    setQuoteToEdit(null);
    setShowQuoteForm(true);
  };

  const handleEditQuote = (quote: any) => {
    setQuoteToEdit(quote);
    setShowQuoteForm(true);
  };

  const handleCloseForm = () => {
    setShowQuoteForm(false);
    setQuoteToEdit(null);
  };

  const handleDeleteQuote = async () => {
    if (!quoteToDelete) return;

    try {
      await apiRequest("DELETE", `/api/simple-quotes/${quoteToDelete.id}`);
      queryClient.invalidateQueries({ queryKey: ["/api/quotes"] });
      toast({
        title: "Success",
        description: "Quote deleted successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete quote",
        variant: "destructive",
      });
    } finally {
      setQuoteToDelete(null);
    }
  };

  const getProjectTitle = (projectId: number) => {
    const project = projects.find((p: any) => p.id === projectId);
    return project ? project.title : `Project #${projectId}`;
  };

  const getClientName = (projectId: number) => {
    const project = projects.find((p: any) => p.id === projectId);
    if (project) {
      const client = clients.find((c: any) => c.id === project.clientId);
      return client ? client.name : `Client #${project.clientId}`;
    }
    return "Unknown Client";
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

  // Render quotes table
  const renderQuotesTable = (quotesData: any[], emptyMessage: string) => {
    if (quotesData.length === 0) {
      return (
        <div className="text-center py-12">
          <div className="text-gray-500 text-lg mb-4">{emptyMessage}</div>
          <Button onClick={handleNewQuote}>
            <Plus className="h-4 w-4 mr-2" />
            Create Quote
          </Button>
        </div>
      );
    }

    return (
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Project
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Client
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Total
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {quotesData.map((quote: any) => (
              <tr key={quote.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {getProjectTitle(quote.projectId)}
                  </div>
                  <div className="text-sm text-gray-500 max-w-xs truncate">
                    {quote.scopeOfWork}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {getClientName(quote.projectId)}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    ${quote.totalEstimate.toLocaleString()}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(
                      quote.status
                    )}`}
                  >
                    {getStatusLabel(quote.status)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {quote.sentDate
                    ? format(new Date(quote.sentDate), "MM/dd/yyyy")
                    : format(new Date(quote.createdAt), "MM/dd/yyyy")}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setViewingQuote(quote)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEditQuote(quote)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setQuoteToDelete(quote)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  if (isLoading) {
    return (
      <Layout title="Simple Quotes">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Simple Quotes">
      <PageHeader
        title="Simple Quotes"
        description="Manage quotes with simplified scope of work"
        actions={
          <Button onClick={handleNewQuote}>
            <Plus className="h-4 w-4 mr-2" />
            New Quote
          </Button>
        }
      />

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <Tabs defaultValue="residential" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="residential">
              Residential ({residentialQuotes.length})
            </TabsTrigger>
            <TabsTrigger value="commercial">
              Commercial ({commercialQuotes.length})
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="residential">
            {renderQuotesTable(residentialQuotes, "No residential quotes found")}
          </TabsContent>
          
          <TabsContent value="commercial">
            {renderQuotesTable(commercialQuotes, "No commercial quotes found")}
          </TabsContent>
        </Tabs>
      </div>

      {/* Quote Form Dialog */}
      <Dialog open={showQuoteForm} onOpenChange={setShowQuoteForm}>
        <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {quoteToEdit ? "Edit Simple Quote" : "New Simple Quote"}
            </DialogTitle>
            <DialogDescription>
              {quoteToEdit
                ? "Modify the quote details as needed"
                : "Create a quote with simplified scope of work"}
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[75vh] overflow-y-auto pr-2">
            <SimpleQuoteForm
              initialData={quoteToEdit || undefined}
              onSuccess={handleCloseForm}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Quote View Dialog */}
      <SimpleQuoteDetail
        open={!!viewingQuote}
        onOpenChange={(open) => !open && setViewingQuote(null)}
        quote={viewingQuote}
        onEdit={(quote) => {
          setViewingQuote(null);
          handleEditQuote(quote);
        }}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!quoteToDelete}
        onOpenChange={() => setQuoteToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the quote.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteQuote}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
}