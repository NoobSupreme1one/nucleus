import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { initializeSentry } from "./lib/sentry";
import { ClerkProvider } from '@clerk/clerk-react';

// Initialize Sentry for error monitoring
initializeSentry();

const publishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as string | undefined;

const root = createRoot(document.getElementById("root")!);

if (publishableKey) {
  root.render(
    <ClerkProvider 
      publishableKey={publishableKey}
      appearance={{
        baseTheme: undefined // Allow theme switching
      }}
      afterSignInUrl="/"
      afterSignUpUrl="/"
      afterSignOutUrl="/"
    >
      <App />
    </ClerkProvider>
  );
} else {
  root.render(<App />);
}
