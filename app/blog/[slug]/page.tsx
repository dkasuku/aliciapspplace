import Link from "next/link";
import { notFound } from "next/navigation";
import { blogPosts, findBlogPost } from "@/lib/blog";

export const dynamic = "force-dynamic";

export async function generateStaticParams() {
  return blogPosts.map((post) => ({ slug: post.slug }));
}

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params) {
  const { slug } = await params;
  const post = findBlogPost(slug);
  if (!post) return { title: "Post not found — Alicia Phone Store" };
  return { title: `${post.title} — Alicia Phone Store`, description: post.excerpt };
}

export default async function BlogPostPage({ params }: Params) {
  const { slug } = await params;
  const post = findBlogPost(slug);
  if (!post) notFound();
  const formatDate = (date: string) => new Date(date).toLocaleDateString("en-KE", { day: "numeric", month: "long", year: "numeric" });
  const related = blogPosts.filter((p) => p.slug !== post.slug && p.category === post.category).slice(0, 3);

  return (
    <main className="min-h-screen bg-[#f7f8f5] text-[#17251f]">
      <article>
        <section className="border-b border-[#dbe5dc] bg-[#e9f7ec]">
          <div className="mx-auto max-w-3xl px-5 py-12">
            <Link href="/blog" className="text-[10px] font-bold uppercase tracking-wider text-[#18864e] hover:underline">← Back to blog</Link>
            <div className="mt-4 flex items-center gap-3 text-[10px] font-bold uppercase tracking-wider text-[#18864e]">
              <span>{post.category}</span>
              <span className="text-[#b8cbbb]">·</span>
              <span>{post.readTime}</span>
            </div>
            <h1 className="mt-3 font-display text-3xl font-black leading-tight tracking-[-0.05em] text-[#123625] sm:text-4xl">{post.title}</h1>
            <div className="mt-5 flex items-center gap-3 text-xs text-[#587061]">
              <span className="font-bold text-[#147243]">{post.author}</span>
              <span className="text-[#b8cbbb]">·</span>
              <span>{formatDate(post.date)}</span>
            </div>
          </div>
        </section>

        <div className="mx-auto max-w-3xl px-5 py-8">
          <div className="overflow-hidden rounded-3xl">
            <img src={post.image} alt={post.title} className="aspect-[16/9] w-full object-cover" />
          </div>

          <div className="mt-8 space-y-5">
            {post.content.map((paragraph, index) => (
              <p key={index} className="text-[15px] leading-7 text-[#2d4a39]">{paragraph}</p>
            ))}
          </div>

          <div className="mt-10 rounded-2xl bg-[#e9f7ec] p-6 text-center">
            <p className="font-display text-lg font-black text-[#123625]">Shop the products mentioned in this article</p>
            <p className="mt-2 text-sm text-[#466451]">Browse our full collection and find the right gear for you.</p>
            <Link href="/shop" className="mt-4 inline-block rounded-xl bg-[#147243] px-6 py-3 text-xs font-black uppercase tracking-wider text-white hover:bg-[#0d5933]">Shop now →</Link>
          </div>
        </div>
      </article>

      {related.length > 0 && (
        <section className="mx-auto max-w-7xl px-5 py-10">
          <h2 className="font-display text-2xl font-black tracking-[-0.05em] text-[#123625]">Related articles</h2>
          <div className="mt-5 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((item) => (
              <Link key={item.slug} href={`/blog/${item.slug}`} className="group flex flex-col overflow-hidden rounded-2xl border border-[#dbe6dd] bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
                <div className="relative aspect-[16/10] overflow-hidden">
                  <img src={item.image} alt={item.title} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                </div>
                <div className="p-5">
                  <h3 className="font-display text-base font-black leading-tight text-[#123625] group-hover:text-[#147243]">{item.title}</h3>
                  <p className="mt-2 text-xs leading-5 text-[#466451]">{item.excerpt}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
