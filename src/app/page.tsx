import { redirect } from "next/navigation";

export default function Home() {
  // First-time visitors start at the intro questionnaire
  redirect("/builder/proj_demo/intro");
}
