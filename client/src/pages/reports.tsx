import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Project, Client, Activity, Quote, ServiceOrder } from "@shared/schema";
import { Layout } from "@/components/layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Chart,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from "chart.js";
import { Bar, Line, Doughnut } from "react-chartjs-2";
import { format, subMonths, startOfMonth, endOfMonth, isWithinInterval } from "date-fns";
import { es } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs as TabsComponent } from "@/components/ui/tabs";
import { Download, Calendar, Filter } from "lucide-react";

// Register Chart.js components
Chart.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

export default function Reports() {
  const [timeRange, setTimeRange] = useState("last6Months");
  const [reportType, setReportType] = useState("ingresos");

  // Fetch all required data
  const { data: projects, isLoading: isLoadingProjects } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
    queryFn: async () => {
      const res = await fetch("/api/projects");
      if (!res.ok) throw new Error("Failed to fetch projects");
      return res.json();
    },
  });

  const { data: clients, isLoading: isLoadingClients } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
    queryFn: async () => {
      const res = await fetch("/api/clients");
      if (!res.ok) throw new Error("Failed to fetch clients");
      return res.json();
    },
  });

  const { data: quotes, isLoading: isLoadingQuotes } = useQuery<Quote[]>({
    queryKey: ["/api/quotes"],
    queryFn: async () => {
      const res = await fetch("/api/quotes");
      if (!res.ok) throw new Error("Failed to fetch quotes");
      return res.json();
    },
  });

  const { data: activities, isLoading: isLoadingActivities } = useQuery<Activity[]>({
    queryKey: ["/api/activities"],
    queryFn: async () => {
      const res = await fetch("/api/activities");
      if (!res.ok) throw new Error("Failed to fetch activities");
      return res.json();
    },
  });

  const isLoading = isLoadingProjects || isLoadingClients || isLoadingQuotes || isLoadingActivities;

  // Get time range for filtering
  const getDateRange = () => {
    const today = new Date();
    
    switch (timeRange) {
      case "last3Months":
        return { start: subMonths(today, 3), end: today };
      case "last6Months":
        return { start: subMonths(today, 6), end: today };
      case "lastYear":
        return { start: subMonths(today, 12), end: today };
      default:
        return { start: subMonths(today, 6), end: today };
    }
  };

  const dateRange = getDateRange();

  // Helper function to format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
    }).format(value);
  };

  // Get stats for the dashboard
  const getStats = () => {
    if (!projects || !clients || !quotes) return null;

    // Filter by date range
    const filteredProjects = projects.filter(project => {
      const createdAt = new Date(project.createdAt);
      return isWithinInterval(createdAt, { start: dateRange.start, end: dateRange.end });
    });

    const filteredClients = clients.filter(client => {
      const createdAt = new Date(client.createdAt);
      return isWithinInterval(createdAt, { start: dateRange.start, end: dateRange.end });
    });

    const filteredQuotes = quotes.filter(quote => {
      const createdAt = new Date(quote.createdAt);
      return isWithinInterval(createdAt, { start: dateRange.start, end: dateRange.end });
    });

    const completedProjects = filteredProjects.filter(project => project.status === "completed");
    
    const totalRevenue = filteredQuotes
      .filter(quote => quote.status === "approved")
      .reduce((sum, quote) => sum + (quote.totalEstimate || 0), 0);
    
    const conversionRate = filteredQuotes.length > 0
      ? (filteredQuotes.filter(quote => quote.status === "approved").length / filteredQuotes.length) * 100
      : 0;

    return {
      newClients: filteredClients.length,
      completedProjects: completedProjects.length,
      totalRevenue,
      conversionRate: conversionRate.toFixed(1),
      avgProjectValue: completedProjects.length > 0
        ? (totalRevenue / completedProjects.length)
        : 0,
    };
  };

  const stats = getStats();

  // Prepare revenue chart data
  const getRevenueChartData = () => {
    if (!quotes) return { labels: [], datasets: [] };

    const months = [];
    const monthlyRevenue = [];
    const monthlyQuotes = [];
    
    // Get last N months
    for (let i = 0; i < (timeRange === "lastYear" ? 12 : timeRange === "last6Months" ? 6 : 3); i++) {
      const month = subMonths(new Date(), i);
      const monthStart = startOfMonth(month);
      const monthEnd = endOfMonth(month);
      const monthLabel = format(month, 'MMM yyyy', { locale: es });
      
      months.unshift(monthLabel);
      
      // Calculate revenue for this month
      const monthRevenue = quotes
        .filter(quote => 
          quote.status === "approved" && 
          quote.approvedDate && 
          isWithinInterval(new Date(quote.approvedDate), { start: monthStart, end: monthEnd })
        )
        .reduce((sum, quote) => sum + (quote.totalEstimate || 0), 0);
      
      monthlyRevenue.unshift(monthRevenue);
      
      // Calculate number of quotes for this month
      const monthQuotes = quotes.filter(quote => 
        quote.createdAt && 
        isWithinInterval(new Date(quote.createdAt), { start: monthStart, end: monthEnd })
      ).length;
      
      monthlyQuotes.unshift(monthQuotes);
    }

    return {
      labels: months,
      datasets: [
        {
          label: 'Ingresos',
          data: monthlyRevenue,
          backgroundColor: 'rgba(37, 99, 235, 0.5)',
          borderColor: 'rgba(37, 99, 235, 1)',
          borderWidth: 1,
        },
        {
          label: 'Presupuestos',
          data: monthlyQuotes,
          backgroundColor: 'rgba(251, 191, 36, 0.5)',
          borderColor: 'rgba(251, 191, 36, 1)',
          borderWidth: 1,
          yAxisID: 'y1',
        }
      ],
    };
  };

  // Prepare client distribution chart data
  const getClientDistributionData = () => {
    if (!clients) return { labels: [], datasets: [] };

    const residentialCount = clients.filter(client => client.classification === "residential").length;
    const commercialCount = clients.filter(client => client.classification === "commercial").length;
    const industrialCount = clients.filter(client => client.classification === "industrial").length;

    return {
      labels: ['Residencial', 'Comercial', 'Industrial'],
      datasets: [
        {
          data: [residentialCount, commercialCount, industrialCount],
          backgroundColor: [
            'rgba(37, 99, 235, 0.7)',
            'rgba(16, 185, 129, 0.7)',
            'rgba(251, 191, 36, 0.7)',
          ],
          borderColor: [
            'rgba(37, 99, 235, 1)',
            'rgba(16, 185, 129, 1)',
            'rgba(251, 191, 36, 1)',
          ],
          borderWidth: 1,
        },
      ],
    };
  };

  // Prepare project status distribution chart data
  const getProjectStatusData = () => {
    if (!projects) return { labels: [], datasets: [] };

    const statusCounts = {
      pending: 0,
      quoted: 0,
      approved: 0,
      preparing: 0,
      in_progress: 0,
      reviewing: 0,
      completed: 0,
      archived: 0,
    };

    projects.forEach(project => {
      if (statusCounts.hasOwnProperty(project.status)) {
        statusCounts[project.status] += 1;
      }
    });

    // Translate status labels to Spanish
    const statusLabels = {
      pending: "Pendiente por visitar",
      quoted: "Presupuesto enviado",
      approved: "Presupuesto aprobado",
      preparing: "En preparación",
      in_progress: "En proceso",
      reviewing: "En revisión final",
      completed: "Finalizado",
      archived: "Archivado",
    };

    return {
      labels: Object.keys(statusCounts).map(key => statusLabels[key]),
      datasets: [
        {
          data: Object.values(statusCounts),
          backgroundColor: [
            'rgba(156, 163, 175, 0.7)', // gray
            'rgba(251, 191, 36, 0.7)', // yellow
            'rgba(16, 185, 129, 0.7)', // green
            'rgba(59, 130, 246, 0.7)', // blue
            'rgba(37, 99, 235, 0.7)', // darker blue
            'rgba(139, 92, 246, 0.7)', // purple
            'rgba(6, 95, 70, 0.7)', // dark green
            'rgba(107, 114, 128, 0.7)', // darker gray
          ],
          borderWidth: 1,
        },
      ],
    };
  };

  const getServiceTypeData = () => {
    if (!projects) return { labels: [], datasets: [] };

    // Count projects by service type
    const serviceTypeCounts = {};
    projects.forEach(project => {
      if (!serviceTypeCounts[project.serviceType]) {
        serviceTypeCounts[project.serviceType] = 0;
      }
      serviceTypeCounts[project.serviceType]++;
    });

    // Sort by count (descending)
    const sortedServices = Object.entries(serviceTypeCounts)
      .sort(([, countA], [, countB]) => (countB as number) - (countA as number))
      .slice(0, 5); // Top 5 services

    return {
      labels: sortedServices.map(([service]) => service),
      datasets: [
        {
          label: 'Cantidad de Proyectos',
          data: sortedServices.map(([, count]) => count),
          backgroundColor: 'rgba(37, 99, 235, 0.7)',
          borderColor: 'rgba(37, 99, 235, 1)',
          borderWidth: 1,
        }
      ],
    };
  };

  // Options for charts
  const revenueChartOptions = {
    responsive: true,
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Ingresos (MXN)',
        },
      },
      y1: {
        beginAtZero: true,
        position: 'right',
        title: {
          display: true,
          text: 'Cantidad de Presupuestos',
        },
        grid: {
          drawOnChartArea: false,
        },
      }
    },
    plugins: {
      title: {
        display: true,
        text: 'Ingresos y Presupuestos Mensuales',
      },
    },
  };

  const doughnutOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'right' as const,
      },
    },
  };

  const serviceTypeOptions = {
    responsive: true,
    indexAxis: 'y' as const,
    plugins: {
      title: {
        display: true,
        text: 'Servicios Más Contratados',
      },
    },
  };

  return (
    <Layout title="Reportes y Análisis">
      <div className="flex flex-wrap gap-4 justify-between items-center mb-6">
        <div className="flex items-center space-x-2">
          <Select
            value={timeRange}
            onValueChange={setTimeRange}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Rango de tiempo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="last3Months">Últimos 3 meses</SelectItem>
              <SelectItem value="last6Months">Últimos 6 meses</SelectItem>
              <SelectItem value="lastYear">Último año</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center space-x-2">
          <Button variant="outline">
            <Filter className="h-4 w-4 mr-2" />
            Filtros Avanzados
          </Button>
          <Button>
            <Download className="h-4 w-4 mr-2" />
            Exportar Reporte
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
        </div>
      ) : (
        <>
          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">
                  Clientes Nuevos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.newClients}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">
                  Proyectos Completados
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.completedProjects}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">
                  Ingresos Totales
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(stats?.totalRevenue || 0)}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">
                  Tasa de Conversión
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.conversionRate}%</div>
              </CardContent>
            </Card>
          </div>

          {/* Tabs for different reports */}
          <Tabs defaultValue="ingresos" value={reportType} onValueChange={setReportType} className="mb-8">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="ingresos">Ingresos</TabsTrigger>
              <TabsTrigger value="clientes">Clientes</TabsTrigger>
              <TabsTrigger value="proyectos">Proyectos</TabsTrigger>
              <TabsTrigger value="servicios">Servicios</TabsTrigger>
            </TabsList>
            
            <TabsContent value="ingresos" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Análisis de Ingresos</CardTitle>
                  <CardDescription>
                    Visualización de los ingresos y presupuestos a lo largo del tiempo
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <Bar
                    data={getRevenueChartData()}
                    options={revenueChartOptions}
                    height={80}
                  />
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="clientes" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Distribución de Clientes</CardTitle>
                  <CardDescription>
                    Clasificación de los clientes por tipo
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="max-w-xl mx-auto">
                    <Doughnut
                      data={getClientDistributionData()}
                      options={doughnutOptions}
                      height={80}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="proyectos" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Estado de los Proyectos</CardTitle>
                  <CardDescription>
                    Distribución de proyectos por estado actual
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="max-w-xl mx-auto">
                    <Doughnut
                      data={getProjectStatusData()}
                      options={doughnutOptions}
                      height={80}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="servicios" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Servicios Más Contratados</CardTitle>
                  <CardDescription>
                    Los servicios más solicitados por los clientes
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <Bar
                    data={getServiceTypeData()}
                    options={serviceTypeOptions}
                    height={80}
                  />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Additional data tables or visualizations could go here */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Rendimiento Promedio</CardTitle>
                <CardDescription>
                  Métricas clave de rendimiento
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">Valor promedio de proyecto:</span>
                    <span className="font-medium">{formatCurrency(stats?.avgProjectValue || 0)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">Duración promedio de proyecto:</span>
                    <span className="font-medium">14 días</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">Satisfacción del cliente:</span>
                    <span className="font-medium">93%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">Tasa de retención:</span>
                    <span className="font-medium">78%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Próximos Vencimientos</CardTitle>
                <CardDescription>
                  Proyectos con fechas próximas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {projects
                    ?.filter(project => 
                      project.status !== "completed" && 
                      project.status !== "archived" && 
                      project.dueDate
                    )
                    .sort((a, b) => new Date(a.dueDate as Date).getTime() - new Date(b.dueDate as Date).getTime())
                    .slice(0, 4)
                    .map(project => (
                      <div key={project.id} className="flex justify-between items-center">
                        <div>
                          <div className="font-medium text-sm">{project.title}</div>
                          <div className="text-xs text-gray-500">{getStatusLabel(project.status)}</div>
                        </div>
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1 text-gray-400" />
                          <span className="text-sm">
                            {project.dueDate ? format(new Date(project.dueDate), "d MMM yyyy", { locale: es }) : ""}
                          </span>
                        </div>
                      </div>
                    ))
                  }
                  
                  {(!projects || projects.filter(p => p.dueDate).length === 0) && (
                    <div className="text-center py-6 text-gray-500">
                      No hay proyectos con fechas de vencimiento
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </Layout>
  );
}

function getStatusLabel(status: string) {
  switch (status) {
    case "pending":
      return "Pendiente por visitar";
    case "quoted":
      return "Presupuesto enviado";
    case "approved":
      return "Presupuesto aprobado";
    case "preparing":
      return "En preparación";
    case "in_progress":
      return "En proceso";
    case "reviewing":
      return "En revisión final";
    case "completed":
      return "Finalizado";
    case "archived":
      return "Archivado";
    default:
      return status;
  }
}
