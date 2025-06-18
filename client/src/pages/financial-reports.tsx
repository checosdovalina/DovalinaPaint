import { Helmet } from "react-helmet";
import PageHeader from "@/components/page-header";
import { Layout } from "@/components/layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, FileText, Filter } from "lucide-react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { DatePicker } from "@/components/ui/date-picker";
import { Separator } from "@/components/ui/separator";
import { FinancialSummary } from "@/components/financial-summary";
import { format, startOfMonth, endOfMonth, subMonths } from "date-fns";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

export default function FinancialReportsPage() {
  const [selectedPeriod, setSelectedPeriod] = useState<string>("current_month");
  const [customStartDate, setCustomStartDate] = useState<Date | undefined>(
    subMonths(startOfMonth(new Date()), 1)
  );
  const [customEndDate, setCustomEndDate] = useState<Date | undefined>(
    endOfMonth(new Date())
  );
  
  // Calculate date range based on selected period
  const getDateRange = () => {
    const today = new Date();
    
    switch (selectedPeriod) {
      case "current_month":
        return {
          startDate: startOfMonth(today),
          endDate: endOfMonth(today),
        };
      case "last_month":
        const lastMonth = subMonths(today, 1);
        return {
          startDate: startOfMonth(lastMonth),
          endDate: endOfMonth(lastMonth),
        };
      case "last_3_months":
        return {
          startDate: startOfMonth(subMonths(today, 2)),
          endDate: endOfMonth(today),
        };
      case "last_6_months":
        return {
          startDate: startOfMonth(subMonths(today, 5)),
          endDate: endOfMonth(today),
        };
      case "current_year":
        return {
          startDate: new Date(today.getFullYear(), 0, 1),
          endDate: new Date(today.getFullYear(), 11, 31),
        };
      case "last_year":
        return {
          startDate: new Date(today.getFullYear() - 1, 0, 1),
          endDate: new Date(today.getFullYear() - 1, 11, 31),
        };
      case "custom":
        return {
          startDate: customStartDate,
          endDate: customEndDate,
        };
      default:
        return {
          startDate: startOfMonth(today),
          endDate: endOfMonth(today),
        };
    }
  };
  
  const dateRange = getDateRange();
  
  // Format the date range for display and API requests - provide default range if none selected
  const defaultStartDate = new Date();
  defaultStartDate.setDate(defaultStartDate.getDate() - 30); // Last 30 days
  
  const formattedStartDate = dateRange.startDate 
    ? format(dateRange.startDate, "yyyy-MM-dd") 
    : format(defaultStartDate, "yyyy-MM-dd");
  const formattedEndDate = dateRange.endDate 
    ? format(dateRange.endDate, "yyyy-MM-dd") 
    : format(new Date(), "yyyy-MM-dd");
  
  // Get payments data within the selected date range
  const { data: paymentsData, isLoading: paymentsLoading } = useQuery({
    queryKey: ['/api/payments/summary', formattedStartDate, formattedEndDate],
    queryFn: () => 
      fetch(`/api/payments/summary?startDate=${formattedStartDate}&endDate=${formattedEndDate}`)
        .then(res => res.json()),
  });
  
  // Get invoice data within the selected date range
  const { data: invoicesData, isLoading: invoicesLoading } = useQuery({
    queryKey: ['/api/invoices/summary', formattedStartDate, formattedEndDate],
    queryFn: () => 
      fetch(`/api/invoices/summary?startDate=${formattedStartDate}&endDate=${formattedEndDate}`)
        .then(res => res.json()),
  });
  
  // Get profit margin data
  const { data: profitData, isLoading: profitLoading } = useQuery({
    queryKey: ['/api/financial/profit-margin', formattedStartDate, formattedEndDate],
    queryFn: () => 
      fetch(`/api/financial/profit-margin?startDate=${formattedStartDate}&endDate=${formattedEndDate}`)
        .then(res => res.json()),
  });
  
  // Get projects data for the period
  const { data: projectsData, isLoading: projectsLoading } = useQuery({
    queryKey: ['/api/projects/financial', formattedStartDate, formattedEndDate],
    queryFn: () => 
      fetch(`/api/projects/financial?startDate=${formattedStartDate}&endDate=${formattedEndDate}`)
        .then(res => res.json()),
  });
  
  // Handle period selection
  const handlePeriodChange = (value: string) => {
    setSelectedPeriod(value);
  };
  
  // Generate and download PDF report
  const generatePDF = async () => {
    const reportElement = document.getElementById('financial-report');
    if (!reportElement) return;
    
    try {
      const canvas = await html2canvas(reportElement, {
        scale: 2,
        logging: false,
        useCORS: true,
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });
      
      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      
      // Add page numbers
      const pageCount = pdf.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        pdf.setPage(i);
        pdf.setFontSize(10);
        pdf.text(`Page ${i} of ${pageCount}`, 105, 295, { align: 'center' });
      }
      
      const reportPeriod = selectedPeriod === 'custom'
        ? `${format(customStartDate as Date, 'dd/MM/yyyy')}-${format(customEndDate as Date, 'dd/MM/yyyy')}`
        : getPeriodLabel(selectedPeriod);
      
      pdf.save(`Financial_Report_${reportPeriod}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
    }
  };
  
  // Get label for the selected period
  const getPeriodLabel = (period: string) => {
    switch (period) {
      case "current_month":
        return "Current Month";
      case "last_month":
        return "Last Month";
      case "last_3_months":
        return "Last 3 Months";
      case "last_6_months":
        return "Last 6 Months";
      case "current_year":
        return "Current Year";
      case "last_year":
        return "Last Year";
      case "custom":
        return "Custom Period";
      default:
        return "Current Month";
    }
  };
  
  // Check if all data is loading
  const isLoading = paymentsLoading || invoicesLoading || profitLoading || projectsLoading;
  
  return (
    <Layout title="Financial Reports">
      <Helmet>
        <title>Financial Reports | Dovalina Painting LLC</title>
      </Helmet>
      
      <div className="container mx-auto py-6 space-y-6">
        <PageHeader
          title="Financial Reports"
          description="Detailed analysis of income, expenses and profitability by period."
          actions={
            <Button onClick={generatePDF} variant="outline" disabled={isLoading}>
              <Download className="mr-2 h-4 w-4" />
              Download PDF
            </Button>
          }
        />
      
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle>Report Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="period">Period</Label>
                <Select onValueChange={handlePeriodChange} defaultValue={selectedPeriod}>
                  <SelectTrigger id="period" className="w-full">
                    <SelectValue placeholder="Select period" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="current_month">Current Month</SelectItem>
                    <SelectItem value="last_month">Last Month</SelectItem>
                    <SelectItem value="last_3_months">Last 3 Months</SelectItem>
                    <SelectItem value="last_6_months">Last 6 Months</SelectItem>
                    <SelectItem value="current_year">Current Year</SelectItem>
                    <SelectItem value="last_year">Last Year</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {selectedPeriod === "custom" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Start Date</Label>
                    <DatePicker
                      date={customStartDate}
                      setDate={setCustomStartDate}
                    />
                  </div>
                  <div>
                    <Label>End Date</Label>
                    <DatePicker
                      date={customEndDate}
                      setDate={setCustomEndDate}
                    />
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        
        <div id="financial-report">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardHeader className="py-4">
                <CardTitle className="text-lg font-medium">Total Income</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">
                  {invoicesData?.totalRevenue 
                    ? new Intl.NumberFormat('en-US', {
                        style: 'currency',
                        currency: 'USD'
                      }).format(invoicesData.totalRevenue)
                    : isLoading ? "Loading..." : "$0.00"}
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {invoicesData?.invoiceCount || 0} invoices in period
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="py-4">
                <CardTitle className="text-lg font-medium">Total Expenses</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-red-600">
                  {paymentsData?.totalExpenses
                    ? new Intl.NumberFormat('en-US', {
                        style: 'currency',
                        currency: 'USD'
                      }).format(paymentsData.totalExpenses)
                    : isLoading ? "Loading..." : "$0.00"}
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {paymentsData?.paymentCount || 0} payments in period
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="py-4">
                <CardTitle className="text-lg font-medium">Net Benefit</CardTitle>
              </CardHeader>
              <CardContent>
                {!isLoading ? (
                  <>
                    {(() => {
                      const totalRevenue = invoicesData?.totalRevenue || 0;
                      const totalExpenses = paymentsData?.totalExpenses || 0;
                      const netBenefit = totalRevenue - totalExpenses;
                      
                      return (
                        <>
                          <div className={`text-3xl font-bold ${
                            netBenefit >= 0 
                              ? 'text-green-600' 
                              : 'text-red-600'
                          }`}>
                            {new Intl.NumberFormat('en-US', {
                              style: 'currency',
                              currency: 'USD'
                            }).format(netBenefit)}
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            Margin: {profitData?.averageMargin 
                              ? `${profitData.averageMargin.toFixed(2)}%` 
                              : "N/A"}
                          </p>
                        </>
                      );
                    })()}
                  </>
                ) : (
                  <div className="text-3xl font-bold">Loading...</div>
                )}
              </CardContent>
            </Card>
          </div>
          
          <Tabs defaultValue="summary" className="w-full mb-6">
            <TabsList className="mb-4">
              <TabsTrigger value="summary">Summary</TabsTrigger>
              <TabsTrigger value="expense-categories">Expense Categories</TabsTrigger>
              <TabsTrigger value="projects">Projects</TabsTrigger>
              <TabsTrigger value="recipients">Recipients</TabsTrigger>
            </TabsList>
            
            <TabsContent value="summary">
              <FinancialSummary 
                paymentsData={paymentsData} 
                invoicesData={invoicesData} 
                isLoading={isLoading}
                startDate={dateRange.startDate}
                endDate={dateRange.endDate}
              />
            </TabsContent>
            
            <TabsContent value="expense-categories">
              <Card>
                <CardHeader>
                  <CardTitle>Expense Distribution by Category</CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="text-center py-6">Loading data...</div>
                  ) : paymentsData?.categorySummary && paymentsData.categorySummary.length > 0 ? (
                    <div className="space-y-4">
                      {paymentsData.categorySummary.map((category: any) => (
                        <div key={category.id} className="space-y-1">
                          <div className="flex justify-between items-center">
                            <span className="font-medium">{category.name}</span>
                            <span className="font-semibold">
                              {new Intl.NumberFormat('en-US', {
                                style: 'currency',
                                currency: 'USD'
                              }).format(category.total)}
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2.5">
                            <div 
                              className="bg-primary h-2.5 rounded-full" 
                              style={{ 
                                width: `${(category.total / paymentsData.totalExpenses) * 100}%` 
                              }}
                            />
                          </div>
                          <p className="text-xs text-gray-500">
                            {((category.total / paymentsData.totalExpenses) * 100).toFixed(1)}% of total expenses
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 text-muted-foreground">
                      No expense category data available for this period
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="projects">
              <Card>
                <CardHeader>
                  <CardTitle>Rentabilidad por Proyecto</CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="text-center py-6">Cargando datos...</div>
                  ) : projectsData && projectsData.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-2 px-4">Proyecto</th>
                            <th className="text-right py-2 px-4">Ingresos</th>
                            <th className="text-right py-2 px-4">Gastos</th>
                            <th className="text-right py-2 px-4">Margen</th>
                            <th className="text-right py-2 px-4">Rentabilidad</th>
                          </tr>
                        </thead>
                        <tbody>
                          {projectsData.map((project: any) => {
                            const profit = project.revenue - project.expenses;
                            const margin = project.revenue > 0 
                              ? (profit / project.revenue) * 100 
                              : 0;
                              
                            return (
                              <tr key={project.id} className="border-b">
                                <td className="py-2 px-4">{project.title}</td>
                                <td className="text-right py-2 px-4">
                                  {new Intl.NumberFormat('es-MX', {
                                    style: 'currency',
                                    currency: 'USD'
                                  }).format(project.revenue)}
                                </td>
                                <td className="text-right py-2 px-4">
                                  {new Intl.NumberFormat('es-MX', {
                                    style: 'currency',
                                    currency: 'USD'
                                  }).format(project.expenses)}
                                </td>
                                <td className="text-right py-2 px-4">
                                  {margin.toFixed(1)}%
                                </td>
                                <td className={`text-right py-2 px-4 font-medium ${
                                  profit >= 0 ? 'text-green-600' : 'text-red-600'
                                }`}>
                                  {new Intl.NumberFormat('es-MX', {
                                    style: 'currency',
                                    currency: 'USD'
                                  }).format(profit)}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-6 text-muted-foreground">
                      No hay datos de proyectos para este período
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="recipients">
              <Card>
                <CardHeader>
                  <CardTitle>Pagos por Destinatario</CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="text-center py-6">Cargando datos...</div>
                  ) : paymentsData?.recipientSummary && paymentsData.recipientSummary.length > 0 ? (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Card>
                          <CardHeader className="py-2">
                            <CardTitle className="text-sm font-medium">Subcontratistas</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="text-2xl font-bold">
                              {new Intl.NumberFormat('es-MX', {
                                style: 'currency',
                                currency: 'USD'
                              }).format(
                                paymentsData.recipientSummary
                                  .filter((r: any) => r.type === 'subcontractor')
                                  .reduce((sum: number, r: any) => sum + r.total, 0)
                              )}
                            </div>
                          </CardContent>
                        </Card>
                        
                        <Card>
                          <CardHeader className="py-2">
                            <CardTitle className="text-sm font-medium">Empleados</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="text-2xl font-bold">
                              {new Intl.NumberFormat('es-MX', {
                                style: 'currency',
                                currency: 'USD'
                              }).format(
                                paymentsData.recipientSummary
                                  .filter((r: any) => r.type === 'employee')
                                  .reduce((sum: number, r: any) => sum + r.total, 0)
                              )}
                            </div>
                          </CardContent>
                        </Card>
                        
                        <Card>
                          <CardHeader className="py-2">
                            <CardTitle className="text-sm font-medium">Proveedores</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="text-2xl font-bold">
                              {new Intl.NumberFormat('es-MX', {
                                style: 'currency',
                                currency: 'USD'
                              }).format(
                                paymentsData.recipientSummary
                                  .filter((r: any) => r.type === 'supplier')
                                  .reduce((sum: number, r: any) => sum + r.total, 0)
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                      
                      <Separator />
                      
                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                          <thead>
                            <tr className="border-b">
                              <th className="text-left py-2 px-4">Destinatario</th>
                              <th className="text-left py-2 px-4">Tipo</th>
                              <th className="text-right py-2 px-4">Monto Total</th>
                              <th className="text-right py-2 px-4">% del Total</th>
                            </tr>
                          </thead>
                          <tbody>
                            {paymentsData.recipientSummary.map((recipient: any) => (
                              <tr key={recipient.id} className="border-b">
                                <td className="py-2 px-4">{recipient.name}</td>
                                <td className="py-2 px-4">
                                  {recipient.type === 'subcontractor' && 'Subcontratista'}
                                  {recipient.type === 'employee' && 'Empleado'}
                                  {recipient.type === 'supplier' && 'Proveedor'}
                                  {recipient.type === 'other' && 'Otro'}
                                </td>
                                <td className="text-right py-2 px-4">
                                  {new Intl.NumberFormat('es-MX', {
                                    style: 'currency',
                                    currency: 'USD'
                                  }).format(recipient.total)}
                                </td>
                                <td className="text-right py-2 px-4">
                                  {((recipient.total / paymentsData.totalExpenses) * 100).toFixed(1)}%
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-6 text-muted-foreground">
                      No hay datos de pagos por destinatario para este período
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </Layout>
  );
}