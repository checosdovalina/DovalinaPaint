import { Helmet } from "react-helmet";
import PageHeader from "@/components/page-header";
import FinancialSummary from "@/components/financial-summary";

export default function FinancialReportsPage() {
  return (
    <>
      <Helmet>
        <title>Financial Reports | Dovalina Painting LLC</title>
      </Helmet>

      <div className="container py-6 space-y-6">
        <PageHeader
          title="Financial Reports"
          description="View financial performance and analytics"
        />
        
        <FinancialSummary />
      </div>
    </>
  );
}