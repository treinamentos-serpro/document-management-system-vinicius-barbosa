const { randomUUID } = require('node:crypto');

class DocumentService {
  constructor(documentRepository) {
    this.documentRepository = documentRepository;
  }

  async createDocument(file, owner) {
    const document = {
      id: randomUUID(),
      originalName: file.originalname,
      size: file.size,
      mimeType: file.mimetype,
      uploadedAt: new Date().toISOString(),
      owner,
      storedName: file.filename,
      storagePath: file.path,
    };

    try {
      this.documentRepository.save(document);
      return this.toPublicDocument(document);
    } catch (error) {
      await this.documentRepository.removeFile(file.path).catch(() => {});
      throw error;
    }
  }

  listDocuments(owner) {
    return this.documentRepository
      .findByOwner(owner)
      .map((document) => this.toPublicDocument(document));
  }

  async getDocumentForDownload(id, owner) {
    const document = this.documentRepository.findById(id);

    if (!document || document.owner !== owner) {
      const error = new Error('Documento não encontrado.');
      error.code = 'DOCUMENT_NOT_FOUND';
      error.status = 404;
      throw error;
    }

    if (!(await this.documentRepository.fileExists(document.storagePath))) {
      const error = new Error('Arquivo não encontrado.');
      error.code = 'FILE_NOT_FOUND';
      error.status = 404;
      throw error;
    }

    return document;
  }

  toPublicDocument(document) {
    const { storedName, storagePath, ...publicDocument } = document;
    return publicDocument;
  }
}

module.exports = DocumentService;