const { test } = require('node:test');
const assert = require('node:assert');
const { createStoredDocument, toPublicDocument } = require('../src/services/documentMapper');

function createFile(overrides = {}) {
  return {
    originalname: 'contrato.pdf',
    size: 24576,
    mimetype: 'application/pdf',
    filename: 'stored-file-name',
    path: '/tmp/stored-file-name',
    ...overrides,
  };
}

test('cria documento persistido com metadados internos e públicos', () => {
  const uploadedAt = new Date('2026-09-15T12:00:00.000Z');
  const document = createStoredDocument(
    createFile(),
    'user-123',
    () => 'document-id',
    () => uploadedAt,
  );

  assert.deepStrictEqual(document, {
    id: 'document-id',
    originalName: 'contrato.pdf',
    size: 24576,
    mimeType: 'application/pdf',
    uploadedAt: uploadedAt.toISOString(),
    owner: 'user-123',
    storedName: 'stored-file-name',
    storagePath: '/tmp/stored-file-name',
  });
});

test('remove campos internos ao expor documento publicamente', () => {
  const publicDocument = toPublicDocument({
    id: 'document-id',
    originalName: 'contrato.pdf',
    size: 24576,
    mimeType: 'application/pdf',
    uploadedAt: '2026-09-15T12:00:00.000Z',
    owner: 'user-123',
    storedName: 'stored-file-name',
    storagePath: '/tmp/stored-file-name',
  });

  assert.deepStrictEqual(publicDocument, {
    id: 'document-id',
    originalName: 'contrato.pdf',
    size: 24576,
    mimeType: 'application/pdf',
    uploadedAt: '2026-09-15T12:00:00.000Z',
    owner: 'user-123',
  });
});
