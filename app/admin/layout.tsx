// Pass-through. The login page renders standalone; the authenticated pages
// live under the (panel) route group which wraps them in AdminShell.
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
