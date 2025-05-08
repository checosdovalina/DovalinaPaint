import { useQuery } from "@tanstack/react-query";
import { DollarSign, TrendingUp, TrendingDown, Wallet, User, HardHat, PackageOpen } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useState } from "react";
import { format } from "date-fns";
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  BarElement, 
  ArcElement,
  Title, 
  Tooltip as ChartTooltip, 
  Legend, 
  PointElement,
  LineElement
} from 'chart.js';
import { Bar, Pie, Line } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  ChartTooltip,
  Legend,
  PointElement,
  LineElement
);

export default function FinancialSummary() {
  const [timeRange, setTimeRange] = useState("all");

  // Fetch financial summary
  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ["/api/reports/financial/summary"],
    staleTime: 60000, // 1 minute
  });

  // Fetch all payments for detailed reporting
  const { data: payments = [], isLoading: paymentsLoading } = useQuery({
    queryKey: ["/api/payments"],
    staleTime: 60000, // 1 minute
  });

  // Fetch invoices for detailed reporting
  const { data: invoices = [], isLoading: invoicesLoading } = useQuery({
    queryKey: ["/api/invoices"],
    staleTime: 60000, // 1 minute
  });

  const isLoading = summaryLoading || paymentsLoading || invoicesLoading;

  if (isLoading) {
    return (
      <div className="w-full flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="p-4 text-center">
        <p className="text-muted-foreground">No financial data available</p>
      </div>
    );
  }

  // Filter data by time range if needed
  const filterDataByTimeRange = (data: any[]) => {
    if (timeRange === "all") return data;
    
    const now = new Date();
    let startDate: Date;
    
    switch (timeRange) {
      case "month":
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case "quarter":
        startDate = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
        break;
      case "year":
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        return data;
    }
    
    return data.filter((item) => new Date(item.date || item.createdAt) >= startDate);
  };

  const filteredPayments = filterDataByTimeRange(payments);
  const filteredInvoices = filterDataByTimeRange(invoices);

  // Calculate filtered totals
  const filteredTotalInvoiced = filteredInvoices.reduce((sum, invoice) => sum + parseFloat(invoice.totalAmount), 0);
  const filteredTotalPaid = filteredPayments.reduce((sum, payment) => sum + parseFloat(payment.amount), 0);
  const filteredNetProfit = filteredTotalInvoiced - filteredTotalPaid;
  const filteredProfitMargin = filteredTotalInvoiced > 0 ? (filteredNetProfit / filteredTotalInvoiced) * 100 : 0;

  // Group payments by recipient type for filtered data
  const filteredPaymentsByType = {
    staff: filteredPayments.filter(p => p.recipientType === 'staff').reduce((sum, p) => sum + parseFloat(p.amount), 0),
    subcontractor: filteredPayments.filter(p => p.recipientType === 'subcontractor').reduce((sum, p) => sum + parseFloat(p.amount), 0),
    supplier: filteredPayments.filter(p => p.recipientType === 'supplier').reduce((sum, p) => sum + parseFloat(p.amount), 0),
    other: filteredPayments.filter(p => !['staff', 'subcontractor', 'supplier'].includes(p.recipientType)).reduce((sum, p) => sum + parseFloat(p.amount), 0)
  };

  // Calculate percentage distribution
  const calculatePercentage = (amount: number) => {
    return filteredTotalPaid > 0 ? (amount / filteredTotalPaid) * 100 : 0;
  };

  // Prepare data for payments distribution pie chart
  const paymentDistributionData = {
    labels: ['Staff', 'Subcontractors', 'Suppliers', 'Other'],
    datasets: [
      {
        data: [
          filteredPaymentsByType.staff, 
          filteredPaymentsByType.subcontractor, 
          filteredPaymentsByType.supplier, 
          filteredPaymentsByType.other
        ],
        backgroundColor: [
          'rgba(54, 162, 235, 0.7)',
          'rgba(255, 159, 64, 0.7)',
          'rgba(75, 192, 192, 0.7)',
          'rgba(201, 203, 207, 0.7)'
        ],
        borderColor: [
          'rgb(54, 162, 235)',
          'rgb(255, 159, 64)',
          'rgb(75, 192, 192)',
          'rgb(201, 203, 207)'
        ],
        borderWidth: 1,
      },
    ],
  };

  // Group payments by month
  const paymentsByMonth: Record<string, number> = {};
  const invoicesByMonth: Record<string, number> = {};
  
  filteredPayments.forEach(payment => {
    const monthYear = format(new Date(payment.date), 'MMM yyyy');
    paymentsByMonth[monthYear] = (paymentsByMonth[monthYear] || 0) + parseFloat(payment.amount);
  });
  
  filteredInvoices.forEach(invoice => {
    const monthYear = format(new Date(invoice.createdAt), 'MMM yyyy');
    invoicesByMonth[monthYear] = (invoicesByMonth[monthYear] || 0) + parseFloat(invoice.totalAmount);
  });

  // Combine and sort months
  const allMonths = [...new Set([...Object.keys(paymentsByMonth), ...Object.keys(invoicesByMonth)])];
  allMonths.sort((a, b) => {
    const dateA = new Date(a);
    const dateB = new Date(b);
    return dateA.getTime() - dateB.getTime();
  });

  // Prepare data for monthly comparison chart
  const monthlyComparisonData = {
    labels: allMonths,
    datasets: [
      {
        label: 'Income',
        data: allMonths.map(month => invoicesByMonth[month] || 0),
        backgroundColor: 'rgba(75, 192, 192, 0.5)',
        borderColor: 'rgb(75, 192, 192)',
        borderWidth: 2,
        tension: 0.1,
      },
      {
        label: 'Expenses',
        data: allMonths.map(month => paymentsByMonth[month] || 0),
        backgroundColor: 'rgba(255, 99, 132, 0.5)',
        borderColor: 'rgb(255, 99, 132)',
        borderWidth: 2,
        tension: 0.1,
      }
    ],
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Financial Report</h2>
          <p className="text-muted-foreground">
            Overview of financial performance
          </p>
        </div>

        <div className="flex">
          <select
            className="bg-background border rounded-md px-3 py-2 text-sm"
            value={timeRange}
            onChange={e => setTimeRange(e.target.value)}
          >
            <option value="all">All Time</option>
            <option value="month">This Month</option>
            <option value="quarter">This Quarter</option>
            <option value="year">This Year</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${filteredTotalInvoiced.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              From {filteredInvoices.length} invoice{filteredInvoices.length !== 1 ? 's' : ''}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${filteredTotalPaid.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              From {filteredPayments.length} payment{filteredPayments.length !== 1 ? 's' : ''}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
            {filteredNetProfit >= 0 ? (
              <TrendingUp className="h-4 w-4 text-green-500" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-500" />
            )}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${filteredNetProfit < 0 ? 'text-red-500' : 'text-green-500'}`}>
              ${filteredNetProfit.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              From {timeRange === "all" ? "all time" : timeRange === "month" ? "this month" : timeRange === "quarter" ? "this quarter" : "this year"}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Profit Margin</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {filteredProfitMargin.toFixed(2)}%
            </div>
            <Progress 
              value={filteredProfitMargin > 100 ? 100 : filteredProfitMargin < 0 ? 0 : filteredProfitMargin} 
              className="h-2" 
            />
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Expense Distribution</CardTitle>
            <CardDescription>Breakdown of expenses by recipient type</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <Pie data={paymentDistributionData} options={{ maintainAspectRatio: false }} />
            </div>
            
            <div className="space-y-4 mt-6">
              <TooltipProvider>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <User className="h-4 w-4 mr-2 text-blue-500" />
                    <span>Staff</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="font-medium">${filteredPaymentsByType.staff.toFixed(2)}</span>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{calculatePercentage(filteredPaymentsByType.staff).toFixed(1)}% of total expenses</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <HardHat className="h-4 w-4 mr-2 text-orange-500" />
                    <span>Subcontractors</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="font-medium">${filteredPaymentsByType.subcontractor.toFixed(2)}</span>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{calculatePercentage(filteredPaymentsByType.subcontractor).toFixed(1)}% of total expenses</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <PackageOpen className="h-4 w-4 mr-2 text-teal-500" />
                    <span>Suppliers</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="font-medium">${filteredPaymentsByType.supplier.toFixed(2)}</span>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{calculatePercentage(filteredPaymentsByType.supplier).toFixed(1)}% of total expenses</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </div>
                
                {filteredPaymentsByType.other > 0 && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="h-4 w-4 mr-2 bg-gray-400 rounded-full" />
                      <span>Other</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="font-medium">${filteredPaymentsByType.other.toFixed(2)}</span>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{calculatePercentage(filteredPaymentsByType.other).toFixed(1)}% of total expenses</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </div>
                )}
              </TooltipProvider>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Income vs. Expenses</CardTitle>
            <CardDescription>Monthly comparison</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <Line 
                data={monthlyComparisonData} 
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  scales: {
                    y: {
                      beginAtZero: true,
                      ticks: {
                        callback: function(value) {
                          return '$' + value;
                        }
                      }
                    }
                  }
                }} 
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}