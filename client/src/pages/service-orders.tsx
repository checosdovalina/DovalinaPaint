import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ServiceOrder, Project, Staff, Subcontractor, Client } from "@shared/schema";
import { Layout } from "@/components/layout";
import { ServiceOrderForm } from "@/components/service-order-form";
import { ServiceOrderDetail } from "@/components/service-order-detail";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Clipboard,
  Calendar,
  Users,
  Plus,
  Edit,
  Trash,
  Search,
  Image,
  CheckCircle,
  Briefcase,
  HardHat,
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
import { enUS } from "date-fns/locale";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import worker1 from "@/assets/images/worker1.svg";
import worker2 from "@/assets/images/worker2.svg";
import worker3 from "@/assets/images/worker3.svg";
import worker4 from "@/assets/images/worker4.svg";

export default function ServiceOrders() {
  const [showServiceOrderForm, setShowServiceOrderForm] = useState(false);
  const [serviceOrderToEdit, setServiceOrderToEdit] = useState<ServiceOrder | null>(null);
  const [serviceOrderToDelete, setServiceOrderToDelete] = useState<ServiceOrder | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const { toast } = useToast();

  // Fetch service orders
  const { data: serviceOrders, isLoading: isLoadingServiceOrders } = useQuery<ServiceOrder[]>({
    queryKey: ["/api/service-orders"],
    queryFn: async () => {
      const res = await fetch("/api/service-orders");
      if (!res.ok) throw new Error("Failed to fetch service orders");
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

  // Fetch staff members
  const { data: staffMembers } = useQuery<Staff[]>({
    queryKey: ["/api/staff"],
    queryFn: async () => {
      const res = await fetch("/api/staff");
      if (!res.ok) throw new Error("Failed to fetch staff");
      return res.json();
    },
  });
  
  // Fetch subcontractors
  const { data: subcontractors } = useQuery<Subcontractor[]>({
    queryKey: ["/api/subcontractors"],
    queryFn: async () => {
      const res = await fetch("/api/subcontractors");
      if (!res.ok) throw new Error("Failed to fetch subcontractors");
      return res.json();
    },
  });

  const handleEditServiceOrder = (serviceOrder: ServiceOrder) => {
    setServiceOrderToEdit(serviceOrder);
    setShowServiceOrderForm(true);
  };

  const handleNewServiceOrder = () => {
    setServiceOrderToEdit(null);
    setShowServiceOrderForm(true);
  };

  const handleCloseForm = () => {
    setShowServiceOrderForm(false);
    setServiceOrderToEdit(null);
  };

  const handleDeleteClick = (serviceOrder: ServiceOrder) => {
    setServiceOrderToDelete(serviceOrder);
  };

  const handleDeleteConfirm = async () => {
    if (!serviceOrderToDelete) return;

    try {
      await apiRequest("DELETE", `/api/service-orders/${serviceOrderToDelete.id}`, undefined);
      
      toast({
        title: "Service Order Deleted",
        description: "The service order has been successfully deleted",
      });
      
      queryClient.invalidateQueries({ queryKey: ["/api/service-orders"] });
    } catch (error) {
      toast({
        title: "Error",
        description: `Could not delete the service order: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setServiceOrderToDelete(null);
    }
  };

  const handleUpdateStatus = async (serviceOrder: ServiceOrder, newStatus: string) => {
    try {
      await apiRequest("PUT", `/api/service-orders/${serviceOrder.id}`, {
        status: newStatus,
      });
      
      toast({
        title: "Status Updated",
        description: `The service order has been successfully ${newStatus === "completed" ? "completed" : "updated"}`,
      });
      
      queryClient.invalidateQueries({ queryKey: ["/api/service-orders"] });
    } catch (error) {
      toast({
        title: "Error",
        description: `Could not update the service order status: ${error.message}`,
        variant: "destructive",
      });
    }
  };

  // Filter service orders
  const filteredServiceOrders = serviceOrders?.filter(serviceOrder => {
    // Filter by status
    if (statusFilter !== "all" && serviceOrder.status !== statusFilter) {
      return false;
    }
    
    // Filter by search term (using project names)
    if (searchTerm && projects) {
      const searchTermLower = searchTerm.toLowerCase();
      const project = projects.find(p => p.id === serviceOrder.projectId);
      
      if (!project || !project.title.toLowerCase().includes(searchTermLower)) {
        return false;
      }
    }
    
    return true;
  });

  // Helper to get project name
  const getProjectName = (projectId: number) => {
    const project = projects?.find(p => p.id === projectId);
    return project ? project.title : `Project #${projectId}`;
  };

  // Helper to format date
  const formatDate = (date: Date | undefined | null) => {
    if (!date) return "Not defined";
    return format(new Date(date), "d MMM yyyy", { locale: enUS });
  };

  // Helper to get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline">Pending</Badge>;
      case "in_progress":
        return <Badge className="bg-blue-100 text-blue-800">In Progress</Badge>;
      case "completed":
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Helper to get assigned staff
  const getAssignedStaff = (assignedStaff: number[] | null | undefined) => {
    if (!assignedStaff || !staffMembers) return [];
    
    return staffMembers.filter(staff => 
      assignedStaff.includes(staff.id)
    );
  };

  // Helper to get staff avatar
  const getStaffAvatar = (staff: Staff) => {
    if (staff.avatar) {
      return staff.avatar;
    }
    
    // Map staff id to avatar images
    switch (staff.id % 4) {
      case 0: return worker1;
      case 1: return worker2;
      case 2: return worker3;
      case 3: return worker4;
      default: return worker1;
    }
  };
  
  // Helper to get supervisor name
  const getSupervisorName = (supervisorId: number | null | undefined) => {
    if (!supervisorId || !staffMembers) return null;
    const supervisor = staffMembers.find(staff => staff.id === supervisorId);
    return supervisor;
  };
  
  // Helper to get subcontractor name
  const getSubcontractorName = (subcontractorId: number | null | undefined) => {
    if (!subcontractorId || !subcontractors) return null;
    const subcontractor = subcontractors.find(sub => sub.id === subcontractorId);
    return subcontractor;
  };

  return (
    <Layout title="Service Orders">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-2 w-full max-w-md">
          <div className="relative w-full">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search service orders..."
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
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={handleNewServiceOrder}>
          <Plus className="h-4 w-4 mr-2" />
          New Service Order
        </Button>
      </div>

      {isLoadingServiceOrders ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
        </div>
      ) : filteredServiceOrders && filteredServiceOrders.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredServiceOrders.map((serviceOrder) => (
            <Card key={serviceOrder.id} className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-lg truncate">
                    {getProjectName(serviceOrder.projectId)}
                  </CardTitle>
                  {getStatusBadge(serviceOrder.status)}
                </div>
              </CardHeader>
              <CardContent className="pb-2 space-y-3">
                <div className="flex items-center text-sm">
                  <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                  <span>Start: {formatDate(serviceOrder.startDate)}</span>
                </div>
                {serviceOrder.endDate && (
                  <div className="flex items-center text-sm">
                    <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                    <span>Completion: {formatDate(serviceOrder.endDate)}</span>
                  </div>
                )}
                <div className="text-sm line-clamp-2 mt-1">
                  {serviceOrder.details}
                </div>

                {/* Assigned subcontractor */}
                {serviceOrder.assignedSubcontractorId && (
                  <div className="flex items-center text-sm mt-3">
                    <Briefcase className="h-4 w-4 mr-2 text-gray-400" />
                    <span className="font-medium">Subcontractor:</span>
                    <span className="ml-1">
                      {getSubcontractorName(serviceOrder.assignedSubcontractorId)?.company || 'Not assigned'}
                    </span>
                  </div>
                )}
                
                {/* Assigned supervisor */}
                {serviceOrder.supervisorId && (
                  <div className="flex items-center text-sm mt-2">
                    <HardHat className="h-4 w-4 mr-2 text-gray-400" />
                    <span className="font-medium">Supervisor:</span>
                    <span className="ml-1">
                      {getSupervisorName(serviceOrder.supervisorId)?.name || 'Not assigned'}
                    </span>
                  </div>
                )}

                {/* Assigned staff */}
                {serviceOrder.assignedStaff && (
                  <div className="mt-3">
                    <div className="flex items-center text-sm mb-2">
                      <Users className="h-4 w-4 mr-2 text-gray-400" />
                      <span>Assigned Staff:</span>
                    </div>
                    <div className="flex -space-x-2">
                      {getAssignedStaff(serviceOrder.assignedStaff as number[]).map(staff => (
                        <Avatar key={staff.id} className="border-2 border-white h-8 w-8">
                          <AvatarImage src={getStaffAvatar(staff)} alt={staff.name} />
                          <AvatarFallback>
                            {staff.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      ))}
                    </div>
                  </div>
                )}

                {/* Images indicator */}
                {(serviceOrder.beforeImages || serviceOrder.afterImages) && (
                  <div className="flex items-center text-sm text-primary">
                    <Image className="h-4 w-4 mr-2" />
                    <span>Contains attached images</span>
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex flex-wrap justify-between pt-2">
                {serviceOrder.status !== "completed" && (
                  <div className="flex space-x-1 mb-2 mr-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 px-2 text-green-600 border-green-600 hover:bg-green-50"
                      onClick={() => handleUpdateStatus(serviceOrder, "completed")}
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Mark as Completed
                    </Button>
                  </div>
                )}
                <div className="flex space-x-1 ml-auto">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 h-8 w-8 p-0"
                    onClick={() => handleDeleteClick(serviceOrder)}
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8"
                    onClick={() => handleEditServiceOrder(serviceOrder)}
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
            ? "No service orders found with the applied filters"
            : "No service orders registered. Create a new one by clicking on 'New Service Order'"}
        </div>
      )}

      {/* Service Order Form Dialog */}
      <Dialog open={showServiceOrderForm} onOpenChange={setShowServiceOrderForm}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {serviceOrderToEdit ? "Edit Service Order" : "New Service Order"}
            </DialogTitle>
            <DialogDescription>
              {serviceOrderToEdit
                ? "Modify the service order details as needed"
                : "Fill out the form to create a new service order"}
            </DialogDescription>
          </DialogHeader>
          <ServiceOrderForm
            initialData={serviceOrderToEdit || undefined}
            onSuccess={handleCloseForm}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!serviceOrderToDelete}
        onOpenChange={(open) => !open && setServiceOrderToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Service Order?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The service order will be permanently deleted from the system.
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
    </Layout>
  );
}
