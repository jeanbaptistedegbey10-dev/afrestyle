// src/app/api/upload/avatar/route.ts
import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("avatar") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "Aucun fichier fourni" },
        { status: 400 }
      );
    }

    // Validation du type de fichier
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/avif"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Format non accepté. Utilise JPG, PNG, WebP ou AVIF." },
        { status: 400 }
      );
    }

    // Validation de la taille (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: "Image trop grande. Maximum 5 MB." },
        { status: 400 }
      );
    }

    // Génère un nom unique
    const timestamp = Date.now();
    const ext = file.name.split(".").pop() ?? "jpg";
    const fileName = `avatar-${timestamp}-${Math.random().toString(36).substring(2, 8)}.${ext}`;

    // Chemin de sauvegarde
    const uploadDir = path.join(process.cwd(), "public", "uploads", "avatars");
    const filePath = path.join(uploadDir, fileName);

    // Crée le dossier s'il n'existe pas
    await mkdir(uploadDir, { recursive: true });

    // Écrit le fichier
    const bytes = await file.arrayBuffer();
    await writeFile(filePath, Buffer.from(bytes));

    // URL publique de l'image
    const avatarUrl = `/uploads/avatars/${fileName}`;

    return NextResponse.json({ success: true, avatarUrl });
  } catch (error) {
    console.error("Upload avatar error:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'upload" },
      { status: 500 }
    );
  }
}