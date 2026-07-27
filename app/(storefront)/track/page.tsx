import type { Metadata } from "next";
import { TrackDelivery } from "@/components/track-delivery";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Track your delivery · Alicia Phone Place",
  description: "Follow your order from the shop in Juja town to your door.",
};

export default async function TrackPage({
  searchParams,
}: {
  searchParams: Promise<{ ref?: string }>;
}) {
  const { ref } = await searchParams;
  return (
    <main className="min-h-screen bg-[#f8faf5]">
      <TrackDelivery initialRef={ref || ""} />
    </main>
  );
}
