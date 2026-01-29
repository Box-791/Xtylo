import React from "react";

type Props = {
  children: React.ReactNode;
};

type State = {
  hasError: boolean;
  message?: string;
};

export default class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(err: unknown): State {
    return {
      hasError: true,
      message: err instanceof Error ? err.message : String(err),
    };
  }

  componentDidCatch(error: unknown, info: unknown) {
    // Shows in DevTools console so you can see the real stack
    console.error("ErrorBoundary caught:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 20, fontFamily: "system-ui, sans-serif" }}>
          <h2>Something crashed on this page.</h2>
          <p style={{ opacity: 0.8 }}>
            Open DevTools → Console to see the exact error stack.
          </p>
          <pre
            style={{
              background: "#111",
              color: "#eee",
              padding: 12,
              borderRadius: 8,
              overflowX: "auto",
            }}
          >
            {this.state.message}
          </pre>
          <button
            onClick={() => window.location.reload()}
            style={{
              marginTop: 12,
              padding: "10px 14px",
              borderRadius: 8,
              border: "1px solid #ccc",
              cursor: "pointer",
            }}
          >
            Reload
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
