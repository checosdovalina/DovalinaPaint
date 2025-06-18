import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Edit, Trash2, Phone, Mail, DollarSign } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Subcontractor } from "@shared/schema";

const formSchema = z.object({
  name: z.string().min(1, "Full name is required"),
  company: z.string().optional(),
  specialty: z.string().min(1, "Specialty is required"),
  phone: z.string().min(1, "Phone number is required"),
  email: z.string().email("Invalid email address"),
  address: z.string().min(1, "Address is required"),
  hourlyRate: z.number().min(0, "Rate must be positive"),
  rateType: z.enum(["hourly", "daily", "fixed"]),
  notes: z.string().optional(),
  status: z.enum(["active", "inactive", "blacklisted"]).default("active"),
});

type SubcontractorFormValues = z.infer<typeof formSchema>;

export default function Subcontractors() {
  const [showSubcontractorForm, setShowSubcontractorForm] = useState(false);
  const [subcontractorToEdit, setSubcontractorToEdit] = useState<Subcontractor | null>(null);
  const [subcontractorToDelete, setSubcontractorToDelete] = useState<Subcontractor | null>(null);
  const { toast } = useToast();

  const { data: subcontractors, isLoading } = useQuery<Subcontractor[]>({
    queryKey: ["/api/subcontractors"],
  });

  const form = useForm<SubcontractorFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      company: "",
      specialty: "",
      phone: "",
      email: "",
      address: "",
      hourlyRate: 0,
      rateType: "hourly",
      notes: "",
      status: "active",
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: SubcontractorFormValues) => {
      if (subcontractorToEdit) {
        return apiRequest("PUT", `/api/subcontractors/${subcontractorToEdit.id}`, data);
      } else {
        return apiRequest("POST", "/api/subcontractors", data);
      }
    },
    onSuccess: () => {
      toast({
        title: subcontractorToEdit ? "Subcontractor updated" : "Subcontractor created",
        description: `The subcontractor has been successfully ${subcontractorToEdit ? "updated" : "created"}.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/subcontractors"] });
      handleCloseForm();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Could not ${subcontractorToEdit ? "update" : "create"} subcontractor: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/subcontractors/${id}`),
    onSuccess: () => {
      toast({
        title: "Subcontractor deleted",
        description: "The subcontractor has been successfully deleted.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/subcontractors"] });
      setSubcontractorToDelete(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Could not delete subcontractor: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const handleNewSubcontractor = () => {
    setSubcontractorToEdit(null);
    form.reset({
      name: "",
      company: "",
      specialty: "",
      phone: "",
      email: "",
      address: "",
      hourlyRate: 0,
      rateType: "hourly",
      notes: "",
      status: "active",
    });
    setShowSubcontractorForm(true);
  };

  const handleEditSubcontractor = (subcontractor: Subcontractor) => {
    setSubcontractorToEdit(subcontractor);
    form.reset({
      name: subcontractor.name,
      company: subcontractor.company || "",
      specialty: subcontractor.specialty,
      phone: subcontractor.phone,
      email: subcontractor.email,
      address: subcontractor.address,
      hourlyRate: subcontractor.hourlyRate,
      rateType: subcontractor.rateType,
      notes: subcontractor.notes || "",
      status: subcontractor.status,
    });
    setShowSubcontractorForm(true);
  };

  const handleCloseForm = () => {
    setShowSubcontractorForm(false);
    setSubcontractorToEdit(null);
    form.reset();
  };

  const handleDeleteClick = (subcontractor: Subcontractor) => {
    setSubcontractorToDelete(subcontractor);
  };

  const handleDeleteConfirm = () => {
    if (subcontractorToDelete) {
      deleteMutation.mutate(subcontractorToDelete.id);
    }
  };

  const onSubmit = (data: SubcontractorFormValues) => {
    mutation.mutate(data);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-green-100 text-green-800";
      case "inactive": return "bg-yellow-100 text-yellow-800";
      case "blacklisted": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getRateDisplay = (rate: number, rateType: string) => {
    const formattedRate = rate.toFixed(2);
    switch (rateType) {
      case "hourly": return `$${formattedRate}/hr`;
      case "daily": return `$${formattedRate}/day`;
      case "fixed": return `$${formattedRate}`;
      default: return `$${formattedRate}`;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Subcontractors</h1>
          <p className="text-muted-foreground">
            Manage your subcontractor network and their rates
          </p>
        </div>
        <Button onClick={handleNewSubcontractor}>
          <Plus className="mr-2 h-4 w-4" />
          New Subcontractor
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {subcontractors?.map((subcontractor) => (
          <Card key={subcontractor.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{subcontractor.name}</CardTitle>
                  {subcontractor.company && (
                    <p className="text-sm text-muted-foreground">{subcontractor.company}</p>
                  )}
                </div>
                <Badge className={getStatusColor(subcontractor.status)}>
                  {subcontractor.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium text-primary">{subcontractor.specialty}</p>
                <div className="flex items-center text-sm text-muted-foreground mt-1">
                  <DollarSign className="h-3 w-3 mr-1" />
                  {getRateDisplay(subcontractor.hourlyRate, subcontractor.rateType)}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center text-sm">
                  <Phone className="h-3 w-3 mr-2 text-muted-foreground" />
                  {subcontractor.phone}
                </div>
                <div className="flex items-center text-sm">
                  <Mail className="h-3 w-3 mr-2 text-muted-foreground" />
                  {subcontractor.email}
                </div>
              </div>

              {subcontractor.notes && (
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {subcontractor.notes}
                </p>
              )}

              <div className="flex justify-end space-x-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEditSubcontractor(subcontractor)}
                >
                  <Edit className="h-3 w-3" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDeleteClick(subcontractor)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {(!subcontractors || subcontractors.length === 0) && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No subcontractors found. Create your first one to get started.</p>
        </div>
      )}

      {/* Subcontractor Form Dialog */}
      <Dialog open={showSubcontractorForm} onOpenChange={setShowSubcontractorForm}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {subcontractorToEdit ? "Edit Subcontractor" : "New Subcontractor"}
            </DialogTitle>
            <DialogDescription>
              {subcontractorToEdit
                ? "Modify the subcontractor details as needed"
                : "Complete the form to register a new subcontractor"}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {/* Personal Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input placeholder="John Doe" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="company"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company (optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="ABC Company LLC" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="specialty"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Specialty</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a specialty" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Painter">Painter</SelectItem>
                        <SelectItem value="Electrician">Electrician</SelectItem>
                        <SelectItem value="Plumber">Plumber</SelectItem>
                        <SelectItem value="Carpenter">Carpenter</SelectItem>
                        <SelectItem value="Mason">Mason</SelectItem>
                        <SelectItem value="Designer">Designer</SelectItem>
                        <SelectItem value="Architect">Architect</SelectItem>
                        <SelectItem value="Flooring">Flooring</SelectItem>
                        <SelectItem value="Roofing">Roofing</SelectItem>
                        <SelectItem value="Landscaping">Landscaping</SelectItem>
                        <SelectItem value="Demolition">Demolition</SelectItem>
                        <SelectItem value="General Labor">General Labor</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Contact Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <Input type="tel" placeholder="(555) 123-4567" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Address</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="john@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Full address including city, state, zip" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Rate Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="hourlyRate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Rate Amount ($)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="25.00" 
                          step="0.01"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="rateType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Rate Type</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select rate type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="hourly">Hourly</SelectItem>
                          <SelectItem value="daily">Daily</SelectItem>
                          <SelectItem value="fixed">Fixed Amount</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Additional information about the subcontractor" 
                        className="resize-none" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                        <SelectItem value="blacklisted">Blacklisted</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end space-x-3 pt-4">
                <Button type="button" variant="outline" onClick={handleCloseForm}>
                  Cancel
                </Button>
                <Button type="submit" disabled={mutation.isPending}>
                  {mutation.isPending ? (
                    <>
                      <div className="animate-spin mr-2 h-4 w-4 border-2 border-current border-t-transparent rounded-full"></div>
                      Saving...
                    </>
                  ) : subcontractorToEdit ? "Update" : "Create"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!subcontractorToDelete} onOpenChange={(open) => !open && setSubcontractorToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this subcontractor?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the subcontractor
              {subcontractorToDelete?.name && ` "${subcontractorToDelete.name}"`} and remove their data from the database.
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
    </div>
  );
}