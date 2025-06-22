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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  UserPlus,
  Users,
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
  const [activeTab, setActiveTab] = useState("clients");
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

  const handleNewProspect = () => {
    setClientToEdit(null);
    setShowClientForm(true);
  };

  const handleCloseForm = () => {
    setShowClientForm(false);
    setClientToEdit(null);
  };

  const convertToClient = async (prospect: Client) => {
    try {
      await apiRequest("PATCH", `/api/clients/${prospect.id}`, {
        ...prospect,
        type: "client"
      });
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      toast({
        title: "Prospect converted",
        description: "The prospect has been successfully converted to client.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Could not convert prospect to client.",
        variant: "destructive",
      });
    }
  };

  const convertToProspect = async (client: Client) => {
    try {
      await apiRequest("PATCH", `/api/clients/${client.id}`, {
        ...client,
        type: "prospect"
      });
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      toast({
        title: "Client converted",
        description: "The client has been converted to prospect.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Could not convert client to prospect.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteClick = (client: Client) => {
    setClientToDelete(client);
  };

  const handleDeleteConfirm = async () => {
    if (!clientToDelete) return;

    try {
      await apiRequest("DELETE", `/api/clients/${clientToDelete.id}`);
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      toast({
        title: "Client deleted",
        description: "The client has been deleted successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Could not delete the client.",
        variant: "destructive",
      });
    } finally {
      setClientToDelete(null);
    }
  };

  // Filter clients and prospects separately
  const actualClients = clients?.filter(client => client.type === 'client') || [];
  const prospects = clients?.filter(client => client.type === 'prospect') || [];

  // Filter and search function
  const filterData = (data: Client[]) => {
    return data.filter(client => {
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
  };

  const filteredClients = filterData(actualClients);
  const filteredProspects = filterData(prospects);

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

  const renderClientCards = (data: Client[], type: 'client' | 'prospect') => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {data.map((item) => (
        <Card key={item.id} className="overflow-hidden">
          <CardHeader className="pb-3">
            <div className="flex justify-between items-start">
              <CardTitle className="text-lg">{item.name}</CardTitle>
              <Badge className={getClassificationColor(item.classification)}>
                {getClassificationLabel(item.classification)}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pb-2 space-y-2">
            <div className="flex items-center text-sm">
              <Mail className="h-4 w-4 mr-2 text-gray-400" />
              <span>{item.email}</span>
            </div>
            <div className="flex items-center text-sm">
              <Phone className="h-4 w-4 mr-2 text-gray-400" />
              <span>{item.phone}</span>
            </div>
            <div className="flex items-start text-sm">
              <MapPin className="h-4 w-4 mr-2 mt-1 text-gray-400" />
              <span className="flex-1">{item.address}</span>
            </div>
            {item.notes && (
              <div className="text-sm text-gray-500 mt-2 pt-2 border-t">
                <p className="line-clamp-2">{item.notes}</p>
              </div>
            )}
          </CardContent>
          <CardFooter className="pt-2 flex justify-between">
            <Button
              variant="ghost"
              size="sm"
              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
              onClick={() => setClientToView(item)}
            >
              <Eye className="h-4 w-4 mr-1" />
              View
            </Button>
            <div className="flex gap-1">
              {type === 'prospect' ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => convertToClient(item)}
                  className="bg-green-50 text-green-600 hover:bg-green-100"
                >
                  <Users className="h-4 w-4 mr-1" />
                  To Client
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => convertToProspect(item)}
                  className="bg-orange-50 text-orange-600 hover:bg-orange-100"
                >
                  <UserPlus className="h-4 w-4 mr-1" />
                  To Prospect
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleEditClient(item)}
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDeleteClick(item)}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash className="h-4 w-4" />
              </Button>
            </div>
          </CardFooter>
        </Card>
      ))}
    </div>
  );

  const renderEmptyState = (type: 'client' | 'prospect') => (
    <div className="text-center py-20">
      {type === 'client' ? (
        <Users className="h-12 w-12 mx-auto text-gray-400 mb-4" />
      ) : (
        <UserPlus className="h-12 w-12 mx-auto text-gray-400 mb-4" />
      )}
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        {type === 'client' ? 'No clients found' : 'No prospects found'}
      </h3>
      <p className="text-gray-500 mb-4">
        {type === 'client' ? 'Start by adding your first client.' : 'Start by adding your first prospect.'}
      </p>
      <Button onClick={type === 'client' ? handleNewClient : handleNewProspect}>
        <Plus className="h-4 w-4 mr-2" />
        {type === 'client' ? 'Add Client' : 'Add Prospect'}
      </Button>
    </div>
  );

  return (
    <Layout title="Clients & Prospects">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="clients" className="flex items-center space-x-2">
              <Users className="h-4 w-4" />
              <span>Clients ({actualClients.length})</span>
            </TabsTrigger>
            <TabsTrigger value="prospects" className="flex items-center space-x-2">
              <UserPlus className="h-4 w-4" />
              <span>Prospects ({prospects.length})</span>
            </TabsTrigger>
          </TabsList>

          <div className="flex items-center space-x-2">
            <Button 
              onClick={activeTab === 'clients' ? handleNewClient : handleNewProspect}
              className="flex items-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              <span>{activeTab === 'clients' ? 'New Client' : 'New Prospect'}</span>
            </Button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div className="flex items-center space-x-2 w-full max-w-md">
            <div className="relative w-full">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder={activeTab === 'clients' ? "Search clients..." : "Search prospects..."}
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
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                <SelectItem value="residential">Residential</SelectItem>
                <SelectItem value="commercial">Commercial</SelectItem>
                <SelectItem value="industrial">Industrial</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-center gap-2">
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
          </div>
        </div>

        <TabsContent value="clients">
          {isLoading ? (
            <div className="flex justify-center py-20">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
            </div>
          ) : filteredClients && filteredClients.length > 0 ? (
            renderClientCards(filteredClients, 'client')
          ) : (
            renderEmptyState('client')
          )}
        </TabsContent>

        <TabsContent value="prospects">
          {isLoading ? (
            <div className="flex justify-center py-20">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
            </div>
          ) : filteredProspects && filteredProspects.length > 0 ? (
            renderClientCards(filteredProspects, 'prospect')
          ) : (
            renderEmptyState('prospect')
          )}
        </TabsContent>
      </Tabs>

      <ClientForm
        open={showClientForm}
        onClose={handleCloseForm}
        clientToEdit={clientToEdit}
        defaultType={activeTab === 'prospects' ? 'prospect' : 'client'}
      />

      <AlertDialog
        open={!!clientToDelete}
        onOpenChange={() => setClientToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm deletion?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the {clientToDelete?.type === 'prospect' ? 'prospect' : 'client'}{" "}
              {clientToDelete?.name} and all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <ClientDetail
        client={clientToView}
        isOpen={!!clientToView}
        onClose={() => setClientToView(null)}
      />
    </Layout>
  );
}