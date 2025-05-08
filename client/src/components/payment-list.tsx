import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { 
  DollarSign, Edit, Trash2, FileText, 
  CheckCircle2, Clock, XCircle, BadgeHelp, 
  UserCircle, HardHat, PackageOpen
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
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
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import PaymentForm from "./payment-form";

export default function PaymentList() {
  const { toast } = useToast();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<any>(null);
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch all payments
  const { data: payments = [], isLoading } = useQuery({
    queryKey: ["/api/payments"],
    staleTime: 30000, // 30 seconds
  });

  // Fetch projects for reference
  const { data: projects = [] } = useQuery({
    queryKey: ["/api/projects"],
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  // Fetch staff for reference
  const { data: staff = [] } = useQuery({
    queryKey: ["/api/staff"],
    staleTime: 10 * 60 * 1000,
  });

  // Fetch subcontractors for reference
  const { data: subcontractors = [] } = useQuery({
    queryKey: ["/api/subcontractors"],
    staleTime: 10 * 60 * 1000,
  });

  // Fetch suppliers for reference
  const { data: suppliers = [] } = useQuery({
    queryKey: ["/api/suppliers"],
    staleTime: 10 * 60 * 1000,
  });

  // Delete payment mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/payments/${id}`);
      if (!res.ok) {
        throw new Error("Failed to delete payment");
      }
      return id;
    },
    onSuccess: () => {
      toast({
        title: "Payment deleted",
        description: "The payment has been deleted successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/payments"] });
      setIsDeleteDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle edit button click
  const handleEdit = (payment: any) => {
    setSelectedPayment(payment);
    setIsEditDialogOpen(true);
  };

  // Handle delete button click
  const handleDelete = (payment: any) => {
    setSelectedPayment(payment);
    setIsDeleteDialogOpen(true);
  };

  // Helper function to get project title
  const getProjectTitle = (projectId: number) => {
    const project = projects.find((p: any) => p.id === projectId);
    return project ? project.title : "Unknown Project";
  };

  // Helper function to get recipient name
  const getRecipientName = (recipientType: string, recipientId: number) => {
    let list;
    switch (recipientType) {
      case "staff":
        list = staff;
        break;
      case "subcontractor":
        list = subcontractors;
        break;
      case "supplier":
        list = suppliers;
        break;
      default:
        return "Unknown Recipient";
    }
    
    const recipient = list.find((r: any) => r.id === recipientId);
    return recipient ? recipient.name : "Unknown Recipient";
  };

  // Helper function to get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-600"><CheckCircle2 className="w-3 h-3 mr-1" /> Completed</Badge>;
      case "pending":
        return <Badge className="bg-yellow-600"><Clock className="w-3 h-3 mr-1" /> Pending</Badge>;
      case "failed":
        return <Badge className="bg-red-600"><XCircle className="w-3 h-3 mr-1" /> Failed</Badge>;
      case "cancelled":
        return <Badge className="bg-gray-600"><XCircle className="w-3 h-3 mr-1" /> Cancelled</Badge>;
      default:
        return <Badge variant="outline"><BadgeHelp className="w-3 h-3 mr-1" /> {status}</Badge>;
    }
  };

  // Helper function to get recipient type icon
  const getRecipientTypeIcon = (type: string) => {
    switch (type) {
      case "staff":
        return <UserCircle className="w-4 h-4 mr-1" />;
      case "subcontractor":
        return <HardHat className="w-4 h-4 mr-1" />;
      case "supplier":
        return <PackageOpen className="w-4 h-4 mr-1" />;
      default:
        return <UserCircle className="w-4 h-4 mr-1" />;
    }
  };

  // Filter and search payments
  const filteredPayments = payments.filter((payment: any) => {
    const matchesStatus = !filterStatus || payment.status === filterStatus;
    const matchesType = !filterType || payment.recipientType === filterType;
    const matchesSearch = !searchQuery || 
      payment.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      getRecipientName(payment.recipientType, payment.recipientId).toLowerCase().includes(searchQuery.toLowerCase()) ||
      (payment.reference && payment.reference.toLowerCase().includes(searchQuery.toLowerCase()));
    
    return matchesStatus && matchesType && matchesSearch;
  });

  // Group payments by month
  const groupedPayments = filteredPayments.reduce((groups: any, payment: any) => {
    const date = new Date(payment.date);
    const month = format(date, "MMMM yyyy");
    
    if (!groups[month]) {
      groups[month] = [];
    }
    
    groups[month].push(payment);
    return groups;
  }, {});

  // Calculate totals
  const totalAmount = filteredPayments.reduce((sum: number, payment: any) => 
    sum + parseFloat(payment.amount), 0);
  
  // Sort months chronologically (most recent first)
  const sortedMonths = Object.keys(groupedPayments).sort((a, b) => {
    // Convert month names to dates for comparison
    const dateA = new Date(a);
    const dateB = new Date(b);
    return dateB.getTime() - dateA.getTime();
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Payments</h2>
          <p className="text-muted-foreground">
            Manage payments to staff, subcontractors, and suppliers
          </p>
        </div>
        <Button 
          onClick={() => setIsCreateDialogOpen(true)} 
          className="shrink-0"
        >
          <DollarSign className="mr-2 h-4 w-4" /> New Payment
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Payment Summary</CardTitle>
          <CardDescription>Overview of all payments</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <div className="flex-1 flex justify-between items-center p-4 bg-primary-50 rounded-lg">
              <div>
                <p className="text-sm font-medium">Total Payments</p>
                <h3 className="text-2xl font-bold">${totalAmount.toFixed(2)}</h3>
              </div>
              <DollarSign className="h-8 w-8 text-primary" />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col sm:flex-row justify-between gap-4 mb-4">
        <div className="flex flex-col sm:flex-row gap-2 sm:items-center w-full">
          <Input
            placeholder="Search payments..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-xs"
          />
          <div className="flex gap-2">
            <Select onValueChange={(value) => setFilterStatus(value === "all" ? null : value)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>

            <Select onValueChange={(value) => setFilterType(value === "all" ? null : value)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Recipients</SelectItem>
                <SelectItem value="staff">Staff</SelectItem>
                <SelectItem value="subcontractor">Subcontractors</SelectItem>
                <SelectItem value="supplier">Suppliers</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {isLoading ? (
          <Card>
            <CardContent className="p-8 flex justify-center items-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </CardContent>
          </Card>
        ) : filteredPayments.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground">No payments found</p>
            </CardContent>
          </Card>
        ) : (
          sortedMonths.map((month) => (
            <Card key={month}>
              <CardHeader>
                <CardTitle>{month}</CardTitle>
                <CardDescription>
                  {groupedPayments[month].length} payment{groupedPayments[month].length !== 1 ? 's' : ''} - Total: ${groupedPayments[month].reduce((sum: number, payment: any) => sum + parseFloat(payment.amount), 0).toFixed(2)}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {groupedPayments[month].sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((payment: any) => (
                    <div key={payment.id} className="flex flex-col md:flex-row justify-between p-4 border rounded-lg">
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{format(new Date(payment.date), "MMM d, yyyy")}</p>
                          {getStatusBadge(payment.status)}
                        </div>
                        <h4 className="text-lg font-semibold">${parseFloat(payment.amount).toFixed(2)}</h4>
                        <p className="text-muted-foreground">{payment.description}</p>
                        
                        <div className="flex flex-wrap gap-2 mt-1">
                          <div className="flex items-center text-sm">
                            {getRecipientTypeIcon(payment.recipientType)}
                            <span className="capitalize">{payment.recipientType}:</span> {getRecipientName(payment.recipientType, payment.recipientId)}
                          </div>
                          
                          {payment.projectId && (
                            <div className="flex items-center text-sm">
                              <FileText className="w-4 h-4 mr-1" />
                              Project: {getProjectTitle(payment.projectId)}
                            </div>
                          )}
                          
                          {payment.reference && (
                            <div className="flex items-center text-sm">
                              <span className="text-muted-foreground">Ref: {payment.reference}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 mt-4 md:mt-0">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(payment)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(payment)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Create Payment Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>New Payment</DialogTitle>
            <DialogDescription>
              Create a new payment record for staff, subcontractors, or suppliers.
            </DialogDescription>
          </DialogHeader>
          <PaymentForm onComplete={() => setIsCreateDialogOpen(false)} />
        </DialogContent>
      </Dialog>

      {/* Edit Payment Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Payment</DialogTitle>
            <DialogDescription>
              Update payment details.
            </DialogDescription>
          </DialogHeader>
          {selectedPayment && (
            <PaymentForm 
              payment={selectedPayment} 
              onComplete={() => setIsEditDialogOpen(false)} 
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the payment record. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteMutation.mutate(selectedPayment.id)}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}