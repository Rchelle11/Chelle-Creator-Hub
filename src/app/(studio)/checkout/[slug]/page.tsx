import { notFound, redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { PageHeader } from "@/components/ui/PageHeader";
import { CheckoutFlow } from "@/components/checkout/CheckoutFlow";

export const metadata = { title: "Checkout" };

export default async function CheckoutPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { supabase, user, profile } = await requireUser();
  const { data: course } = await supabase.from("courses").select("id, title, price, thumbnail_url, slug").eq("slug", slug).eq("published", true).maybeSingle();
  if (!course) notFound();
  if (Number(course.price) === 0) redirect(`/courses/${slug}`); // free: no payment needed

  const [{ data: enrollment }, { data: pending }] = await Promise.all([
    supabase.from("enrollments").select("id").eq("user_id", user.id).eq("course_id", course.id).maybeSingle(),
    supabase.from("payments").select("id").eq("user_id", user.id).eq("course_id", course.id).eq("status", "pending").maybeSingle(),
  ]);
  if (enrollment) redirect(`/courses/${slug}`);
  if (pending) redirect("/payment-status");

  return (
    <>
      <PageHeader eyebrow="Secure checkout" title="CHECKOUT" subtitle="Pay manually, upload your receipt, and we'll unlock your course after confirmation." />
      <CheckoutFlow course={{ ...course, price: Number(course.price) }} userId={user.id} defaultName={profile.full_name} />
    </>
  );
}
