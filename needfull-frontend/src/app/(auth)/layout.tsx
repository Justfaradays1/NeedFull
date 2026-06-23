export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen overflow-x-hidden bg-white">
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute right-0 top-0 h-64 w-64 bg-brand-light/30 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-64 w-64 bg-gold/10 blur-3xl" />
      </div>
      {children}
    </div>
  );
}
