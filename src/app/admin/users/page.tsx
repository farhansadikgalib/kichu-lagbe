"use client";

import { useEffect, useState } from "react";
import { MoreHorizontal } from "lucide-react";
import { toast } from "sonner";
import {
  PageHeader,
  TablePagination,
  TableSearchInput,
  TableShell,
  TableStateRows,
} from "@/components/admin/data-table";
import { errorMessage, useAdminUsers } from "@/components/admin/hooks";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSession } from "@/hooks/use-session";
import { apiMutate } from "@/lib/api/fetcher";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { User, UserRole } from "@/types";

const COLUMN_COUNT = 7;
const SEARCH_DEBOUNCE_MS = 300;
const PAGE_SIZE = 20;

const USER_ROLES: UserRole[] = ["customer", "rider", "admin"];

const ROLE_LABELS: Record<UserRole, string> = {
  customer: "Customer",
  rider: "Rider",
  admin: "Admin",
};

const ROLE_STYLES: Record<UserRole, string> = {
  customer: "bg-muted text-muted-foreground",
  rider: "bg-blue-500/15 text-blue-400",
  admin: "bg-primary/15 text-primary",
};

type RoleFilter = "all" | UserRole;

export default function AdminUsersPage() {
  const [filter, setFilter] = useState<RoleFilter>("all");
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const role = filter === "all" ? undefined : filter;

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearch(query.trim());
      setPage(1);
    }, SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [query]);

  const { data, error, isLoading, mutate } = useAdminUsers(role, {
    search,
    page,
    pageSize: PAGE_SIZE,
  });
  const users = data?.items ?? [];
  const { user: sessionUser } = useSession();
  const [pendingId, setPendingId] = useState<string | null>(null);

  function changeFilter(value: RoleFilter) {
    setFilter(value);
    setPage(1);
  }

  async function updateUser(
    user: User,
    patch: { role?: UserRole; isActive?: boolean },
    successMessage: string,
  ) {
    setPendingId(user.id);
    try {
      await apiMutate(`/api/admin/users/${user.id}`, { method: "PATCH", body: patch });
      toast.success(successMessage);
      await mutate();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setPendingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Users"
        description="Manage customer, rider, and admin accounts."
      />

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <Tabs value={filter} onValueChange={(value) => changeFilter(value as RoleFilter)}>
          <div className="overflow-x-auto">
            <TabsList aria-label="Filter users by role">
              <TabsTrigger value="all">All</TabsTrigger>
              {USER_ROLES.map((r) => (
                <TabsTrigger key={r} value={r}>
                  {ROLE_LABELS[r]}s
                </TabsTrigger>
              ))}
            </TabsList>
          </div>
        </Tabs>
        <TableSearchInput
          value={query}
          onValueChange={setQuery}
          placeholder="Search by name, email, or phone"
          className="lg:max-w-sm"
        />
      </div>

      <TableShell>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Joined</TableHead>
            <TableHead>Active</TableHead>
            <TableHead>
              <span className="sr-only">Actions</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableStateRows
            colSpan={COLUMN_COUNT}
            isLoading={isLoading}
            error={error}
            isEmpty={users.length === 0}
            emptyMessage={
              search
                ? `No users match "${search}".`
                : filter === "all"
                  ? "No users yet."
                  : `No ${filter}s found.`
            }
            skeletonRows={8}
          />
          {users.map((user) => {
            const isSelf = sessionUser?.id === user.id;
            const pending = pendingId === user.id;
            return (
              <TableRow key={user.id}>
                <TableCell className="font-medium">
                  {user.name}
                  {isSelf && (
                    <Badge variant="outline" className="ml-2">
                      You
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-muted-foreground">{user.email}</TableCell>
                <TableCell className="text-muted-foreground">
                  {user.phone ?? "—"}
                </TableCell>
                <TableCell>
                  <Badge className={cn(ROLE_STYLES[user.role])}>
                    {ROLE_LABELS[user.role]}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {formatDate(user.createdAt)}
                </TableCell>
                <TableCell>
                  {isSelf ? (
                    <span className="text-sm text-muted-foreground">
                      {user.isActive ? "Active" : "Inactive"}
                    </span>
                  ) : (
                    <Switch
                      checked={user.isActive}
                      disabled={pending}
                      onCheckedChange={(checked) =>
                        void updateUser(
                          user,
                          { isActive: checked },
                          `${user.name} ${checked ? "activated" : "deactivated"}.`,
                        )
                      }
                      aria-label={`Toggle account status of ${user.name}`}
                    />
                  )}
                </TableCell>
                <TableCell className="text-right">
                  {!isSelf && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          disabled={pending}
                          aria-label={`Change role of ${user.name}`}
                        >
                          <MoreHorizontal />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Change role</DropdownMenuLabel>
                        {USER_ROLES.filter((r) => r !== user.role).map((r) => (
                          <DropdownMenuItem
                            key={r}
                            onSelect={() =>
                              void updateUser(
                                user,
                                { role: r },
                                `${user.name} is now a ${ROLE_LABELS[r].toLowerCase()}.`,
                              )
                            }
                          >
                            Make {ROLE_LABELS[r].toLowerCase()}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </TableShell>
      {data && <TablePagination pageInfo={data.pageInfo} onPageChange={setPage} />}
    </div>
  );
}
