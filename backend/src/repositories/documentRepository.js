const fs = require('node:fs/promises');

class DocumentRepository {
  constructor() {
    this.documents = new Map();
  }

  save(document) {
    this.documents.set(document.id, document);
    return document;
  }

  findById(id) {
    return this.documents.get(id) || null;
  }

  findByOwner(owner) {
    return Array.from(this.documents.values())
      .filter((document) => document.owner === owner)
      .sort((first, second) => second.uploadedAt.localeCompare(first.uploadedAt));
  }

  async fileExists(storagePath) {
    try {
      await fs.access(storagePath);
      return true;
    } catch {
      return false;
    }
  }

  async removeFile(storagePath) {
    await fs.unlink(storagePath);
  }
}

module.exports = DocumentRepository;