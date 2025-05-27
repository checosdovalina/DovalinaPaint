import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery } from "@tanstack/react-query";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useState } from "react";

// Exterior breakdown item schema
const exteriorItemSchema = z.object({
  enabled: z.boolean().default(false),
  ft: z.number().min(0).default(0),
  price: z.number().min(0).default(0),
  subtotal: z.number().min(0).default(0),
});

// Simplified quote schema without cost breakdown
const simpleQuoteSchema = z.object({
  projectId: z.number().min(1, "Please select a project"),
  totalEstimate: z.number().min(0, "Total estimate must be greater than or equal to 0"),
  scopeOfWork: z.string().min(1, "Scope of work is required"),
  isInterior: z.boolean().optional(),
  isExterior: z.boolean().optional(),
  exteriorBreakdown: z.object({
    soffit: exteriorItemSchema.optional(),
    facia: exteriorItemSchema.optional(),
    gutters: exteriorItemSchema.optional(),
  }).optional(),
  notes: z.string().optional(),
  validUntil: z.date().optional(),
  sentDate: z.date().optional(),
});

type SimpleQuoteFormData = z.infer<typeof simpleQuoteSchema>;

interface SimpleQuoteFormProps {
  initialData?: any;
  onSuccess: () => void;
}

export function SimpleQuoteForm({ initialData, onSuccess }: SimpleQuoteFormProps) {
  const { toast } = useToast();
  const [validUntilOpen, setValidUntilOpen] = useState(false);
  const [sentDateOpen, setSentDateOpen] = useState(false);

  const form = useForm<SimpleQuoteFormData>({
    resolver: zodResolver(simpleQuoteSchema),
    defaultValues: {
      projectId: initialData?.projectId || 0,
      totalEstimate: initialData?.totalEstimate || initialData?.total || 0,
      scopeOfWork: initialData?.scopeOfWork || "",
      isInterior: initialData?.isInterior || false,
      isExterior: initialData?.isExterior || false,
      exteriorBreakdown: initialData?.exteriorBreakdown || {
        soffit: { enabled: false, ft: 0, price: 0, subtotal: 0 },
        facia: { enabled: false, ft: 0, price: 0, subtotal: 0 },
        gutters: { enabled: false, ft: 0, price: 0, subtotal: 0 },
      },
      notes: initialData?.notes || "",
      validUntil: initialData?.validUntil ? new Date(initialData.validUntil) : undefined,
      sentDate: initialData?.sentDate ? new Date(initialData.sentDate) : undefined,
    },
  });

  // Fetch projects
  const { data: projects } = useQuery({
    queryKey: ["/api/projects"],
  });

  // Fetch clients to determine residential vs commercial
  const { data: clients } = useQuery({
    queryKey: ["/api/clients"],
  });

  // Check if selected project is residential
  const selectedProject = projects?.find((p: any) => p.id === form.watch("projectId"));
  const selectedClient = selectedProject ? clients?.find((c: any) => c.id === selectedProject.clientId) : null;
  const isResidential = selectedClient?.classification === 'residential';
  


  const mutation = useMutation({
    mutationFn: async (data: SimpleQuoteFormData) => {
      if (initialData?.id) {
        // Edit existing quote
        const response = await apiRequest("PUT", `/api/simple-quotes/${initialData.id}`, {
          projectId: data.projectId,
          totalEstimate: data.totalEstimate,
          scopeOfWork: data.scopeOfWork,
          isInterior: data.isInterior || false,
          isExterior: data.isExterior || false,
          exteriorBreakdown: data.exteriorBreakdown || null,
          notes: data.notes || "",
          validUntil: data.validUntil ? data.validUntil.toISOString() : null,
          sentDate: data.sentDate ? data.sentDate.toISOString() : null,
          status: "draft",
        });
        
        if (response.ok) {
          return { success: true };
        }
        throw new Error("Failed to update quote");
      } else {
        // Create new quote
        const response = await apiRequest("POST", "/api/simple-quotes", {
          projectId: data.projectId,
          totalEstimate: data.totalEstimate,
          scopeOfWork: data.scopeOfWork,
          isInterior: data.isInterior || false,
          isExterior: data.isExterior || false,
          exteriorBreakdown: data.exteriorBreakdown || null,
          notes: data.notes || "",
          validUntil: data.validUntil ? data.validUntil.toISOString() : null,
          sentDate: data.sentDate ? data.sentDate.toISOString() : null,
          status: "draft",
        });
        
        if (response.ok) {
          return await response.json();
        }
        throw new Error("Failed to create quote");
      }
    },
    onSuccess: (data) => {
      console.log("Simple quote saved successfully:", data);
      
      // Invalidate cache to refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/quotes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/simple-quotes"] });
      
      // Show success message
      toast({
        title: "Success",
        description: initialData?.id 
          ? "Simple quote updated successfully" 
          : "Simple quote created successfully",
      });
      
      // Close modal/form
      if (typeof onSuccess === 'function') {
        onSuccess();
      }
    },
    onError: (error: any) => {
      console.error("Simple quote error:", error);
      toast({
        title: "Error",
        description: error.message || "Error saving quote",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: SimpleQuoteFormData) => {
    mutation.mutate(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 max-h-[80vh] overflow-y-auto">
        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="projectId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Project</FormLabel>
                <Select
                  onValueChange={(value) => field.onChange(parseInt(value))}
                  value={field.value?.toString()}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a project" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Array.isArray(projects) && projects.map((project: any) => (
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
            name="totalEstimate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Total Estimate ($)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    {...field}
                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="scopeOfWork"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Scope of Work</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Describe in detail the scope of work to be performed..."
                  className="min-h-[120px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
              <div className="text-xs text-gray-500 mt-1">
                You can use bullet points with "•", "-", "*", or "✓" to create lists
              </div>
            </FormItem>
          )}
        />

        {/* Service Type Options */}
        <div className="space-y-4">
          <div>
            <FormLabel className="text-base font-medium">Service Type</FormLabel>
            <p className="text-sm text-muted-foreground">Select which areas will be painted</p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="isInterior"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Interior</FormLabel>
                    <p className="text-sm text-muted-foreground">
                      Indoor painting services
                    </p>
                  </div>
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="isExterior"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Exterior</FormLabel>
                    <p className="text-sm text-muted-foreground">
                      Outdoor painting services
                    </p>
                  </div>
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Exterior Breakdown - show for all residential quotes when exterior is selected */}
        {form.watch("isExterior") && (
          <div className="space-y-4 border rounded-lg p-4 bg-gray-50">
            <div>
              <FormLabel className="text-base font-medium">Labor Breakdown - Exterior</FormLabel>
              <p className="text-sm text-muted-foreground">Select and price specific exterior components</p>
            </div>
            
            {/* Boxes (Unified Soffit, Facia, Gutters) */}
            <div className="space-y-2">
              <FormField
                control={form.control}
                name="exteriorBreakdown.boxes.enabled"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className="font-medium">Boxes (Soffit, Facia, Gutters)</FormLabel>
                      <p className="text-xs text-muted-foreground">Quantity will be multiplied by 3 automatically</p>
                    </div>
                  </FormItem>
                )}
              />
              
              {form.watch("exteriorBreakdown.boxes.enabled") && (
                <div className="grid grid-cols-3 gap-2 ml-6">
                  <FormField
                    control={form.control}
                    name="exteriorBreakdown.boxes.quantity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Quantity</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="1"
                            placeholder="0"
                            {...field}
                            onChange={(e) => {
                              const quantity = parseFloat(e.target.value) || 0;
                              field.onChange(quantity);
                              const price = form.getValues("exteriorBreakdown.boxes.price") || 0;
                              // Multiply quantity by 3 for the subtotal calculation
                              form.setValue("exteriorBreakdown.boxes.subtotal", (quantity * 3) * price);
                            }}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="exteriorBreakdown.boxes.price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Price ($)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            {...field}
                            onChange={(e) => {
                              const price = parseFloat(e.target.value) || 0;
                              field.onChange(price);
                              const quantity = form.getValues("exteriorBreakdown.boxes.quantity") || 0;
                              // Multiply quantity by 3 for the subtotal calculation
                              form.setValue("exteriorBreakdown.boxes.subtotal", (quantity * 3) * price);
                            }}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="exteriorBreakdown.boxes.subtotal"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Subtotal ($)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            {...field}
                            readOnly
                            className="bg-gray-100"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              )}
            </div>

            {/* Siding */}
            <div className="space-y-2">
              <FormField
                control={form.control}
                name="exteriorBreakdown.siding.enabled"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className="font-medium">Siding</FormLabel>
                      <p className="text-xs text-muted-foreground">Select siding material and pricing</p>
                    </div>
                  </FormItem>
                )}
              />
              
              {form.watch("exteriorBreakdown.siding.enabled") && (
                <div className="space-y-3 ml-6">
                  {/* Material Dropdown */}
                  <FormField
                    control={form.control}
                    name="exteriorBreakdown.siding.material"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Material Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select siding material" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="clapboard">Clapboard Siding</SelectItem>
                            <SelectItem value="t1-11">T1-11 Siding</SelectItem>
                            <SelectItem value="cedar">Cedar Siding</SelectItem>
                            <SelectItem value="vertical">Vertical Siding</SelectItem>
                            <SelectItem value="masonite">Masonite Siding</SelectItem>
                            <SelectItem value="natural-wood">Natural Wood Siding</SelectItem>
                            <SelectItem value="faux-wood">Faux Wood Siding</SelectItem>
                            <SelectItem value="aluminum">Aluminum Siding</SelectItem>
                            <SelectItem value="vinyl">Vinyl Siding</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {/* Quantity, Price, Subtotal */}
                  <div className="grid grid-cols-3 gap-2">
                    <FormField
                      control={form.control}
                      name="exteriorBreakdown.siding.quantity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs">Quantity</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              placeholder="0"
                              {...field}
                              onChange={(e) => {
                                const quantity = parseFloat(e.target.value) || 0;
                                field.onChange(quantity);
                                const price = form.getValues("exteriorBreakdown.siding.price") || 0;
                                form.setValue("exteriorBreakdown.siding.subtotal", quantity * price);
                              }}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="exteriorBreakdown.siding.price"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs">Price ($)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              placeholder="0.00"
                              {...field}
                              onChange={(e) => {
                                const price = parseFloat(e.target.value) || 0;
                                field.onChange(price);
                                const quantity = form.getValues("exteriorBreakdown.siding.quantity") || 0;
                                form.setValue("exteriorBreakdown.siding.subtotal", quantity * price);
                              }}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="exteriorBreakdown.siding.subtotal"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs">Subtotal ($)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              placeholder="0.00"
                              {...field}
                              readOnly
                              className="bg-gray-100"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Dormer */}
            <div className="space-y-2">
              <FormField
                control={form.control}
                name="exteriorBreakdown.dormer.enabled"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className="font-medium">Dormer</FormLabel>
                      <p className="text-xs text-muted-foreground">Roof dormer windows with complexity pricing</p>
                    </div>
                  </FormItem>
                )}
              />
              
              {form.watch("exteriorBreakdown.dormer.enabled") && (
                <div className="space-y-3 ml-6">
                  {/* Complexity Level */}
                  <FormField
                    control={form.control}
                    name="exteriorBreakdown.dormer.complexity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Complexity Level</FormLabel>
                        <Select 
                          onValueChange={(value) => {
                            field.onChange(value);
                            // Auto-set price based on complexity
                            const price = value === "simple" ? 300 : 400;
                            form.setValue("exteriorBreakdown.dormer.unitPrice", price);
                            
                            // Recalculate subtotal
                            const quantity = form.getValues("exteriorBreakdown.dormer.quantity") || 0;
                            form.setValue("exteriorBreakdown.dormer.subtotal", quantity * price);
                          }} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select complexity level" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="simple">Simple - $300 USD</SelectItem>
                            <SelectItem value="complex">Complex - $400 USD</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {/* Quantity and Subtotal */}
                  <div className="grid grid-cols-2 gap-2">
                    <FormField
                      control={form.control}
                      name="exteriorBreakdown.dormer.quantity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs">Quantity</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="1"
                              placeholder="0"
                              {...field}
                              onChange={(e) => {
                                const quantity = parseFloat(e.target.value) || 0;
                                field.onChange(quantity);
                                const unitPrice = form.getValues("exteriorBreakdown.dormer.unitPrice") || 0;
                                form.setValue("exteriorBreakdown.dormer.subtotal", quantity * unitPrice);
                              }}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="exteriorBreakdown.dormer.subtotal"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs">Subtotal ($)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              placeholder="0.00"
                              {...field}
                              readOnly
                              className="bg-gray-100"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Hidden unit price field for calculations */}
                  <FormField
                    control={form.control}
                    name="exteriorBreakdown.dormer.unitPrice"
                    render={({ field }) => (
                      <input type="hidden" {...field} />
                    )}
                  />
                </div>
              )}
            </div>

            {/* Chimney */}
            <div className="space-y-2">
              <FormField
                control={form.control}
                name="exteriorBreakdown.chimney.enabled"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className="font-medium">Chimney</FormLabel>
                      <p className="text-xs text-muted-foreground">Chimney painting with material selection</p>
                    </div>
                  </FormItem>
                )}
              />
              
              {form.watch("exteriorBreakdown.chimney.enabled") && (
                <div className="space-y-3 ml-6">
                  {/* Chimney Type - Radio Buttons */}
                  <FormField
                    control={form.control}
                    name="exteriorBreakdown.chimney.type"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormLabel className="text-xs">Chimney Type</FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={(value) => {
                              field.onChange(value);
                              // Clear siding material when switching to brick
                              if (value === "brick") {
                                form.setValue("exteriorBreakdown.chimney.sidingMaterial", "");
                              }
                            }}
                            defaultValue={field.value}
                            className="flex flex-row space-x-6"
                          >
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="brick" id="chimney-brick" />
                              <label htmlFor="chimney-brick" className="text-sm font-medium">
                                Brick
                              </label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="siding" id="chimney-siding" />
                              <label htmlFor="chimney-siding" className="text-sm font-medium">
                                Siding
                              </label>
                            </div>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Siding Material Dropdown - Only show if Siding is selected */}
                  {form.watch("exteriorBreakdown.chimney.type") === "siding" && (
                    <FormField
                      control={form.control}
                      name="exteriorBreakdown.chimney.sidingMaterial"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs">Siding Material</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select siding material" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="clapboard">Clapboard Siding</SelectItem>
                              <SelectItem value="t1-11">T1-11 Siding</SelectItem>
                              <SelectItem value="cedar">Cedar Siding</SelectItem>
                              <SelectItem value="vertical">Vertical Siding</SelectItem>
                              <SelectItem value="masonite">Masonite Siding</SelectItem>
                              <SelectItem value="natural-wood">Natural Wood Siding</SelectItem>
                              <SelectItem value="faux-wood">Faux Wood Siding</SelectItem>
                              <SelectItem value="aluminum">Aluminum Siding</SelectItem>
                              <SelectItem value="vinyl">Vinyl Siding</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                  
                  {/* Quantity, Price, Subtotal */}
                  <div className="grid grid-cols-3 gap-2">
                    <FormField
                      control={form.control}
                      name="exteriorBreakdown.chimney.quantity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs">Quantity</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              placeholder="0"
                              {...field}
                              onChange={(e) => {
                                const quantity = parseFloat(e.target.value) || 0;
                                field.onChange(quantity);
                                const price = form.getValues("exteriorBreakdown.chimney.price") || 0;
                                form.setValue("exteriorBreakdown.chimney.subtotal", quantity * price);
                              }}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="exteriorBreakdown.chimney.price"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs">Price ($)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              placeholder="0.00"
                              {...field}
                              onChange={(e) => {
                                const price = parseFloat(e.target.value) || 0;
                                field.onChange(price);
                                const quantity = form.getValues("exteriorBreakdown.chimney.quantity") || 0;
                                form.setValue("exteriorBreakdown.chimney.subtotal", quantity * price);
                              }}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="exteriorBreakdown.chimney.subtotal"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs">Subtotal ($)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              placeholder="0.00"
                              {...field}
                              readOnly
                              className="bg-gray-100"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="validUntil"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Valid Until</FormLabel>
                <Popover open={validUntilOpen} onOpenChange={setValidUntilOpen}>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "PPP", { locale: es })
                        ) : (
                          <span>Seleccionar fecha</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={(date) => {
                        field.onChange(date);
                        setValidUntilOpen(false);
                      }}
                      disabled={(date) => date < new Date()}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="sentDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Fecha de Envío</FormLabel>
                <Popover open={sentDateOpen} onOpenChange={setSentDateOpen}>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "PPP", { locale: es })
                        ) : (
                          <span>Seleccionar fecha</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={(date) => {
                        field.onChange(date);
                        setSentDateOpen(false);
                      }}
                      disabled={(date) => date > new Date()}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Editable Total Section */}
        <div className="bg-gray-50 p-4 rounded-lg border">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold text-gray-800">Resumen del Presupuesto</h3>
          </div>
          <div className="grid gap-3">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-600">Total del Proyecto:</span>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-500">$</span>
                <FormField
                  control={form.control}
                  name="totalEstimate"
                  render={({ field }) => (
                    <Input
                      type="number"
                      step="0.01"
                      className="w-32 text-right font-semibold"
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    />
                  )}
                />
              </div>
            </div>
            <div className="text-xs text-gray-500">
              El total puede ser editado directamente según las necesidades del proyecto
            </div>
          </div>
        </div>

        {/* Notes Mini Module */}
        <div className="space-y-4">
          <div className="border rounded-lg p-4">
            <h3 className="text-md font-semibold text-gray-800 mb-3">Notas del Presupuesto</h3>
            
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">Notas Internas</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Notas para uso interno del equipo..."
                      className="min-h-[80px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                  <div className="text-xs text-gray-500 mt-1">
                    Estas notas son solo para uso interno y no aparecerán en el presupuesto del cliente
                  </div>
                </FormItem>
              )}
            />

            <div className="mt-4 p-3 bg-blue-50 rounded border border-blue-200">
              <h4 className="text-sm font-medium text-blue-800 mb-2">💡 Consejos para las notas:</h4>
              <ul className="text-xs text-blue-700 space-y-1">
                <li>• Incluye detalles sobre materiales especiales requeridos</li>
                <li>• Menciona consideraciones especiales del cliente</li>
                <li>• Anota cualquier factor que pueda afectar el cronograma</li>
                <li>• Registra conversaciones importantes con el cliente</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-2 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onSuccess}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={mutation.isPending}
          >
            {mutation.isPending
              ? "Guardando..."
              : initialData?.id
              ? "Actualizar Presupuesto"
              : "Crear Presupuesto"}
          </Button>
        </div>
      </form>
    </Form>
  );
}