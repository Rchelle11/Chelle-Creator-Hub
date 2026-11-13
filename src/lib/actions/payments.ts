"use server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult, PaymentMethod } from "@/lib/types";
import { fail } from "./_run";

export type Quote = { valid: boolean | null; amount: number; original: number; discount?: number; code?: string; message?: string };

export async function quotePrice(courseId: string, code: string): Promise<ActionResult<Quote>> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("quote_price", { p_course_id: courseId, p_code: code || null });
  if (error) return fail(error);
  const q = data as Quote;
  return { ok: true, data: { ...q, amount: Number(q.amount), original: Number(q.original), discount: Number(q.discount ?? 0) } };
}

export async function submitPayment(input: {
  courseId: string; method: PaymentMethod; reference: string; senderName: string; senderNumber: string; receiptPath: string; code?: string;
}): Promise<ActionResult<string>> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("submit_payment", {
    p_course_id: input.courseId, p_method: input.method, p_reference: input.reference, p_sender_name: input.senderName,
    p_sender_number: input.senderNumber, p_receipt_path: input.receiptPath, p_code: input.code || null,
  });
  if (error) {
    if (error.code === "23505") return { ok: false, error: "You already have a payment under review for this course." };
    return fail(error);
  }
  revalidatePath("/payment-status");
  revalidatePath("/dashboard");
  return { ok: true, data: data as string };
}
