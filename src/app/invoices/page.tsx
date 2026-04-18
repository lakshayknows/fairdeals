import PendingPaymentsDashboard from "@/components/PendingPaymentsDashboard";

export const metadata = { title: "Invoices — FairDeals Billing" };

export default function InvoicesPage() {
  return (
    <div className="flex flex-col h-full">
      <PendingPaymentsDashboard variant="invoices" />
    </div>
  );
}
