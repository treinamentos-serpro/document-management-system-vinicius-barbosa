import { useState } from 'react';
import { downloadDocument } from '../services/documentApi';

export default function DownloadButton({ document, userId, disabled, onError }) {
  const [isDownloading, setIsDownloading] = useState(false);

  async function handleDownload() {
    setIsDownloading(true);
    onError('');

    try {
      await downloadDocument(document, userId);
    } catch (error) {
      onError(error.message);
    } finally {
      setIsDownloading(false);
    }
  }

  return (
    <button type="button" disabled={disabled || isDownloading} onClick={handleDownload}>
      {isDownloading ? 'Baixando...' : 'Baixar'}
    </button>
  );
}