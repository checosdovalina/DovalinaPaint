import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { insertProjectSchema } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
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
import { Calendar as CalendarIcon, Upload, X, FileText, Image, Users } from "lucide-react";
import { format } from "date-fns";
import { enUS } from "date-fns/locale";
import { StaffAssignment } from "@/components/staff-assignment";
import { ImageUpload } from "@/components/ui/image-upload";
import { ClientForm } from "@/components/client-form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// Extend the schema to handle the form
const formSchema = insertProjectSchema
  .extend({
    startDate: z.date().optional(),
    dueDate: z.date().optional(),
  })
  .omit({ 
    assignedStaff: true,
    images: true,
    documents: true
  });

type ProjectFormValues = z.infer<typeof formSchema>;

interface ProjectFormProps {
  initialData?: ProjectFormValues & { id?: number; assignedStaff?: number[] };
  onSuccess: () => void;
}

export function ProjectForm({ initialData, onSuccess }: ProjectFormProps) {
  const { toast } = useToast();
  const [assignedStaff, setAssignedStaff] = useState<number[]>(
    initialData?.assignedStaff || []
  );
  const [images, setImages] = useState<string[]>(
    initialData?.images as string[] || []
  );
  const [documents, setDocuments] = useState<any[]>(
    initialData?.documents as any[] || []
  );
  const [showClientForm, setShowClientForm] = useState(false);

  // Fetch clients for the dropdown
  const { data: clients } = useQuery({
    queryKey: ["/api/clients"],
    queryFn: async () => {
      const res = await fetch("/api/clients");
      if (!res.ok) throw new Error("Failed to fetch clients");
      return res.json();
    },
  });

  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData || {
      title: "",
      description: "",
      address: "",
      serviceType: "",
      status: "pending",
      priority: "medium",
      progress: 0,
    },
  });

  // Create or update mutation
  const mutation = useMutation({
    mutationFn: async (data: ProjectFormValues) => {
      // Include images and documents in the submission
      const projectData = {
        ...data,
        assignedStaff,
        images,
        documents,
      };

      console.log("Project mutation data:", projectData);
      console.log("Is update?", !!initialData?.id);
      console.log("Initial data:", initialData);

      if (initialData?.id) {
        // Update
        console.log("Making PUT request to:", `/api/projects/${initialData.id}`);
        return apiRequest("PUT", `/api/projects/${initialData.id}`, projectData);
      } else {
        // Create
        console.log("Making POST request to:", "/api/projects");
        return apiRequest("POST", "/api/projects", projectData);
      }
    },
    onSuccess: () => {
      toast({
        title: initialData?.id
          ? "Project updated"
          : "Project created",
        description: initialData?.id
          ? "The project has been successfully updated"
          : "The project has been successfully created",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      onSuccess();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Could not ${initialData?.id ? "update" : "create"} project: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ProjectFormValues) => {
    // Asegurarse de que las fechas sean instancias de Date antes de enviarlas
    // El backend espera objetos Date, no strings
    mutation.mutate({
      ...data,
      startDate: data.startDate instanceof Date ? data.startDate : undefined,
      dueDate: data.dueDate instanceof Date ? data.dueDate : undefined,
      assignedStaff,
      images,
      documents,
    });
  };

  const handleClientCreated = () => {
    setShowClientForm(false);
    queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
    toast({
      title: "Success",
      description: "Client created successfully",
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Project Title</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Paint House Torres Family" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="clientId"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center justify-between">
                  <FormLabel>Client</FormLabel>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowClientForm(true)}
                    className="h-8 px-2"
                  >
                    <Users className="h-3 w-3 mr-1" />
                    New Client
                  </Button>
                </div>
                <Select
                  onValueChange={(value) => {
                    const clientId = parseInt(value);
                    field.onChange(clientId);
                    
                    // Auto-populate address when client is selected
                    const selectedClient = clients?.find((client: any) => client.id === clientId);
                    if (selectedClient?.address) {
                      form.setValue('address', selectedClient.address);
                    }
                  }}
                  value={field.value?.toString()}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a client" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {clients?.map((client: any) => (
                      <SelectItem key={client.id} value={client.id.toString()}>
                        {client.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                  placeholder="Describe the project and its details"
                  {...field}
                />
              </FormControl>
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
                <Input
                  placeholder="Complete project address"
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
            name="serviceType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Service Type</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select service type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Interior Painting">Interior Painting</SelectItem>
                    <SelectItem value="Exterior Painting">Exterior Painting</SelectItem>
                    <SelectItem value="Interior and Exterior Painting">Interior and Exterior Painting</SelectItem>
                    <SelectItem value="Industrial Painting">Industrial Painting</SelectItem>
                    <SelectItem value="Commercial Painting">Commercial Painting</SelectItem>
                    <SelectItem value="Residential Painting">Residential Painting</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="projectType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Project Type</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select project type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="residential">Residential</SelectItem>
                    <SelectItem value="commercial">Commercial</SelectItem>
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
            name="priority"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Priority</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
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
                    <SelectItem value="pending">Pending Visit</SelectItem>
                    <SelectItem value="quoted">Quote Sent</SelectItem>
                    <SelectItem value="approved">Quote Approved</SelectItem>
                    <SelectItem value="preparing">In Preparation</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="reviewing">Final Review</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="progress"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Progress (%)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    {...field}
                    onChange={(e) => field.onChange(parseInt(e.target.value || "0"))}
                  />
                </FormControl>
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

        {/* Project Images Section */}
        <div className="space-y-4">
          <FormLabel className="text-base font-semibold">Project Images</FormLabel>
          <div className="grid gap-4">
            <ImageUpload
              value={images}
              onChange={setImages}
              label="Upload images"
            />
          </div>
        </div>

        {/* Project Documents Section */}
        <div className="space-y-4">
          <FormLabel className="text-base font-semibold">Project Documents</FormLabel>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
            <div className="text-center">
              <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <div className="flex flex-col items-center">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.multiple = true;
                    input.accept = '.pdf,.doc,.docx,.txt,.xls,.xlsx';
                    input.onchange = (e) => {
                      const files = Array.from((e.target as HTMLInputElement).files || []);
                      const newDocs = files.map(file => ({
                        name: file.name,
                        size: file.size,
                        type: file.type,
                        url: URL.createObjectURL(file)
                      }));
                      setDocuments([...documents, ...newDocs]);
                    };
                    input.click();
                  }}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Documents
                </Button>
                <p className="text-sm text-gray-500 mt-2">
                  PDF, DOC, DOCX, TXT, XLS, XLSX (max. 10MB per file)
                </p>
              </div>
            </div>
            
            {/* Display uploaded documents */}
            {documents.length > 0 && (
              <div className="mt-4 space-y-2">
                <h4 className="font-medium text-sm text-gray-700">Uploaded documents:</h4>
                {documents.map((doc, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <div className="flex items-center space-x-2">
                      <FileText className="h-4 w-4 text-gray-500" />
                      <span className="text-sm">{doc.name}</span>
                      <span className="text-xs text-gray-400">
                        ({Math.round(doc.size / 1024)} KB)
                      </span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setDocuments(documents.filter((_, i) => i !== index));
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div>
          <FormLabel>Assigned Staff</FormLabel>
          <StaffAssignment
            selectedStaff={assignedStaff}
            onChange={setAssignedStaff}
          />
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
              ? "Update Project"
              : "Create Project"}
          </Button>
        </div>
      </form>

      {/* Client Creation Modal */}
      <Dialog open={showClientForm} onOpenChange={setShowClientForm}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create New Client</DialogTitle>
            <DialogDescription>
              Add a new client to the system
            </DialogDescription>
          </DialogHeader>
          <ClientForm onSuccess={handleClientCreated} />
        </DialogContent>
      </Dialog>
    </Form>
  );
}
