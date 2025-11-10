import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus, Eye, Edit, Trash2, FileDown, Grid3X3, List, Filter, Calendar, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
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
  
  // View and filter states
  const [viewMode, setViewMode] = useState<'list' | 'cards'>('list');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();
  const [dateFromOpen, setDateFromOpen] = useState(false);
  const [dateToOpen, setDateToOpen] = useState(false);
  
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
  const simpleQuotes = [...quotes].filter((quote: any) => quote.scopeOfWork) || [];

  // Apply filters to simple quotes and sort by newest first
  const filteredSimpleQuotes = simpleQuotes.filter((quote: any) => {
    // Status filter
    if (statusFilter !== 'all' && quote.status !== statusFilter) {
      return false;
    }

    // Search filter (search in project title, client name, or quote description)
    if (searchTerm) {
      const project = projects.find((p: any) => p.id === quote.projectId);
      const client = project ? clients.find((c: any) => c.id === project.clientId) : null;
      
      const searchableText = [
        project?.title,
        client?.name,
        quote.scopeOfWork,
        quote.notes
      ].filter(Boolean).join(' ').toLowerCase();
      
      if (!searchableText.includes(searchTerm.toLowerCase())) {
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
  }).sort((a: any, b: any) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

  // Separate quotes by project type (residential vs commercial)
  const getQuotesByType = (type: string) => {
    return filteredSimpleQuotes.filter((quote: any) => {
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

  // Helper function to get status badge
  const getStatusBadge = (status: string) => {
    const statusConfig = {
      draft: { label: "Borrador", variant: "secondary" as const },
      sent: { label: "Enviado", variant: "default" as const },
      approved: { label: "Aprobado", variant: "default" as const },
      rejected: { label: "Rechazado", variant: "destructive" as const },
      converted: { label: "Convertido", variant: "default" as const },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || { label: status, variant: "secondary" as const };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  // Helper function to clear all filters
  const clearFilters = () => {
    setStatusFilter('all');
    setSearchTerm('');
    setDateFrom(undefined);
    setDateTo(undefined);
  };

  const handleNewQuote = () => {
    setQuoteToEdit(null);
    setShowQuoteForm(true);
  };

  const handleEditQuote = (quote: any) => {
    setQuoteToEdit(quote);
    setShowQuoteForm(true);
  };

  const handleExportPDF = (quote: any) => {
    // Export PDF functionality
    const project = projects.find((p: any) => p.id === quote.projectId);
    const client = project ? clients.find((c: any) => c.id === project.clientId) : null;
    
    // Create a simple text-based export for now
    const content = `
Simple Quote #${quote.id}
Project: ${project?.title || 'Unknown Project'}
Client: ${client?.name || 'Unknown Client'}
Total: $${parseFloat(quote.totalEstimate || 0).toLocaleString()}
Status: ${quote.status}
${quote.sentDate ? `Date Sent: ${format(new Date(quote.sentDate), "MMM dd, yyyy")}` : ''}

Scope of Work:
${quote.scopeOfWork || 'No description available'}

${quote.notes ? `Notes: ${quote.notes}` : ''}
    `.trim();

    // Create and download the file
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

  // Render quotes cards
  const renderQuotesCards = (quotesData: any[], emptyMessage: string) => {
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
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {quotesData.map((quote: any) => {
          const project = projects.find((p: any) => p.id === quote.projectId);
          const client = project ? clients.find((c: any) => c.id === project.clientId) : null;

          return (
            <Card key={quote.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{project?.title || 'Unknown Project'}</CardTitle>
                  {getStatusBadge(quote.status)}
                </div>
                <p className="text-sm text-gray-600">{client?.name || 'Unknown Client'}</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">Total:</span>
                    <span className="font-semibold text-lg">${parseFloat(quote.totalEstimate || 0).toLocaleString()}</span>
                  </div>
                  
                  {quote.sentDate && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">Sent:</span>
                      <span className="text-sm">{format(new Date(quote.sentDate), "MMM dd, yyyy")}</span>
                    </div>
                  )}

                  {quote.scopeOfWork && (
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {quote.scopeOfWork.substring(0, 100)}...
                    </p>
                  )}

                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setViewingQuote(quote)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditQuote(quote)}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleExportPDF(quote)}
                    >
                      <FileDown className="h-4 w-4 mr-1" />
                      PDF
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setQuoteToDelete(quote)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
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

      {/* Filters and View Controls */}
      <div className="bg-white shadow rounded-lg p-4 mb-6">
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
          {/* Search */}
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search quotes, projects, or clients..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-3 items-center">
            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="draft">Borrador</SelectItem>
                <SelectItem value="sent">Enviado</SelectItem>
                <SelectItem value="approved">Aprobado</SelectItem>
                <SelectItem value="rejected">Rechazado</SelectItem>
                <SelectItem value="converted">Convertido</SelectItem>
              </SelectContent>
            </Select>

            {/* Date From */}
            <Popover open={dateFromOpen} onOpenChange={setDateFromOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-40 justify-start text-left font-normal",
                    !dateFrom && "text-muted-foreground"
                  )}
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  {dateFrom ? format(dateFrom, "PPP") : "From date"}
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
                    "w-40 justify-start text-left font-normal",
                    !dateTo && "text-muted-foreground"
                  )}
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  {dateTo ? format(dateTo, "PPP") : "To date"}
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
            <Button variant="outline" onClick={clearFilters}>
              <Filter className="mr-2 h-4 w-4" />
              Clear
            </Button>

            {/* View Toggle */}
            <div className="flex rounded-md border">
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="rounded-r-none"
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'cards' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('cards')}
                className="rounded-l-none"
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Active Filters Display */}
        {(statusFilter !== 'all' || searchTerm || dateFrom || dateTo) && (
          <div className="flex gap-2 mt-3 pt-3 border-t">
            <span className="text-sm text-gray-500">Active filters:</span>
            {statusFilter !== 'all' && (
              <Badge variant="secondary" className="text-xs">
                Status: {statusFilter}
              </Badge>
            )}
            {searchTerm && (
              <Badge variant="secondary" className="text-xs">
                Search: {searchTerm}
              </Badge>
            )}
            {dateFrom && (
              <Badge variant="secondary" className="text-xs">
                From: {format(dateFrom, "MMM dd, yyyy")}
              </Badge>
            )}
            {dateTo && (
              <Badge variant="secondary" className="text-xs">
                To: {format(dateTo, "MMM dd, yyyy")}
              </Badge>
            )}
          </div>
        )}
      </div>

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
          
          <TabsContent value="residential" className="p-6">
            {viewMode === 'list' 
              ? renderQuotesTable(residentialQuotes, "No residential quotes found")
              : renderQuotesCards(residentialQuotes, "No residential quotes found")
            }
          </TabsContent>
          
          <TabsContent value="commercial" className="p-6">
            {viewMode === 'list'
              ? renderQuotesTable(commercialQuotes, "No commercial quotes found") 
              : renderQuotesCards(commercialQuotes, "No commercial quotes found")
            }
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