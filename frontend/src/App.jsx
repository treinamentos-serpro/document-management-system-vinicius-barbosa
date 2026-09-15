import { useEffect, useRef, useState } from 'react';
import DocumentList from './components/DocumentList';
import UploadComponent from './components/UploadComponent';
import { listDocuments, uploadDocument } from './services/documentApi';
import './App.css';

export default function App() {
  const [userId, setUserId] = useState('demo-user');
  const [documents, setDocuments] = useState([]);
  const [feedback, setFeedback] = useState({ message: '', type: 'success' });
  const [isLoading, setIsLoading] = useState(false);
  const latestUserId = useRef('demo-user');

  const trimmedUserId = userId.trim();
  const isUserMissing = !trimmedUserId;
  latestUserId.current = trimmedUserId;

  useEffect(() => {
    if (isUserMissing) {
      setDocuments([]);
      return;
    }

    let isActive = true;

    async function loadDocuments() {
      setIsLoading(true);
      setFeedback({ message: '', type: 'success' });

      try {
        const loadedDocuments = await listDocuments(trimmedUserId);

        if (isActive) {
          setDocuments(loadedDocuments);
        }
      } catch (error) {
        if (isActive) {
          setFeedback({ message: error.message, type: 'error' });
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }

    loadDocuments();

    return () => {
      isActive = false;
    };
  }, [isUserMissing, trimmedUserId]);

  async function handleUpload(file) {
    const uploadUserId = trimmedUserId;
    setIsLoading(true);
    setFeedback({ message: '', type: 'success' });

    try {
      await uploadDocument(file, trimmedUserId);
      const updatedDocuments = await listDocuments(uploadUserId);

      if (latestUserId.current === uploadUserId) {
        setDocuments(updatedDocuments);
        setFeedback({ message: 'Documento enviado com sucesso.', type: 'success' });
      }

      return true;
    } catch (error) {
      setFeedback({ message: error.message, type: 'error' });
      return false;
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="app-shell">
      <section className="app-container">
        <header className="app-header">
          <p className="app-eyebrow">Document Management System</p>
          <h1>Gestão de documentos</h1>
        </header>

        <label className="user-field" htmlFor="user-id">
          Usuário
          <input
            id="user-id"
            type="text"
            value={userId}
            onChange={(event) => setUserId(event.target.value)}
            placeholder="Informe o usuário"
          />
        </label>

        <UploadComponent disabled={isLoading || isUserMissing} onUpload={handleUpload} />

        {isUserMissing && (
          <p className="message message-error">Informe um usuário para enviar e listar documentos.</p>
        )}

        {feedback.message && (
          <p className={`message message-${feedback.type}`}>{feedback.message}</p>
        )}

        <section className="documents-section">
          <div className="section-header">
            <h2>Documentos</h2>
            {isLoading && <span>Carregando...</span>}
          </div>
          <DocumentList
            documents={documents}
            userId={trimmedUserId}
            disabled={isLoading || isUserMissing}
            onError={(message) => setFeedback({ message, type: 'error' })}
          />
        </section>
      </section>
    </main>
  );
}
