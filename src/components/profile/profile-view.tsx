"use client";

import { toast } from "sonner";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { BadgeCheck, LogOut } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Reveal } from "@/components/motion";
import { ChangePasswordDialog } from "@/components/profile/change-password-dialog";
import { PushToggle } from "@/components/pwa/push-toggle";
import { ProfileForm } from "@/components/profile/profile-form";
import { useSession } from "@/hooks/use-session";
import { apiMutate, swrFetcher } from "@/lib/api/fetcher";
import { formatDate } from "@/lib/format";
import type { User } from "@/types";

function initialsOf(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

/** Account page: identity card, profile editing, password change, and logout. */
export function ProfileView() {
  const router = useRouter();
  const { mutate: mutateSession } = useSession();
  const {
    data: profile,
    error,
    isLoading,
    mutate: mutateProfile,
  } = useSWR<User>("/api/auth/profile", swrFetcher);

  async function handleLogout() {
    try {
      await apiMutate("/api/auth/logout");
      await mutateSession(null);
      router.push("/");
      router.refresh();
    } catch {
      toast.error("Could not log out. Please try again.");
    }
  }

  if (isLoading) {
    return (
      <div className="container-page max-w-3xl py-8 md:py-12">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="mt-6 h-28 w-full" />
        <Skeleton className="mt-6 h-56 w-full" />
        <Skeleton className="mt-6 h-24 w-full" />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="container-page max-w-3xl py-8 md:py-12">
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
            <p className="text-sm text-muted-foreground">
              Couldn&apos;t load your profile. Please try again.
            </p>
            <Button variant="outline" size="sm" onClick={() => mutateProfile()}>
              Try again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container-page max-w-3xl py-8 md:py-12">
      <Reveal>
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">My account</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your personal details and security.
        </p>
      </Reveal>

      <div className="mt-6 space-y-6">
        <Reveal>
          <Card>
            <CardContent className="flex flex-wrap items-center gap-4">
              <Avatar className="size-16 border border-border">
                {profile.avatarUrl && (
                  <AvatarImage src={profile.avatarUrl} alt="" />
                )}
                <AvatarFallback className="bg-secondary text-lg font-semibold">
                  {initialsOf(profile.name)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate text-lg font-semibold">{profile.name}</p>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <p className="truncate text-sm text-muted-foreground">{profile.email}</p>
                  {profile.emailVerified ? (
                    <Badge className="bg-emerald-500/15 text-emerald-400">
                      <BadgeCheck aria-hidden /> Verified
                    </Badge>
                  ) : (
                    <Badge variant="outline">Unverified</Badge>
                  )}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Member since {formatDate(profile.createdAt)}
                </p>
              </div>
              <Button variant="outline" onClick={handleLogout}>
                <LogOut /> Log out
              </Button>
            </CardContent>
          </Card>
        </Reveal>

        <Reveal delay={0.05}>
          <Card>
            <CardHeader>
              <CardTitle>Profile details</CardTitle>
              <CardDescription>Update your name and phone number.</CardDescription>
            </CardHeader>
            <CardContent>
              <ProfileForm
                profile={profile}
                onSaved={() => {
                  mutateProfile();
                  mutateSession();
                }}
              />
            </CardContent>
          </Card>
        </Reveal>

        <Reveal delay={0.08}>
          <Card>
            <CardHeader>
              <CardTitle>Notifications</CardTitle>
              <CardDescription>
                Order confirmations, rider updates and delivery alerts on this device.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PushToggle />
            </CardContent>
          </Card>
        </Reveal>

        <Reveal delay={0.1}>
          <Card>
            <CardHeader>
              <CardTitle>Security</CardTitle>
              <CardDescription>
                Use a strong password you don&apos;t reuse elsewhere.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ChangePasswordDialog />
            </CardContent>
          </Card>
        </Reveal>
      </div>
    </div>
  );
}
