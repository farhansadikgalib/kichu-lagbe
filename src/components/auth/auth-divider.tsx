import { Separator } from "@/components/ui/separator";

/** "or continue with email" divider between Google and the email form. */
export function AuthDivider() {
  return (
    <div className="my-5 flex items-center gap-3" aria-hidden>
      <Separator className="flex-1" />
      <span className="text-xs text-muted-foreground">or continue with email</span>
      <Separator className="flex-1" />
    </div>
  );
}
