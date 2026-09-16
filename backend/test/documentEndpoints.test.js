const { test } = require('node:test');
const assert = require('node:assert');
const http = require('node:http');
const app = require('../src/app');

// Sobe o app em uma porta aleatória para testar via requisições HTTP reais.
async function startServer() {
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const { port } = server.address();
  return { server, baseUrl: `http://127.0.0.1:${port}` };
}

async function stopServer(server) {
  await new Promise((resolve) => server.close(resolve));
}

function buildFormData(content, filename = 'contrato.pdf') {
  const formData = new FormData();
  formData.append('file', new Blob([content], { type: 'application/pdf' }), filename);
  return formData;
}

test('POST /upload envia um documento e retorna os metadados públicos', async () => {
  const { server, baseUrl } = await startServer();

  try {
    const response = await fetch(`${baseUrl}/upload`, {
      method: 'POST',
      headers: { 'X-User-Id': 'user-123' },
      body: buildFormData('conteudo do arquivo'),
    });
    const body = await response.json();

    assert.strictEqual(response.status, 201);
    assert.ok(body.document.id, 'o documento deve possuir um id');
    assert.strictEqual(body.document.originalName, 'contrato.pdf');
    assert.strictEqual(body.document.owner, 'user-123');
  } finally {
    await stopServer(server);
  }
});

test('POST /upload sem X-User-Id retorna 400', async () => {
  const { server, baseUrl } = await startServer();

  try {
    const response = await fetch(`${baseUrl}/upload`, {
      method: 'POST',
      body: buildFormData('conteudo do arquivo'),
    });
    const body = await response.json();

    assert.strictEqual(response.status, 400);
    assert.strictEqual(body.error.code, 'USER_ID_REQUIRED');
  } finally {
    await stopServer(server);
  }
});

test('POST /upload sem arquivo retorna 400', async () => {
  const { server, baseUrl } = await startServer();

  try {
    const response = await fetch(`${baseUrl}/upload`, {
      method: 'POST',
      headers: { 'X-User-Id': 'user-123' },
      body: new FormData(),
    });
    const body = await response.json();

    assert.strictEqual(response.status, 400);
    assert.strictEqual(body.error.code, 'FILE_REQUIRED');
  } finally {
    await stopServer(server);
  }
});

test('GET /documents lista apenas os documentos do usuário informado', async () => {
  const { server, baseUrl } = await startServer();

  try {
    await fetch(`${baseUrl}/upload`, {
      method: 'POST',
      headers: { 'X-User-Id': 'user-abc' },
      body: buildFormData('arquivo do user-abc'),
    });
    await fetch(`${baseUrl}/upload`, {
      method: 'POST',
      headers: { 'X-User-Id': 'user-xyz' },
      body: buildFormData('arquivo do user-xyz'),
    });

    const response = await fetch(`${baseUrl}/documents`, {
      headers: { 'X-User-Id': 'user-abc' },
    });
    const body = await response.json();

    assert.strictEqual(response.status, 200);
    assert.strictEqual(body.documents.length, 1);
    assert.strictEqual(body.documents[0].originalName, 'contrato.pdf');
  } finally {
    await stopServer(server);
  }
});

test('GET /documents sem X-User-Id retorna 400', async () => {
  const { server, baseUrl } = await startServer();

  try {
    const response = await fetch(`${baseUrl}/documents`);
    const body = await response.json();

    assert.strictEqual(response.status, 400);
    assert.strictEqual(body.error.code, 'USER_ID_REQUIRED');
  } finally {
    await stopServer(server);
  }
});

test('GET /documents/:id/download baixa o conteúdo enviado no upload', async () => {
  const { server, baseUrl } = await startServer();

  try {
    const uploadResponse = await fetch(`${baseUrl}/upload`, {
      method: 'POST',
      headers: { 'X-User-Id': 'user-123' },
      body: buildFormData('conteudo para download'),
    });
    const { document } = await uploadResponse.json();

    const downloadResponse = await fetch(`${baseUrl}/documents/${document.id}/download`, {
      headers: { 'X-User-Id': 'user-123' },
    });
    const content = await downloadResponse.text();

    assert.strictEqual(downloadResponse.status, 200);
    assert.strictEqual(content, 'conteudo para download');
  } finally {
    await stopServer(server);
  }
});

test('GET /documents/:id/download com documento inexistente retorna 404', async () => {
  const { server, baseUrl } = await startServer();

  try {
    const response = await fetch(`${baseUrl}/documents/id-inexistente/download`, {
      headers: { 'X-User-Id': 'user-123' },
    });
    const body = await response.json();

    assert.strictEqual(response.status, 404);
    assert.strictEqual(body.error.code, 'DOCUMENT_NOT_FOUND');
  } finally {
    await stopServer(server);
  }
});

test('GET /documents/:id/download de outro usuário retorna 404', async () => {
  const { server, baseUrl } = await startServer();

  try {
    const uploadResponse = await fetch(`${baseUrl}/upload`, {
      method: 'POST',
      headers: { 'X-User-Id': 'user-dono' },
      body: buildFormData('conteudo restrito'),
    });
    const { document } = await uploadResponse.json();

    const response = await fetch(`${baseUrl}/documents/${document.id}/download`, {
      headers: { 'X-User-Id': 'outro-usuario' },
    });

    assert.strictEqual(response.status, 404);
  } finally {
    await stopServer(server);
  }
});
