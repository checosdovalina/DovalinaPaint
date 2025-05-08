import { Helmet } from "react-helmet";
import PageHeader from "@/components/page-header";
import PaymentList from "@/components/payment-list";

export default function PaymentsPage() {
  return (
    <>
      <Helmet>
        <title>Payments | Dovalina Painting LLC</title>
      </Helmet>

      <div className="container py-6 space-y-6">
        <PageHeader
          title="Payments"
          description="Manage payments to staff, subcontractors, and suppliers"
        />
        
        <PaymentList />
      </div>
    </>
  );
}