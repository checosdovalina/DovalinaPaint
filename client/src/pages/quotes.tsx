import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Quote, Project, Client } from "@shared/schema";
import { Layout } from "@/components/layout";
import { QuoteForm } from "@/components/quote-form";
import { QuoteDetail } from "@/components/quote-detail";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  FileText,
  DollarSign,
  Calendar,
  Clock,
  Plus,
  Edit,
  Trash,
  Download,
  Search,
  Check,
  X,
  FileCheck,
  Eye,
  Grid3X3,
  List,
  Filter,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function Quotes() {
  const [showQuoteForm, setShowQuoteForm] = useState(false);
  const [quoteToEdit, setQuoteToEdit] = useState<Quote | null>(null);
  const [quoteToDelete, setQuoteToDelete] = useState<Quote | null>(null);
  const [quoteToView, setQuoteToView] = useState<Quote | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  
  // Advanced filter and view states
  const [viewMode, setViewMode] = useState<'list' | 'cards'>('cards');
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();
  const [dateFromOpen, setDateFromOpen] = useState(false);
  const [dateToOpen, setDateToOpen] = useState(false);
  
  const { toast } = useToast();

  // Fetch quotes
  const { data: quotes, isLoading: isLoadingQuotes } = useQuery<Quote[]>({
    queryKey: ["/api/quotes"],
    queryFn: async () => {
      const res = await fetch("/api/quotes");
      if (!res.ok) throw new Error("Failed to fetch quotes");
      return res.json();
    },
  });

  // Fetch projects to display project names
  const { data: projects } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
    queryFn: async () => {
      const res = await fetch("/api/projects");
      if (!res.ok) throw new Error("Failed to fetch projects");
      return res.json();
    },
  });
  
  // Fetch clients
  const { data: clients } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
    queryFn: async () => {
      const res = await fetch("/api/clients");
      if (!res.ok) throw new Error("Failed to fetch clients");
      return res.json();
    },
  });

  const handleEditQuote = (quote: Quote) => {
    setQuoteToEdit(quote);
    setShowQuoteForm(true);
  };

  const handleNewQuote = () => {
    setQuoteToEdit(null);
    setShowQuoteForm(true);
  };

  const handleCloseForm = () => {
    setShowQuoteForm(false);
    setQuoteToEdit(null);
  };

  const handleDeleteClick = (quote: Quote) => {
    setQuoteToDelete(quote);
  };

  const handleDeleteConfirm = async () => {
    if (!quoteToDelete) return;

    try {
      await apiRequest("DELETE", `/api/quotes/${quoteToDelete.id}`, undefined);
      
      toast({
        title: "Presupuesto eliminado",
        description: "El presupuesto ha sido eliminado exitosamente",
      });
      
      queryClient.invalidateQueries({ queryKey: ["/api/quotes"] });
    } catch (error) {
      toast({
        title: "Error",
        description: `No se pudo eliminar el presupuesto: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setQuoteToDelete(null);
    }
  };

  const handleUpdateStatus = async (quote: Quote, newStatus: string) => {
    try {
      await apiRequest("PUT", `/api/quotes/${quote.id}`, {
        status: newStatus,
        ...(newStatus === "approved" ? { approvedDate: new Date() } : {}),
        ...(newStatus === "rejected" ? { rejectedDate: new Date() } : {})
      });
      
      toast({
        title: "Estado actualizado",
        description: `El presupuesto ha sido ${newStatus === "approved" ? "aprobado" : "rechazado"} exitosamente`,
      });
      
      queryClient.invalidateQueries({ queryKey: ["/api/quotes"] });
    } catch (error) {
      toast({
        title: "Error",
        description: `No se pudo actualizar el estado del presupuesto: ${error.message}`,
        variant: "destructive",
      });
    }
  };

  // Helper function to clear all filters
  const clearFilters = () => {
    setStatusFilter('all');
    setSearchTerm('');
    setDateFrom(undefined);
    setDateTo(undefined);
  };

  // Filter quotes with advanced filters
  const filteredQuotes = quotes?.filter(quote => {
    // Filter by status
    if (statusFilter !== "all" && quote.status !== statusFilter) {
      return false;
    }
    
    // Enhanced search filter (search in project title, client name, or quote details)
    if (searchTerm && (projects && clients)) {
      const searchTermLower = searchTerm.toLowerCase();
      const project = projects.find(p => p.id === quote.projectId);
      const client = project ? clients.find(c => c.id === project.clientId) : null;
      
      const searchableText = [
        project?.title,
        client?.name,
        quote.scopeOfWork,
        quote.notes
      ].filter(Boolean).join(' ').toLowerCase();
      
      if (!searchableText.includes(searchTermLower)) {
        return false;
      }
    }

    // Date filter
    if (dateFrom || dateTo) {
      const quoteDate = quote.sentDate ? new Date(quote.sentDate) : new Date(quote.createdAt || Date.now());
      
      if (dateFrom && quoteDate < dateFrom) {
        return false;
      }
      
      if (dateTo && quoteDate > dateTo) {
        return false;
      }
    }
    
    return true;
  });

  // Helper to get project name
  const getProjectName = (projectId: number) => {
    const project = projects?.find(p => p.id === projectId);
    return project ? project.title : `Proyecto #${projectId}`;
  };

  // Helper to format date
  const formatDate = (date: Date | undefined | null) => {
    if (!date) return "No definida";
    return format(new Date(date), "d MMM yyyy", { locale: es });
  };

  // Helper to get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "draft":
        return <Badge variant="outline">Borrador</Badge>;
      case "sent":
        return <Badge className="bg-blue-100 text-blue-800">Enviado</Badge>;
      case "approved":
        return <Badge className="bg-green-100 text-green-800">Aprobado</Badge>;
      case "rejected":
        return <Badge className="bg-red-100 text-red-800">Rechazado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Export PDF function
  const handleExportPDF = (quote: Quote) => {
    const project = projects?.find((p: any) => p.id === quote.projectId);
    const client = project ? clients?.find((c: any) => c.id === project.clientId) : null;
    
    const content = `
Quote #${quote.id}
Project: ${project?.title || 'Unknown Project'}
Client: ${client?.name || 'Unknown Client'}
Total: $${parseFloat(quote.totalEstimate || '0').toLocaleString()}
Status: ${quote.status}
${quote.sentDate ? `Date Sent: ${format(new Date(quote.sentDate), "MMM dd, yyyy")}` : ''}

${quote.scopeOfWork ? `Scope of Work:\n${quote.scopeOfWork}` : ''}
${quote.notes ? `\nNotes:\n${quote.notes}` : ''}
    `.trim();

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `quote-${quote.id}-${project?.title?.replace(/[^a-zA-Z0-9]/g, '-') || 'unknown'}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Success",
      description: "Quote exported successfully",
    });
  };

  // Render table view
  const renderTableView = () => {
    if (!filteredQuotes || filteredQuotes.length === 0) {
      return (
        <div className="text-center py-20 text-gray-500">
          {searchTerm || statusFilter !== "all" || dateFrom || dateTo
            ? "No quotes found with the applied filters"
            : "No quotes registered. Create a new one by clicking 'New Quote'"}
        </div>
      );
    }

    return (
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Project & Client
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date Sent
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredQuotes.map((quote) => {
                const project = projects?.find((p: any) => p.id === quote.projectId);
                const client = project ? clients?.find((c: any) => c.id === project.clientId) : null;
                
                return (
                  <tr key={quote.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {project?.title || `Project #${quote.projectId}`}
                        </div>
                        <div className="text-sm text-gray-500">
                          {client?.name || 'Unknown Client'}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-gray-900">
                        ${parseFloat(quote.totalEstimate || '0').toLocaleString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(quote.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(quote.sentDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setQuoteToView(quote)}
                          className="h-8 w-8 p-0"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditQuote(quote)}
                          className="h-8 w-8 p-0"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleExportPDF(quote)}
                          className="h-8 w-8 p-0"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteClick(quote)}
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // Render cards view (existing implementation)
  const renderCardsView = () => {
    if (!filteredQuotes || filteredQuotes.length === 0) {
      return (
        <div className="text-center py-20 text-gray-500">
          {searchTerm || statusFilter !== "all" || dateFrom || dateTo
            ? "No quotes found with the applied filters"
            : "No quotes registered. Create a new one by clicking 'New Quote'"}
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredQuotes.map((quote) => (
          <Card key={quote.id} className="overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg truncate">
                  {getProjectName(quote.projectId)}
                </CardTitle>
                {getStatusBadge(quote.status)}
              </div>
            </CardHeader>
            <CardContent className="pb-2 space-y-3">
              <div className="flex items-center text-sm">
                <DollarSign className="h-4 w-4 mr-2 text-gray-400" />
                <span className="font-semibold">${parseFloat(quote.totalEstimate || '0').toLocaleString()}</span>
              </div>
              <div className="flex items-center text-sm">
                <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                <span>Sent: {formatDate(quote.sentDate)}</span>
              </div>
              <div className="flex items-center text-sm">
                <Clock className="h-4 w-4 mr-2 text-gray-400" />
                <span>Valid until: {formatDate(quote.validUntil)}</span>
              </div>
              {quote.status === "approved" && (
                <div className="flex items-center text-sm text-green-600">
                  <FileCheck className="h-4 w-4 mr-2" />
                  <span>Approved: {formatDate(quote.approvedDate)}</span>
                </div>
              )}
              {quote.notes && (
                <div className="text-sm text-gray-500 mt-2 pt-2 border-t">
                  <p className="line-clamp-2">{quote.notes}</p>
                </div>
              )}
            </CardContent>
            <CardFooter className="pt-2 flex justify-between items-center">
              <div className="flex items-center space-x-2">
                {quote.status === "sent" && (
                  <div className="flex space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-green-600 hover:text-green-700 hover:bg-green-50 h-8 w-8 p-0"
                      onClick={() => handleUpdateStatus(quote, "approved")}
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 h-8 w-8 p-0"
                      onClick={() => handleUpdateStatus(quote, "rejected")}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
              <div className="flex space-x-1 ml-auto">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-red-600 hover:text-red-700 hover:bg-red-50 h-8 w-8 p-0"
                  onClick={() => handleDeleteClick(quote)}
                >
                  <Trash className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 h-8 w-8 p-0"
                  onClick={() => setQuoteToView(quote)}
                >
                  <Eye className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8"
                  onClick={() => handleEditQuote(quote)}
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Edit
                </Button>
              </div>
            </CardFooter>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <Layout title="Quotes">
      {/* Header with filters and controls */}
      <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
          {/* Left side - Filters */}
          <div className="flex flex-col sm:flex-row gap-3 flex-1">
            {/* Search */}
            <div className="relative min-w-[250px]">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search quotes, projects, or clients..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="sent">Sent</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>

            {/* Date From */}
            <Popover open={dateFromOpen} onOpenChange={setDateFromOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-[140px] justify-start text-left font-normal",
                    !dateFrom && "text-muted-foreground"
                  )}
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  {dateFrom ? format(dateFrom, "MMM dd") : "From"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent
                  mode="single"
                  selected={dateFrom}
                  onSelect={setDateFrom}
                  initialFocus
                />
              </PopoverContent>
            </Popover>

            {/* Date To */}
            <Popover open={dateToOpen} onOpenChange={setDateToOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-[140px] justify-start text-left font-normal",
                    !dateTo && "text-muted-foreground"
                  )}
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  {dateTo ? format(dateTo, "MMM dd") : "To"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent
                  mode="single"
                  selected={dateTo}
                  onSelect={setDateTo}
                  initialFocus
                />
              </PopoverContent>
            </Popover>

            {/* Clear Filters */}
            {(statusFilter !== 'all' || searchTerm || dateFrom || dateTo) && (
              <Button
                variant="ghost"
                onClick={clearFilters}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-4 w-4 mr-1" />
                Clear
              </Button>
            )}
          </div>

          {/* Right side - Actions and View Toggle */}
          <div className="flex items-center gap-2">
            {/* View Toggle */}
            <div className="flex border rounded-lg">
              <Button
                variant={viewMode === 'cards' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('cards')}
                className="rounded-r-none"
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="rounded-l-none"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>

            {/* New Quote Button */}
            <Button onClick={handleNewQuote}>
              <Plus className="h-4 w-4 mr-2" />
              New Quote
            </Button>
          </div>
        </div>
      </div>

      {isLoadingQuotes ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
        </div>
      ) : filteredQuotes && filteredQuotes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredQuotes.map((quote) => (
            <Card key={quote.id} className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-lg truncate">
                    {getProjectName(quote.projectId)}
                  </CardTitle>
                  {getStatusBadge(quote.status)}
                </div>
              </CardHeader>
              <CardContent className="pb-2 space-y-3">
                <div className="flex items-center text-sm">
                  <DollarSign className="h-4 w-4 mr-2 text-gray-400" />
                  <span className="font-semibold">${quote.totalEstimate?.toLocaleString()}</span>
                </div>
                <div className="flex items-center text-sm">
                  <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                  <span>Sent: {formatDate(quote.sentDate)}</span>
                </div>
                <div className="flex items-center text-sm">
                  <Clock className="h-4 w-4 mr-2 text-gray-400" />
                  <span>Valid until: {formatDate(quote.validUntil)}</span>
                </div>
                {quote.status === "approved" && (
                  <div className="flex items-center text-sm text-green-600">
                    <FileCheck className="h-4 w-4 mr-2" />
                    <span>Approved: {formatDate(quote.approvedDate)}</span>
                  </div>
                )}
                {quote.notes && (
                  <div className="text-sm text-gray-500 mt-2 pt-2 border-t">
                    <p className="line-clamp-2">{quote.notes}</p>
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex flex-wrap justify-between pt-2">
                {quote.status === "sent" && (
                  <div className="flex space-x-1 mb-2 mr-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 px-2 text-green-600 border-green-600 hover:bg-green-50"
                      onClick={() => handleUpdateStatus(quote, "approved")}
                    >
                      <Check className="h-4 w-4 mr-1" />
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 px-2 text-red-600 border-red-600 hover:bg-red-50"
                      onClick={() => handleUpdateStatus(quote, "rejected")}
                    >
                      <X className="h-4 w-4 mr-1" />
                      Reject
                    </Button>
                  </div>
                )}
                <div className="flex space-x-1 ml-auto">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 h-8 w-8 p-0"
                    onClick={() => handleDeleteClick(quote)}
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 h-8 w-8 p-0"
                    onClick={() => setQuoteToView(quote)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8"
                    onClick={() => handleEditQuote(quote)}
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 text-gray-500">
          {searchTerm || statusFilter !== "all"
            ? "No quotes found with the applied filters"
            : "No quotes registered. Create a new one by clicking 'New Quote'"}
        </div>
      )}

      {/* Quote Form Dialog */}
      <Dialog open={showQuoteForm} onOpenChange={setShowQuoteForm}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>
              {quoteToEdit ? "Edit Quote" : "New Quote"}
            </DialogTitle>
            <DialogDescription>
              {quoteToEdit
                ? "Modify the quote details as necessary"
                : "Complete the form to create a new quote"}
            </DialogDescription>
          </DialogHeader>
          <QuoteForm
            initialData={quoteToEdit || undefined}
            onSuccess={handleCloseForm}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!quoteToDelete}
        onOpenChange={(open) => !open && setQuoteToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Quote?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The quote will be permanently deleted from the system.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Quote Detail View */}
      {quoteToView && (
        <QuoteDetail
          quote={quoteToView}
          project={projects?.find(p => p.id === quoteToView.projectId)}
          client={clients?.find(c => {
            const project = projects?.find(p => p.id === quoteToView.projectId);
            return project && c.id === project.clientId;
          })}
          open={!!quoteToView}
          onClose={() => setQuoteToView(null)}
        />
      )}
    </Layout>
  );
}
