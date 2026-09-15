import DownloadButton from './DownloadButton';

function formatFileSize(size) {
  if (size < 1024) {
    return `${size} B`;
  }

  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`;
  }

  return `${(size / 1024 / 1024).toFixed(1)} MB`;
}

function formatDate(date) {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(date));
}

export default function DocumentList({ documents, userId, disabled, onError }) {
  if (!documents.length) {
    return <p className="empty-state">Nenhum documento enviado para este usuário.</p>;
  }

  return (
    <div className="document-list" aria-live="polite">
      {documents.map((document) => (
        <article className="document-item" key={document.id}>
          <div>
            <h2>{document.originalName}</h2>
            <p>
              {formatFileSize(document.size)} - {formatDate(document.uploadedAt)}
            </p>
          </div>
          <DownloadButton
            document={document}
            userId={userId}
            disabled={disabled}
            onError={onError}
          />
        </article>
      ))}
    </div>
  );
}