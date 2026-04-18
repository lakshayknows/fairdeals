import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    let configs = await prisma.gstConfig.findMany({ orderBy: { cgstRate: "asc" } });
    
    // Seed standard ones if empty
    if (configs.length === 0) {
      await prisma.gstConfig.createMany({
        data: [
          { name: "GST 0%", cgstRate: 0, sgstRate: 0, igstRate: 0, cessRate: 0 },
          { name: "GST 5%", cgstRate: 2.5, sgstRate: 2.5, igstRate: 5, cessRate: 0 },
          { name: "GST 12%", cgstRate: 6, sgstRate: 6, igstRate: 12, cessRate: 0 },
          { name: "GST 18%", cgstRate: 9, sgstRate: 9, igstRate: 18, cessRate: 0 },
          { name: "GST 28%", cgstRate: 14, sgstRate: 14, igstRate: 28, cessRate: 0 },
          { name: "GST 40%", cgstRate: 20, sgstRate: 20, igstRate: 40, cessRate: 0 },
        ],
      });
      configs = await prisma.gstConfig.findMany({ orderBy: { cgstRate: "asc" } });
    }
    
    return NextResponse.json(configs);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
