import { PhotosUploadClient } from "./PhotosUploadClient";

export const dynamic = "force-dynamic";

export default function AdminPhotosPage() {
  return (
    <div>
      <div>
        <h1 className="text-3xl font-display text-stone-800">Photos</h1>
        <p className="text-stone-500 mt-1">
          Upload event photos to the gallery. Files are stored in Vercel Blob and
          appear in the site gallery immediately. Requires{" "}
          <code>BLOB_READ_WRITE_TOKEN</code> in <code>.env</code>.
        </p>
      </div>
      <PhotosUploadClient />
    </div>
  );
}
