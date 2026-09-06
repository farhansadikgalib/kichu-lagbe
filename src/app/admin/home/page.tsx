import type { Metadata } from "next";
import { HomeBuilder } from "@/components/admin/home-builder/home-builder";

export const metadata: Metadata = { title: "Home page" };

export default function AdminHomePage() {
  return <HomeBuilder />;
}
