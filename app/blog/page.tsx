import Link from "next/link";
import { blogPosts } from "@/lib/blog";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Blog — Alicia Phone Store",
  description: "Tech reviews, buying guides and comparisons from the Alicia Phone Store team.",
};

export default function BlogPage() {
  const featured = blogPosts[0];
  const rest = blogPosts.slice(1);
  const formatDate = (date: string) => new Date(date).toLocaleDateString("en-KE", { day: "numeric", month: "long", year: "numeric" });

  return (
    <main className="min-h-screen bg-[#f7f8f5] text-[#17251f]">
      <section className="border-b border-[#dbe5dc] bg-[#e9f7ec]">
        <div className="mx-auto max-w-7xl px-5 py-12">
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#18864e]">Alicia blog</p>
          <h1 className="mt-3 font-display text-4xl font-black tracking-[-0.06em] text-[#123625] sm:text-5xl">Tech insights & reviews</h1>
          <p className="mt-4 max-w-xl text-sm leading-6 text-[#466451]">Expert reviews, buying guides and comparisons to help you choose the right phone, tablet and accessories.</p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-10">
        <Link href={`/blog/${featured.slug}`} className="group block overflow-hidden rounded-3xl border border-[#dbe6dd] bg-white shadow-sm transition hover:shadow-lg md:grid md:grid-cols-2">
          <div className="relative aspect-[16/10] overflow-hidden md:aspect-auto">
            <img src={featured.image} alt={featured.title} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
            <span className="absolute left-4 top-4 rounded-full bg-[#147243] px-3 py-1 text-[9px] font-black uppercase tracking-wider text-white">Featured</span>
          </div>
          <div className="p-6 md:p-8">
            <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-wider text-[#18864e]">
              <span>{featured.category}</span>
              <span className="text-[#b8cbbb]">·</span>
              <span>{featured.readTime}</span>
            </div>
            <h2 className="mt-3 font-display text-2xl font-black leading-tight tracking-[-0.04em] text-[#123625] group-hover:text-[#147243]">{featured.title}</h2>
            <p className="mt-3 text-sm leading-6 text-[#466451]">{featured.excerpt}</p>
            <div className="mt-5 flex items-center gap-3 text-xs text-[#587061]">
              <span className="font-bold text-[#147243]">{featured.author}</span>
              <span className="text-[#b8cbbb]">·</span>
              <span>{formatDate(featured.date)}</span>
            </div>
          </div>
        </Link>

        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {rest.map((post) => (
            <Link key={post.slug} href={`/blog/${post.slug}`} className="group flex flex-col overflow-hidden rounded-2xl border border-[#dbe6dd] bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
              <div className="relative aspect-[16/10] overflow-hidden">
                <img src={post.image} alt={post.title} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-[8px] font-black uppercase tracking-wider text-[#147243]">{post.category}</span>
              </div>
              <div className="flex flex-1 flex-col p-5">
                <h3 className="font-display text-lg font-black leading-tight tracking-[-0.03em] text-[#123625] group-hover:text-[#147243]">{post.title}</h3>
                <p className="mt-2 flex-1 text-xs leading-5 text-[#466451]">{post.excerpt}</p>
                <div className="mt-4 flex items-center justify-between text-[10px] text-[#587061]">
                  <span className="font-bold text-[#147243]">{post.author}</span>
                  <span>{formatDate(post.date)}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
