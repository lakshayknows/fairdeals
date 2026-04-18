export const dynamic = "force-dynamic";
import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import NewInvoiceForm from "@/components/NewInvoiceForm";

export default async function EditInvoicePage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const id = parseInt(params.id, 10);
  if (isNaN(id)) return notFound();

  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: {
      party: true,
      items: { include: { product: true } }
    }
  });

  if (!invoice) return notFound();

  const serializedInvoice = JSON.parse(JSON.stringify(invoice));

  return <NewInvoiceForm initialData={serializedInvoice} />;
}
