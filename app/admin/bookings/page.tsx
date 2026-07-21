import { products } from "@/lib/topduka";
import { BookingsManager } from "@/components/admin/bookings-manager";
import type { Booking } from "@/lib/topduka/types";

export const dynamic = "force-dynamic";

export default async function AdminBookingsPage() {
  let bookings: Booking[] = [];
  try {
    const allProducts = await products.list({ limit: 1 });
    void allProducts;
  } catch {}
  return <BookingsManager initialBookings={bookings} />;
}
