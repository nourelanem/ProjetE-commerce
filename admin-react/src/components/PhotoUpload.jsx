import { useState, useRef } from "react";
import { uploadProductPhoto, getPhotoUrl } from "../api/api";

export default function PhotoUpload({ product, onUploaded }) {
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState(
    product.photoUrl ? getPhotoUrl(product.id) : null
  );
  const inputRef = useRef();

  const handleFile = async (file) => {
    if (!file) return;
    // Show local preview instantly
    setPreview(URL.createObjectURL(file));
    setLoading(true);
    try {
      const updated = await uploadProductPhoto(product.id, file);
      onUploaded?.(updated);
    } catch (e) {
      console.error("Upload failed", e);
    } finally {
      setLoading(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) handleFile(file);
  };

  return (
    <div
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
      onClick={() => inputRef.current.click()}
      style={{
        border: "1.5px dashed #B5D4F4",
        borderRadius: 8,
        padding: "1.5rem",
        textAlign: "center",
        cursor: "pointer",
        background: preview ? "transparent" : "#E6F1FB22",
        position: "relative",
        minHeight: 140,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        onChange={(e) => handleFile(e.target.files[0])}
      />

      {preview ? (
        <img
          src={preview}
          alt="preview"
          style={{
            maxHeight: 120,
            maxWidth: "100%",
            borderRadius: 6,
            objectFit: "cover",
          }}
        />
      ) : (
        <>
          <div style={{ fontSize: 28 }}>📷</div>
          <div style={{ fontSize: 13, color: "#888" }}>
            Glissez une image ou cliquez pour choisir
          </div>
          <div style={{ fontSize: 11, color: "#aaa" }}>
            JPG, PNG, WEBP — max 5 MB
          </div>
        </>
      )}

      {loading && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "rgba(255,255,255,0.7)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 8,
            fontSize: 13,
            color: "#185FA5",
          }}
        >
          Envoi en cours…
        </div>
      )}

      {preview && !loading && (
        <div style={{ fontSize: 11, color: "#185FA5", marginTop: 4 }}>
          Cliquer pour changer la photo
        </div>
      )}
    </div>
  );
}