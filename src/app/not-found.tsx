export default function NotFound() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-canvas px-4">
      <div className="text-center">
        <h1 className="text-xl font-semibold text-navy-800">Sidan hittades inte</h1>
        <p className="mt-2 text-sm text-muted-foreground">Kontrollera adressen och försök igen.</p>
        <p className="mt-4">
          <a href="/app" className="text-sm font-medium text-navy-800 underline">
            Till översikten
          </a>
        </p>
      </div>
    </div>
  );
}
