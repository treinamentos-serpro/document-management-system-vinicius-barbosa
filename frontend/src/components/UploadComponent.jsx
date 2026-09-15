import { useState } from 'react';

export default function UploadComponent({ disabled, onUpload }) {
  const [selectedFile, setSelectedFile] = useState(null);

  async function handleSubmit(event) {
    event.preventDefault();

    if (!selectedFile) {
      return;
    }

    const uploaded = await onUpload(selectedFile);

    if (uploaded) {
      setSelectedFile(null);
      event.currentTarget.reset();
    }
  }

  return (
    <form className="upload-panel" onSubmit={handleSubmit}>
      <label htmlFor="document-file">Documento</label>
      <div className="upload-controls">
        <input
          id="document-file"
          type="file"
          disabled={disabled}
          onChange={(event) => setSelectedFile(event.target.files?.[0] || null)}
        />
        <button type="submit" disabled={disabled || !selectedFile}>
          Enviar
        </button>
      </div>
    </form>
  );
}