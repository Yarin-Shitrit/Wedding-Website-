import { LoginForm } from "./LoginForm";

export default function LoginPage({ searchParams }: { searchParams: { next?: string } }) {
  return (
    <main
      dir="ltr"
      lang="en"
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        background: "var(--ivory)"
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 360,
          background: "var(--paper)",
          border: "1px solid var(--hair)",
          padding: 32
        }}
      >
        <h1
          className="display"
          style={{
            fontSize: 28,
            color: "var(--accent)",
            textAlign: "center",
            margin: 0
          }}
        >
          Admin
        </h1>
        <p
          style={{
            textAlign: "center",
            color: "var(--ink-3)",
            fontSize: 13,
            marginTop: 4
          }}
        >
          Sign in to manage the wedding
        </p>
        <div style={{ marginTop: 24 }}>
          <LoginForm next={searchParams.next ?? "/admin"} />
        </div>
      </div>
    </main>
  );
}
