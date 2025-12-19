import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Helmet } from "react-helmet";
import { Plus, Search, Edit, Trash2, PackageOpen } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import PageHeader from "@/components/page-header";
import { Layout } from "@/components/layout";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Define form schema for suppliers
const supplierFormSchema = z.object({
  name: z.string().min(1, { message: "Name is required" }),
  company: z.string().min(1, { message: "Company is required" }),
  email: z.string().email({ message: "Invalid email address" }).optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z.string().optional(),
  category: z.string().min(1, { message: "Category is required" }),
  contactName: z.string().optional(),
  notes: z.string().optional()
});

type SupplierFormValues = z.infer<typeof supplierFormSchema>;

// Categories for suppliers
const SUPPLIER_CATEGORIES = [
  "Paint supplies",
  "Equipment",
  "Tools",
  "Safety equipment",
  "Office supplies",
  "Other"
];

export default function Suppliers() {
  const [search, setSearch] = useState<string>("");
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [openDialog, setOpenDialog] = useState<boolean>(false);
  const [editingSupplierId, setEditingSupplierId] = useState<number | null>(null);
  const { toast } = useToast();

  // Form setup
  const form = useForm<SupplierFormValues>({
    resolver: zodResolver(supplierFormSchema),
    defaultValues: {
      name: "",
      company: "",
      email: "",
      phone: "",
      address: "",
      category: "",
      contactName: "",
      notes: ""
    }
  });

  // Query to get all suppliers
  const { data: suppliers = [], isLoading, refetch } = useQuery({
    queryKey: ['/api/suppliers', categoryFilter],
    queryFn: async () => {
      const url = categoryFilter
        ? `/api/suppliers?category=${encodeURIComponent(categoryFilter)}`
        : '/api/suppliers';
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("Failed to fetch suppliers");
      }
      return response.json();
    }
  });

  // Create supplier mutation
  const createMutation = useMutation({
    mutationFn: async (supplier: SupplierFormValues) => {
      return apiRequest("POST", "/api/suppliers", supplier);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/suppliers'] });
      setOpenDialog(false);
      form.reset();
      toast({
        title: "Success",
        description: "Supplier created successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to create supplier: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Update supplier mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, supplier }: { id: number; supplier: SupplierFormValues }) => {
      return apiRequest("PUT", `/api/suppliers/${id}`, supplier);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/suppliers'] });
      setOpenDialog(false);
      setEditingSupplierId(null);
      form.reset();
      toast({
        title: "Success",
        description: "Supplier updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to update supplier: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Delete supplier mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/suppliers/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/suppliers'] });
      toast({
        title: "Success",
        description: "Supplier deleted successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to delete supplier: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Filter suppliers based on search term
  const filteredSuppliers = suppliers.filter((supplier: any) => {
    const searchMatch = 
      search === "" || 
      supplier.name.toLowerCase().includes(search.toLowerCase()) ||
      (supplier.contactName && supplier.contactName.toLowerCase().includes(search.toLowerCase())) ||
      (supplier.category && supplier.category.toLowerCase().includes(search.toLowerCase()));
    
    const categoryMatch = categoryFilter === "" || categoryFilter === "all" || supplier.category === categoryFilter;
    
    return searchMatch && categoryMatch;
  });

  // Handle form submission
  const onSubmit = (data: SupplierFormValues) => {
    if (editingSupplierId) {
      updateMutation.mutate({ id: editingSupplierId, supplier: data });
    } else {
      createMutation.mutate(data);
    }
  };

  // Open dialog to add new supplier
  const handleAddNew = () => {
    setEditingSupplierId(null);
    form.reset({
      name: "",
      company: "",
      email: "",
      phone: "",
      address: "",
      category: "",
      contactName: "",
      notes: ""
    });
    setOpenDialog(true);
  };

  // Open dialog to edit supplier
  const handleEdit = (supplier: any) => {
    setEditingSupplierId(supplier.id);
    form.reset({
      name: supplier.name,
      company: supplier.company || "",
      email: supplier.email || "",
      phone: supplier.phone || "",
      address: supplier.address || "",
      category: supplier.category,
      contactName: supplier.contactName || "",
      notes: supplier.notes || ""
    });
    setOpenDialog(true);
  };

  // Handle supplier deletion
  const handleDelete = (id: number) => {
    if (window.confirm("Are you sure you want to delete this supplier? This action cannot be undone.")) {
      deleteMutation.mutate(id);
    }
  };

  // Count suppliers by category
  const suppliersByCategory = SUPPLIER_CATEGORIES.map(category => ({
    category,
    count: suppliers.filter((s: any) => s.category === category).length
  }));

  return (
    <Layout title="Suppliers Management">
      <Helmet>
        <title>Suppliers | Dovalina Pro Painters LLC</title>
      </Helmet>

      <PageHeader
        title="Suppliers Management"
        description="Add and manage your suppliers and materials sources."
        actions={
          <Button onClick={handleAddNew}>
            <Plus className="mr-2 h-4 w-4" />
            Add New Supplier
          </Button>
        }
      />

      <Tabs defaultValue="all" className="w-full">
        <div className="flex justify-between items-center mb-4 flex-col md:flex-row gap-4">
          <TabsList>
            <TabsTrigger value="all" onClick={() => setCategoryFilter("all")}>All Suppliers</TabsTrigger>
            <TabsTrigger value="categories">By Category</TabsTrigger>
          </TabsList>

          <div className="relative w-full md:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              type="search"
              placeholder="Search suppliers..."
              className="pl-8"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <TabsContent value="all" className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex justify-between items-center">
                <CardTitle>All Suppliers</CardTitle>
                {categoryFilter && categoryFilter !== "all" && (
                  <Badge className="ml-2" variant="secondary">
                    {categoryFilter}
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-4 w-4 ml-1 p-0" 
                      onClick={() => setCategoryFilter("all")}
                    >
                      &times;
                    </Button>
                  </Badge>
                )}
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {SUPPLIER_CATEGORIES.map((category) => (
                      <SelectItem key={category} value={category}>{category}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <CardDescription>
                {filteredSuppliers.length} suppliers {categoryFilter && categoryFilter !== "all" && `in ${categoryFilter}`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center py-6">
                  <p>Loading suppliers...</p>
                </div>
              ) : filteredSuppliers.length === 0 ? (
                <div className="text-center py-6">
                  <PackageOpen className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-lg font-medium">No suppliers found</h3>
                  <p className="mt-1 text-gray-500">
                    {search || categoryFilter
                      ? "Try adjusting your search or filter criteria"
                      : "Get started by adding your first supplier"}
                  </p>
                  <Button className="mt-4" onClick={handleAddNew}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Supplier
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Contact</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredSuppliers.map((supplier: any) => (
                        <TableRow key={supplier.id}>
                          <TableCell className="font-medium">{supplier.name}</TableCell>
                          <TableCell>
                            {supplier.contactName && (
                              <span className="block text-sm">{supplier.contactName}</span>
                            )}
                            {supplier.email && (
                              <span className="block text-sm text-gray-500">{supplier.email}</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{supplier.category}</Badge>
                          </TableCell>
                          <TableCell>{supplier.phone}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEdit(supplier)}
                            >
                              <Edit className="h-4 w-4" />
                              <span className="sr-only">Edit</span>
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-red-600 hover:text-red-700 hover:bg-red-100"
                              onClick={() => handleDelete(supplier.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                              <span className="sr-only">Delete</span>
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {suppliersByCategory.map(({ category, count }) => (
              <Card
                key={category}
                className={`cursor-pointer hover:shadow-md transition-shadow ${
                  categoryFilter === category ? "ring-2 ring-primary" : ""
                }`}
                onClick={() => {
                  setCategoryFilter(categoryFilter === category ? "all" : category);
                }}
              >
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">{category}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center">
                    <p className="text-2xl font-bold">{count}</p>
                    <Badge variant="outline">{count === 1 ? 'Supplier' : 'Suppliers'}</Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Add/Edit Supplier Dialog */}
      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingSupplierId ? 'Edit Supplier' : 'Add New Supplier'}</DialogTitle>
            <DialogDescription>
              {editingSupplierId
                ? 'Update the supplier information below'
                : 'Fill out the form below to add a new supplier'}
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pb-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name*</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter supplier name" {...field} />
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
                    <FormLabel>Company*</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter company name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="contactName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact Person</FormLabel>
                      <FormControl>
                        <Input placeholder="Contact name" {...field} />
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
                        <Input placeholder="Phone number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="Email address" type="email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category*</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {SUPPLIER_CATEGORIES.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Supplier address" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Additional notes" {...field} />
                    </FormControl>
                    <FormDescription>
                      Additional information about this supplier
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpenDialog(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  {createMutation.isPending || updateMutation.isPending ? (
                    "Saving..."
                  ) : editingSupplierId ? (
                    "Update Supplier"
                  ) : (
                    "Add Supplier"
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}