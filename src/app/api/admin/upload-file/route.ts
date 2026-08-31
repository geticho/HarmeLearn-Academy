import { NextRequest, NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import { requireAdmin, authErrorResponse } from "@/lib/session";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const dynamic = "force-dynamic";

/**
 * POST /api/admin/upload-file
 *
 * Accepts a multipart/form-data upload with a single "file" field.
 * Uploads it to Cloudinary and returns the resulting public URL.
 *
 * This is intentionally separate from /api/admin/pdfs — that route still
 * only stores an already-hosted URL in the database. This route's job is
 * just to produce that URL from a file the admin picks on their computer.
 */
export async function POST(request: NextRequest) {
  try {
    await requireAdmin();

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Cloudinary's Node SDK wants a Buffer or a base64 data URI for
    // programmatic uploads (as opposed to the browser-side widget).
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = `data:${file.type};base64,${buffer.toString("base64")}`;

    // "raw" resource_type handles PDFs and other non-image/video files.
    const isPdf = file.type === "application/pdf";

 const result = await cloudinary.uploader.upload(base64, {
  resource_type: isPdf ? "image" : "auto",
  folder: "harmelearn",
  use_filename: true,
  unique_filename: true,
  format: isPdf ? "pdf" : undefined,
});

    return NextResponse.json({
      url: result.secure_url,
      bytes: result.bytes,
      format: result.format,
    });
  } catch (error) {
    const authResponse = authErrorResponse(error);
    if (authResponse) return authResponse;
    console.error("Upload file error:", error);
    return NextResponse.json({ error: "Failed to upload file" }, { status: 500 });
  }
}
