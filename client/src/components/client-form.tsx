import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { insertClientSchema } from "@shared/schema";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { useEffect } from "react";

const formSchema = insertClientSchema;
type ClientFormValues = z.infer<typeof formSchema>;

interface ClientFormProps {
  open: boolean;
  onClose: () => void;
  clientToEdit?: ClientFormValues & { id?: number } | null;
  defaultType?: string;
}

export function ClientForm({ open, onClose, clientToEdit, defaultType = 'client' }: ClientFormProps) {
  const { toast } = useToast();

  const form = useForm<ClientFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      address: "",
      classification: "residential",
      type: defaultType,
      notes: "",
    },
  });

  // Reset form when dialog opens/closes or when clientToEdit changes
  useEffect(() => {
    if (open) {
      if (clientToEdit) {
        form.reset({
          name: clientToEdit.name || "",
          email: clientToEdit.email || "",
          phone: clientToEdit.phone || "",
          address: clientToEdit.address || "",
          classification: clientToEdit.classification || "residential",
          type: clientToEdit.type || defaultType,
          notes: clientToEdit.notes || "",
        });
      } else {
        form.reset({
          name: "",
          email: "",
          phone: "",
          address: "",
          classification: "residential",
          type: defaultType,
          notes: "",
        });
      }
    }
  }, [open, clientToEdit, defaultType, form]);

  const mutation = useMutation({
    mutationFn: async (data: ClientFormValues) => {
      if (clientToEdit?.id) {
        const res = await apiRequest("PUT", `/api/clients/${clientToEdit.id}`, data);
        return await res.json();
      } else {
        const res = await apiRequest("POST", "/api/clients", data);
        return await res.json();
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      toast({
        title: clientToEdit ? "Cliente actualizado" : "Cliente creado",
        description: clientToEdit 
          ? "El cliente ha sido actualizado exitosamente." 
          : "El cliente ha sido creado exitosamente.",
      });
      onClose();
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Ocurrió un error al procesar la solicitud.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ClientFormValues) => {
    mutation.mutate(data);
  };

  const isProspect = defaultType === 'prospect' || clientToEdit?.type === 'prospect';

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {clientToEdit 
              ? `Editar ${clientToEdit.type === 'prospect' ? 'Prospecto' : 'Cliente'}` 
              : `Nuevo ${isProspect ? 'Prospecto' : 'Cliente'}`}
          </DialogTitle>
          <DialogDescription>
            {clientToEdit 
              ? `Actualiza la información del ${clientToEdit.type === 'prospect' ? 'prospecto' : 'cliente'}.`
              : `Completa la información para crear un nuevo ${isProspect ? 'prospecto' : 'cliente'}.`}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre *</FormLabel>
                  <FormControl>
                    <Input placeholder="Nombre completo" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email *</FormLabel>
                  <FormControl>
                    <Input placeholder="email@ejemplo.com" type="email" {...field} />
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
                  <FormLabel>Teléfono *</FormLabel>
                  <FormControl>
                    <Input placeholder="(555) 123-4567" {...field} />
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
                  <FormLabel>Dirección *</FormLabel>
                  <FormControl>
                    <Input placeholder="Dirección completa" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="classification"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Clasificación *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona una clasificación" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="residential">Residencial</SelectItem>
                      <SelectItem value="commercial">Comercial</SelectItem>
                      <SelectItem value="industrial">Industrial</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notas</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Notas adicionales..." 
                      {...field} 
                      value={field.value || ""} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending 
                  ? "Guardando..." 
                  : clientToEdit 
                    ? "Actualizar" 
                    : "Crear"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}