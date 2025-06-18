import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Subcontractor } from "@shared/schema";
import { Layout } from "@/components/layout";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { insertSubcontractorSchema } from "@shared/schema";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Search,
  Plus,
  Mail,
  Phone,
  Edit,
  Trash,
  Home,
  Briefcase,
  Shield,
  DollarSign,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// Extend the schema to handle the form
const formSchema = insertSubcontractorSchema.extend({});

type SubcontractorFormValues = z.infer<typeof formSchema>;

export default function Subcontractors() {
  const [showSubcontractorForm, setShowSubcontractorForm] = useState(false);
  const [subcontractorToEdit, setSubcontractorToEdit] = useState<Subcontractor | null>(null);
  const [subcontractorToDelete, setSubcontractorToDelete] = useState<Subcontractor | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [specialtyFilter, setSpecialtyFilter] = useState("all");
  const { toast } = useToast();

  // Fetch subcontractors
  const { data: subcontractors, isLoading } = useQuery<Subcontractor[]>({
    queryKey: ["/api/subcontractors"],
    queryFn: async () => {
      const res = await fetch("/api/subcontractors");
      if (!res.ok) throw new Error("Failed to fetch subcontractors");
      return res.json();
    },
  });

  const form = useForm<SubcontractorFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      company: "",
      specialty: "",
      email: "",
      phone: "",
      address: "",
      taxId: "",
      insuranceInfo: "",
      rate: undefined,
      rateType: "hourly",
      notes: "",
      status: "active",
    },
  });

  // Reset form when subcontractorToEdit changes
  useEffect(() => {
    if (subcontractorToEdit) {
      form.reset({
        name: subcontractorToEdit.name,
        company: subcontractorToEdit.company || "",
        specialty: subcontractorToEdit.specialty,
        email: subcontractorToEdit.email || "",
        phone: subcontractorToEdit.phone,
        address: subcontractorToEdit.address || "",
        taxId: subcontractorToEdit.taxId || "",
        insuranceInfo: subcontractorToEdit.insuranceInfo || "",
        rate: subcontractorToEdit.rate,
        rateType: subcontractorToEdit.rateType || "hourly",
        notes: subcontractorToEdit.notes || "",
        status: subcontractorToEdit.status,
      });
    } else {
      form.reset({
        name: "",
        company: "",
        specialty: "",
        email: "",
        phone: "",
        address: "",
        taxId: "",
        insuranceInfo: "",
        rate: undefined,
        rateType: "hourly",
        notes: "",
        status: "active",
      });
    }
  }, [subcontractorToEdit, form]);

  const mutation = useMutation({
    mutationFn: async (data: SubcontractorFormValues) => {
      if (subcontractorToEdit?.id) {
        // Update
        return apiRequest("PUT", `/api/subcontractors/${subcontractorToEdit.id}`, data);
      } else {
        // Create
        return apiRequest("POST", "/api/subcontractors", data);
      }
    },
    onSuccess: () => {
      toast({
        title: subcontractorToEdit?.id
          ? "Subcontratista actualizado"
          : "Subcontratista creado",
        description: subcontractorToEdit?.id
          ? "El subcontratista ha sido actualizado exitosamente"
          : "El subcontratista ha sido añadido exitosamente",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/subcontractors"] });
      handleCloseForm();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `No se pudo ${subcontractorToEdit?.id ? "actualizar" : "crear"} el subcontratista: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const handleEditSubcontractor = (subcontractor: Subcontractor) => {
    setSubcontractorToEdit(subcontractor);
    setShowSubcontractorForm(true);
  };

  const handleNewSubcontractor = () => {
    setSubcontractorToEdit(null);
    setShowSubcontractorForm(true);
  };

  const handleCloseForm = () => {
    setShowSubcontractorForm(false);
    setSubcontractorToEdit(null);
  };

  const handleDeleteClick = (subcontractor: Subcontractor) => {
    setSubcontractorToDelete(subcontractor);
  };

  const handleDeleteConfirm = async () => {
    if (!subcontractorToDelete) return;

    try {
      await apiRequest("DELETE", `/api/subcontractors/${subcontractorToDelete.id}`, undefined);
      
      toast({
        title: "Subcontractor Deleted",
        description: "The subcontractor has been successfully deleted",
      });
      
      queryClient.invalidateQueries({ queryKey: ["/api/subcontractors"] });
    } catch (error) {
      toast({
        title: "Error",
        description: `No se pudo eliminar el subcontratista: ${(error as Error).message}`,
        variant: "destructive",
      });
    } finally {
      setSubcontractorToDelete(null);
    }
  };

  const onSubmit = (data: SubcontractorFormValues) => {
    mutation.mutate(data);
  };

  // Get unique specialties for filter
  const uniqueSpecialties = subcontractors 
    ? Array.from(new Set(subcontractors.map(s => s.specialty)))
    : [];

  // Filter subcontractors
  const filteredSubcontractors = subcontractors?.filter(subcontractor => {
    // Filter by specialty
    if (specialtyFilter !== "all" && subcontractor.specialty !== specialtyFilter) {
      return false;
    }
    
    // Filter by search term
    if (searchTerm) {
      const searchTermLower = searchTerm.toLowerCase();
      return (
        subcontractor.name.toLowerCase().includes(searchTermLower) ||
        (subcontractor.company && subcontractor.company.toLowerCase().includes(searchTermLower)) ||
        subcontractor.specialty.toLowerCase().includes(searchTermLower) ||
        (subcontractor.email && subcontractor.email.toLowerCase().includes(searchTermLower)) ||
        subcontractor.phone.toLowerCase().includes(searchTermLower)
      );
    }
    
    return true;
  });

  // Helper to get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-100 text-green-800">Activo</Badge>;
      case "inactive":
        return <Badge className="bg-gray-100 text-gray-800">Inactivo</Badge>;
      case "blacklisted":
        return <Badge className="bg-red-100 text-red-800">Lista Negra</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Helper function to format rate display
  const formatRate = (rate: number | null | undefined, rateType: string) => {
    if (!rate) return "No especificado";
    
    const formatter = new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    });
    
    const formattedRate = formatter.format(rate);
    
    switch (rateType) {
      case "hourly":
        return `${formattedRate}/hora`;
      case "daily":
        return `${formattedRate}/día`;
      case "fixed":
        return `${formattedRate} (fijo)`;
      default:
        return formattedRate;
    }
  };

  return (
    <Layout title="Subcontratistas">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-2 w-full max-w-md">
          <div className="relative w-full">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar subcontratistas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
          <Select
            value={specialtyFilter}
            onValueChange={setSpecialtyFilter}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Especialidad" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              {uniqueSpecialties.map((specialty) => (
                <SelectItem key={specialty} value={specialty}>
                  {specialty}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button onClick={handleNewSubcontractor}>
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Subcontratista
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
        </div>
      ) : filteredSubcontractors && filteredSubcontractors.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSubcontractors.map((subcontractor) => (
            <Card key={subcontractor.id} className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{subcontractor.name}</CardTitle>
                    <p className="text-sm text-gray-500">
                      {subcontractor.company ? subcontractor.company : "Independiente"}
                    </p>
                  </div>
                  {getStatusBadge(subcontractor.status)}
                </div>
              </CardHeader>
              <CardContent className="pb-2 space-y-2">
                <div className="flex items-center text-sm">
                  <Briefcase className="h-4 w-4 mr-2 text-gray-400" />
                  <span>{subcontractor.specialty}</span>
                </div>
                
                {subcontractor.email && (
                  <div className="flex items-center text-sm">
                    <Mail className="h-4 w-4 mr-2 text-gray-400" />
                    <span>{subcontractor.email}</span>
                  </div>
                )}
                
                <div className="flex items-center text-sm">
                  <Phone className="h-4 w-4 mr-2 text-gray-400" />
                  <span>{subcontractor.phone}</span>
                </div>
                
                {subcontractor.address && (
                  <div className="flex items-center text-sm">
                    <Home className="h-4 w-4 mr-2 text-gray-400" />
                    <span>{subcontractor.address}</span>
                  </div>
                )}

                {subcontractor.rate && (
                  <div className="flex items-center text-sm">
                    <DollarSign className="h-4 w-4 mr-2 text-gray-400" />
                    <span>{formatRate(subcontractor.rate, subcontractor.rateType || "hourly")}</span>
                  </div>
                )}
                
                {subcontractor.insuranceInfo && (
                  <div className="flex items-center text-sm">
                    <Shield className="h-4 w-4 mr-2 text-gray-400" />
                    <span>{subcontractor.insuranceInfo}</span>
                  </div>
                )}
              </CardContent>
              <CardFooter className="pt-2 flex justify-end space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  onClick={() => handleDeleteClick(subcontractor)}
                >
                  <Trash className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEditSubcontractor(subcontractor)}
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Editar
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 text-gray-500">
          {searchTerm || specialtyFilter !== "all"
            ? "No se encontraron subcontratistas con los filtros aplicados"
            : "No hay subcontratistas registrados. Cree uno nuevo haciendo clic en 'Nuevo Subcontratista'"}
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
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                    >
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
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="email@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone</FormLabel>
                      <FormControl>
                        <Input placeholder="555-1234" {...field} />
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
                      <Input placeholder="Street, City, State, ZIP" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="taxId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tax ID</FormLabel>
                      <FormControl>
                        <Input placeholder="123-45-6789" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="insuranceInfo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Insurance Information</FormLabel>
                      <FormControl>
                        <Input placeholder="Policy #12345" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="rate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Rate</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="0.00" 
                          step="0.01"
                          onChange={(e) => {
                            const value = e.target.value ? parseFloat(e.target.value) : undefined;
                            field.onChange(value);
                          }}
                          value={field.value === undefined ? "" : field.value}
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
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
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
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                    >
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

              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCloseForm}
                >
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
    </Layout>
  );
}