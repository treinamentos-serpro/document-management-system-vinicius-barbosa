const { randomUUID } = require('node:crypto');

function createStoredDocument(file, owner, createId = randomUUID, now = () => new Date()) {
  return {
    id: createId(),
    originalName: file.originalname,
    size: file.size,
    mimeType: file.mimetype,
    uploadedAt: now().toISOString(),
    owner,
    storedName: file.filename,
    storagePath: file.path,
  };
}

function toPublicDocument(document) {
  return {
    id: document.id,
    originalName: document.originalName,
    size: document.size,
    mimeType: document.mimeType,
    uploadedAt: document.uploadedAt,
    owner: document.owner,
  };
}

module.exports = {
  createStoredDocument,
  toPublicDocument,
};
