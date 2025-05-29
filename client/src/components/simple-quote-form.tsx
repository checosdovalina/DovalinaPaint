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
import { Calendar as CalendarIcon, Plus, Minus } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useState } from "react";

// Simplified quote schema without cost breakdown
const simpleQuoteSchema = z.object({
  projectId: z.number().min(1, "Please select a project"),
  totalEstimate: z.number().min(0, "Total estimate must be greater than or equal to 0"),
  scopeOfWork: z.string().min(1, "Scope of work is required"),
  isInterior: z.boolean().optional(),
  isExterior: z.boolean().optional(),
  exteriorBreakdown: z.any().optional(),
  optionalComments: z.any().optional(),
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

  const form = useForm({
    resolver: zodResolver(simpleQuoteSchema),
    defaultValues: {
      projectId: initialData?.projectId || 0,
      totalEstimate: initialData?.totalEstimate || initialData?.total || 0,
      scopeOfWork: initialData?.scopeOfWork || "",
      isInterior: initialData?.isInterior || false,
      isExterior: initialData?.isExterior || false,
      exteriorBreakdown: {
        soffit: initialData?.exteriorBreakdown?.soffit || { enabled: false, ft: 0, price: 0, subtotal: 0 },
        facia: initialData?.exteriorBreakdown?.facia || { enabled: false, ft: 0, price: 0, subtotal: 0 },
        gutters: initialData?.exteriorBreakdown?.gutters || { enabled: false, ft: 0, price: 0, subtotal: 0 },
        boxes: initialData?.exteriorBreakdown?.boxes || { enabled: false, quantity: 38, price: 18, subtotal: 0 },
        siding: {
          enabled: initialData?.exteriorBreakdown?.siding?.enabled || false,
          lines: initialData?.exteriorBreakdown?.siding?.lines || [{ 
            material: "brick", 
            quantity: 0, 
            price: 0, 
            subtotal: 0 
          }]
        },
        dormer: {
          enabled: initialData?.exteriorBreakdown?.dormer?.enabled || false,
          lines: initialData?.exteriorBreakdown?.dormer?.lines || [{ 
            type: "simple", 
            quantity: 0, 
            price: 300, 
            subtotal: 0 
          }]
        },
        chimney: {
          enabled: initialData?.exteriorBreakdown?.chimney?.enabled || false,
          lines: initialData?.exteriorBreakdown?.chimney?.lines || [{ 
            material: "brick", 
            quantity: 0, 
            price: 0, 
            subtotal: 0 
          }]
        },
        porch: {
          enabled: initialData?.exteriorBreakdown?.porch?.enabled || false,
          columns: initialData?.exteriorBreakdown?.porch?.columns || { enabled: false, quantity: 0, price: 0, subtotal: 0 },
          ceiling: initialData?.exteriorBreakdown?.porch?.ceiling || { enabled: false, quantity: 0, price: 0, subtotal: 0 }
        },
        windows: {
          enabled: initialData?.exteriorBreakdown?.windows?.enabled || false,
          lines: initialData?.exteriorBreakdown?.windows?.lines || [{ 
            type: "plastic", 
            coats: "1", 
            quantity: 0, 
            price: 0, 
            subtotal: 0 
          }]
        },
        shutters: {
          enabled: initialData?.exteriorBreakdown?.shutters?.enabled || false,
          lines: initialData?.exteriorBreakdown?.shutters?.lines || [{ 
            type: "panel", 
            quantity: 0, 
            price: 25, 
            subtotal: 0 
          }]
        },
        deck: {
          enabled: initialData?.exteriorBreakdown?.deck?.enabled || false,
          lines: initialData?.exteriorBreakdown?.deck?.lines || [{ 
            quantity: 0, 
            price: 0, 
            subtotal: 0 
          }]
        },
        miscellaneous: {
          enabled: initialData?.exteriorBreakdown?.miscellaneous?.enabled || false,
          lines: initialData?.exteriorBreakdown?.miscellaneous?.lines || [{ 
            description: "", 
            price: 0 
          }]
        }
      },
      optionalComments: {
        prep: initialData?.optionalComments?.prep || false,
        primer: initialData?.optionalComments?.primer || false,
        protection: initialData?.optionalComments?.protection || false,
        cleanup: initialData?.optionalComments?.cleanup || false,
        warranty: initialData?.optionalComments?.warranty || false,
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
    mutationFn: async (data: any) => {
      if (initialData?.id) {
        // Edit existing quote
        const response = await apiRequest("PUT", `/api/simple-quotes/${initialData.id}`, {
          projectId: data.projectId,
          totalEstimate: data.totalEstimate,
          scopeOfWork: data.scopeOfWork,
          isInterior: data.isInterior || false,
          isExterior: data.isExterior || false,
          exteriorBreakdown: data.exteriorBreakdown || null,
          optionalComments: data.optionalComments || null,
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

        {/* Optional Comments for Scope of Work */}
        <div className="space-y-4">
          <div className="border rounded-lg p-4">
            <h3 className="text-md font-semibold text-gray-800 mb-3">Optional Work Comments</h3>
            <p className="text-xs text-gray-500 mb-3">Select standard comments to include in the scope of work</p>
            
            <div className="grid gap-3">
              <FormField
                control={form.control}
                name="optionalComments.prep"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className="text-sm font-medium cursor-pointer">
                        Preparation Work
                      </FormLabel>
                      <p className="text-xs text-gray-600">
                        "Prep: Power washing as needed, scraping and sanding, removing old caulk and re-caulking gaps."
                      </p>
                    </div>
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="optionalComments.primer"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className="text-sm font-medium cursor-pointer">
                        Primer Application
                      </FormLabel>
                      <p className="text-xs text-gray-600">
                        "Prime: Apply high-quality primer to all surfaces to ensure proper paint adhesion."
                      </p>
                    </div>
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="optionalComments.protection"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className="text-sm font-medium cursor-pointer">
                        Surface Protection
                      </FormLabel>
                      <p className="text-xs text-gray-600">
                        "Protection: Cover and protect all landscaping, walkways, and adjacent surfaces."
                      </p>
                    </div>
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="optionalComments.cleanup"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className="text-sm font-medium cursor-pointer">
                        Clean-up
                      </FormLabel>
                      <p className="text-xs text-gray-600">
                        "Clean-up: Complete site clean-up and proper disposal of all materials."
                      </p>
                    </div>
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="optionalComments.warranty"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className="text-sm font-medium cursor-pointer">
                        Warranty Information
                      </FormLabel>
                      <p className="text-xs text-gray-600">
                        "Warranty: 2-year warranty on workmanship and materials against defects."
                      </p>
                    </div>
                  </FormItem>
                )}
              />
            </div>
          </div>
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
                  {/* Add Line Button */}
                  <div className="flex justify-end">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const currentLines = form.getValues("exteriorBreakdown.siding.lines") || [];
                        form.setValue("exteriorBreakdown.siding.lines", [
                          ...currentLines,
                          { material: "", quantity: 0, price: 0, subtotal: 0 }
                        ]);
                      }}
                      className="h-8"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add Line
                    </Button>
                  </div>

                  {/* Dynamic Lines */}
                  {(form.watch("exteriorBreakdown.siding.lines") || []).map((_, lineIndex) => (
                    <div key={lineIndex} className="border border-gray-200 rounded-lg p-3 space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Siding Line #{lineIndex + 1}</span>
                        {lineIndex > 0 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const currentLines = form.getValues("exteriorBreakdown.siding.lines") || [];
                              const newLines = currentLines.filter((_, i) => i !== lineIndex);
                              form.setValue("exteriorBreakdown.siding.lines", newLines);
                            }}
                            className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                        )}
                      </div>

                      {/* Material Dropdown */}
                      <FormField
                        control={form.control}
                        name={`exteriorBreakdown.siding.lines.${lineIndex}.material`}
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
                                <SelectItem value="brick">Brick</SelectItem>
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
                          name={`exteriorBreakdown.siding.lines.${lineIndex}.quantity`}
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
                                    const lines = form.getValues("exteriorBreakdown.siding.lines") || [];
                                    if (lines[lineIndex]) {
                                      const price = lines[lineIndex].price || 0;
                                      form.setValue(`exteriorBreakdown.siding.lines.${lineIndex}.subtotal`, quantity * price);
                                    }
                                  }}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name={`exteriorBreakdown.siding.lines.${lineIndex}.price`}
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
                                    const lines = form.getValues("exteriorBreakdown.siding.lines") || [];
                                    if (lines[lineIndex]) {
                                      const quantity = lines[lineIndex].quantity || 0;
                                      form.setValue(`exteriorBreakdown.siding.lines.${lineIndex}.subtotal`, quantity * price);
                                    }
                                  }}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name={`exteriorBreakdown.siding.lines.${lineIndex}.subtotal`}
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
                  ))}

                  {/* Initialize with first line if none exist */}
                  {(!form.watch("exteriorBreakdown.siding.lines") || form.watch("exteriorBreakdown.siding.lines").length === 0) && (
                    <div className="text-center py-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          form.setValue("exteriorBreakdown.siding.lines", [
                            { material: "", quantity: 0, price: 0, subtotal: 0 }
                          ]);
                        }}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add First Siding Line
                      </Button>
                    </div>
                  )}
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

            {/* Porch */}
            <div className="space-y-2">
              <FormField
                control={form.control}
                name="exteriorBreakdown.porch.enabled"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className="font-medium">Porch</FormLabel>
                      <p className="text-xs text-muted-foreground">Porch painting with columns and ceiling options</p>
                    </div>
                  </FormItem>
                )}
              />
              
              {form.watch("exteriorBreakdown.porch.enabled") && (
                <div className="space-y-4 ml-6">
                  {/* Columns Sub-section */}
                  <div className="space-y-2">
                    <FormField
                      control={form.control}
                      name="exteriorBreakdown.porch.columns.enabled"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel className="text-sm font-medium">Columns</FormLabel>
                            <p className="text-xs text-muted-foreground">Porch columns painting</p>
                          </div>
                        </FormItem>
                      )}
                    />
                    
                    {form.watch("exteriorBreakdown.porch.columns.enabled") && (
                      <div className="grid grid-cols-3 gap-2 ml-6">
                        <FormField
                          control={form.control}
                          name="exteriorBreakdown.porch.columns.quantity"
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
                                    const price = form.getValues("exteriorBreakdown.porch.columns.price") || 0;
                                    form.setValue("exteriorBreakdown.porch.columns.subtotal", quantity * price);
                                  }}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="exteriorBreakdown.porch.columns.price"
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
                                    const quantity = form.getValues("exteriorBreakdown.porch.columns.quantity") || 0;
                                    form.setValue("exteriorBreakdown.porch.columns.subtotal", quantity * price);
                                  }}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="exteriorBreakdown.porch.columns.subtotal"
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

                  {/* Ceiling Sub-section */}
                  <div className="space-y-2">
                    <FormField
                      control={form.control}
                      name="exteriorBreakdown.porch.ceiling.enabled"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel className="text-sm font-medium">Ceiling</FormLabel>
                            <p className="text-xs text-muted-foreground">Porch ceiling painting</p>
                          </div>
                        </FormItem>
                      )}
                    />
                    
                    {form.watch("exteriorBreakdown.porch.ceiling.enabled") && (
                      <div className="grid grid-cols-3 gap-2 ml-6">
                        <FormField
                          control={form.control}
                          name="exteriorBreakdown.porch.ceiling.quantity"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs">Sq Ft</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  step="0.01"
                                  placeholder="0"
                                  {...field}
                                  onChange={(e) => {
                                    const quantity = parseFloat(e.target.value) || 0;
                                    field.onChange(quantity);
                                    const price = form.getValues("exteriorBreakdown.porch.ceiling.price") || 0;
                                    form.setValue("exteriorBreakdown.porch.ceiling.subtotal", quantity * price);
                                  }}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="exteriorBreakdown.porch.ceiling.price"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs">Price/Sq Ft ($)</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  step="0.01"
                                  placeholder="0.00"
                                  {...field}
                                  onChange={(e) => {
                                    const price = parseFloat(e.target.value) || 0;
                                    field.onChange(price);
                                    const quantity = form.getValues("exteriorBreakdown.porch.ceiling.quantity") || 0;
                                    form.setValue("exteriorBreakdown.porch.ceiling.subtotal", quantity * price);
                                  }}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="exteriorBreakdown.porch.ceiling.subtotal"
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
                </div>
              )}
            </div>

            {/* Windows */}
            <div className="space-y-2">
              <FormField
                control={form.control}
                name="exteriorBreakdown.windows.enabled"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className="font-medium">Windows</FormLabel>
                      <p className="text-xs text-muted-foreground">Window painting with material and coating options</p>
                    </div>
                  </FormItem>
                )}
              />
              
              {form.watch("exteriorBreakdown.windows.enabled") && (
                <div className="space-y-3 ml-6">
                  {/* Add Line Button */}
                  <div className="flex justify-end">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const currentLines = form.getValues("exteriorBreakdown.windows.lines") || [];
                        form.setValue("exteriorBreakdown.windows.lines", [
                          ...currentLines,
                          { type: "", coats: "", quantity: 0, unitPrice: 0, subtotal: 0 }
                        ]);
                      }}
                      className="h-8"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add Line
                    </Button>
                  </div>

                  {/* Dynamic Lines */}
                  {(form.watch("exteriorBreakdown.windows.lines") || []).map((_, lineIndex) => (
                    <div key={lineIndex} className="border border-gray-200 rounded-lg p-3 space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Window Line #{lineIndex + 1}</span>
                        {lineIndex > 0 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const currentLines = form.getValues("exteriorBreakdown.windows.lines") || [];
                              const newLines = currentLines.filter((_, i) => i !== lineIndex);
                              form.setValue("exteriorBreakdown.windows.lines", newLines);
                            }}
                            className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                        )}
                      </div>

                      {/* Window Type Dropdown */}
                      <FormField
                        control={form.control}
                        name={`exteriorBreakdown.windows.lines.${lineIndex}.type`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs">Window Type</FormLabel>
                            <Select 
                              onValueChange={(value) => {
                                field.onChange(value);
                                // Reset coats and unit price when type changes
                                form.setValue(`exteriorBreakdown.windows.lines.${lineIndex}.coats`, "");
                                form.setValue(`exteriorBreakdown.windows.lines.${lineIndex}.unitPrice`, 0);
                                form.setValue(`exteriorBreakdown.windows.lines.${lineIndex}.subtotal`, 0);
                              }} 
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select window type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="plastic-pvc">Plastic/PVC (Brick Molding only)</SelectItem>
                                <SelectItem value="wood">Wood (Brick Molding, Sashes, Grilled)</SelectItem>
                                <SelectItem value="casement">Casement Windows</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Coats Dropdown - Only show if window type is selected */}
                      {form.watch(`exteriorBreakdown.windows.lines.${lineIndex}.type`) && (
                        <FormField
                          control={form.control}
                          name={`exteriorBreakdown.windows.lines.${lineIndex}.coats`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs">Number of Coats</FormLabel>
                              <Select 
                                onValueChange={(value) => {
                                  field.onChange(value);
                                  const windowType = form.watch(`exteriorBreakdown.windows.lines.${lineIndex}.type`);
                                  let unitPrice = 0;
                                  
                                  // Set unit price based on type and coats
                                  if (windowType === "plastic-pvc") {
                                    unitPrice = value === "1" ? 40 : 60;
                                  } else if (windowType === "wood") {
                                    unitPrice = value === "1" ? 80 : 120;
                                  } else if (windowType === "casement") {
                                    unitPrice = value === "1" ? 70 : 100;
                                  }
                                  
                                  form.setValue(`exteriorBreakdown.windows.lines.${lineIndex}.unitPrice`, unitPrice);
                                  
                                  // Recalculate subtotal
                                  const quantity = form.getValues(`exteriorBreakdown.windows.lines.${lineIndex}.quantity`) || 0;
                                  form.setValue(`exteriorBreakdown.windows.lines.${lineIndex}.subtotal`, quantity * unitPrice);
                                }} 
                                defaultValue={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select number of coats" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="1">1 Coat</SelectItem>
                                  <SelectItem value="2">2 Coats</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}
                      
                      {/* Quantity and Subtotal */}
                      <div className="grid grid-cols-2 gap-2">
                        <FormField
                          control={form.control}
                          name={`exteriorBreakdown.windows.lines.${lineIndex}.quantity`}
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
                                    const lines = form.getValues("exteriorBreakdown.windows.lines") || [];
                                    if (lines[lineIndex]) {
                                      const unitPrice = lines[lineIndex].unitPrice || 0;
                                      form.setValue(`exteriorBreakdown.windows.lines.${lineIndex}.subtotal`, quantity * unitPrice);
                                    }
                                  }}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name={`exteriorBreakdown.windows.lines.${lineIndex}.subtotal`}
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

                      {/* Show unit price for reference */}
                      {form.watch(`exteriorBreakdown.windows.lines.${lineIndex}.unitPrice`) > 0 && (
                        <div className="text-xs text-muted-foreground">
                          Unit Price: ${form.watch(`exteriorBreakdown.windows.lines.${lineIndex}.unitPrice`)} per window
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Initialize with first line if none exist */}
                  {(!form.watch("exteriorBreakdown.windows.lines") || form.watch("exteriorBreakdown.windows.lines").length === 0) && (
                    <div className="text-center py-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          form.setValue("exteriorBreakdown.windows.lines", [
                            { type: "", coats: "", quantity: 0, unitPrice: 0, subtotal: 0 }
                          ]);
                        }}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add First Window Line
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Shutters */}
            <div className="space-y-2">
              <FormField
                control={form.control}
                name="exteriorBreakdown.shutters.enabled"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className="font-medium">Shutters</FormLabel>
                      <p className="text-xs text-muted-foreground">Shutter painting with panel types</p>
                    </div>
                  </FormItem>
                )}
              />
              
              {form.watch("exteriorBreakdown.shutters.enabled") && (
                <div className="space-y-3 ml-6">
                  {/* Add Line Button */}
                  <div className="flex justify-end">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const currentLines = form.getValues("exteriorBreakdown.shutters.lines") || [];
                        form.setValue("exteriorBreakdown.shutters.lines", [
                          ...currentLines,
                          { type: "", quantity: 0, unitPrice: 0, subtotal: 0 }
                        ]);
                      }}
                      className="h-8"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add Line
                    </Button>
                  </div>

                  {/* Dynamic Lines */}
                  {(form.watch("exteriorBreakdown.shutters.lines") || []).map((_, lineIndex) => (
                    <div key={lineIndex} className="border border-gray-200 rounded-lg p-3 space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Shutter Line #{lineIndex + 1}</span>
                        {lineIndex > 0 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const currentLines = form.getValues("exteriorBreakdown.shutters.lines") || [];
                              const newLines = currentLines.filter((_, i) => i !== lineIndex);
                              form.setValue("exteriorBreakdown.shutters.lines", newLines);
                            }}
                            className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                        )}
                      </div>

                      {/* Shutter Type Dropdown */}
                      <FormField
                        control={form.control}
                        name={`exteriorBreakdown.shutters.lines.${lineIndex}.type`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs">Shutter Type</FormLabel>
                            <Select 
                              onValueChange={(value) => {
                                field.onChange(value);
                                const unitPrice = value === "panel" ? 25 : 35;
                                form.setValue(`exteriorBreakdown.shutters.lines.${lineIndex}.unitPrice`, unitPrice);
                                
                                // Recalculate subtotal
                                const quantity = form.getValues(`exteriorBreakdown.shutters.lines.${lineIndex}.quantity`) || 0;
                                form.setValue(`exteriorBreakdown.shutters.lines.${lineIndex}.subtotal`, quantity * unitPrice);
                              }} 
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select shutter type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="panel">Panel - $25</SelectItem>
                                <SelectItem value="louver">Louver - $35</SelectItem>
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
                          name={`exteriorBreakdown.shutters.lines.${lineIndex}.quantity`}
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
                                    const lines = form.getValues("exteriorBreakdown.shutters.lines") || [];
                                    if (lines[lineIndex]) {
                                      const unitPrice = lines[lineIndex].unitPrice || 0;
                                      form.setValue(`exteriorBreakdown.shutters.lines.${lineIndex}.subtotal`, quantity * unitPrice);
                                    }
                                  }}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name={`exteriorBreakdown.shutters.lines.${lineIndex}.subtotal`}
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
                  ))}

                  {/* Initialize with first line if none exist */}
                  {(!form.watch("exteriorBreakdown.shutters.lines") || form.watch("exteriorBreakdown.shutters.lines").length === 0) && (
                    <div className="text-center py-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          form.setValue("exteriorBreakdown.shutters.lines", [
                            { type: "", quantity: 0, unitPrice: 0, subtotal: 0 }
                          ]);
                        }}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add First Shutter Line
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Deck */}
            <div className="space-y-2">
              <FormField
                control={form.control}
                name="exteriorBreakdown.deck.enabled"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className="font-medium">Deck</FormLabel>
                      <p className="text-xs text-muted-foreground">Deck painting with custom pricing</p>
                    </div>
                  </FormItem>
                )}
              />
              
              {form.watch("exteriorBreakdown.deck.enabled") && (
                <div className="space-y-3 ml-6">
                  {/* Add Line Button */}
                  <div className="flex justify-end">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const currentLines = form.getValues("exteriorBreakdown.deck.lines") || [];
                        form.setValue("exteriorBreakdown.deck.lines", [
                          ...currentLines,
                          { quantity: 0, price: 0, subtotal: 0 }
                        ]);
                      }}
                      className="h-8"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add Line
                    </Button>
                  </div>

                  {/* Dynamic Lines */}
                  {(form.watch("exteriorBreakdown.deck.lines") || []).map((_, lineIndex) => (
                    <div key={lineIndex} className="border border-gray-200 rounded-lg p-3 space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Deck Line #{lineIndex + 1}</span>
                        {lineIndex > 0 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const currentLines = form.getValues("exteriorBreakdown.deck.lines") || [];
                              const newLines = currentLines.filter((_, i) => i !== lineIndex);
                              form.setValue("exteriorBreakdown.deck.lines", newLines);
                            }}
                            className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                      
                      {/* Quantity, Price and Subtotal */}
                      <div className="grid grid-cols-3 gap-2">
                        <FormField
                          control={form.control}
                          name={`exteriorBreakdown.deck.lines.${lineIndex}.quantity`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs">Quantity (sq ft)</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  step="0.01"
                                  placeholder="0"
                                  {...field}
                                  onChange={(e) => {
                                    const quantity = parseFloat(e.target.value) || 0;
                                    field.onChange(quantity);
                                    const lines = form.getValues("exteriorBreakdown.deck.lines") || [];
                                    if (lines[lineIndex]) {
                                      const price = lines[lineIndex].price || 0;
                                      form.setValue(`exteriorBreakdown.deck.lines.${lineIndex}.subtotal`, quantity * price);
                                    }
                                  }}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name={`exteriorBreakdown.deck.lines.${lineIndex}.price`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs">Price per sq ft ($)</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  step="0.01"
                                  placeholder="0.00"
                                  {...field}
                                  onChange={(e) => {
                                    const price = parseFloat(e.target.value) || 0;
                                    field.onChange(price);
                                    const lines = form.getValues("exteriorBreakdown.deck.lines") || [];
                                    if (lines[lineIndex]) {
                                      const quantity = lines[lineIndex].quantity || 0;
                                      form.setValue(`exteriorBreakdown.deck.lines.${lineIndex}.subtotal`, quantity * price);
                                    }
                                  }}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name={`exteriorBreakdown.deck.lines.${lineIndex}.subtotal`}
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
                  ))}

                  {/* Initialize with first line if none exist */}
                  {(!form.watch("exteriorBreakdown.deck.lines") || form.watch("exteriorBreakdown.deck.lines").length === 0) && (
                    <div className="text-center py-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          form.setValue("exteriorBreakdown.deck.lines", [
                            { quantity: 0, price: 0, subtotal: 0 }
                          ]);
                        }}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add First Deck Line
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Miscellaneous Expenses */}
            <div className="space-y-2">
              <FormField
                control={form.control}
                name="exteriorBreakdown.miscellaneous.enabled"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className="font-medium">Miscellaneous Expenses</FormLabel>
                      <p className="text-xs text-muted-foreground">Additional costs and miscellaneous items</p>
                    </div>
                  </FormItem>
                )}
              />
              
              {form.watch("exteriorBreakdown.miscellaneous.enabled") && (
                <div className="space-y-3 ml-6">
                  {/* Add Line Button */}
                  <div className="flex justify-end">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const currentLines = form.getValues("exteriorBreakdown.miscellaneous.lines") || [];
                        form.setValue("exteriorBreakdown.miscellaneous.lines", [
                          ...currentLines,
                          { description: "", price: 0 }
                        ]);
                      }}
                      className="h-8"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add Expense
                    </Button>
                  </div>

                  {/* Dynamic Lines */}
                  {(form.watch("exteriorBreakdown.miscellaneous.lines") || []).map((_, lineIndex) => (
                    <div key={lineIndex} className="border border-gray-200 rounded-lg p-3 space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Expense #{lineIndex + 1}</span>
                        {lineIndex > 0 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const currentLines = form.getValues("exteriorBreakdown.miscellaneous.lines") || [];
                              const newLines = currentLines.filter((_, i) => i !== lineIndex);
                              form.setValue("exteriorBreakdown.miscellaneous.lines", newLines);
                            }}
                            className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                      
                      {/* Description and Price */}
                      <div className="grid grid-cols-2 gap-3">
                        <FormField
                          control={form.control}
                          name={`exteriorBreakdown.miscellaneous.lines.${lineIndex}.description`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs">Description</FormLabel>
                              <FormControl>
                                <Input
                                  type="text"
                                  placeholder="Describe the expense..."
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name={`exteriorBreakdown.miscellaneous.lines.${lineIndex}.price`}
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
                                  }}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      {/* Show current price for reference */}
                      {form.watch(`exteriorBreakdown.miscellaneous.lines.${lineIndex}.price`) > 0 && (
                        <div className="text-xs text-muted-foreground bg-gray-50 p-2 rounded">
                          <strong>Cost:</strong> ${(form.watch(`exteriorBreakdown.miscellaneous.lines.${lineIndex}.price`) || 0).toFixed(2)}
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Initialize with first line if none exist */}
                  {(!form.watch("exteriorBreakdown.miscellaneous.lines") || form.watch("exteriorBreakdown.miscellaneous.lines").length === 0) && (
                    <div className="text-center py-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          form.setValue("exteriorBreakdown.miscellaneous.lines", [
                            { description: "", price: 0 }
                          ]);
                        }}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add First Expense
                      </Button>
                    </div>
                  )}
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

        {/* Breakdown Summary and Total Section */}
        <div className="bg-gray-50 p-4 rounded-lg border">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Resumen del Presupuesto</h3>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                // Calculate total from all breakdown items
                let total = 0;
                
                // Get current form values
                const formValues = form.getValues();
                const breakdown = formValues.exteriorBreakdown || {};
                
                // Boxes subtotal (multiply by 3 for soffit, facia, gutters)
                if (breakdown.boxes?.enabled) {
                  const boxesSubtotal = (breakdown.boxes?.quantity || 0) * (breakdown.boxes?.price || 0) * 3;
                  total += boxesSubtotal;
                  // Update the form value for display
                  form.setValue("exteriorBreakdown.boxes.subtotal", boxesSubtotal);
                }
                
                // Siding lines subtotal
                if (breakdown.siding?.enabled) {
                  const sidingLines = breakdown.siding?.lines || [];
                  sidingLines.forEach((line, index) => {
                    const lineSubtotal = (line.quantity || 0) * (line.price || 0);
                    total += lineSubtotal;
                    // Update the form value for display
                    form.setValue(`exteriorBreakdown.siding.lines.${index}.subtotal`, lineSubtotal);
                  });
                }
                
                // Dormer lines subtotal
                if (form.watch("exteriorBreakdown.dormer.enabled")) {
                  const dormerLines = form.getValues("exteriorBreakdown.dormer.lines") || [];
                  dormerLines.forEach(line => {
                    total += line.subtotal || 0;
                  });
                }
                
                // Chimney lines subtotal
                if (form.watch("exteriorBreakdown.chimney.enabled")) {
                  const chimneyLines = form.getValues("exteriorBreakdown.chimney.lines") || [];
                  chimneyLines.forEach(line => {
                    total += line.subtotal || 0;
                  });
                }
                
                // Porch columns and ceiling subtotal
                if (form.watch("exteriorBreakdown.porch.enabled")) {
                  if (form.watch("exteriorBreakdown.porch.columns.enabled")) {
                    total += form.getValues("exteriorBreakdown.porch.columns.subtotal") || 0;
                  }
                  if (form.watch("exteriorBreakdown.porch.ceiling.enabled")) {
                    total += form.getValues("exteriorBreakdown.porch.ceiling.subtotal") || 0;
                  }
                }
                
                // Windows lines subtotal
                if (form.watch("exteriorBreakdown.windows.enabled")) {
                  const windowLines = form.getValues("exteriorBreakdown.windows.lines") || [];
                  windowLines.forEach(line => {
                    total += line.subtotal || 0;
                  });
                }
                
                // Shutters lines subtotal
                if (form.watch("exteriorBreakdown.shutters.enabled")) {
                  const shutterLines = form.getValues("exteriorBreakdown.shutters.lines") || [];
                  shutterLines.forEach(line => {
                    total += line.subtotal || 0;
                  });
                }
                
                // Deck lines subtotal
                if (form.watch("exteriorBreakdown.deck.enabled")) {
                  const deckLines = form.getValues("exteriorBreakdown.deck.lines") || [];
                  deckLines.forEach(line => {
                    total += line.subtotal || 0;
                  });
                }
                
                // Miscellaneous expenses
                if (form.watch("exteriorBreakdown.miscellaneous.enabled")) {
                  const miscLines = form.getValues("exteriorBreakdown.miscellaneous.lines") || [];
                  miscLines.forEach(line => {
                    total += line.price || 0;
                  });
                }
                
                // Update the total
                form.setValue("totalEstimate", total);
                
                // Generate breakdown summary for scope of work
                let breakdownSummary = "Project Breakdown:\n\n";
                
                // Add each module to the breakdown
                if (form.watch("exteriorBreakdown.boxes.enabled") && form.getValues("exteriorBreakdown.boxes.subtotal") > 0) {
                  breakdownSummary += `• Boxes (Soffit, Facia, Gutters): $${(form.getValues("exteriorBreakdown.boxes.subtotal") || 0).toFixed(2)}\n`;
                }
                
                if (form.watch("exteriorBreakdown.siding.enabled")) {
                  const sidingLines = form.getValues("exteriorBreakdown.siding.lines") || [];
                  sidingLines.forEach((line, index) => {
                    if (line.subtotal > 0) {
                      breakdownSummary += `• Siding ${line.material ? `(${line.material})` : `Line #${index + 1}`}: $${(line.subtotal || 0).toFixed(2)}\n`;
                    }
                  });
                }
                
                if (form.watch("exteriorBreakdown.dormer.enabled")) {
                  const dormerLines = form.getValues("exteriorBreakdown.dormer.lines") || [];
                  dormerLines.forEach((line, index) => {
                    if (line.subtotal > 0) {
                      breakdownSummary += `• Dormer ${line.type ? `(${line.type})` : `Line #${index + 1}`}: $${(line.subtotal || 0).toFixed(2)}\n`;
                    }
                  });
                }
                
                if (form.watch("exteriorBreakdown.chimney.enabled")) {
                  const chimneyLines = form.getValues("exteriorBreakdown.chimney.lines") || [];
                  chimneyLines.forEach((line, index) => {
                    if (line.subtotal > 0) {
                      breakdownSummary += `• Chimney ${line.material ? `(${line.material})` : `Line #${index + 1}`}: $${(line.subtotal || 0).toFixed(2)}\n`;
                    }
                  });
                }
                
                if (form.watch("exteriorBreakdown.porch.enabled")) {
                  if (form.watch("exteriorBreakdown.porch.columns.enabled") && form.getValues("exteriorBreakdown.porch.columns.subtotal") > 0) {
                    breakdownSummary += `• Porch Columns: $${(form.getValues("exteriorBreakdown.porch.columns.subtotal") || 0).toFixed(2)}\n`;
                  }
                  if (form.watch("exteriorBreakdown.porch.ceiling.enabled") && form.getValues("exteriorBreakdown.porch.ceiling.subtotal") > 0) {
                    breakdownSummary += `• Porch Ceiling: $${(form.getValues("exteriorBreakdown.porch.ceiling.subtotal") || 0).toFixed(2)}\n`;
                  }
                }
                
                if (form.watch("exteriorBreakdown.windows.enabled")) {
                  const windowLines = form.getValues("exteriorBreakdown.windows.lines") || [];
                  windowLines.forEach((line, index) => {
                    if (line.subtotal > 0) {
                      breakdownSummary += `• Windows ${line.type && line.coats ? `(${line.type}, ${line.coats} coat${line.coats === '1' ? '' : 's'})` : `Line #${index + 1}`}: $${(line.subtotal || 0).toFixed(2)}\n`;
                    }
                  });
                }
                
                if (form.watch("exteriorBreakdown.shutters.enabled")) {
                  const shutterLines = form.getValues("exteriorBreakdown.shutters.lines") || [];
                  shutterLines.forEach((line, index) => {
                    if (line.subtotal > 0) {
                      breakdownSummary += `• Shutters ${line.type ? `(${line.type})` : `Line #${index + 1}`}: $${(line.subtotal || 0).toFixed(2)}\n`;
                    }
                  });
                }
                
                if (form.watch("exteriorBreakdown.deck.enabled")) {
                  const deckLines = form.getValues("exteriorBreakdown.deck.lines") || [];
                  deckLines.forEach((line, index) => {
                    if (line.subtotal > 0) {
                      breakdownSummary += `• Deck Line #${index + 1}: $${(line.subtotal || 0).toFixed(2)}\n`;
                    }
                  });
                }
                
                if (form.watch("exteriorBreakdown.miscellaneous.enabled")) {
                  const miscLines = form.getValues("exteriorBreakdown.miscellaneous.lines") || [];
                  miscLines.forEach((line, index) => {
                    if (line.price > 0) {
                      breakdownSummary += `• ${line.description || `Miscellaneous Expense #${index + 1}`}: $${(line.price || 0).toFixed(2)}\n`;
                    }
                  });
                }
                
                breakdownSummary += `\nTOTAL PROJECT COST: $${total.toFixed(2)}`;
                
                // Add optional comments if selected
                let optionalComments = "";
                const comments = form.getValues("optionalComments") || {};
                
                if (comments.prep) {
                  optionalComments += "\n• Prep: Power washing as needed, scraping and sanding, removing old caulk and re-caulking gaps.";
                }
                if (comments.primer) {
                  optionalComments += "\n• Prime: Apply high-quality primer to all surfaces to ensure proper paint adhesion.";
                }
                if (comments.protection) {
                  optionalComments += "\n• Protection: Cover and protect all landscaping, walkways, and adjacent surfaces.";
                }
                if (comments.cleanup) {
                  optionalComments += "\n• Clean-up: Complete site clean-up and proper disposal of all materials.";
                }
                if (comments.warranty) {
                  optionalComments += "\n• Warranty: 2-year warranty on workmanship and materials against defects.";
                }
                
                if (optionalComments) {
                  breakdownSummary += "\n\nAdditional Services:" + optionalComments;
                }
                
                // Get current scope of work
                const currentScope = form.getValues("scopeOfWork") || "";
                
                // Add the breakdown to scope of work (append or replace if already exists)
                const hasBreakdown = currentScope.includes("Project Breakdown:");
                let newScope;
                
                if (hasBreakdown) {
                  // Replace existing breakdown
                  const beforeBreakdown = currentScope.split("Project Breakdown:")[0].trim();
                  newScope = beforeBreakdown ? beforeBreakdown + "\n\n" + breakdownSummary : breakdownSummary;
                } else {
                  // Append to existing scope
                  newScope = currentScope ? currentScope + "\n\n" + breakdownSummary : breakdownSummary;
                }
                
                form.setValue("scopeOfWork", newScope);
              }}
              className="h-8"
            >
              Calculate Total
            </Button>
          </div>
          
          {/* Breakdown details */}
          <div className="space-y-2 mb-4">
            {/* Boxes breakdown */}
            {form.watch("exteriorBreakdown.boxes.enabled") && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Boxes (Soffit, Facia, Gutters):</span>
                <span className="font-medium">${(form.watch("exteriorBreakdown.boxes.subtotal") || 0).toFixed(2)}</span>
              </div>
            )}
            
            {/* Siding breakdown */}
            {form.watch("exteriorBreakdown.siding.enabled") && form.watch("exteriorBreakdown.siding.lines") && (
              <>
                {form.watch("exteriorBreakdown.siding.lines").map((line, index) => (
                  line.subtotal > 0 && (
                    <div key={index} className="flex justify-between text-sm">
                      <span className="text-gray-600">Siding Line #{index + 1}:</span>
                      <span className="font-medium">${(line.subtotal || 0).toFixed(2)}</span>
                    </div>
                  )
                ))}
              </>
            )}
            
            {/* Windows breakdown */}
            {form.watch("exteriorBreakdown.windows.enabled") && form.watch("exteriorBreakdown.windows.lines") && (
              <>
                {form.watch("exteriorBreakdown.windows.lines").map((line, index) => (
                  line.subtotal > 0 && (
                    <div key={index} className="flex justify-between text-sm">
                      <span className="text-gray-600">Window Line #{index + 1}:</span>
                      <span className="font-medium">${(line.subtotal || 0).toFixed(2)}</span>
                    </div>
                  )
                ))}
              </>
            )}
            
            {/* Shutters breakdown */}
            {form.watch("exteriorBreakdown.shutters.enabled") && form.watch("exteriorBreakdown.shutters.lines") && (
              <>
                {form.watch("exteriorBreakdown.shutters.lines").map((line, index) => (
                  line.subtotal > 0 && (
                    <div key={index} className="flex justify-between text-sm">
                      <span className="text-gray-600">Shutter Line #{index + 1}:</span>
                      <span className="font-medium">${(line.subtotal || 0).toFixed(2)}</span>
                    </div>
                  )
                ))}
              </>
            )}
            
            {/* Deck breakdown */}
            {form.watch("exteriorBreakdown.deck.enabled") && form.watch("exteriorBreakdown.deck.lines") && (
              <>
                {form.watch("exteriorBreakdown.deck.lines").map((line, index) => (
                  line.subtotal > 0 && (
                    <div key={index} className="flex justify-between text-sm">
                      <span className="text-gray-600">Deck Line #{index + 1}:</span>
                      <span className="font-medium">${(line.subtotal || 0).toFixed(2)}</span>
                    </div>
                  )
                ))}
              </>
            )}
            
            {/* Miscellaneous expenses breakdown */}
            {form.watch("exteriorBreakdown.miscellaneous.enabled") && form.watch("exteriorBreakdown.miscellaneous.lines") && (
              <>
                {form.watch("exteriorBreakdown.miscellaneous.lines").map((line, index) => (
                  line.price > 0 && (
                    <div key={index} className="flex justify-between text-sm">
                      <span className="text-gray-600">{line.description || `Misc Expense #${index + 1}`}:</span>
                      <span className="font-medium">${(line.price || 0).toFixed(2)}</span>
                    </div>
                  )
                ))}
              </>
            )}
            
            {/* Porch breakdown */}
            {form.watch("exteriorBreakdown.porch.enabled") && (
              <>
                {form.watch("exteriorBreakdown.porch.columns.enabled") && form.watch("exteriorBreakdown.porch.columns.subtotal") > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Porch Columns:</span>
                    <span className="font-medium">${(form.watch("exteriorBreakdown.porch.columns.subtotal") || 0).toFixed(2)}</span>
                  </div>
                )}
                {form.watch("exteriorBreakdown.porch.ceiling.enabled") && form.watch("exteriorBreakdown.porch.ceiling.subtotal") > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Porch Ceiling:</span>
                    <span className="font-medium">${(form.watch("exteriorBreakdown.porch.ceiling.subtotal") || 0).toFixed(2)}</span>
                  </div>
                )}
              </>
            )}
          </div>
          
          <div className="border-t pt-3">
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold text-gray-800">Total del Proyecto:</span>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-500">$</span>
                <FormField
                  control={form.control}
                  name="totalEstimate"
                  render={({ field }) => (
                    <Input
                      type="number"
                      step="0.01"
                      className="w-32 text-right font-semibold text-lg"
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    />
                  )}
                />
              </div>
            </div>
            <div className="text-xs text-gray-500 mt-2">
              Use "Calculate Total" para sumar automáticamente todos los subtotales, o edite el total manualmente
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