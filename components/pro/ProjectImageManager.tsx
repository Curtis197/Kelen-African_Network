"use client";

import { useState, useRef } from "react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { uploadFile } from "@/lib/supabase/storage";
import { addProjectImage, deleteProjectImage, setMainProjectImage } from "@/lib/actions/realisations";
import { Image as ImageIcon, Upload, Trash2, Star, StarOff, X } from "lucide-react";
import Image from "next/image";
import type { ProjectImage } from "@/lib/supabase/types";

interface ProjectImageManagerProps {
  documentId: string;
  images: ProjectImage[];
  onImagesChange: () => void;
}

export default function ProjectImageManager({
  documentId,
  images,
  onImagesChange,
}: ProjectImageManagerProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();


  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) {
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setError("Vous devez être connecté pour uploader des images.");
        return;
      }


      const { data: pro } = await supabase
        .from("professionals")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (!pro) {
        setError(
          "Profil professionnel non trouvé. Veuillez compléter votre profil."
        );
        return;
      }


      // Upload all files
      const uploadedUrls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        // Validate file size (10MB max)
        if (file.size > 10 * 1024 * 1024) {
          setError("Un ou plusieurs fichiers sont trop volumineux. Taille maximale : 10 Mo.");
          continue;
        }

        // Validate file type
        const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
        if (!allowedTypes.includes(file.type)) {
          setError("Format non accepté. Formats acceptés : JPG, PNG, WEBP.");
          continue;
        }

        // Upload file to storage
        const bucket = "portfolios";
        const path = `${user.id}/projects/${documentId}/images`;

        const fileUrl = await uploadFile(file, bucket, path);
        uploadedUrls.push(fileUrl);
      }

      if (uploadedUrls.length === 0) {
        return;
      }


      // Add images to database
      const result = await addProjectImage(documentId, uploadedUrls);

      if (!result.success) {
        setError(result.error || "Erreur lors de l'ajout des images.");
        return;
      }

      onImagesChange();
    } catch (err) {
      setError("Erreur lors de l'upload des images.");
    } finally {
      setIsUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleSetMain = async (imageId: string) => {
    setError(null);

    const result = await setMainProjectImage(documentId, imageId);

    if (!result.success) {
      setError(result.error || "Erreur lors de la définition de l'image principale.");
      return;
    }

    onImagesChange();
  };

  const handleDelete = (imageId: string) => {
    toast("Supprimer cette image ?", {
      action: {
        label: "Supprimer",
        onClick: async () => {
          setIsDeleting(imageId);
          setError(null);
          const result = await deleteProjectImage(imageId);
          if (!result.success) {
            setError(result.error || "Erreur lors de la suppression de l'image.");
            setIsDeleting(null);
            return;
          }
          onImagesChange();
          setIsDeleting(null);
        },
      },
      cancel: { label: "Annuler", onClick: () => {} },
    });
  };

  const mainImage = images.find((img) => img.is_main);
  const otherImages = images.filter((img) => !img.is_main);


  return (
    <div className="space-y-4">
      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center justify-between">
          <p className="text-sm">{error}</p>
          <button onClick={() => setError(null)} className="p-1 hover:bg-red-100 rounded">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Image Display */}
      {mainImage && (
        <div className="relative group">
          <div className="aspect-video bg-surface-container rounded-xl overflow-hidden">
            <Image
              src={mainImage.url}
              alt="Image principale"
              className="object-cover"
              fill
              sizes="(max-width: 1200px) 100vw, 80vw"
            />
          </div>
          <div className="absolute top-3 left-3 bg-kelen-green-600 text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
            <Star className="w-3 h-3" fill="currentColor" />
            Image principale
          </div>
          <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => handleDelete(mainImage.id)}
              disabled={isDeleting === mainImage.id}
              className="p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
              title="Supprimer"
            >
              {isDeleting === mainImage.id ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      )}

      {/* Image Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {otherImages.map((image) => (
            <div
              key={image.id}
              className="relative group aspect-square bg-surface-container rounded-xl overflow-hidden"
            >
              <Image
                src={image.url}
                alt="Image du projet"
                className="object-cover"
                fill
                sizes="(max-width: 768px) 50vw, 25vw"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors" />
              <div className="absolute inset-0 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => handleSetMain(image.id)}
                  className="p-2 bg-white text-on-surface rounded-lg hover:bg-gray-100 transition-colors"
                  title="Définir comme image principale"
                >
                  <Star className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(image.id)}
                  disabled={isDeleting === image.id}
                  className="p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                  title="Supprimer"
                >
                  {isDeleting === image.id ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          ))}

          {/* Upload Card */}
          <div className="relative aspect-square bg-surface-container-low rounded-xl overflow-hidden border-2 border-dashed border-outline-variant/30 hover:border-kelen-green-300 transition-colors cursor-pointer">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              multiple
              onChange={handleImageUpload}
              disabled={isUploading}
              className="absolute inset-0 opacity-0 cursor-pointer disabled:cursor-not-allowed"
            />
            <div className="absolute inset-0 flex flex-col items-center justify-center text-on-surface-variant">
              {isUploading ? (
                <div className="w-8 h-8 border-4 border-kelen-green-500 border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Upload className="w-8 h-8 mb-2" />
                  <span className="text-xs font-medium">Ajouter</span>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {images.length === 0 && (
        <div className="text-center py-12 bg-surface-container-low rounded-xl">
          <ImageIcon className="w-12 h-12 mx-auto text-on-surface-variant/40 mb-4" />
          <h3 className="text-lg font-semibold text-on-surface mb-2">
            Aucune image
          </h3>
          <p className="text-sm text-on-surface-variant mb-4">
            Ajoutez des images pour illustrer ce document
          </p>
          <label className="inline-flex items-center gap-2 px-6 py-3 bg-kelen-green-600 text-white rounded-xl font-semibold text-sm hover:bg-kelen-green-700 transition-colors cursor-pointer">
            <Upload className="w-4 h-4" />
            Sélectionner des images
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              multiple
              onChange={handleImageUpload}
              disabled={isUploading}
              className="hidden"
            />
          </label>
        </div>
      )}

      {/* Upload Button (when images already exist) */}
      {images.length > 0 && (
        <label className="flex items-center justify-center gap-2 w-full py-4 bg-surface-container-low border-2 border-dashed border-outline-variant/30 rounded-xl hover:border-kelen-green-300 hover:bg-kelen-green-50/20 transition-all cursor-pointer">
          {isUploading ? (
            <div className="w-5 h-5 border-4 border-kelen-green-500 border-t-transparent rounded-full animate-spin" />
          ) : (
            <Upload className="w-5 h-5 text-on-surface-variant" />
          )}
          <span className="text-sm font-medium text-on-surface-variant">
            Ajouter d'autres images
          </span>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            multiple
            onChange={handleImageUpload}
            disabled={isUploading}
            className="hidden"
          />
        </label>
      )}
    </div>
  );
}
