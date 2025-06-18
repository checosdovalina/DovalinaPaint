import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useForm, FieldValues } from "react-hook-form";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Edit, Trash2, FileText, DollarSign, Calendar, User } from "lucide-react";
import type { Client, Project, Quote } from "@shared/schema";
import { Layout } from "@/components/layout";

// Schema para validación de facturas
const invoiceFormSchema = z.object({
  clientId: z.number(),
  projectId: z.number().optional(),
  quoteId: z.number().optional(),
  issueDate: z.string(),
  dueDate: z.string(),
  totalAmount: z.number(),
  status: z.string().default("draft"),
  notes: z.string().optional(),
});

type InvoiceFormValues = z.infer<typeof invoiceFormSchema>;

interface Invoice {
  id: number;
  clientId: number;
  projectId?: number;
  quoteId?: number;
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  totalAmount: number;
  status: string;
  notes?: string;
  items: InvoiceItem[];
  createdAt: string;
}

interface InvoiceItem {
  id?: number;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
  discount?: number;
}

// Componente para crear/editar facturas
const InvoiceForm = ({ 
  open, 
  onClose, 
  onSuccess, 
  editingInvoice 
}: { 
  open: boolean; 
  onClose: () => void; 
  onSuccess: () => void; 
  editingInvoice?: Invoice;
}) => {
  const { toast } = useToast();
  const [selectedClientId, setSelectedClientId] = useState<number | null>(editingInvoice?.clientId || null);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(editingInvoice?.projectId || null);
  const [selectedQuoteId, setSelectedQuoteId] = useState<number | null>(editingInvoice?.quoteId || null);
  const [showCreateClient, setShowCreateClient] = useState(false);
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [items, setItems] = useState<InvoiceItem[]>(editingInvoice?.items || [{
    description: "Material 1",
    quantity: 25,
    unitPrice: 0,
    total: 0,
    discount: 0
  }, {
    description: "Mano de obra 1",
    quantity: 5008,
    unitPrice: 0,
    total: 0,
    discount: 0
  }]);
  const [baseAmount, setBaseAmount] = useState<number>(0);
  const [globalDiscount, setGlobalDiscount] = useState<number>(0);

  // Efecto para recalcular el total cuando cambien los items o descuento global
  useEffect(() => {
    const timer = setTimeout(() => {
      calculateTotal();
    }, 100);
    return () => clearTimeout(timer);
  }, [items, globalDiscount]);

  // Consultas para obtener datos
  const { data: clients } = useQuery({ queryKey: ["/api/clients"] });
  const { data: projects } = useQuery({ queryKey: ["/api/projects"] });
  const { data: quotes } = useQuery({ queryKey: ["/api/quotes"] });

  const form = useForm<InvoiceFormValues>({
    resolver: zodResolver(invoiceFormSchema),
    defaultValues: {
      clientId: editingInvoice?.clientId || 0,
      projectId: editingInvoice?.projectId || undefined,
      quoteId: editingInvoice?.quoteId || undefined,
      issueDate: editingInvoice?.issueDate || new Date().toISOString().split('T')[0],
      dueDate: editingInvoice?.dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      totalAmount: editingInvoice?.totalAmount || 0,
      status: editingInvoice?.status || "draft",
      notes: editingInvoice?.notes || "",
    },
  });

  // Mutación para crear cliente
  const createClientMutation = useMutation({
    mutationFn: async (clientData: { 
      name: string; 
      email: string; 
      phone?: string; 
      address?: string 
    }) => {
      const res = await apiRequest("POST", "/api/clients", clientData);
      return await res.json();
    },
    onSuccess: (newClient) => {
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      setSelectedClientId(newClient.id);
      form.setValue("clientId", newClient.id);
      setShowCreateClient(false);
      toast({
        title: "Client Created",
        description: `${newClient.name} has been created successfully.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Error creating client: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Mutación para crear proyecto
  const createProjectMutation = useMutation({
    mutationFn: async (projectData: { 
      clientId: number; 
      title: string; 
      description: string; 
      address: string; 
      serviceType: string 
    }) => {
      const res = await apiRequest("POST", "/api/projects", projectData);
      return await res.json();
    },
    onSuccess: (newProject) => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      setSelectedProjectId(newProject.id);
      form.setValue("projectId", newProject.id);
      setShowCreateProject(false);
      toast({
        title: "Project Created",
        description: `${newProject.title} has been created successfully.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Error creating project: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Function to load quote data when selected
  const loadQuoteData = (quoteId: number) => {
    const quote = Array.isArray(quotes) ? quotes.find((q: Quote) => q.id === quoteId) : null;
    if (quote) {
      // Load quote elements as invoice items
      const quoteItems: InvoiceItem[] = [];
      
      // Add materials from quote
      if (quote.materialsEstimate && Array.isArray(quote.materialsEstimate)) {
        quote.materialsEstimate.forEach((material: any, index: number) => {
          const quantity = parseFloat(material.quantity) || 1;
          const unitPrice = parseFloat(material.unitPrice) || parseFloat(material.cost) || 0;
          quoteItems.push({
            id: index + 1,
            description: material.item || material.description || `Material ${index + 1}`,
            quantity: quantity,
            unitPrice: unitPrice,
            total: quantity * unitPrice,
            discount: 0
          });
        });
      }

      // Agregar mano de obra del presupuesto
      if (quote.laborEstimate && Array.isArray(quote.laborEstimate)) {
        quote.laborEstimate.forEach((labor: any, index: number) => {
          const quantity = parseFloat(labor.hours) || 1;
          const unitPrice = parseFloat(labor.hourlyRate) || parseFloat(labor.rate) || 0;
          quoteItems.push({
            id: quoteItems.length + index + 1,
            description: labor.task || labor.description || `Mano de obra ${index + 1}`,
            quantity: quantity,
            unitPrice: unitPrice,
            total: quantity * unitPrice,
            discount: 0
          });
        });
      }

      // Si no hay elementos específicos, crear uno por defecto con el total del presupuesto
      if (quoteItems.length === 0) {
        quoteItems.push({
          description: "Servicio de pintura",
          quantity: 1,
          unitPrice: parseFloat(quote.totalEstimate) || 0,
          total: parseFloat(quote.totalEstimate) || 0,
          discount: 0
        });
      }

      setItems(quoteItems);
      setBaseAmount(parseFloat(quote.totalEstimate) || 0);
      
      // Calcular el total después de establecer los items
      setTimeout(() => {
        calculateTotal();
      }, 100);
    }
  };

  // Función para calcular el total de la factura
  const calculateTotal = () => {
    const itemsTotal = items.reduce((sum, item) => {
      const itemTotal = (item.quantity * item.unitPrice) - (item.discount || 0);
      return sum + itemTotal;
    }, 0);
    const finalTotal = Math.max(0, itemsTotal - globalDiscount);
    form.setValue("totalAmount", finalTotal);
    return finalTotal;
  };

  // Función para agregar nuevo item
  const addItem = () => {
    setItems([...items, {
      description: "",
      quantity: 1,
      unitPrice: 0,
      total: 0,
      discount: 0
    }]);
  };

  // Función para actualizar item
  const updateItem = (index: number, field: keyof InvoiceItem, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    
    // Recalcular el total del item cuando cambia cantidad o precio unitario
    if (field === 'quantity' || field === 'unitPrice') {
      const quantity = field === 'quantity' ? value : newItems[index].quantity;
      const unitPrice = field === 'unitPrice' ? value : newItems[index].unitPrice;
      newItems[index].total = quantity * unitPrice;
    }
    
    setItems(newItems);
  };

  // Función para eliminar item
  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  // Mutación para crear/actualizar factura
  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const url = editingInvoice
        ? `/api/invoices/${editingInvoice.id}`
        : "/api/invoices";
      const method = editingInvoice ? "PATCH" : "POST";
      const res = await apiRequest(method, url, { ...data, items });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      toast({
        title: `Factura ${editingInvoice ? "Actualizada" : "Creada"}`,
        description: `La factura ha sido ${editingInvoice ? "actualizada" : "creada"} exitosamente.`,
      });
      onSuccess();
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Error ${editingInvoice ? "updating" : "creating"} invoice: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InvoiceFormValues) => {
    // Validate that there is at least one item with description
    if (items.length === 0 || items.every(item => !item.description.trim())) {
      toast({
        title: "Validation Error",
        description: "You must add at least one item to the invoice",
        variant: "destructive",
      });
      return;
    }

    const finalTotal = calculateTotal();
    createMutation.mutate({ 
      ...data, 
      amount: finalTotal,
      totalAmount: finalTotal,
      items: items.filter(item => item.description.trim())
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editingInvoice ? "Edit Invoice" : "New Invoice"}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Client Selection */}
              <div className="space-y-2">
                <FormLabel>Client*</FormLabel>
                <div className="flex gap-2">
                  <Select
                    value={selectedClientId?.toString() || ""}
                    onValueChange={(value) => {
                      if (value === "create") {
                        setShowCreateClient(true);
                      } else {
                        const clientId = parseInt(value);
                        setSelectedClientId(clientId);
                        form.setValue("clientId", clientId);
                      }
                    }}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Select client" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="create">+ Create new client</SelectItem>
                      {Array.isArray(clients) && clients.map((client: Client) => (
                        <SelectItem key={client.id} value={client.id.toString()}>
                          {client.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Project Selection */}
              <div className="space-y-2">
                <FormLabel>Project (Optional)</FormLabel>
                <div className="flex gap-2">
                  <Select
                    value={selectedProjectId?.toString() || "none"}
                    onValueChange={(value) => {
                      if (value === "none") {
                        setSelectedProjectId(null);
                        form.setValue("projectId", undefined);
                      } else if (value === "create") {
                        if (!selectedClientId) {
                          toast({
                            title: "Client Required",
                            description: "Please select a client first before creating a project.",
                            variant: "destructive",
                          });
                          return;
                        }
                        setShowCreateProject(true);
                      } else {
                        const projectId = parseInt(value);
                        setSelectedProjectId(projectId);
                        form.setValue("projectId", projectId);
                      }
                    }}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Select project" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No project</SelectItem>
                      <SelectItem value="create">+ Create new project</SelectItem>
                      {Array.isArray(projects) && projects
                        .filter((project: Project) => !selectedClientId || project.clientId === selectedClientId)
                        .map((project: Project) => (
                          <SelectItem key={project.id} value={project.id.toString()}>
                            {project.title}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Quote Selection */}
              {selectedProjectId && (
                <div className="space-y-2">
                  <FormLabel>Quote (Optional)</FormLabel>
                  <Select
                    value={selectedQuoteId?.toString() || "none"}
                    onValueChange={(value) => {
                      if (value === "none") {
                        setSelectedQuoteId(null);
                        form.setValue("quoteId", undefined);
                        setItems([{
                          description: "Material 1",
                          quantity: 25,
                          unitPrice: 0,
                          total: 0,
                          discount: 0
                        }]);
                        setBaseAmount(0);
                        form.setValue("totalAmount", 0);
                      } else {
                        const quoteId = parseInt(value);
                        setSelectedQuoteId(quoteId);
                        form.setValue("quoteId", quoteId);
                        loadQuoteData(quoteId);
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select quote" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No quote</SelectItem>
                      {Array.isArray(quotes) && quotes
                        .filter((quote: Quote) => quote.projectId === selectedProjectId)
                        .map((quote: Quote) => (
                          <SelectItem key={quote.id} value={quote.id.toString()}>
                            Quote - ${quote.totalEstimate}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Issue Date */}
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

              {/* Due Date */}
              <FormField
                control={form.control}
                name="dueDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Due Date*</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Status */}
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status*</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="sent">Sent</SelectItem>
                        <SelectItem value="paid">Paid</SelectItem>
                        <SelectItem value="overdue">Overdue</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Items Section */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <Label className="text-lg font-semibold">Invoice Items</Label>
                <Button type="button" onClick={addItem} variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Item
                </Button>
              </div>

              {items.map((item, index) => (
                <div key={index} className="border rounded-lg p-4 space-y-3">
                  <div className="grid grid-cols-12 gap-2">
                    <div className="col-span-4">
                      <Label>Description</Label>
                      <Input
                        value={item.description}
                        onChange={(e) => updateItem(index, 'description', e.target.value)}
                        placeholder="Service/product description"
                      />
                    </div>
                    <div className="col-span-2">
                      <Label>Quantity</Label>
                      <Input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => updateItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                        min="0"
                        step="0.01"
                      />
                    </div>
                    <div className="col-span-2">
                      <Label>Unit Price</Label>
                      <Input
                        type="number"
                        value={item.unitPrice}
                        onChange={(e) => updateItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                        min="0"
                        step="0.01"
                      />
                    </div>
                    <div className="col-span-2">
                      <Label>Discount</Label>
                      <Input
                        type="number"
                        value={item.discount || 0}
                        onChange={(e) => updateItem(index, 'discount', parseFloat(e.target.value) || 0)}
                        min="0"
                        step="0.01"
                      />
                    </div>
                    <div className="col-span-1">
                      <Label>Total</Label>
                      <div className="h-10 flex items-center">
                        ${(((item.quantity * item.unitPrice) || 0) - (item.discount || 0)).toFixed(2)}
                      </div>
                    </div>
                    <div className="col-span-1 flex items-end">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeItem(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}

              {/* Global Discount */}
              <div className="flex justify-end">
                <div className="w-64 space-y-2">
                  <Label>Global Discount</Label>
                  <Input
                    type="number"
                    value={globalDiscount}
                    onChange={(e) => setGlobalDiscount(parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>

              {/* Total */}
              <div className="flex justify-end">
                <div className="text-right">
                  <Label className="text-lg font-semibold">Total: ${calculateTotal().toFixed(2)}</Label>
                </div>
              </div>
            </div>

            {/* Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea 
                      {...field} 
                      placeholder="Add notes or additional information for this invoice"
                      rows={3}
                    />
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
                {createMutation.isPending ? "Saving..." : "Create Invoice"}
              </Button>
            </div>
          </form>
        </Form>

        {/* Modal to create client */}
        <Dialog open={showCreateClient} onOpenChange={setShowCreateClient}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Client</DialogTitle>
            </DialogHeader>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.target as HTMLFormElement);
              const clientData = {
                name: formData.get('name') as string,
                email: formData.get('email') as string,
                phone: formData.get('phone') as string || undefined,
                address: formData.get('address') as string || undefined,
              };
              createClientMutation.mutate(clientData);
            }} className="space-y-4">
              <div>
                <Label htmlFor="client-name">Name*</Label>
                <Input id="client-name" name="name" required />
              </div>
              <div>
                <Label htmlFor="client-email">Email*</Label>
                <Input id="client-email" name="email" type="email" required />
              </div>
              <div>
                <Label htmlFor="client-phone">Phone</Label>
                <Input id="client-phone" name="phone" type="tel" />
              </div>
              <div>
                <Label htmlFor="client-address">Address</Label>
                <Textarea id="client-address" name="address" rows={2} />
              </div>
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setShowCreateClient(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createClientMutation.isPending}>
                  {createClientMutation.isPending ? "Creating..." : "Create Client"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Modal to create project */}
        <Dialog open={showCreateProject} onOpenChange={setShowCreateProject}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Project</DialogTitle>
            </DialogHeader>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.target as HTMLFormElement);
              const projectData = {
                clientId: selectedClientId!,
                title: formData.get('title') as string,
                description: formData.get('description') as string,
                address: formData.get('address') as string,
                serviceType: formData.get('serviceType') as string || 'Other',
              };
              createProjectMutation.mutate(projectData);
            }} className="space-y-4">
              <div>
                <Label htmlFor="project-title">Title*</Label>
                <Input id="project-title" name="title" required />
              </div>
              <div>
                <Label htmlFor="project-description">Description*</Label>
                <Textarea id="project-description" name="description" rows={2} required />
              </div>
              <div>
                <Label htmlFor="project-address">Address*</Label>
                <Input id="project-address" name="address" required />
              </div>
              <div>
                <Label htmlFor="project-serviceType">Service Type*</Label>
                <select 
                  id="project-serviceType" 
                  name="serviceType" 
                  required 
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="">Select service type</option>
                  <option value="Exterior Painting">Exterior Painting</option>
                  <option value="Interior Painting">Interior Painting</option>
                  <option value="Commercial Painting">Commercial Painting</option>
                  <option value="Pressure Washing">Pressure Washing</option>
                  <option value="Deck Staining">Deck Staining</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setShowCreateProject(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createProjectMutation.isPending}>
                  {createProjectMutation.isPending ? "Creating..." : "Create Project"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  );
};

// Main invoices component
export default function Invoices() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | undefined>();

  const { data: invoices, isLoading } = useQuery({ queryKey: ["/api/invoices"] });
  const { data: clients } = useQuery({ queryKey: ["/api/clients"] });
  const { data: projects } = useQuery({ queryKey: ["/api/projects"] });

  const getStatusBadge = (status: string) => {
    const statusMap = {
      draft: { label: "Draft", variant: "secondary" as const },
      sent: { label: "Sent", variant: "default" as const },
      paid: { label: "Paid", variant: "default" as const },
      overdue: { label: "Overdue", variant: "destructive" as const },
      cancelled: { label: "Cancelled", variant: "outline" as const },
    };
    
    return statusMap[status as keyof typeof statusMap] || { label: status, variant: "secondary" as const };
  };

  const getClientName = (clientId: number) => {
    if (!Array.isArray(clients)) return "Unknown client";
    const client = clients.find((c: Client) => c.id === clientId);
    return client ? client.name : "Unknown client";
  };

  const getProjectTitle = (projectId?: number) => {
    if (!projectId || !Array.isArray(projects)) return null;
    const project = projects.find((p: Project) => p.id === projectId);
    return project ? project.title : null;
  };

  const handleEdit = (invoice: Invoice) => {
    setEditingInvoice(invoice);
    setIsFormOpen(true);
  };

  const handleCreate = () => {
    setEditingInvoice(undefined);
    setIsFormOpen(true);
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingInvoice(undefined);
  };

  const handleFormSuccess = () => {
    setIsFormOpen(false);
    setEditingInvoice(undefined);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p>Loading invoices...</p>
        </div>
      </div>
    );
  }

  return (
    <Layout title="Invoices">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Invoices</h1>
            <p className="text-muted-foreground">Manage your project invoices</p>
          </div>
          <Button onClick={handleCreate}>
            <Plus className="h-4 w-4 mr-2" />
            New Invoice
          </Button>
        </div>

      {!Array.isArray(invoices) || invoices.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center space-y-4">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto" />
              <div>
                <h3 className="text-lg font-semibold">No invoices created</h3>
                <p className="text-muted-foreground">Start by creating your first invoice</p>
              </div>
              <Button onClick={handleCreate}>
                <Plus className="h-4 w-4 mr-2" />
                Create First Invoice
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {invoices.map((invoice: Invoice) => (
            <Card key={invoice.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <h3 className="font-semibold">Invoice #{invoice.invoiceNumber}</h3>
                      <Badge variant={getStatusBadge(invoice.status).variant}>
                        {getStatusBadge(invoice.status).label}
                      </Badge>
                    </div>
                    
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <div className="flex items-center space-x-2">
                        <User className="h-4 w-4" />
                        <span>{getClientName(invoice.clientId)}</span>
                      </div>
                      
                      {invoice.projectId && (
                        <div className="flex items-center space-x-2">
                          <FileText className="h-4 w-4" />
                          <span>{getProjectTitle(invoice.projectId)}</span>
                        </div>
                      )}
                      
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4" />
                        <span>Issued: {new Date(invoice.issueDate).toLocaleDateString()}</span>
                        <span>•</span>
                        <span>Due: {new Date(invoice.dueDate).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right space-y-2">
                    <div className="flex items-center space-x-2 text-lg font-semibold">
                      <DollarSign className="h-5 w-5" />
                      <span>${parseFloat(invoice.totalAmount).toFixed(2)}</span>
                    </div>
                    
                    <div className="space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(invoice)}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <InvoiceForm
        open={isFormOpen}
        onClose={handleFormClose}
        onSuccess={handleFormSuccess}
        editingInvoice={editingInvoice}
      />
      </div>
    </Layout>
  );
}