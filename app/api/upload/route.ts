import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth-helpers";
import { uploadImage } from "@/lib/blob";

export async function POST(req: Request) {
  const userId = await getCurrentUserId();
  const form = await req.formData();
  const file = form.get("file");
  const folder = (form.get("folder") as string | null) ?? "uploads";
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Missing file" }, { status: 400 });
  }
  try {
    const blob = await uploadImage(file, `${userId}/${folder}/${file.name}`);
    return NextResponse.json({ url: blob.url });
  } catch (e) {
    return NextResponse.json(
      { error: (e as Error).message },
      { status: 400 },
    );
  }
}
