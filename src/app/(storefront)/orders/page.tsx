import type { Metadata } from "next";
import { OrdersView } from "@/components/orders/orders-view";

export const metadata: Metadata = {
  title: "My orders",
  description: "Track active deliveries and browse your order history.",
};

export default function OrdersPage() {
  return <OrdersView />;
}
