import { LoginForm } from "./LoginForm";

export default function LoginPage({ searchParams }: { searchParams: { next?: string } }) {
  return (
    <main className="min-h-screen flex items-center justify-center bg-sand-50 px-6">
      <div className="card w-full max-w-sm">
        <h1 className="text-3xl text-rose-600 text-center">Admin</h1>
        <p className="text-center text-stone-500 text-sm mt-1">Sign in to manage the wedding</p>
        <div className="mt-6">
          <LoginForm next={searchParams.next ?? "/admin"} />
        </div>
      </div>
    </main>
  );
}
