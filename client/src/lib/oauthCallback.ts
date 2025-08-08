// OAuth callback handler for processing tokens from URL fragment
export function handleOAuthCallback() {
  const hash = window.location.hash;
  const search = window.location.search;
  
  // Handle query-based auth success (like ?auth=success)
  if (search.includes('auth=success')) {
    // Just clean the URL, don't reload (avoids infinite loop)
    window.history.replaceState({}, document.title, window.location.pathname);
    return true;
  }
  
  if (!hash || !hash.includes('access_token')) {
    return false;
  }

  // Parse the hash fragment
  const params = new URLSearchParams(hash.substring(1));
  const accessToken = params.get('access_token');
  const refreshToken = params.get('refresh_token');
  const expiresAt = params.get('expires_at');
  
  if (!accessToken) {
    console.error('No access token found in OAuth callback');
    return false;
  }

  // Send tokens to backend to set cookies and create user session
  fetch('/auth/callback?' + new URLSearchParams({
    access_token: accessToken,
    refresh_token: refreshToken || '',
    expires_at: expiresAt || ''
  }), {
    method: 'GET',
    credentials: 'include'
  })
  .then(response => {
    if (response.ok) {
      // Clear the hash from URL and redirect to dashboard
      window.history.replaceState({}, document.title, window.location.pathname);
      window.location.href = '/';
    } else {
      console.error('Failed to process OAuth callback');
      window.location.href = '/login?error=callback_failed';
    }
  })
  .catch(error => {
    console.error('OAuth callback error:', error);
    window.location.href = '/login?error=callback_failed';
  });

  return true;
}