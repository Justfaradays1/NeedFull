import { AuthBranding } from "./AuthBranding";

interface AuthLayoutProps {
  children: React.ReactNode;
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="flex min-h-screen">
      {/* Left: scrollable form panel */}
      <div className="flex w-full flex-col overflow-y-auto lg:w-[45%] xl:w-[42%]">
        <div className="flex flex-1 items-center justify-center px-5 py-8 sm:px-8 lg:px-12">
          <div className="w-full max-w-sm">{children}</div>
        </div>
      </div>

      {/* Right: sticky branding panel — hidden on mobile/tablet */}
      <div className="sticky top-0 hidden h-screen lg:block lg:flex-1">
        <AuthBranding />
      </div>
    </div>
  );
}
