const { test } = require('node:test');
const assert = require('node:assert');
const DocumentService = require('../src/services/documentService');

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

function createDocument(overrides = {}) {
  return {
    id: 'document-id',
    originalName: 'contrato.pdf',
    size: 24576,
    mimeType: 'application/pdf',
    uploadedAt: '2026-09-15T12:00:00.000Z',
    owner: 'user-123',
    storedName: 'stored-file-name',
    storagePath: '/tmp/stored-file-name',
    ...overrides,
  };
}

function createRepository(overrides = {}) {
  return {
    savedDocuments: [],
    removedFiles: [],
    save(document) {
      this.savedDocuments.push(document);
      return document;
    },
    findByOwner() {
      return [];
    },
    findById() {
      return null;
    },
    async fileExists() {
      return true;
    },
    async removeFile(storagePath) {
      this.removedFiles.push(storagePath);
    },
    ...overrides,
  };
}

test('cria documento com metadados públicos e registra no repositório', async () => {
  const repository = createRepository();
  const service = new DocumentService(repository);
  const file = createFile();

  const document = await service.createDocument(file, 'user-123');

  assert.match(document.id, /^[0-9a-f-]{36}$/);
  assert.strictEqual(document.originalName, file.originalname);
  assert.strictEqual(document.size, file.size);
  assert.strictEqual(document.mimeType, file.mimetype);
  assert.strictEqual(document.owner, 'user-123');
  assert.strictEqual(typeof document.uploadedAt, 'string');
  assert.ok(!Number.isNaN(Date.parse(document.uploadedAt)));
  assert.strictEqual(document.storedName, undefined);
  assert.strictEqual(document.storagePath, undefined);

  assert.strictEqual(repository.savedDocuments.length, 1);
  assert.strictEqual(repository.savedDocuments[0].storedName, file.filename);
  assert.strictEqual(repository.savedDocuments[0].storagePath, file.path);
});

test('remove arquivo criado quando o registro no repositório falha', async () => {
  const saveError = new Error('falha ao salvar');
  const repository = createRepository({
    save() {
      throw saveError;
    },
  });
  const service = new DocumentService(repository);
  const file = createFile();

  await assert.rejects(() => service.createDocument(file, 'user-123'), saveError);
  assert.deepStrictEqual(repository.removedFiles, [file.path]);
});

test('lista somente documentos retornados pelo repositório sem campos internos', () => {
  const firstDocument = createDocument({ id: 'first-document' });
  const secondDocument = createDocument({ id: 'second-document', originalName: 'recibo.pdf' });
  const repository = createRepository({
    requestedOwner: null,
    findByOwner(owner) {
      this.requestedOwner = owner;
      return [firstDocument, secondDocument];
    },
  });
  const service = new DocumentService(repository);

  const documents = service.listDocuments('user-123');

  assert.strictEqual(repository.requestedOwner, 'user-123');
  assert.deepStrictEqual(documents, [
    {
      id: 'first-document',
      originalName: 'contrato.pdf',
      size: 24576,
      mimeType: 'application/pdf',
      uploadedAt: '2026-09-15T12:00:00.000Z',
      owner: 'user-123',
    },
    {
      id: 'second-document',
      originalName: 'recibo.pdf',
      size: 24576,
      mimeType: 'application/pdf',
      uploadedAt: '2026-09-15T12:00:00.000Z',
      owner: 'user-123',
    },
  ]);
});

test('retorna documento para download quando existe, pertence ao usuário e o arquivo está disponível', async () => {
  const storedDocument = createDocument();
  const repository = createRepository({
    checkedPath: null,
    findById(id) {
      assert.strictEqual(id, 'document-id');
      return storedDocument;
    },
    async fileExists(storagePath) {
      this.checkedPath = storagePath;
      return true;
    },
  });
  const service = new DocumentService(repository);

  const document = await service.getDocumentForDownload('document-id', 'user-123');

  assert.strictEqual(document, storedDocument);
  assert.strictEqual(repository.checkedPath, storedDocument.storagePath);
});

test('rejeita download de documento inexistente com erro padronizado', async () => {
  const service = new DocumentService(createRepository());

  await assert.rejects(
    () => service.getDocumentForDownload('missing-id', 'user-123'),
    {
      code: 'DOCUMENT_NOT_FOUND',
      status: 404,
      message: 'Documento não encontrado.',
    },
  );
});

test('rejeita download de documento de outro proprietário como não encontrado', async () => {
  const repository = createRepository({
    findById() {
      return createDocument({ owner: 'other-user' });
    },
  });
  const service = new DocumentService(repository);

  await assert.rejects(
    () => service.getDocumentForDownload('document-id', 'user-123'),
    {
      code: 'DOCUMENT_NOT_FOUND',
      status: 404,
      message: 'Documento não encontrado.',
    },
  );
});

test('rejeita download quando o arquivo físico não está disponível', async () => {
  const repository = createRepository({
    findById() {
      return createDocument();
    },
    async fileExists() {
      return false;
    },
  });
  const service = new DocumentService(repository);

  await assert.rejects(
    () => service.getDocumentForDownload('document-id', 'user-123'),
    {
      code: 'FILE_NOT_FOUND',
      status: 404,
      message: 'Arquivo não encontrado.',
    },
  );
});