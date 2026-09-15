const fs = require('node:fs/promises');
const path = require('node:path');

class DocumentRepository {
  constructor(storageDirectory) {
    this.documents = new Map();
    this.storageDirectory = path.resolve(storageDirectory);
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

  getStoragePath(storedName) {
    if (!storedName || storedName !== path.basename(storedName)) {
      throw new Error('Nome físico de arquivo inválido.');
    }

    return path.join(this.storageDirectory, storedName);
  }

  async fileExists(storedName) {
    try {
      await fs.access(this.getStoragePath(storedName));
      return true;
    } catch {
      return false;
    }
  }

  async removeFile(storedName) {
    await fs.unlink(this.getStoragePath(storedName));
  }
}

module.exports = DocumentRepository;