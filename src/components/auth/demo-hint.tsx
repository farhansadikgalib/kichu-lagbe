const DEMO_ACCOUNTS = [
  "admin@deliverylagbe.com",
  "rider@deliverylagbe.com",
  "customer@deliverylagbe.com",
];

/** Demo credentials box shown under the auth forms. */
export function DemoHint() {
  return (
    <div className="mt-4 rounded-lg border border-border bg-muted/40 p-4 text-xs text-muted-foreground">
      <p className="font-medium text-foreground">Demo accounts</p>
      <ul className="mt-1.5 space-y-0.5">
        {DEMO_ACCOUNTS.map((email) => (
          <li key={email} className="font-mono">
            {email}
          </li>
        ))}
      </ul>
      <p className="mt-1.5">
        Password for all:{" "}
        <span className="font-mono text-foreground">Password123!</span>
      </p>
    </div>
  );
}
