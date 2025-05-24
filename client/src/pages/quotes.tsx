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

  // Filter quotes
  const filteredQuotes = quotes?.filter(quote => {
    // Filter by status
    if (statusFilter !== "all" && quote.status !== statusFilter) {
      return false;
    }
    
    // Filter by search term (using project names)
    if (searchTerm && projects) {
      const searchTermLower = searchTerm.toLowerCase();
      const project = projects.find(p => p.id === quote.projectId);
      
      if (!project || !project.title.toLowerCase().includes(searchTermLower)) {
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

  return (
    <Layout title="Quotes">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-2 w-full max-w-md">
          <div className="relative w-full">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search quotes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
          <Select
            value={statusFilter}
            onValueChange={setStatusFilter}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="sent">Sent</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={handleNewQuote}>
          <Plus className="h-4 w-4 mr-2" />
          New Quote
        </Button>
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
                  <span>Enviado: {formatDate(quote.sentDate)}</span>
                </div>
                <div className="flex items-center text-sm">
                  <Clock className="h-4 w-4 mr-2 text-gray-400" />
                  <span>Válido hasta: {formatDate(quote.validUntil)}</span>
                </div>
                {quote.status === "approved" && (
                  <div className="flex items-center text-sm text-green-600">
                    <FileCheck className="h-4 w-4 mr-2" />
                    <span>Aprobado: {formatDate(quote.approvedDate)}</span>
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
                    Editar
                  </Button>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 text-gray-500">
          {searchTerm || statusFilter !== "all"
            ? "No se encontraron presupuestos con los filtros aplicados"
            : "No hay presupuestos registrados. Cree uno nuevo haciendo clic en 'Nuevo Presupuesto'"}
        </div>
      )}

      {/* Quote Form Dialog */}
      <Dialog open={showQuoteForm} onOpenChange={setShowQuoteForm}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>
              {quoteToEdit ? "Editar Presupuesto" : "Nuevo Presupuesto"}
            </DialogTitle>
            <DialogDescription>
              {quoteToEdit
                ? "Modifique los detalles del presupuesto según sea necesario"
                : "Complete el formulario para crear un nuevo presupuesto"}
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
            <AlertDialogTitle>¿Eliminar Presupuesto?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El presupuesto será eliminado permanentemente del sistema.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-red-600 hover:bg-red-700"
            >
              Eliminar
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
