import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

// Chart imports
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  Cell,
} from 'recharts';

// Types
type FinancialSummaryProps = {
  paymentsData: any;
  invoicesData: any;
  isLoading: boolean;
  startDate: Date | undefined;
  endDate: Date | undefined;
};

// Color palette
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A569BD', '#5DADE2', '#45B39D', '#F4D03F', '#EB984E'];

export function FinancialSummary({
  paymentsData,
  invoicesData,
  isLoading,
  startDate,
  endDate,
}: FinancialSummaryProps) {
  const [summaryData, setSummaryData] = useState<any[]>([]);
  const [categoryData, setCategoryData] = useState<any[]>([]);
  const [recipientTypeData, setRecipientTypeData] = useState<any[]>([]);
  
  // Prepare data for charts when props change
  useEffect(() => {
    if (paymentsData && invoicesData) {
      // Prepare summary data for line/bar chart
      prepareSummaryData();
      
      // Prepare category data for pie chart
      prepareCategoryData();
      
      // Prepare recipient type data for pie chart
      prepareRecipientTypeData();
    }
  }, [paymentsData, invoicesData]);
  
  // Format the date range for display
  const formatDateRange = () => {
    if (!startDate || !endDate) return '';
    
    return `${format(startDate, 'dd MMM yyyy', { locale: es })} - ${format(endDate, 'dd MMM yyyy', { locale: es })}`;
  };
  
  // Prepare summary data for line/bar chart
  const prepareSummaryData = () => {
    if (!paymentsData?.timeSeriesData || !invoicesData?.timeSeriesData) return;
    
    // Get all dates from both datasets
    const allDates = new Set<string>([
      ...(paymentsData.timeSeriesData || []).map((item: any) => item.date),
      ...(invoicesData.timeSeriesData || []).map((item: any) => item.date),
    ]);
    
    // Create data with both revenue and expenses for each date
    const data = Array.from(allDates).map((date) => {
      const paymentItem = paymentsData.timeSeriesData?.find((item: any) => item.date === date);
      const invoiceItem = invoicesData.timeSeriesData?.find((item: any) => item.date === date);
      
      return {
        date,
        gastos: paymentItem ? paymentItem.amount : 0,
        ingresos: invoiceItem ? invoiceItem.amount : 0,
        beneficio: (invoiceItem ? invoiceItem.amount : 0) - (paymentItem ? paymentItem.amount : 0),
      };
    });
    
    // Sort by date
    data.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    setSummaryData(data);
  };
  
  // Prepare category data for pie chart
  const prepareCategoryData = () => {
    if (!paymentsData?.categorySummary) return;
    
    const data = (paymentsData.categorySummary || []).map((item: any) => ({
      name: item.name,
      value: item.total,
    }));
    
    setCategoryData(data);
  };
  
  // Prepare recipient type data for pie chart
  const prepareRecipientTypeData = () => {
    if (!paymentsData?.recipientSummary) return;
    
    // Group by recipient type
    const groupedByType: Record<string, number> = {};
    
    (paymentsData.recipientSummary || []).forEach((item: any) => {
      const type = item.type;
      if (!groupedByType[type]) {
        groupedByType[type] = 0;
      }
      groupedByType[type] += item.total;
    });
    
    // Convert to array format for chart
    const data = Object.entries(groupedByType).map(([type, total]) => ({
      name: getRecipientTypeLabel(type),
      value: total,
    }));
    
    setRecipientTypeData(data);
  };
  
  // Custom tooltip for charts
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border rounded shadow-sm">
          <p className="font-medium">{format(new Date(label), 'dd MMM yyyy', { locale: es })}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }}>
              {entry.name}: {formatCurrency(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };
  
  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };
  
  // Format date for X-axis
  const formatXAxis = (date: string) => {
    return format(new Date(date), 'dd/MM', { locale: es });
  };
  
  // Get recipient type label
  const getRecipientTypeLabel = (type: string) => {
    switch (type) {
      case 'subcontractor':
        return 'Subcontratistas';
      case 'employee':
        return 'Empleados';
      case 'supplier':
        return 'Proveedores';
      default:
        return 'Otros';
    }
  };
  
  // Custom legend formatter for pie charts
  const renderLegend = (props: any) => {
    const { payload } = props;
    
    return (
      <ul className="flex flex-wrap justify-center gap-4 mt-4">
        {payload.map((entry: any, index: number) => (
          <li key={`item-${index}`} className="flex items-center">
            <span
              className="inline-block w-3 h-3 mr-2 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-sm">{entry.value}</span>
          </li>
        ))}
      </ul>
    );
  };
  
  // PieChart custom label formatter
  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index }: any) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * Math.PI / 180);
    const y = cy + radius * Math.sin(-midAngle * Math.PI / 180);
    
    return percent > 0.05 ? (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={12}
        fontWeight="bold"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    ) : null;
  };
  
  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center py-12">
            <p className="text-lg text-gray-500">Cargando datos financieros...</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Resumen Financiero</CardTitle>
          <CardDescription>
            Período: {formatDateRange()}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={summaryData}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tickFormatter={formatXAxis} />
                <YAxis 
                  yAxisId="left" 
                  orientation="left" 
                  tickFormatter={(value) => `$${value.toLocaleString()}`} 
                />
                <YAxis 
                  yAxisId="right" 
                  orientation="right" 
                  tickFormatter={(value) => `$${value.toLocaleString()}`} 
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar yAxisId="left" dataKey="ingresos" name="Ingresos" fill="#4CAF50" />
                <Bar yAxisId="left" dataKey="gastos" name="Gastos" fill="#FF5722" />
                <Line 
                  yAxisId="right" 
                  type="monotone" 
                  dataKey="beneficio" 
                  name="Beneficio" 
                  stroke="#2196F3" 
                  strokeWidth={2} 
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Distribución de Gastos</CardTitle>
            <CardDescription>Por categoría</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              {categoryData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={renderCustomizedLabel}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatCurrency(value as number)} />
                    <Legend 
                      formatter={(value, entry, index) => value}
                      iconType="circle"
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-gray-500">No hay datos disponibles</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Pagos por Tipo de Destinatario</CardTitle>
            <CardDescription>Distribución del gasto total</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              {recipientTypeData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={recipientTypeData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={renderCustomizedLabel}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {recipientTypeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatCurrency(value as number)} />
                    <Legend 
                      formatter={(value, entry, index) => value}
                      iconType="circle"
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-gray-500">No hay datos disponibles</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}