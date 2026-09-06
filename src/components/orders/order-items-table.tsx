import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatBDT, formatLineName } from "@/lib/format";
import type { OrderItem } from "@/types";

interface OrderItemsTableProps {
  items: OrderItem[];
}

/** Snapshot of ordered items with unit prices and line totals. */
export function OrderItemsTable({ items }: OrderItemsTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Item</TableHead>
          <TableHead className="text-right">Unit price</TableHead>
          <TableHead className="text-right">Qty</TableHead>
          <TableHead className="text-right">Total</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((item) => (
          <TableRow key={item.id}>
            <TableCell className="font-medium">{formatLineName(item)}</TableCell>
            <TableCell className="text-right tabular-nums">
              {formatBDT(item.unitPrice)}
            </TableCell>
            <TableCell className="text-right tabular-nums">{item.quantity}</TableCell>
            <TableCell className="text-right font-medium tabular-nums">
              {formatBDT(item.lineTotal)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
