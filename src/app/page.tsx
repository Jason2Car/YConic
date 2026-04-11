import { redirect } from "next/navigation";

export default function Home() {
  // Redirect to the demo edit page
  redirect("/builder/proj_demo/edit");
}
