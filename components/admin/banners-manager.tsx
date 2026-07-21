"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Save, Plus, Trash2, Upload, X, Image as ImageIcon } from "lucide-react";

interface SiteContent {
  deliveryBanner: { text: string; helpText: string; enabled: boolean };
  heroSection: { badge: string; title: string; subtitle: string; ctaPrimary: string; ctaSecondary: string; enabled: boolean; imageUrl?: string };
  promoCards: { id: string; title: string; detail: string; tone: string; category: string; enabled: boolean; imageUrl?: string }[];
  motionBanner: { id: string; title: string; subtitle: string; enabled: boolean }[];
  headerNav: { id: string; label: string; href: string; enabled: boolean }[];
  footer: { description: string; shopWithConfidence: string; phone: string; email: string };
  sectionTags: { id: string; label: string; heading: string; subheading: string; enabled: boolean }[];
  logoUrl?: string;
}

const TONE_OPTIONS = [
  { label: "Purple", value: "from-[#22103c] to-[#833c9e]" },
  { label: "Green Dark", value: "from-[#0c2a1c] to-[#147243]" },
  { label: "Blue", value: "from-[#0c1c3a] to-[#2563eb]" },
  { label: "Orange", value: "from-[#3a1c0c] to-[#ea580c]" },
  { label: "Red", value: "from-[#3a0c0c] to-[#dc2626]" },
  { label: "Teal", value: "from-[#0c3a3a] to-[#0d9488]" },
];

export function BannersManager() {
  const [content, setContent] = useState<SiteContent | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const heroInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/site-content")
      .then((r) => r.json())
      .then(setContent)
      .catch(() => {});
  }, []);

  if (!content) return <div className="p-8 text-center text-[#64748b]">Loading content...</div>;

  function update<K extends keyof SiteContent>(key: K, value: SiteContent[K]) {
    setContent((prev) => prev ? { ...prev, [key]: value } : prev);
    setSaved(false);
  }

  async function save() {
    setSaving(true);
    try {
      await fetch("/api/site-content", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(content),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      alert("Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      alert("Logo too large. Max 2MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      update("logoUrl", reader.result as string);
    };
    reader.readAsDataURL(file);
    if (logoInputRef.current) logoInputRef.current.value = "";
  }

  function handleHeroImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !content) return;
    if (file.size > 3 * 1024 * 1024) {
      alert("Image too large. Max 3MB.");
      return;
    }
    const currentHero = content.heroSection;
    const reader = new FileReader();
    reader.onload = () => {
      update("heroSection", { ...currentHero, imageUrl: reader.result as string });
    };
    reader.readAsDataURL(file);
    if (heroInputRef.current) heroInputRef.current.value = "";
  }

  function handlePromoImageUpload(e: React.ChangeEvent<HTMLInputElement>, index: number) {
    const file = e.target.files?.[0];
    if (!file || !content) return;
    if (file.size > 3 * 1024 * 1024) {
      alert("Image too large. Max 3MB.");
      return;
    }
    const currentPromos = content.promoCards;
    const reader = new FileReader();
    reader.onload = () => {
      update("promoCards", currentPromos.map((p, i) => i === index ? { ...p, imageUrl: reader.result as string } : p));
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[#0f172a]">Banners & Content</h2>
          <p className="text-sm text-[#64748b]">Manage all banners, sections, headers, and site content</p>
        </div>
        <div className="flex items-center gap-3">
          {saved && <span className="text-xs font-medium text-[#166534]">✓ Saved</span>}
          <Button onClick={save} disabled={saving}>
            <Save className="mr-2 h-4 w-4" />
            {saving ? "Saving..." : "Save all changes"}
          </Button>
        </div>
      </div>

      {/* Logo Upload */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><ImageIcon className="h-5 w-5" /> Store Logo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={content.logoUrl || "/Phoneplacelg.png"} alt="Store logo" className="h-20 w-auto max-w-[200px] rounded-lg border border-[#166534]/20 bg-white p-2 object-contain" />
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => logoInputRef.current?.click()}
                className="flex items-center gap-2 rounded-lg border border-[#166534]/30 px-4 py-2 text-sm font-medium text-[#166534] hover:bg-[#f0fdf4]"
              >
                <Upload className="h-4 w-4" /> Upload new logo
              </button>
              <input ref={logoInputRef} type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
              <p className="text-xs text-[#94a3b8]">PNG or JPG, max 2MB</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Delivery Banner */}
      <Card>
        <CardHeader>
          <CardTitle>Delivery Banner (top strip)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={content.deliveryBanner.enabled}
              onChange={(e) => update("deliveryBanner", { ...content.deliveryBanner, enabled: e.target.checked })}
              className="h-4 w-4 rounded border-[#166534]/30"
            />
            <Label>Enabled</Label>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label>Banner text</Label>
              <Input value={content.deliveryBanner.text} onChange={(e) => update("deliveryBanner", { ...content.deliveryBanner, text: e.target.value })} />
            </div>
            <div>
              <Label>Help text (right side)</Label>
              <Input value={content.deliveryBanner.helpText} onChange={(e) => update("deliveryBanner", { ...content.deliveryBanner, helpText: e.target.value })} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Hero Section */}
      <Card>
        <CardHeader>
          <CardTitle>Hero Section (homepage banner)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={content.heroSection.enabled}
              onChange={(e) => update("heroSection", { ...content.heroSection, enabled: e.target.checked })}
              className="h-4 w-4 rounded border-[#166534]/30"
            />
            <Label>Enabled</Label>
          </div>
          <div className="grid gap-4">
            <div>
              <Label>Badge text</Label>
              <Input value={content.heroSection.badge} onChange={(e) => update("heroSection", { ...content.heroSection, badge: e.target.value })} />
            </div>
            <div>
              <Label>Main title</Label>
              <Input value={content.heroSection.title} onChange={(e) => update("heroSection", { ...content.heroSection, title: e.target.value })} />
            </div>
            <div>
              <Label>Subtitle</Label>
              <Textarea value={content.heroSection.subtitle} onChange={(e) => update("heroSection", { ...content.heroSection, subtitle: e.target.value })} />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label>Primary button text</Label>
                <Input value={content.heroSection.ctaPrimary} onChange={(e) => update("heroSection", { ...content.heroSection, ctaPrimary: e.target.value })} />
              </div>
              <div>
                <Label>Secondary button text</Label>
                <Input value={content.heroSection.ctaSecondary} onChange={(e) => update("heroSection", { ...content.heroSection, ctaSecondary: e.target.value })} />
              </div>
            </div>
            <div>
              <Label>Hero image (optional — replaces decorative phone graphic)</Label>
              <div className="flex items-center gap-4">
                {content.heroSection.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={content.heroSection.imageUrl} alt="Hero" className="h-20 w-32 rounded-lg border border-[#166534]/20 bg-white p-1 object-cover" />
                ) : (
                  <div className="grid h-20 w-32 place-items-center rounded-lg border border-dashed border-[#166534]/20 bg-[#f0fdf4] text-[#94a3b8]">
                    <ImageIcon className="h-6 w-6" />
                  </div>
                )}
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => heroInputRef.current?.click()}
                    className="flex items-center gap-2 rounded-lg border border-[#166534]/30 px-4 py-2 text-sm font-medium text-[#166534] hover:bg-[#f0fdf4]"
                  >
                    <Upload className="h-4 w-4" /> Upload hero image
                  </button>
                  <input ref={heroInputRef} type="file" accept="image/*" onChange={handleHeroImageUpload} className="hidden" />
                  {content.heroSection.imageUrl && (
                    <button
                      type="button"
                      onClick={() => update("heroSection", { ...content.heroSection, imageUrl: undefined })}
                      className="flex items-center gap-1 text-xs text-red-600 hover:underline"
                    >
                      <X className="h-3 w-3" /> Remove image
                    </button>
                  )}
                  <p className="text-xs text-[#94a3b8]">PNG or JPG, max 3MB. Recommended 600×800</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Promo Cards */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Promo Cards (homepage side banners)</CardTitle>
            <Button size="sm" variant="outline" onClick={() => update("promoCards", [...content.promoCards, { id: `promo-${Date.now()}`, title: "New promo", detail: "Detail here", tone: TONE_OPTIONS[0].value, category: "", enabled: true }])}>
              <Plus className="mr-1 h-4 w-4" /> Add promo
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {content.promoCards.map((promo, index) => (
            <div key={promo.id} className="rounded-lg border border-[#e2e8f0] p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={promo.enabled}
                    onChange={(e) => update("promoCards", content.promoCards.map((p, i) => i === index ? { ...p, enabled: e.target.checked } : p))}
                    className="h-4 w-4 rounded border-[#166534]/30"
                  />
                  <span className="text-sm font-medium">Promo {index + 1}</span>
                </div>
                <button onClick={() => update("promoCards", content.promoCards.filter((_, i) => i !== index))} className="text-[#94a3b8] hover:text-red-600">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <Label>Title</Label>
                  <Input value={promo.title} onChange={(e) => update("promoCards", content.promoCards.map((p, i) => i === index ? { ...p, title: e.target.value } : p))} />
                </div>
                <div>
                  <Label>Detail</Label>
                  <Input value={promo.detail} onChange={(e) => update("promoCards", content.promoCards.map((p, i) => i === index ? { ...p, detail: e.target.value } : p))} />
                </div>
                <div>
                  <Label>Category filter</Label>
                  <Input value={promo.category} onChange={(e) => update("promoCards", content.promoCards.map((p, i) => i === index ? { ...p, category: e.target.value } : p))} placeholder="e.g. Gaming, Audio" />
                </div>
                <div>
                  <Label>Color theme</Label>
                  <select
                    value={promo.tone}
                    onChange={(e) => update("promoCards", content.promoCards.map((p, i) => i === index ? { ...p, tone: e.target.value } : p))}
                    className="flex h-10 w-full rounded-md border border-[#166534]/30 bg-white px-3 py-2 text-sm"
                  >
                    {TONE_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <Label>Promo image (optional)</Label>
                <div className="flex items-center gap-3">
                  {promo.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={promo.imageUrl} alt="Promo" className="h-16 w-24 rounded-lg border border-[#166534]/20 bg-white p-1 object-cover" />
                  ) : (
                    <div className="grid h-16 w-24 place-items-center rounded-lg border border-dashed border-[#166534]/20 bg-[#f0fdf4] text-[#94a3b8]">
                      <ImageIcon className="h-5 w-5" />
                    </div>
                  )}
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        const input = document.createElement("input");
                        input.type = "file";
                        input.accept = "image/*";
                        input.onchange = (e) => handlePromoImageUpload(e as unknown as React.ChangeEvent<HTMLInputElement>, index);
                        input.click();
                      }}
                      className="flex items-center gap-1 rounded-lg border border-[#166534]/30 px-3 py-1.5 text-xs font-medium text-[#166534] hover:bg-[#f0fdf4]"
                    >
                      <Upload className="h-3 w-3" /> Upload
                    </button>
                    {promo.imageUrl && (
                      <button
                        type="button"
                        onClick={() => update("promoCards", content.promoCards.map((p, i) => i === index ? { ...p, imageUrl: undefined } : p))}
                        className="flex items-center gap-1 text-xs text-red-600 hover:underline"
                      >
                        <X className="h-3 w-3" /> Remove
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Motion Banner Items */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Motion Banner (scrolling strip)</CardTitle>
            <Button size="sm" variant="outline" onClick={() => update("motionBanner", [...content.motionBanner, { id: `mb-${Date.now()}`, title: "NEW ITEM", subtitle: "Subtitle", enabled: true }])}>
              <Plus className="mr-1 h-4 w-4" /> Add item
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {content.motionBanner.map((item, index) => (
            <div key={item.id} className="flex items-center gap-3 rounded-lg border border-[#e2e8f0] p-3">
              <input
                type="checkbox"
                checked={item.enabled}
                onChange={(e) => update("motionBanner", content.motionBanner.map((m, i) => i === index ? { ...m, enabled: e.target.checked } : m))}
                className="h-4 w-4 rounded border-[#166534]/30"
              />
              <Input value={item.title} onChange={(e) => update("motionBanner", content.motionBanner.map((m, i) => i === index ? { ...m, title: e.target.value } : m))} className="flex-1" />
              <Input value={item.subtitle} onChange={(e) => update("motionBanner", content.motionBanner.map((m, i) => i === index ? { ...m, subtitle: e.target.value } : m))} className="flex-1" />
              <button onClick={() => update("motionBanner", content.motionBanner.filter((_, i) => i !== index))} className="text-[#94a3b8] hover:text-red-600">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Header Navigation */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Header Navigation Links</CardTitle>
            <Button size="sm" variant="outline" onClick={() => update("headerNav", [...content.headerNav, { id: `nav-${Date.now()}`, label: "New Link", href: "/", enabled: true }])}>
              <Plus className="mr-1 h-4 w-4" /> Add link
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {content.headerNav.map((nav, index) => (
            <div key={nav.id} className="flex items-center gap-3 rounded-lg border border-[#e2e8f0] p-3">
              <input
                type="checkbox"
                checked={nav.enabled}
                onChange={(e) => update("headerNav", content.headerNav.map((n, i) => i === index ? { ...n, enabled: e.target.checked } : n))}
                className="h-4 w-4 rounded border-[#166534]/30"
              />
              <Input value={nav.label} onChange={(e) => update("headerNav", content.headerNav.map((n, i) => i === index ? { ...n, label: e.target.value } : n))} className="w-32" placeholder="Label" />
              <Input value={nav.href} onChange={(e) => update("headerNav", content.headerNav.map((n, i) => i === index ? { ...n, href: e.target.value } : n))} className="flex-1" placeholder="/path" />
              <button onClick={() => update("headerNav", content.headerNav.filter((_, i) => i !== index))} className="text-[#94a3b8] hover:text-red-600">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Section Tags / Headings */}
      <Card>
        <CardHeader>
          <CardTitle>Website Section Headings & Tags</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {content.sectionTags.map((tag, index) => (
            <div key={tag.id} className="rounded-lg border border-[#e2e8f0] p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={tag.enabled}
                    onChange={(e) => update("sectionTags", content.sectionTags.map((t, i) => i === index ? { ...t, enabled: e.target.checked } : t))}
                    className="h-4 w-4 rounded border-[#166534]/30"
                  />
                  <Badge variant="outline">{tag.label}</Badge>
                </div>
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                <div>
                  <Label>Subheading (small text)</Label>
                  <Input value={tag.subheading} onChange={(e) => update("sectionTags", content.sectionTags.map((t, i) => i === index ? { ...t, subheading: e.target.value } : t))} />
                </div>
                <div>
                  <Label>Heading (main title)</Label>
                  <Input value={tag.heading} onChange={(e) => update("sectionTags", content.sectionTags.map((t, i) => i === index ? { ...t, heading: e.target.value } : t))} />
                </div>
                <div>
                  <Label>Label</Label>
                  <Input value={tag.label} onChange={(e) => update("sectionTags", content.sectionTags.map((t, i) => i === index ? { ...t, label: e.target.value } : t))} />
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Footer */}
      <Card>
        <CardHeader>
          <CardTitle>Footer Content</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Store description</Label>
            <Textarea value={content.footer.description} onChange={(e) => update("footer", { ...content.footer, description: e.target.value })} />
          </div>
          <div>
            <Label>Shop with confidence text</Label>
            <Input value={content.footer.shopWithConfidence} onChange={(e) => update("footer", { ...content.footer, shopWithConfidence: e.target.value })} />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label>Phone number</Label>
              <Input value={content.footer.phone} onChange={(e) => update("footer", { ...content.footer, phone: e.target.value })} />
            </div>
            <div>
              <Label>Email</Label>
              <Input value={content.footer.email} onChange={(e) => update("footer", { ...content.footer, email: e.target.value })} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save button at bottom */}
      <div className="flex justify-end pb-8">
        <Button onClick={save} disabled={saving} size="lg">
          <Save className="mr-2 h-4 w-4" />
          {saving ? "Saving..." : "Save all changes"}
        </Button>
      </div>
    </div>
  );
}
