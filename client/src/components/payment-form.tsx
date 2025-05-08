import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { z } from "zod";
import { useEffect, useState } from "react";
import { ChevronsUpDown, Check, CalendarIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

const paymentSchema = z.object({
  amount: z.string().refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
    message: "Amount must be a positive number",
  }),
  date: z.date({
    required_error: "Payment date is required",
  }),
  description: z.string().min(1, { message: "Description is required" }),
  method: z.string().min(1, { message: "Payment method is required" }),
  status: z.string().min(1, { message: "Status is required" }),
  recipientType: z.string().min(1, { message: "Recipient type is required" }),
  recipientId: z.number({
    required_error: "Recipient is required",
  }),
  projectId: z.number().nullable().optional(),
  invoiceId: z.number().nullable().optional(),
  reference: z.string().optional(),
});

type PaymentFormData = z.infer<typeof paymentSchema>;

interface PaymentFormProps {
  payment?: any;
  onComplete: () => void;
}

export default function PaymentForm({ payment, onComplete }: PaymentFormProps) {
  const { toast } = useToast();
  const [recipientType, setRecipientType] = useState<string>(payment?.recipientType || "staff");
  const [selectedProject, setSelectedProject] = useState<number | null>(payment?.projectId || null);
  
  // Fetch projects for dropdown
  const { data: projects = [] } = useQuery({
    queryKey: ["/api/projects"],
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
  
  // Fetch staff for dropdown
  const { data: staff = [] } = useQuery({
    queryKey: ["/api/staff"],
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
  
  // Fetch subcontractors for dropdown
  const { data: subcontractors = [] } = useQuery({
    queryKey: ["/api/subcontractors"],
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
  
  // Fetch suppliers for dropdown
  const { data: suppliers = [] } = useQuery({
    queryKey: ["/api/suppliers"],
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  const form = useForm<PaymentFormData>({
    resolver: zodResolver(paymentSchema),
    defaultValues: payment ? {
      amount: payment.amount.toString(),
      date: new Date(payment.date),
      description: payment.description,
      method: payment.method,
      status: payment.status,
      recipientType: payment.recipientType,
      recipientId: payment.recipientId,
      projectId: payment.projectId,
      invoiceId: payment.invoiceId,
      reference: payment.reference || "",
    } : {
      amount: "",
      date: new Date(),
      description: "",
      method: "check",
      status: "completed",
      recipientType: "staff",
      recipientId: 0,
      projectId: null,
      invoiceId: null,
      reference: "",
    }
  });

  // Update form when recipientType changes
  useEffect(() => {
    form.setValue("recipientType", recipientType);
    form.setValue("recipientId", 0); // Reset the recipient when type changes
  }, [recipientType, form]);

  // Update form when selectedProject changes
  useEffect(() => {
    form.setValue("projectId", selectedProject);
  }, [selectedProject, form]);

  const createMutation = useMutation({
    mutationFn: async (data: PaymentFormData) => {
      // Convert amount from string to number
      const paymentData = {
        ...data,
        amount: parseFloat(data.amount),
      };
      
      const res = await apiRequest("POST", "/api/payments", paymentData);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to create payment");
      }
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Payment created",
        description: "The payment has been created successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/payments"] });
      onComplete();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const updateMutation = useMutation({
    mutationFn: async (data: PaymentFormData) => {
      // Convert amount from string to number
      const paymentData = {
        ...data,
        amount: parseFloat(data.amount),
      };
      
      const res = await apiRequest("PATCH", `/api/payments/${payment.id}`, paymentData);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to update payment");
      }
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Payment updated",
        description: "The payment has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/payments"] });
      onComplete();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const onSubmit = (data: PaymentFormData) => {
    if (payment) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  // Get recipients based on type
  const getRecipients = () => {
    switch (recipientType) {
      case "staff":
        return staff;
      case "subcontractor":
        return subcontractors;
      case "supplier":
        return suppliers;
      default:
        return [];
    }
  };

  // Get recipient name by ID
  const getRecipientName = (id: number) => {
    const recipients = getRecipients();
    const recipient = recipients.find((r: any) => r.id === id);
    return recipient ? recipient.name : "Unknown Recipient";
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Amount ($)</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    step="0.01" 
                    min="0" 
                    placeholder="0.00" 
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Payment Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) =>
                        date > new Date() || date < new Date("1900-01-01")
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Payment description..." 
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="method"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Payment Method</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select payment method" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="check">Check</SelectItem>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="credit_card">Credit Card</SelectItem>
                    <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                    <SelectItem value="paypal">PayPal</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
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
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select payment status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="recipientType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Recipient Type</FormLabel>
                <Select
                  onValueChange={(value) => {
                    field.onChange(value);
                    setRecipientType(value);
                  }}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select recipient type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="staff">Staff</SelectItem>
                    <SelectItem value="subcontractor">Subcontractor</SelectItem>
                    <SelectItem value="supplier">Supplier</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="recipientId"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Recipient</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        role="combobox"
                        className={cn(
                          "w-full justify-between",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value
                          ? getRecipientName(field.value)
                          : "Select recipient"}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0">
                    <Command>
                      <CommandInput placeholder={`Search ${recipientType}...`} />
                      <CommandEmpty>No {recipientType} found.</CommandEmpty>
                      <CommandGroup>
                        {getRecipients().map((recipient: any) => (
                          <CommandItem
                            key={recipient.id}
                            value={recipient.name}
                            onSelect={() => {
                              form.setValue("recipientId", recipient.id);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                recipient.id === field.value
                                  ? "opacity-100"
                                  : "opacity-0"
                              )}
                            />
                            {recipient.name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </Command>
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="projectId"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Project (Optional)</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant="outline"
                      role="combobox"
                      className={cn(
                        "w-full justify-between",
                        !field.value && "text-muted-foreground"
                      )}
                      onClick={() => {
                        if (field.value === null) {
                          setSelectedProject(null);
                        }
                      }}
                    >
                      {field.value
                        ? projects.find((project: any) => project.id === field.value)?.title || "Unknown Project"
                        : "Select project (optional)"}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0">
                  <Command>
                    <CommandInput placeholder="Search projects..." />
                    <CommandEmpty>No projects found.</CommandEmpty>
                    <CommandGroup>
                      {projects.map((project: any) => (
                        <CommandItem
                          key={project.id}
                          value={project.title}
                          onSelect={() => {
                            setSelectedProject(project.id);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              project.id === field.value
                                ? "opacity-100"
                                : "opacity-0"
                            )}
                          />
                          {project.title}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </Command>
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="reference"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Reference Number (Optional)</FormLabel>
              <FormControl>
                <Input 
                  placeholder="e.g., Check #1234, Transaction ID, etc." 
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2 pt-4">
          <Button 
            type="button" 
            variant="outline" 
            onClick={onComplete}
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={createMutation.isPending || updateMutation.isPending}
          >
            {createMutation.isPending || updateMutation.isPending ? "Saving..." : payment ? "Update Payment" : "Create Payment"}
          </Button>
        </div>
      </form>
    </Form>
  );
}