import { redirect } from "next/navigation";

export default function ChemistsPage() {
  redirect("/doctors?tab=chemist");
}
