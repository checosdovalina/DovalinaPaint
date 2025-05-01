import { Invoice } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";
import { Client, Project } from "@shared/schema";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";

interface InvoiceListProps {
  invoices: Invoice[];
  onSelectInvoice: (invoiceId: number) => void;
}

export function InvoiceList({ invoices, onSelectInvoice }: InvoiceListProps) {
  // Fetch clients for display
  const { data: clients } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
  });

  // Fetch projects for display
  const { data: projects } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  const getClientName = (clientId: number) => {
    const client = clients?.find((c) => c.id === clientId);
    return client ? client.name : "Cliente desconocido";
  };

  const getProjectTitle = (projectId: number) => {
    const project = projects?.find((p) => p.id === projectId);
    return project ? project.title : "Proyecto desconocido";
  };

  // Function to get badge color based on status
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "draft":
        return <Badge variant="outline">Borrador</Badge>;
      case "sent":
        return <Badge variant="secondary">Enviada</Badge>;
      case "paid":
        return <Badge variant="success">Pagada</Badge>;
      case "overdue":
        return <Badge variant="destructive">Vencida</Badge>;
      case "cancelled":
        return <Badge variant="destructive">Cancelada</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Format date for display
  const formatDate = (dateString: string | Date | null) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("es-ES", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(date);
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[120px]">Nº Factura</TableHead>
            <TableHead>Cliente</TableHead>
            <TableHead>Proyecto</TableHead>
            <TableHead>Fecha emisión</TableHead>
            <TableHead>Fecha vencimiento</TableHead>
            <TableHead className="text-right">Importe</TableHead>
            <TableHead>Estado</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {invoices.map((invoice) => (
            <TableRow
              key={invoice.id}
              className="cursor-pointer hover:bg-muted/50"
              onClick={() => onSelectInvoice(invoice.id)}
            >
              <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
              <TableCell>{getClientName(invoice.clientId)}</TableCell>
              <TableCell>{getProjectTitle(invoice.projectId)}</TableCell>
              <TableCell>{formatDate(invoice.issueDate)}</TableCell>
              <TableCell>{formatDate(invoice.dueDate)}</TableCell>
              <TableCell className="text-right">
                {formatCurrency(Number(invoice.totalAmount))}
              </TableCell>
              <TableCell>{getStatusBadge(invoice.status)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}