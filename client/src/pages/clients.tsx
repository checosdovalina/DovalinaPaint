import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Client } from "@shared/schema";
import { Layout } from "@/components/layout";
import { ClientForm } from "@/components/client-form";
import { ClientDetail } from "@/components/client-detail";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Building,
  User,
  Mail,
  Phone,
  MapPin,
  Plus,
  Edit,
  Trash,
  Search,
  Eye,
  Grid3X3,
  List,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function Clients() {
  const [showClientForm, setShowClientForm] = useState(false);
  const [clientToEdit, setClientToEdit] = useState<Client | null>(null);
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);
  const [clientToView, setClientToView] = useState<Client | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [classificationFilter, setClassificationFilter] = useState("all");
  const [viewMode, setViewMode] = useState<"cards" | "list">("cards");
  const { toast } = useToast();

  // Fetch clients
  const { data: clients, isLoading } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
    queryFn: async () => {
      const res = await fetch("/api/clients");
      if (!res.ok) throw new Error("Failed to fetch clients");
      return res.json();
    },
  });

  const handleEditClient = (client: Client) => {
    setClientToEdit(client);
    setShowClientForm(true);
  };

  const handleNewClient = () => {
    setClientToEdit(null);
    setShowClientForm(true);
  };

  const handleCloseForm = () => {
    setShowClientForm(false);
    setClientToEdit(null);
  };

  const handleDeleteClick = (client: Client) => {
    setClientToDelete(client);
  };

  const handleDeleteConfirm = async () => {
    if (!clientToDelete) return;

    try {
      await apiRequest("DELETE", `/api/clients/${clientToDelete.id}`, undefined);
      
      toast({
        title: "Cliente eliminado",
        description: "El cliente ha sido eliminado exitosamente",
      });
      
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
    } catch (error) {
      toast({
        title: "Error",
        description: `No se pudo eliminar el cliente: ${error instanceof Error ? error.message : 'Error desconocido'}`,
        variant: "destructive",
      });
    } finally {
      setClientToDelete(null);
    }
  };

  // Filter and search clients
  const filteredClients = clients?.filter(client => {
    // Filter by classification
    if (classificationFilter !== "all" && client.classification !== classificationFilter) {
      return false;
    }
    
    // Filter by search term
    if (searchTerm) {
      const searchTermLower = searchTerm.toLowerCase();
      return (
        client.name.toLowerCase().includes(searchTermLower) ||
        client.email.toLowerCase().includes(searchTermLower) ||
        client.phone.toLowerCase().includes(searchTermLower) ||
        client.address.toLowerCase().includes(searchTermLower)
      );
    }
    
    return true;
  });

  // Helper to get classification label
  const getClassificationLabel = (classification: string) => {
    switch (classification) {
      case "residential":
        return "Residencial";
      case "commercial":
        return "Comercial";
      case "industrial":
        return "Industrial";
      default:
        return classification;
    }
  };

  // Helper to get classification badge color
  const getClassificationColor = (classification: string) => {
    switch (classification) {
      case "residential":
        return "bg-blue-100 text-blue-800";
      case "commercial":
        return "bg-green-100 text-green-800";
      case "industrial":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <Layout title="Clientes y Prospectos">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="flex items-center space-x-2 w-full max-w-md">
          <div className="relative w-full">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar clientes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
          <Select
            value={classificationFilter}
            onValueChange={setClassificationFilter}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filtrar por tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los tipos</SelectItem>
              <SelectItem value="residential">Residencial</SelectItem>
              <SelectItem value="commercial">Comercial</SelectItem>
              <SelectItem value="industrial">Industrial</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex items-center gap-2">
          {/* View mode toggle */}
          <div className="flex items-center border rounded-lg p-1">
            <Button
              variant={viewMode === "cards" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("cards")}
              className="h-8 px-3"
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("list")}
              className="h-8 px-3"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
          
          <Button onClick={handleNewClient}>
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Cliente
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
        </div>
      ) : filteredClients && filteredClients.length > 0 ? (
        viewMode === "cards" ? (
          // Cards view
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredClients.map((client) => (
              <Card key={client.id} className="overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">{client.name}</CardTitle>
                    <Badge className={getClassificationColor(client.classification)}>
                      {getClassificationLabel(client.classification)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pb-2 space-y-2">
                  <div className="flex items-center text-sm">
                    <Mail className="h-4 w-4 mr-2 text-gray-400" />
                    <span>{client.email}</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <Phone className="h-4 w-4 mr-2 text-gray-400" />
                    <span>{client.phone}</span>
                  </div>
                  <div className="flex items-start text-sm">
                    <MapPin className="h-4 w-4 mr-2 mt-1 text-gray-400" />
                    <span className="flex-1">{client.address}</span>
                  </div>
                  {client.notes && (
                    <div className="text-sm text-gray-500 mt-2 pt-2 border-t">
                      <p className="line-clamp-2">{client.notes}</p>
                    </div>
                  )}
                </CardContent>
                <CardFooter className="pt-2 flex justify-between">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                    onClick={() => setClientToView(client)}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    Ver Detalles
                  </Button>
                  <div className="flex space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={() => handleDeleteClick(client)}
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditClient(client)}
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
          // List view
          <div className="space-y-4">
            {filteredClients.map((client) => (
              <Card key={client.id} className="overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 flex-1">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold">{client.name}</h3>
                          <Badge className={getClassificationColor(client.classification)}>
                            {getClassificationLabel(client.classification)}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-gray-600">
                          <div className="flex items-center">
                            <Mail className="h-4 w-4 mr-2 text-gray-400" />
                            <span>{client.email}</span>
                          </div>
                          <div className="flex items-center">
                            <Phone className="h-4 w-4 mr-2 text-gray-400" />
                            <span>{client.phone}</span>
                          </div>
                          <div className="flex items-center">
                            <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                            <span className="truncate">{client.address}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        onClick={() => setClientToView(client)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Ver Detalles
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditClient(client)}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Editar
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => handleDeleteClick(client)}
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )
      ) : (
        <div className="text-center py-20 text-gray-500">
          {searchTerm || classificationFilter !== "all"
            ? "No se encontraron clientes con los filtros aplicados"
            : "No hay clientes registrados. Cree uno nuevo haciendo clic en 'Nuevo Cliente'"}
        </div>
      )}

      {/* Client Form Dialog */}
      <Dialog open={showClientForm} onOpenChange={setShowClientForm}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {clientToEdit ? "Editar Cliente" : "Nuevo Cliente"}
            </DialogTitle>
            <DialogDescription>
              {clientToEdit
                ? "Modifique los datos del cliente según sea necesario"
                : "Complete el formulario para registrar un nuevo cliente"}
            </DialogDescription>
          </DialogHeader>
          <ClientForm
            initialData={clientToEdit || undefined}
            onSuccess={handleCloseForm}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!clientToDelete}
        onOpenChange={(open) => !open && setClientToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar Cliente?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El cliente será eliminado permanentemente del sistema.
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

      {/* Client Detail Dialog */}
      <ClientDetail
        client={clientToView}
        isOpen={!!clientToView}
        onClose={() => setClientToView(null)}
      />
    </Layout>
  );
}
