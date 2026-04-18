import React from "react";
import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import PrintButton from "@/components/PrintButton";
import { getBusinessProfile } from "@/lib/businessProfile";
import A4InvoiceTemplate from "@/components/A4InvoiceTemplate";
import ThermalReceiptTemplate from "@/components/ThermalReceiptTemplate";
import Link from "next/link";
import { FileText, Receipt } from "lucide-react";

export default async function PrintInvoicePage(props: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ layout?: string }>;
}) {
  const params = await props.params;
  const searchParams = await props.searchParams;

  const invId = parseInt(params.id, 10);
  if (isNaN(invId)) return notFound();

  const invoice = await prisma.invoice.findUnique({
    where: { id: invId },
    include: {
      party: true,
      items: {
        include: { product: true },
      },
      payments: { orderBy: { paymentDate: "desc" } },
    },
  });

  if (!invoice) return notFound();

  const profile = await getBusinessProfile();
  const isThermal = searchParams.layout === "thermal";

  return (
    <div className="bg-slate-100 min-h-screen text-slate-900 pb-20">
      <div className="no-print mx-auto max-w-[210mm] pt-8 flex justify-between items-center mb-4 px-4 border-b border-slate-300 pb-4">
        
        {/* Layout Switcher UI */}
        <div className="flex bg-slate-200 p-1 rounded-lg">
          <Link
            href={`?layout=a4`}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-semibold transition-colors ${!isThermal ? 'bg-white shadow text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <FileText size={16} /> A4 Standard
          </Link>
          <Link
            href={`?layout=thermal`}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-semibold transition-colors ${isThermal ? 'bg-white shadow text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <Receipt size={16} /> 80mm Thermal
          </Link>
        </div>

        <PrintButton invoiceId={params.id} />
      </div>

      <div className="mt-8">
        {isThermal ? (
          <ThermalReceiptTemplate invoice={invoice} profile={profile} />
        ) : (
          <A4InvoiceTemplate invoice={invoice} profile={profile} />
        )}
      </div>
    </div>
  );
}
