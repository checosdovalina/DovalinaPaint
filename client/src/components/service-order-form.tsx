import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { insertServiceOrderSchema } from "@shared/schema";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarIcon, HardHat, Briefcase } from "lucide-react";
import { format } from "date-fns";
import { enUS } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { StaffAssignment } from "@/components/staff-assignment";
import { ImageUpload } from "@/components/ui/image-upload";

// Extend the schema to handle the form
const formSchema = insertServiceOrderSchema
  .extend({
    startDate: z.union([z.date(), z.string(), z.null()]).nullable().optional(),
    endDate: z.union([z.date(), z.string(), z.null()]).nullable().optional(),
    dueDate: z.union([z.date(), z.string(), z.null()]).nullable().optional(),
    materialsRequired: z.union([z.string(), z.null()]).nullable().optional(),
    specialInstructions: z.union([z.string(), z.null()]).nullable().optional(),
    safetyRequirements: z.union([z.string(), z.null()]).nullable().optional(),
    assignedTo: z.union([z.number(), z.null()]).nullable().optional(),
    assignedType: z.enum(["staff", "subcontractor"]).optional(),
  })
  .omit({ assignedStaff: true });

type ServiceOrderFormValues = z.infer<typeof formSchema>;

interface ServiceOrderFormProps {
  initialData?: ServiceOrderFormValues & { id?: number; assignedStaff?: number[] };
  onSuccess: () => void;
}

export function ServiceOrderForm({ initialData, onSuccess }: ServiceOrderFormProps) {
  const { toast } = useToast();
  const [assignedStaff, setAssignedStaff] = useState<number[]>(
    initialData?.assignedStaff || []
  );
  const [beforeImages, setBeforeImages] = useState<string[]>(
    initialData?.beforeImages as string[] || []
  );
  const [afterImages, setAfterImages] = useState<string[]>(
    initialData?.afterImages as string[] || []
  );

  // Fetch projects for the dropdown
  const { data: projects } = useQuery({
    queryKey: ["/api/projects"],
    queryFn: async () => {
      const res = await fetch("/api/projects");
      if (!res.ok) throw new Error("Failed to fetch projects");
      return res.json();
    },
  });
  
  // Fetch subcontractors for the dropdown
  const { data: subcontractors } = useQuery({
    queryKey: ["/api/subcontractors"],
    queryFn: async () => {
      const res = await fetch("/api/subcontractors");
      if (!res.ok) throw new Error("Failed to fetch subcontractors");
      return res.json();
    },
  });
  
  // Fetch staff for the supervisor dropdown
  const { data: staffMembers } = useQuery({
    queryKey: ["/api/staff"],
    queryFn: async () => {
      const res = await fetch("/api/staff");
      if (!res.ok) throw new Error("Failed to fetch staff members");
      return res.json();
    },
  });

  const form = useForm<ServiceOrderFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData || {
      details: "",
      status: "pending",
    },
  });

  // Create or update mutation
  const mutation = useMutation({
    mutationFn: async (data: ServiceOrderFormValues) => {
      // Prepare the data - parse empty strings as null
      const serviceOrderData = {
        ...data,
        assignedStaff,
        beforeImages,
        afterImages,
        assignedSubcontractorId: data.assignedSubcontractorId ? data.assignedSubcontractorId : null,
        supervisorId: data.supervisorId ? data.supervisorId : null,
      };

      if (initialData?.id) {
        // Update
        return apiRequest("PUT", `/api/service-orders/${initialData.id}`, serviceOrderData);
      } else {
        // Create
        return apiRequest("POST", "/api/service-orders", serviceOrderData);
      }
    },
    onSuccess: () => {
      toast({
        title: initialData?.id
          ? "Service order updated"
          : "Service order created",
        description: initialData?.id
          ? "The service order has been successfully updated"
          : "The service order has been successfully created",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/service-orders"] });
      onSuccess();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Could not ${initialData?.id ? "update" : "create"} service order: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ServiceOrderFormValues) => {
    mutation.mutate(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 max-h-[90vh] overflow-y-auto pb-4">
        <FormField
          control={form.control}
          name="projectId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Project</FormLabel>
              <Select
                onValueChange={(value) => field.onChange(parseInt(value))}
                defaultValue={field.value?.toString()}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a project" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {projects?.map((project: any) => (
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
          name="details"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Details</FormLabel>
              <FormControl>
                <div className="flex flex-col">
                  <Textarea
                    placeholder="Specific details about the work to be done"
                    {...field}
                    rows={5}
                  />
                  <div className="mt-1 text-xs text-gray-500">
                    <p>Formato:</p>
                    <ul className="list-disc ml-4">
                      <li>Inicie cada punto de la lista con "•", "-", "*" o "✓"</li>
                      <li>Cada línea nueva creará un párrafo separado</li>
                      <li>Ejemplo: "✓ Preparar superficie\n✓ Aplicar primera capa"</li>
                    </ul>
                  </div>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="language"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Language</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value || "english"}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select language" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="english">English</SelectItem>
                    <SelectItem value="spanish">Español</SelectItem>
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
            name="assignedType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Assignment Type</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value || "staff"}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select assignment type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="staff">Internal Staff</SelectItem>
                    <SelectItem value="subcontractor">Subcontractor</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {form.watch("assignedType") === "subcontractor" ? (
            <FormField
              control={form.control}
              name="assignedTo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-1.5">
                    <Briefcase className="h-4 w-4" />
                    Assigned Subcontractor
                  </FormLabel>
                  <Select
                    onValueChange={(value) => field.onChange(parseInt(value))}
                    defaultValue={field.value?.toString()}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a subcontractor" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="0">None</SelectItem>
                      {subcontractors?.map((subcontractor: any) => (
                        <SelectItem key={subcontractor.id} value={subcontractor.id.toString()}>
                          {subcontractor.company}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          ) : (
            <FormField
              control={form.control}
              name="assignedTo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-1.5">
                    <HardHat className="h-4 w-4" />
                    Assigned Responsible
                  </FormLabel>
                  <Select
                    onValueChange={(value) => field.onChange(parseInt(value))}
                    defaultValue={field.value?.toString()}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a responsible person" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="0">None</SelectItem>
                      {staffMembers?.map((staff: any) => (
                        <SelectItem key={staff.id} value={staff.id.toString()}>
                          {staff.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="assignedSubcontractorId"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-1.5">
                  <Briefcase className="h-4 w-4" />
                  Support Subcontractor
                </FormLabel>
                <Select
                  onValueChange={(value) => field.onChange(parseInt(value))}
                  defaultValue={field.value?.toString()}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a subcontractor" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="0">None</SelectItem>
                    {subcontractors?.map((subcontractor: any) => (
                      <SelectItem key={subcontractor.id} value={subcontractor.id.toString()}>
                        {subcontractor.company}
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
            name="supervisorId"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-1.5">
                  <HardHat className="h-4 w-4" />
                  Supervisor
                </FormLabel>
                <Select
                  onValueChange={(value) => field.onChange(parseInt(value))}
                  defaultValue={field.value?.toString()}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a supervisor" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="0">None</SelectItem>
                    {staffMembers?.map((staff: any) => (
                      <SelectItem key={staff.id} value={staff.id.toString()}>
                        {staff.name}
                      </SelectItem>
                    ))}
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
            name="startDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Start Date</FormLabel>
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
                          format(field.value, "PPP", { locale: enUS })
                        ) : (
                          <span>Select a date</span>
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
            name="endDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Completion Date</FormLabel>
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
                          format(field.value, "PPP", { locale: enUS })
                        ) : (
                          <span>Select a date</span>
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
            name="dueDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Due Date</FormLabel>
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
                          format(field.value, "PPP", { locale: enUS })
                        ) : (
                          <span>Select a date</span>
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
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 gap-4">
          <FormField
            control={form.control}
            name="materialsRequired"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Required Materials</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="List required materials for the job"
                    {...field}
                    value={field.value || ""}
                    rows={3}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="specialInstructions"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Special Instructions</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Include special instructions for the work team"
                    {...field}
                    value={field.value || ""}
                    rows={3}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="safetyRequirements"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Safety Requirements</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Specify necessary safety requirements"
                    {...field}
                    value={field.value || ""}
                    rows={3}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div>
          <FormLabel>Assigned Staff</FormLabel>
          <StaffAssignment
            selectedStaff={assignedStaff}
            onChange={setAssignedStaff}
          />
        </div>

        <div className="border-t mt-6 pt-6">
          <h3 className="text-lg font-medium mb-3">Project Images</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ImageUpload
              label="Before Images"
              value={beforeImages}
              onChange={setBeforeImages}
              multiple={true}
            />
            
            <ImageUpload
              label="After Images"
              value={afterImages}
              onChange={setAfterImages}
              multiple={true}
            />
          </div>
        </div>

        <div className="flex justify-end space-x-2">
          <Button
            type="button"
            variant="outline"
            onClick={onSuccess}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={mutation.isPending}
          >
            {mutation.isPending
              ? "Saving..."
              : initialData?.id
              ? "Update Service Order"
              : "Create Service Order"}
          </Button>
        </div>
      </form>
    </Form>
  );
}