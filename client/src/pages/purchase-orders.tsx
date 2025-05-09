import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { PurchaseOrder as PurchaseOrderType, insertPurchaseOrderSchema } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";

import { Layout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PageHeader from "@/components/page-header";
import { 
  PlusCircle, 
  FileText, 
  ShoppingBag, 
  Search,
  Download,
  Trash,
  Edit,
  Plus
} from "lucide-react";

// Purchase Order Form schema
const purchaseOrderFormSchema = insertPurchaseOrderSchema.extend({
  items: z.array(z.object({
    description: z.string().min(1, "Description is required"),
    quantity: z.string().min(1, "Quantity is required"),
    unit: z.string().min(1, "Unit is required"),
    price: z.string().min(1, "Price is required"),
  })),
  projectId: z.number().optional(),
  quoteId: z.number().optional(),
});

type PurchaseOrderFormValues = z.infer<typeof purchaseOrderFormSchema>;

// Purchase Order Detail component
const PurchaseOrderDetail = ({ purchaseOrder }: { purchaseOrder: PurchaseOrderType }) => {
  const { toast } = useToast();

  // Format date function
  const formatDate = (dateString: string | Date | null) => {
    if (!dateString) return "-";
    return format(new Date(dateString), "MMM d, yyyy");
  };

  // Function to download PDF
  const handleDownloadPDF = () => {
    toast({
      title: "PDF Download",
      description: "Purchase Order PDF download functionality will be implemented soon",
    });
  };

  // Calculate totals
  const calculateTotal = () => {
    let total = 0;
    if (purchaseOrder.items) {
      purchaseOrder.items.forEach(item => {
        total += Number(item.price) * Number(item.quantity);
      });
    }
    return total.toFixed(2);
  };

  return (
    <Card className="w-full">
      <CardHeader className="bg-muted/50">
        <div className="flex justify-between items-center">
          <CardTitle className="text-xl">
            Purchase Order: {purchaseOrder.orderNumber}
          </CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleDownloadPDF}>
              <Download className="h-4 w-4 mr-2" />
              Download PDF
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-semibold mb-3">Supplier Information</h3>
            <p className="text-sm text-muted-foreground mb-1">
              <span className="font-medium">Supplier:</span> {purchaseOrder.supplierName || "Not specified"}
            </p>
            <p className="text-sm text-muted-foreground mb-1">
              <span className="font-medium">Contact:</span> {purchaseOrder.supplierContact || "Not specified"}
            </p>
            <p className="text-sm text-muted-foreground mb-1">
              <span className="font-medium">Phone:</span> {purchaseOrder.supplierPhone || "Not specified"}
            </p>
            <p className="text-sm text-muted-foreground mb-1">
              <span className="font-medium">Email:</span> {purchaseOrder.supplierEmail || "Not specified"}
            </p>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-3">Order Details</h3>
            <p className="text-sm text-muted-foreground mb-1">
              <span className="font-medium">Issue Date:</span> {formatDate(purchaseOrder.issueDate)}
            </p>
            <p className="text-sm text-muted-foreground mb-1">
              <span className="font-medium">Expected Delivery:</span> {formatDate(purchaseOrder.expectedDeliveryDate)}
            </p>
            <p className="text-sm text-muted-foreground mb-1">
              <span className="font-medium">Delivery Address:</span> {purchaseOrder.deliveryAddress}
            </p>
            <p className="text-sm text-muted-foreground mb-1">
              <span className="font-medium">Payment Terms:</span> {purchaseOrder.paymentTerms || "Not specified"}
            </p>
          </div>
        </div>

        <Separator className="my-6" />

        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3">Order Items</h3>
          
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Description</TableHead>
                  <TableHead className="w-[100px] text-right">Quantity</TableHead>
                  <TableHead className="w-[100px] text-right">Unit</TableHead>
                  <TableHead className="w-[120px] text-right">Price</TableHead>
                  <TableHead className="w-[120px] text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {purchaseOrder.items && purchaseOrder.items.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell>{item.description}</TableCell>
                    <TableCell className="text-right">{item.quantity}</TableCell>
                    <TableCell className="text-right">{item.unit}</TableCell>
                    <TableCell className="text-right">${parseFloat(item.price).toFixed(2)}</TableCell>
                    <TableCell className="text-right">
                      ${(parseFloat(item.price) * parseFloat(item.quantity)).toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow>
                  <TableCell colSpan={4} className="text-right font-semibold">
                    Total:
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    ${calculateTotal()}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </div>

        <Separator className="my-6" />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-semibold mb-3">Delivery Conditions</h3>
            <p className="text-sm whitespace-pre-line">
              {purchaseOrder.deliveryConditions || "No specific delivery conditions specified."}
            </p>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-3">Approval</h3>
            {purchaseOrder.approvalSignature ? (
              <div className="border rounded p-3">
                <p className="text-sm mb-2">Signed by: {purchaseOrder.approvalSignature}</p>
                <p className="text-sm mb-2">Date: {formatDate(purchaseOrder.approvalDate)}</p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                This purchase order has not been approved yet.
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Purchase Order Form component
const PurchaseOrderForm = ({
  isOpen,
  onClose,
  onSuccess,
  editingPurchaseOrder,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editingPurchaseOrder?: PurchaseOrderType;
}) => {
  const { toast } = useToast();
  const [items, setItems] = useState(
    editingPurchaseOrder?.items || [{ description: "", quantity: "1", unit: "", price: "0" }]
  );
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(
    editingPurchaseOrder?.projectId || null
  );

  // Query suppliers
  const { data: suppliers = [] } = useQuery({
    queryKey: ["/api/suppliers"],
    enabled: isOpen,
  });

  // Query projects
  const { data: projects = [] } = useQuery({
    queryKey: ["/api/projects"],
    enabled: isOpen,
  });
  
  // Query quote for selected project
  const { data: projectQuote } = useQuery({
    queryKey: ["/api/projects", selectedProjectId, "quote"],
    queryFn: async () => {
      if (!selectedProjectId || selectedProjectId === 0) return null;
      try {
        const res = await apiRequest("GET", `/api/projects/${selectedProjectId}/quote`);
        return await res.json();
      } catch (error) {
        console.error("Error fetching project quote:", error);
        return null;
      }
    },
    enabled: !!selectedProjectId && selectedProjectId > 0,
  });

  // Form configuration
  const form = useForm<PurchaseOrderFormValues>({
    resolver: zodResolver(purchaseOrderFormSchema),
    defaultValues: editingPurchaseOrder
      ? {
          ...editingPurchaseOrder,
          items: editingPurchaseOrder.items || [],
          issueDate: editingPurchaseOrder.issueDate
            ? format(new Date(editingPurchaseOrder.issueDate), "yyyy-MM-dd")
            : format(new Date(), "yyyy-MM-dd"),
          expectedDeliveryDate: editingPurchaseOrder.expectedDeliveryDate
            ? format(new Date(editingPurchaseOrder.expectedDeliveryDate), "yyyy-MM-dd")
            : "",
        }
      : {
          supplierId: 0,
          orderNumber: `PO-${Date.now().toString().slice(-6)}`,
          issueDate: format(new Date(), "yyyy-MM-dd"),
          expectedDeliveryDate: "",
          deliveryAddress: "",
          deliveryConditions: "",
          paymentTerms: "Net 30",
          items: [{ description: "", quantity: "1", unit: "", price: "0" }],
        },
  });

  // Add item to order
  const addItem = () => {
    setItems([...items, { description: "", quantity: "1", unit: "", price: "0" }]);
  };

  // Remove item from order
  const removeItem = (index: number) => {
    const newItems = [...items];
    newItems.splice(index, 1);
    setItems(newItems);
  };

  // Calculate total
  const calculateTotal = () => {
    return items.reduce((sum, item) => {
      return sum + (parseFloat(item.price || "0") * parseFloat(item.quantity || "0"));
    }, 0).toFixed(2);
  };

  // Handle form submission
  const createMutation = useMutation({
    mutationFn: async (data: PurchaseOrderFormValues) => {
      const url = editingPurchaseOrder
        ? `/api/purchase-orders/${editingPurchaseOrder.id}`
        : "/api/purchase-orders";
      const method = editingPurchaseOrder ? "PATCH" : "POST";
      const res = await apiRequest(method, url, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/purchase-orders"] });
      toast({
        title: `Purchase Order ${editingPurchaseOrder ? "Updated" : "Created"}`,
        description: `The purchase order has been successfully ${
          editingPurchaseOrder ? "updated" : "created"
        }.`,
      });
      onSuccess();
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to ${editingPurchaseOrder ? "update" : "create"} purchase order: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: PurchaseOrderFormValues) => {
    // Update the items with current state before submitting
    const formData = {
      ...data,
      items: items,
    };
    createMutation.mutate(formData);
  };

  // Update items when form values change
  const updateItemField = (index: number, field: string, value: string) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };
  
  // Load materials from quote when available
  useEffect(() => {
    if (!projectQuote) return;
    
    try {
      // Handle different ways materials might be stored
      let materials;
      if (projectQuote.materials_estimate) {
        materials = typeof projectQuote.materials_estimate === 'string' 
          ? JSON.parse(projectQuote.materials_estimate) 
          : projectQuote.materials_estimate;
      } else if (projectQuote.materials) {
        materials = typeof projectQuote.materials === 'string' 
          ? JSON.parse(projectQuote.materials) 
          : projectQuote.materials;
      }
          
      if (Array.isArray(materials) && materials.length > 0) {
        // Convert quote materials to purchase order items format
        const materialItems = materials.map(material => ({
          description: material.name || "",
          quantity: material.quantity?.toString() || "1",
          unit: material.unit || "unit",
          price: material.unitPrice?.toString() || "0"
        }));
        
        // Ask user before replacing existing items if there are any non-empty ones
        const hasNonEmptyItems = items.some(item => 
          item.description.trim() !== "" && 
          item.description !== "0" && 
          parseFloat(item.price) > 0
        );
        
        if (hasNonEmptyItems) {
          if (confirm("Would you like to load materials from the associated quote? This will replace your current items.")) {
            setItems(materialItems);
          }
        } else {
          // If no substantive items exist, just load the materials
          setItems(materialItems);
          
          toast({
            title: "Materials Loaded",
            description: `${materialItems.length} materials loaded from the quote.`,
          });
        }
      }
    } catch (error) {
      console.error("Error processing materials from quote:", error);
      toast({
        title: "Error Loading Materials",
        description: "Could not load materials from the quote. Please add them manually.",
        variant: "destructive",
      });
    }
  }, [projectQuote, toast, items]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editingPurchaseOrder ? "Edit Purchase Order" : "Create New Purchase Order"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="supplierId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Supplier*</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(parseInt(value))}
                      defaultValue={field.value?.toString()}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select supplier" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {suppliers.map((supplier) => (
                          <SelectItem key={supplier.id} value={supplier.id.toString()}>
                            {supplier.name}
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
                name="orderNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Order Number*</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="issueDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Issue Date*</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="expectedDeliveryDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Expected Delivery Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="projectId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Project (Optional)</FormLabel>
                    <Select
                      onValueChange={(value) => {
                        const projectId = parseInt(value);
                        field.onChange(projectId);
                        setSelectedProjectId(projectId);
                      }}
                      defaultValue={field.value?.toString()}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select project" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="0">None</SelectItem>
                        {projects.map((project) => (
                          <SelectItem key={project.id} value={project.id.toString()}>
                            {project.title}
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
                name="paymentTerms"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payment Terms</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="deliveryAddress"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Delivery Address*</FormLabel>
                  <FormControl>
                    <Textarea rows={2} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div>
              <Label>Order Items*</Label>
              <div className="border rounded-md p-4 mt-2">
                <div className="space-y-4">
                  {items.map((item, index) => (
                    <div key={index} className="grid grid-cols-12 gap-2 items-start">
                      <div className="col-span-5">
                        <Label htmlFor={`item-${index}-description`}>Description</Label>
                        <Input
                          id={`item-${index}-description`}
                          value={item.description}
                          onChange={(e) => updateItemField(index, "description", e.target.value)}
                          className="mt-1"
                        />
                      </div>
                      <div className="col-span-2">
                        <Label htmlFor={`item-${index}-quantity`}>Quantity</Label>
                        <Input
                          id={`item-${index}-quantity`}
                          type="number"
                          min="1"
                          step="1"
                          value={item.quantity}
                          onChange={(e) => updateItemField(index, "quantity", e.target.value)}
                          className="mt-1"
                        />
                      </div>
                      <div className="col-span-2">
                        <Label htmlFor={`item-${index}-unit`}>Unit</Label>
                        <Input
                          id={`item-${index}-unit`}
                          value={item.unit}
                          onChange={(e) => updateItemField(index, "unit", e.target.value)}
                          className="mt-1"
                        />
                      </div>
                      <div className="col-span-2">
                        <Label htmlFor={`item-${index}-price`}>Price ($)</Label>
                        <Input
                          id={`item-${index}-price`}
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.price}
                          onChange={(e) => updateItemField(index, "price", e.target.value)}
                          className="mt-1"
                        />
                      </div>
                      <div className="col-span-1 pt-6">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="mt-1 text-destructive"
                          onClick={() => removeItem(index)}
                          disabled={items.length <= 1}
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex justify-between mt-4">
                  <Button type="button" variant="outline" onClick={addItem} size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Item
                  </Button>
                  <div className="text-right">
                    <span className="text-sm font-medium">Total: ${calculateTotal()}</span>
                  </div>
                </div>
              </div>
            </div>

            <FormField
              control={form.control}
              name="deliveryConditions"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Delivery Conditions</FormLabel>
                  <FormControl>
                    <Textarea rows={3} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? "Saving..." : "Save Purchase Order"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

// Main Purchase Orders Page component
export default function PurchaseOrders() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPurchaseOrder, setSelectedPurchaseOrder] = useState<PurchaseOrderType | null>(null);
  const [editingPurchaseOrder, setEditingPurchaseOrder] = useState<PurchaseOrderType | undefined>(
    undefined
  );
  const { toast } = useToast();

  // Fetch purchase orders
  const { data: purchaseOrders = [], isLoading } = useQuery({
    queryKey: ["/api/purchase-orders"],
  });

  // Delete purchase order mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/purchase-orders/${id}`);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/purchase-orders"] });
      toast({
        title: "Purchase Order Deleted",
        description: "The purchase order has been successfully deleted.",
      });
      setSelectedPurchaseOrder(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to delete purchase order: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Handle purchase order selection
  const handleSelectPurchaseOrder = (purchaseOrder: PurchaseOrderType) => {
    setSelectedPurchaseOrder(purchaseOrder);
  };

  // Handle create new purchase order
  const handleCreateNew = () => {
    setEditingPurchaseOrder(undefined);
    setIsFormOpen(true);
  };

  // Handle edit purchase order
  const handleEdit = (purchaseOrder: PurchaseOrderType) => {
    setEditingPurchaseOrder(purchaseOrder);
    setIsFormOpen(true);
  };

  // Handle delete purchase order
  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this purchase order?")) {
      deleteMutation.mutate(id);
    }
  };

  // Filter purchase orders by search query
  const filteredPurchaseOrders = searchQuery
    ? purchaseOrders.filter(
        (po) =>
          po.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
          po.supplierName?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : purchaseOrders;

  // Format date
  const formatDate = (dateString: string | Date | null) => {
    if (!dateString) return "-";
    return format(new Date(dateString), "MMM d, yyyy");
  };

  return (
    <Layout>
      <PageHeader
        title="Purchase Orders"
        description="Manage purchase orders to suppliers"
        actions={
        <Button onClick={handleCreateNew}>
          <PlusCircle className="h-4 w-4 mr-2" />
          New Purchase Order
        </Button>}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <Card className="h-full">
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <CardTitle>Purchase Orders</CardTitle>
                <div className="relative w-full sm:w-auto">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search..."
                    className="pl-8 w-full sm:w-[180px]"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="h-[calc(100vh-13rem)] overflow-auto">
              {isLoading ? (
                <div className="flex justify-center items-center h-[200px]">
                  <p className="text-muted-foreground">Loading purchase orders...</p>
                </div>
              ) : filteredPurchaseOrders.length > 0 ? (
                <div className="space-y-2">
                  {filteredPurchaseOrders.map((po) => (
                    <div
                      key={po.id}
                      className={`p-3 rounded-md cursor-pointer border transition-colors ${
                        selectedPurchaseOrder?.id === po.id
                          ? "border-primary bg-primary/5"
                          : "hover:bg-muted"
                      }`}
                      onClick={() => handleSelectPurchaseOrder(po)}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium">{po.orderNumber}</h3>
                          <p className="text-sm text-muted-foreground">
                            {po.supplierName || "Unknown supplier"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Issued: {formatDate(po.issueDate)}
                          </p>
                        </div>
                        <div className="flex">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEdit(po);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                            <span className="sr-only">Edit</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(po.id);
                            }}
                          >
                            <Trash className="h-4 w-4" />
                            <span className="sr-only">Delete</span>
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-[200px] text-center">
                  <FileText className="h-8 w-8 mb-2 text-muted-foreground" />
                  <p className="text-muted-foreground">
                    {searchQuery
                      ? "No purchase orders match your search"
                      : "No purchase orders found"}
                  </p>
                  {searchQuery ? (
                    <Button
                      variant="link"
                      className="mt-2"
                      onClick={() => setSearchQuery("")}
                    >
                      Clear search
                    </Button>
                  ) : (
                    <Button variant="link" className="mt-2" onClick={handleCreateNew}>
                      Create your first purchase order
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-2">
          {selectedPurchaseOrder ? (
            <PurchaseOrderDetail purchaseOrder={selectedPurchaseOrder} />
          ) : (
            <Card className="h-full flex flex-col items-center justify-center text-center p-8">
              <ShoppingBag className="h-10 w-10 mb-4 text-primary/60" />
              <h2 className="text-xl font-semibold mb-2">No Purchase Order Selected</h2>
              <p className="text-muted-foreground mb-4 max-w-md">
                Select a purchase order from the list to view details or create a new
                purchase order to get started.
              </p>
              <Button onClick={handleCreateNew}>
                <PlusCircle className="h-4 w-4 mr-2" />
                Create New Purchase Order
              </Button>
            </Card>
          )}
        </div>
      </div>

      {/* Purchase Order Form Dialog */}
      {isFormOpen && (
        <PurchaseOrderForm
          isOpen={isFormOpen}
          onClose={() => setIsFormOpen(false)}
          onSuccess={() => queryClient.invalidateQueries({ queryKey: ["/api/purchase-orders"] })}
          editingPurchaseOrder={editingPurchaseOrder}
        />
      )}
    </Layout>
  );
}