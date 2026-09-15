const {
  createDocumentNotFoundError,
  createFileNotFoundError,
} = require('./documentErrors');
const { createStoredDocument, toPublicDocument } = require('./documentMapper');

class DocumentService {
  constructor(documentRepository) {
    this.documentRepository = documentRepository;
  }

  async createDocument(file, owner) {
    const document = createStoredDocument(file, owner);

    try {
      this.documentRepository.save(document);
      return toPublicDocument(document);
    } catch (error) {
      await this.removeStoredFile(file.path);
      throw error;
    }
  }

  listDocuments(owner) {
    return this.documentRepository
      .findByOwner(owner)
      .map(toPublicDocument);
  }

  async getDocumentForDownload(id, owner) {
    const document = this.requireOwnedDocument(id, owner);
    await this.ensureStoredFileExists(document.storagePath);

    return document;
  }

  requireOwnedDocument(id, owner) {
    const document = this.documentRepository.findById(id);

    if (!document || document.owner !== owner) {
      throw createDocumentNotFoundError();
    }

    return document;
  }

  async ensureStoredFileExists(storagePath) {
    if (!(await this.documentRepository.fileExists(storagePath))) {
      throw createFileNotFoundError();
    }
  }

  async removeStoredFile(storagePath) {
    await this.documentRepository.removeFile(storagePath).catch(() => {});
  }
}

module.exports = DocumentService;