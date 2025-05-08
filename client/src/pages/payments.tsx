import { Helmet } from "react-helmet";
import PageHeader from "@/components/page-header";
import { Layout } from "@/components/layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import PaymentForm from "@/components/payment-form";
import PaymentList from "@/components/payment-list";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default function PaymentsPage() {
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [editingPayment, setEditingPayment] = useState<any>(null);
  const { toast } = useToast();
  
  // Fetch all payment recipients (subcontractors, employees, suppliers)
  const { data: recipients } = useQuery({
    queryKey: ['/api/payment-recipients'],
  });
  
  // Fetch all projects
  const { data: projects } = useQuery({
    queryKey: ['/api/projects'],
  });
  
  // Fetch payment categories
  const { data: categories } = useQuery({
    queryKey: ['/api/payment-categories'],
  });

  // Fetch payments
  const { data: payments, isLoading, refetch } = useQuery({
    queryKey: ['/api/payments'],
  });

  const handleAddNew = () => {
    setEditingPayment(null);
    setShowPaymentForm(true);
  };

  const handleEditPayment = (payment: any) => {
    setEditingPayment(payment);
    setShowPaymentForm(true);
  };

  const handlePaymentSubmit = () => {
    setShowPaymentForm(false);
    setEditingPayment(null);
    toast({
      title: "Éxito",
      description: editingPayment 
        ? "Pago actualizado correctamente." 
        : "Pago registrado correctamente.",
    });
    refetch();
  };

  const handleCancel = () => {
    setShowPaymentForm(false);
    setEditingPayment(null);
  };

  return (
    <Layout title="Gestión de Pagos">
      <Helmet>
        <title>Pagos | Dovalina Painting LLC</title>
      </Helmet>

      <div className="container mx-auto py-6 space-y-6">
        <PageHeader
          title="Gestión de Pagos"
          description="Registra y administra todos los pagos a subcontratistas, empleados y proveedores."
          actions={
            !showPaymentForm && (
              <Button onClick={handleAddNew}>
                <Plus className="mr-2 h-4 w-4" />
                Nuevo Pago
              </Button>
            )
          }
        />

        {showPaymentForm ? (
          <Card>
            <CardHeader>
              <CardTitle>{editingPayment ? "Editar Pago" : "Registrar Nuevo Pago"}</CardTitle>
              <CardDescription>
                {editingPayment
                  ? "Actualiza la información del pago seleccionado."
                  : "Completa el formulario para registrar un nuevo pago."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PaymentForm
                payment={editingPayment}
                recipients={recipients}
                projects={projects}
                categories={categories}
                onSubmit={handlePaymentSubmit}
                onCancel={handleCancel}
              />
            </CardContent>
          </Card>
        ) : (
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="all">Todos los Pagos</TabsTrigger>
              <TabsTrigger value="subcontractors">Subcontratistas</TabsTrigger>
              <TabsTrigger value="employees">Empleados</TabsTrigger>
              <TabsTrigger value="suppliers">Proveedores</TabsTrigger>
              <TabsTrigger value="other">Otros</TabsTrigger>
            </TabsList>
            
            <TabsContent value="all">
              <PaymentList 
                payments={payments}
                isLoading={isLoading}
                projects={projects} 
                onEdit={handleEditPayment}
                refetch={refetch}
                filterType={null}
              />
            </TabsContent>
            
            <TabsContent value="subcontractors">
              <PaymentList 
                payments={payments}
                isLoading={isLoading}
                projects={projects} 
                onEdit={handleEditPayment}
                refetch={refetch}
                filterType="subcontractor"
              />
            </TabsContent>
            
            <TabsContent value="employees">
              <PaymentList 
                payments={payments}
                isLoading={isLoading}
                projects={projects} 
                onEdit={handleEditPayment}
                refetch={refetch}
                filterType="employee"
              />
            </TabsContent>
            
            <TabsContent value="suppliers">
              <PaymentList 
                payments={payments}
                isLoading={isLoading}
                projects={projects} 
                onEdit={handleEditPayment}
                refetch={refetch}
                filterType="supplier"
              />
            </TabsContent>
            
            <TabsContent value="other">
              <PaymentList 
                payments={payments}
                isLoading={isLoading}
                projects={projects} 
                onEdit={handleEditPayment}
                refetch={refetch}
                filterType="other"
              />
            </TabsContent>
          </Tabs>
        )}
      </div>
    </Layout>
  );
}