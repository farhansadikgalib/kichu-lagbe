"use client";

import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiMutate, FetchError } from "@/lib/api/fetcher";
import { updateProfileSchema } from "@/lib/validation/auth";
import type { User } from "@/types";

interface ProfileFormProps {
  profile: User;
  /** Called after a successful save so callers can revalidate profile/session data. */
  onSaved: () => void;
}

/** Edit name and phone number. */
export function ProfileForm({ profile, onSaved }: ProfileFormProps) {
  const [name, setName] = useState(profile.name);
  const [phone, setPhone] = useState(profile.phone ?? "");
  const [errors, setErrors] = useState<{ name?: string; phone?: string }>({});
  const [saving, setSaving] = useState(false);

  const dirty = name !== profile.name || phone !== (profile.phone ?? "");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setErrors({ name: "Name is required" });
      return;
    }
    const parsed = updateProfileSchema.safeParse({
      name: name.trim(),
      phone: phone.trim() || undefined,
    });
    if (!parsed.success) {
      const fe = z.flattenError(parsed.error).fieldErrors;
      setErrors({ name: fe.name?.[0], phone: fe.phone?.[0] });
      return;
    }

    setErrors({});
    setSaving(true);
    try {
      await apiMutate<User>("/api/auth/profile", { method: "PATCH", body: parsed.data });
      toast.success("Profile updated");
      onSaved();
    } catch (err) {
      toast.error(err instanceof FetchError ? err.message : "Could not update profile");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="profile-name">Full name</Label>
          <Input
            id="profile-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="name"
            aria-invalid={errors.name ? true : undefined}
            aria-describedby={errors.name ? "profile-name-error" : undefined}
          />
          {errors.name && (
            <p id="profile-name-error" role="alert" className="text-xs text-destructive">
              {errors.name}
            </p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="profile-phone">Phone number</Label>
          <Input
            id="profile-phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="01XXXXXXXXX"
            autoComplete="tel"
            aria-invalid={errors.phone ? true : undefined}
            aria-describedby={errors.phone ? "profile-phone-error" : undefined}
          />
          {errors.phone && (
            <p id="profile-phone-error" role="alert" className="text-xs text-destructive">
              {errors.phone}
            </p>
          )}
        </div>
      </div>
      <Button type="submit" disabled={!dirty || saving}>
        {saving ? "Saving…" : "Save changes"}
      </Button>
    </form>
  );
}
