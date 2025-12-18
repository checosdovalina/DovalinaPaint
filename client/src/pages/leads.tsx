import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Lead } from "@shared/schema";
import { Layout } from "@/components/layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  User,
  Mail,
  Phone,
  MessageSquare,
  Calendar,
  Search,
  Eye,
  Trash,
  CheckCircle,
  Clock,
  XCircle,
  UserPlus,
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
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function Leads() {
  const [leadToView, setLeadToView] = useState<Lead | null>(null);
  const [leadToDelete, setLeadToDelete] = useState<Lead | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const { toast } = useToast();

  const { data: leads, isLoading } = useQuery<Lead[]>({
    queryKey: ["/api/leads"],
    queryFn: async () => {
      const res = await fetch("/api/leads", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch leads");
      return res.json();
    },
  });

  const handleDeleteConfirm = async () => {
    if (!leadToDelete) return;

    try {
      await apiRequest("DELETE", `/api/leads/${leadToDelete.id}`);
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      toast({
        title: "Lead deleted",
        description: "The lead has been deleted successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Could not delete the lead.",
        variant: "destructive",
      });
    } finally {
      setLeadToDelete(null);
    }
  };

  const updateLeadStatus = async (lead: Lead, newStatus: string) => {
    try {
      await apiRequest("PUT", `/api/leads/${lead.id}`, { status: newStatus });
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      toast({
        title: "Status updated",
        description: `Lead status changed to ${newStatus}.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Could not update lead status.",
        variant: "destructive",
      });
    }
  };

  const convertToClient = async (lead: Lead) => {
    try {
      await apiRequest("POST", "/api/clients", {
        name: lead.name,
        email: lead.email,
        phone: lead.phone,
        address: "To be updated",
        type: "prospect",
        classification: "residential",
        notes: lead.message || "",
      });
      await apiRequest("PUT", `/api/leads/${lead.id}`, { status: "converted" });
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      toast({
        title: "Lead converted",
        description: "The lead has been converted to a client prospect.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Could not convert lead to client.",
        variant: "destructive",
      });
    }
  };

  const filteredLeads = leads?.filter((lead) => {
    const matchesSearch =
      lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.phone.includes(searchTerm);
    const matchesStatus = statusFilter === "all" || lead.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "new":
        return <Badge className="bg-blue-500">New</Badge>;
      case "contacted":
        return <Badge className="bg-yellow-500">Contacted</Badge>;
      case "qualified":
        return <Badge className="bg-green-500">Qualified</Badge>;
      case "converted":
        return <Badge className="bg-primary">Converted</Badge>;
      case "lost":
        return <Badge variant="destructive">Lost</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatDate = (date: Date | string | null) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getServiceLabel = (serviceType: string | null) => {
    if (!serviceType) return "Not specified";
    const services: Record<string, string> = {
      "exterior-painting": "Exterior House Painting",
      "interior-painting": "Interior Painting",
      "commercial-painting": "Commercial Painting",
      "cabinet-painting": "Cabinet Painting",
      "deck-fence": "Deck & Fence Painting",
      other: "Other",
    };
    return services[serviceType] || serviceType;
  };

  const leadStats = {
    total: leads?.length || 0,
    new: leads?.filter((l) => l.status === "new").length || 0,
    contacted: leads?.filter((l) => l.status === "contacted").length || 0,
    converted: leads?.filter((l) => l.status === "converted").length || 0,
  };

  return (
    <Layout title="Leads">
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-primary" data-testid="text-page-title">
              Leads
            </h1>
            <p className="text-gray-500">
              Manage leads from your website contact form
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
              <User className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-total-leads">
                {leadStats.total}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">New</CardTitle>
              <Clock className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-500" data-testid="text-new-leads">
                {leadStats.new}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Contacted</CardTitle>
              <Phone className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-500" data-testid="text-contacted-leads">
                {leadStats.contacted}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Converted</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-500" data-testid="text-converted-leads">
                {leadStats.converted}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <CardTitle>All Leads</CardTitle>
                <CardDescription>
                  Contact form submissions from your website
                </CardDescription>
              </div>
              <div className="flex flex-col md:flex-row gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search leads..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-full md:w-[250px]"
                    data-testid="input-search"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full md:w-[150px]" data-testid="select-status-filter">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="new">New</SelectItem>
                    <SelectItem value="contacted">Contacted</SelectItem>
                    <SelectItem value="qualified">Qualified</SelectItem>
                    <SelectItem value="converted">Converted</SelectItem>
                    <SelectItem value="lost">Lost</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-gray-500">Loading leads...</div>
            ) : !filteredLeads?.length ? (
              <div className="text-center py-8 text-gray-500">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No leads found</p>
                <p className="text-sm">
                  Leads from your website contact form will appear here
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Service</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLeads.map((lead) => (
                      <TableRow key={lead.id} data-testid={`row-lead-${lead.id}`}>
                        <TableCell className="font-medium">{lead.name}</TableCell>
                        <TableCell>
                          <div className="flex flex-col text-sm">
                            <span className="flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {lead.email}
                            </span>
                            <span className="flex items-center gap-1 text-gray-500">
                              <Phone className="h-3 w-3" />
                              {lead.phone}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>{getServiceLabel(lead.service)}</TableCell>
                        <TableCell>{getStatusBadge(lead.status)}</TableCell>
                        <TableCell className="text-sm text-gray-500">
                          {formatDate(lead.createdAt)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setLeadToView(lead)}
                              data-testid={`button-view-${lead.id}`}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {lead.status !== "converted" && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => convertToClient(lead)}
                                className="text-green-600 hover:text-green-700"
                                data-testid={`button-convert-${lead.id}`}
                              >
                                <UserPlus className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setLeadToDelete(lead)}
                              className="text-red-600 hover:text-red-700"
                              data-testid={`button-delete-${lead.id}`}
                            >
                              <Trash className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={!!leadToView} onOpenChange={() => setLeadToView(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Lead Details</DialogTitle>
            <DialogDescription>
              View lead information and update status
            </DialogDescription>
          </DialogHeader>
          {leadToView && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Name</p>
                  <p className="font-medium">{leadToView.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  {getStatusBadge(leadToView.status)}
                </div>
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <a
                    href={`mailto:${leadToView.email}`}
                    className="text-primary hover:underline"
                  >
                    {leadToView.email}
                  </a>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Phone</p>
                  <a
                    href={`tel:${leadToView.phone}`}
                    className="text-primary hover:underline"
                  >
                    {leadToView.phone}
                  </a>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Service Requested</p>
                  <p>{getServiceLabel(leadToView.service)}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-gray-500">Received</p>
                  <p>{formatDate(leadToView.createdAt)}</p>
                </div>
              </div>
              {leadToView.message && (
                <div>
                  <p className="text-sm text-gray-500 mb-1">Message</p>
                  <p className="p-3 bg-gray-50 rounded-md text-sm">
                    {leadToView.message}
                  </p>
                </div>
              )}
              <div className="flex flex-wrap gap-2 pt-4 border-t">
                <p className="w-full text-sm text-gray-500 mb-1">Update Status:</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => updateLeadStatus(leadToView, "contacted")}
                  disabled={leadToView.status === "contacted"}
                  data-testid="button-status-contacted"
                >
                  <Phone className="h-4 w-4 mr-1" />
                  Contacted
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => updateLeadStatus(leadToView, "qualified")}
                  disabled={leadToView.status === "qualified"}
                  data-testid="button-status-qualified"
                >
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Qualified
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => updateLeadStatus(leadToView, "lost")}
                  disabled={leadToView.status === "lost"}
                  data-testid="button-status-lost"
                >
                  <XCircle className="h-4 w-4 mr-1" />
                  Lost
                </Button>
                {leadToView.status !== "converted" && (
                  <Button
                    size="sm"
                    onClick={() => {
                      convertToClient(leadToView);
                      setLeadToView(null);
                    }}
                    className="bg-green-600 hover:bg-green-700"
                    data-testid="button-convert-to-client"
                  >
                    <UserPlus className="h-4 w-4 mr-1" />
                    Convert to Client
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!leadToDelete}
        onOpenChange={() => setLeadToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Lead</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this lead? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-red-600 hover:bg-red-700"
              data-testid="button-confirm-delete"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
}
