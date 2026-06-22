import { redirect } from "next/navigation";

export default function StockistsPage() {
  redirect("/doctors?tab=stockist");
}
