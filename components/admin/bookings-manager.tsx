"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Users, Phone, Mail } from "lucide-react";

type Booking = {
  id: string;
  product_id?: string;
  starts_at?: string;
  party_size?: number;
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
  notes?: string;
  status?: string;
  [key: string]: unknown;
};

const statusVariant = (status?: string): "default" | "secondary" | "destructive" | "warning" => {
  const s = (status || "").toLowerCase();
  if (s.includes("confirm") || s.includes("complete")) return "default";
  if (s.includes("cancel")) return "destructive";
  if (s.includes("pending")) return "warning";
  return "secondary";
};

export function BookingsManager({ initialBookings }: { initialBookings: Booking[] }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-[#0f172a]">Bookings</h2>
        <p className="text-sm text-[#64748b]">{initialBookings.length} total bookings</p>
      </div>

      {initialBookings.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Calendar className="mx-auto h-12 w-12 text-[#cbd5e1]" />
            <p className="mt-4 text-sm text-[#64748b]">No bookings yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {initialBookings.map((booking) => (
            <Card key={booking.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{booking.customer_name || "Guest"}</CardTitle>
                  <Badge variant={statusVariant(booking.status)}>{booking.status || "pending"}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {booking.starts_at && (
                  <div className="flex items-center gap-2 text-[#64748b]">
                    <Calendar className="h-4 w-4" />
                    {new Date(booking.starts_at).toLocaleString()}
                  </div>
                )}
                {booking.party_size != null && (
                  <div className="flex items-center gap-2 text-[#64748b]">
                    <Users className="h-4 w-4" />
                    {booking.party_size} {booking.party_size === 1 ? "person" : "people"}
                  </div>
                )}
                {booking.customer_phone && (
                  <div className="flex items-center gap-2 text-[#64748b]">
                    <Phone className="h-4 w-4" />
                    {booking.customer_phone}
                  </div>
                )}
                {booking.customer_email && (
                  <div className="flex items-center gap-2 text-[#64748b]">
                    <Mail className="h-4 w-4" />
                    {booking.customer_email}
                  </div>
                )}
                {booking.notes && (
                  <p className="mt-2 rounded-lg bg-[#f8faf5] p-3 text-xs text-[#64748b]">{booking.notes}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
