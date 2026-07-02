import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

export async function GET() {
  const auth = await createClient();
  const { data: { user } } = await auth.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const db = createServiceClient();

  // Verificar info del bucket
  const { data: bucket, error: bucketError } = await db.storage.getBucket("product-images");

  // Listar archivos (máx 5 para muestra)
  const { data: files, error: listError } = await db.storage
    .from("product-images")
    .list("products", { limit: 5 });

  // URL de muestra
  let sampleUrl: string | null = null;
  if (files && files.length > 0) {
    const { data: { publicUrl } } = db.storage
      .from("product-images")
      .getPublicUrl(`products/${files[0].name}`);
    sampleUrl = publicUrl;
  }

  return NextResponse.json({
    bucket: bucket ? {
      id: bucket.id,
      name: bucket.name,
      public: bucket.public,
      fileSizeLimit: bucket.file_size_limit,
    } : null,
    bucketError: bucketError?.message ?? null,
    fileCount: files?.length ?? 0,
    sampleFiles: files?.map(f => f.name) ?? [],
    sampleUrl,
    listError: listError?.message ?? null,
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "NOT SET",
  });
}
