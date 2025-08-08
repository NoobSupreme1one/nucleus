'use client';

import pb from './pocketbase';

export async function signIn(email: string, password: string) {
  try {
    const authData = await pb.collection('users').authWithPassword(email, password);
    return authData;
  } catch {
    throw new Error('Invalid credentials');
  }
}

export async function signUp(email: string, password: string, username: string, name: string) {
  try {
    // Create user
    const userData = {
      email,
      password,
      passwordConfirm: password,
      username,
      name,
    };
    
    await pb.collection('users').create(userData);
    
    // Sign in after signup
    const authData = await pb.collection('users').authWithPassword(email, password);
    return authData;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to create account';
    throw new Error(errorMessage);
  }
}

export function signOut() {
  pb.authStore.clear();
}

export function getCurrentUser() {
  return pb.authStore.model;
}

export function isAuthenticated() {
  return pb.authStore.isValid;
}

export function getAuthToken() {
  return pb.authStore.token;
}