import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Minus } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

// Define the schema for the form
const simpleQuoteSchema = z.object({
  projectId: z.number(),
  projectType: z.literal("residential"),
  totalEstimate: z.number().min(0),
  scopeOfWork: z.string(),
  isInterior: z.boolean().default(false),
  isExterior: z.boolean().default(false),
  isSpecialRequirements: z.boolean().default(false),
  exteriorBreakdown: z.object({
    boxes: z.object({
      enabled: z.boolean().default(false),
      quantity: z.number().default(0),
      price: z.number().default(0),
      subtotal: z.number().default(0),
    }),
  }),
  optionalComments: z.object({
    prep: z.boolean().default(false),
    primer: z.boolean().default(false),
    protection: z.boolean().default(false),
    cleanup: z.boolean().default(false),
    warranty: z.boolean().default(false),
  }).optional(),
});

type SimpleQuoteFormData = z.infer<typeof simpleQuoteSchema>;

interface SimpleQuoteFormProps {
  initialData?: any;
  onSuccess: () => void;
}

export function SimpleQuoteForm({ initialData, onSuccess }: SimpleQuoteFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<SimpleQuoteFormData>({
    resolver: zodResolver(simpleQuoteSchema),
    defaultValues: {
      projectId: initialData?.projectId || 0,
      projectType: "residential" as const,
      totalEstimate: initialData?.totalEstimate || 0,
      scopeOfWork: initialData?.scopeOfWork || "",
      isInterior: initialData?.isInterior || false,
      isExterior: initialData?.isExterior || false,
      isSpecialRequirements: initialData?.isSpecialRequirements || false,
      exteriorBreakdown: {
        boxes: {
          enabled: false,
          quantity: 0,
          price: 0,
          subtotal: 0,
        },
      },
      optionalComments: {
        prep: false,
        primer: false,
        protection: false,
        cleanup: false,
        warranty: false,
      },
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: SimpleQuoteFormData) => {
      const response = await apiRequest("POST", "/api/simple-quotes", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Quote created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/simple-quotes"] });
      onSuccess();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: SimpleQuoteFormData) => {
      const response = await apiRequest("PUT", `/api/simple-quotes/${initialData.id}`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Quote updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/simple-quotes"] });
      onSuccess();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: SimpleQuoteFormData) => {
    if (initialData?.id) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const calculateTotal = () => {
    try {
      const formData = form.getValues();
      let total = 0;

      // Calculate exterior modules
      if (formData.exteriorBreakdown?.boxes?.enabled) {
        const boxesTotal = (formData.exteriorBreakdown.boxes.quantity || 0) * (formData.exteriorBreakdown.boxes.price || 0);
        form.setValue("exteriorBreakdown.boxes.subtotal", boxesTotal);
        total += boxesTotal;
      }

      // Update total
      form.setValue("totalEstimate", total);

      // Generate breakdown summary
      let breakdownSummary = "Project Breakdown:\n\n";
      
      if (formData.exteriorBreakdown?.boxes?.enabled && formData.exteriorBreakdown.boxes.subtotal > 0) {
        breakdownSummary += `• Boxes (Soffit, Facia, Gutters): $${formData.exteriorBreakdown.boxes.subtotal.toFixed(2)}\n`;
      }

      breakdownSummary += `\nTOTAL PROJECT COST: $${total.toFixed(2)}`;

      // Add optional comments
      const comments = formData.optionalComments || {};
      let optionalComments = "";

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

      // Update scope of work
      const currentScope = formData.scopeOfWork || "";
      const hasBreakdown = currentScope.includes("Project Breakdown:");
      let newScope;

      if (hasBreakdown) {
        const beforeBreakdown = currentScope.split("Project Breakdown:")[0].trim();
        newScope = beforeBreakdown ? beforeBreakdown + "\n\n" + breakdownSummary : breakdownSummary;
      } else {
        newScope = currentScope ? currentScope + "\n\n" + breakdownSummary : breakdownSummary;
      }

      form.setValue("scopeOfWork", newScope);

      toast({
        title: "Success",
        description: "Total calculated successfully",
      });
    } catch (error) {
      console.error("Error calculating total:", error);
      toast({
        title: "Error",
        description: "Failed to calculate total",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Quote Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="projectId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Project ID</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        />
                      </FormControl>
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
                        placeholder="Describe the work to be performed..."
                        className="min-h-[120px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Project Type Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Project Type</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-6">
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
                      </div>
                    </FormItem>
                  )}
                />

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
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="isSpecialRequirements"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Special Requirements</FormLabel>
                      </div>
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Exterior Module */}
          {form.watch("isExterior") && (
            <Card>
              <CardHeader>
                <CardTitle>Exterior Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
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
                          <FormLabel>Boxes (Soffit, Facia, Gutters)</FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />

                  {form.watch("exteriorBreakdown.boxes.enabled") && (
                    <div className="grid gap-4 md:grid-cols-3 ml-6">
                      <FormField
                        control={form.control}
                        name="exteriorBreakdown.boxes.quantity"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Quantity</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
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
                        name="exteriorBreakdown.boxes.price"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Price per Unit ($)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
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
                        name="exteriorBreakdown.boxes.subtotal"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Subtotal ($)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                step="0.01"
                                {...field}
                                readOnly
                                className="bg-gray-50"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Optional Comments */}
          <Card>
            <CardHeader>
              <CardTitle>Optional Comments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
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
                        <FormLabel>Prep Work</FormLabel>
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
                        <FormLabel>Primer Application</FormLabel>
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
                        <FormLabel>Surface Protection</FormLabel>
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
                        <FormLabel>Site Cleanup</FormLabel>
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
                        <FormLabel>2-Year Warranty</FormLabel>
                      </div>
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Calculate Total Button */}
          <div className="flex justify-center">
            <Button
              type="button"
              variant="outline"
              onClick={calculateTotal}
              className="w-auto px-8"
            >
              Calculate Total
            </Button>
          </div>

          {/* Submit Button */}
          <div className="flex gap-4 pt-6">
            <Button
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending}
              className="flex-1"
            >
              {createMutation.isPending || updateMutation.isPending
                ? "Saving..."
                : initialData?.id
                ? "Update Quote"
                : "Create Quote"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}