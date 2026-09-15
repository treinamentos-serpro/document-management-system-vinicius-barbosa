const API_BASE_URL = '/api';

function buildUserHeaders(userId) {
  return {
    'X-User-Id': userId.trim(),
  };
}

async function parseError(response) {
  try {
    const body = await response.json();
    return body?.error?.message || 'Não foi possível concluir a operação.';
  } catch {
    return 'Não foi possível concluir a operação.';
  }
}

async function requestJson(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, options);

  if (!response.ok) {
    throw new Error(await parseError(response));
  }

  return response.json();
}

export async function uploadDocument(file, userId) {
  const formData = new FormData();
  formData.append('file', file);

  const body = await requestJson('/upload', {
    method: 'POST',
    headers: buildUserHeaders(userId),
    body: formData,
  });

  return body.document;
}

export async function listDocuments(userId) {
  const body = await requestJson('/documents', {
    headers: buildUserHeaders(userId),
  });

  return body.documents;
}

export async function downloadDocument(document, userId) {
  const response = await fetch(`${API_BASE_URL}/documents/${document.id}/download`, {
    headers: buildUserHeaders(userId),
  });

  if (!response.ok) {
    throw new Error(await parseError(response));
  }

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const link = window.document.createElement('a');

  link.href = url;
  link.download = document.originalName;
  window.document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}