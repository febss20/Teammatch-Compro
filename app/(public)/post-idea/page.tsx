import { redirect } from "next/navigation";

export default function PostIdeaPage() {
    redirect("/login?next=/dashboard/boards/new");
}
