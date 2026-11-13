import { Trash2 } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { PageHeader, Badge } from "@/components/ui/PageHeader";
import { AdminTable } from "@/components/admin/AdminTable";
import { ActionButton } from "@/components/admin/ActionButton";
import { deleteDiscount, toggleDiscount } from "@/lib/actions/admin";
import { DiscountForm } from "./DiscountForm";
import { fmtDate, peso } from "@/lib/utils";

export const metadata = { title: "Discounts" };

export default async function Discounts() {
  const { supabase } = await requireAdmin();
  const { data } = await supabase.from("discount_codes").select("*").order("created_at", { ascending: false });
  return (
    <>
      <PageHeader eyebrow="Admin" title="Discount codes" />
      <div className="space-y-6">
        <DiscountForm />
        <AdminTable head={["Code", "Discount", "Uses", "Expires", "Status", ""]} empty={!data?.length}>
          {(data ?? []).map((d) => (
            <tr key={d.id}>
              <td className="font-mono font-semibold">{d.code}</td>
              <td>{d.percent_off ? `${d.percent_off}% off` : `${peso(d.amount_off)} off`}</td>
              <td>{d.uses}{d.max_uses ? ` / ${d.max_uses}` : ""}</td>
              <td className="text-xs text-mute">{d.expires_at ? fmtDate(d.expires_at) : "Never"}</td>
              <td><Badge tone={d.active ? "ok" : "neutral"}>{d.active ? "Active" : "Inactive"}</Badge></td>
              <td className="flex justify-end gap-1">
                <ActionButton action={toggleDiscount.bind(null, d.id, !d.active)}>{d.active ? "Deactivate" : "Activate"}</ActionButton>
                <ActionButton className="btn-quiet btn-sm text-bad" confirm="Delete this code?" action={deleteDiscount.bind(null, d.id)}><Trash2 className="size-4" /></ActionButton>
              </td>
            </tr>
          ))}
        </AdminTable>
      </div>
    </>
  );
}
