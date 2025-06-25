// src/services/authService.js

const API_URL = 'http://localhost:3001/api/auth';

export const login = async ({ username, password }) => {
  const response = await fetch(`${API_URL}/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ username, password }),
  });

  if (!response.ok) {
    throw new Error('Error al iniciar sesión');
  }

  return response.json();
};

export const register = async ({ email, username, password }) => {
  const response = await fetch(`${API_URL}/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email,
      username,
      password,
    }),
  });

  if (!response.ok) {
    throw new Error('Error al registrar');
  }

  return response.json();
};
