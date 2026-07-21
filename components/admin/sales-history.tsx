"use client";

import { useState, Fragment } from "react";
import { Receipt, ChevronDown, ChevronUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Sale } from "@/lib/api/types";

const money = (v: number) => `KES ${Number(v || 0).toLocaleString()}`;

export function SalesHistory({ initialSales }: { initialSales: Sale[] }) {
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-[#0f172a]">Sales History</h2>
        <p className="text-sm text-[#64748b]">{initialSales.length} total sales</p>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Receipt</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Total</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {initialSales.map((sale) => (
                <Fragment key={sale.id}>
                  <TableRow>
                    <TableCell className="font-mono text-xs font-bold">{sale.receipt_no}</TableCell>
                    <TableCell className="text-[#64748b]">
                      {sale.created_at ? new Date(sale.created_at).toLocaleDateString() : "—"}
                    </TableCell>
                    <TableCell>{sale.items?.length ?? 0}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="capitalize">{sale.payment_method}</Badge>
                    </TableCell>
                    <TableCell className="text-[#64748b]">{sale.customer_name || "Walk-in"}</TableCell>
                    <TableCell className="font-bold text-[#166534]">{money(sale.total)}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setExpanded(expanded === sale.id ? null : sale.id)}
                      >
                        {expanded === sale.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </Button>
                    </TableCell>
                  </TableRow>
                  {expanded === sale.id && (
                    <TableRow>
                      <TableCell colSpan={7} className="bg-[#f8faf5]">
                        <div className="space-y-2 p-2">
                          {sale.items?.map((item) => (
                            <div key={item.id} className="flex justify-between text-sm">
                              <span>{item.product_name} × {item.quantity}</span>
                              <span className="font-medium">{money(item.total)}</span>
                            </div>
                          ))}
                          <div className="border-t border-[#166534]/15 pt-2">
                            <div className="flex justify-between text-sm text-[#64748b]">
                              <span>Subtotal</span>
                              <span>{money(sale.subtotal)}</span>
                            </div>
                            {sale.discount > 0 && (
                              <div className="flex justify-between text-sm text-[#64748b]">
                                <span>Discount</span>
                                <span>-{money(sale.discount)}</span>
                              </div>
                            )}
                            <div className="flex justify-between font-bold">
                              <span>Total</span>
                              <span className="text-[#166534]">{money(sale.total)}</span>
                            </div>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </Fragment>
              ))}
              {initialSales.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="py-8 text-center text-[#64748b]">
                    <Receipt className="mx-auto mb-2 h-8 w-8 text-[#94a3b8]" />
                    No sales recorded yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
