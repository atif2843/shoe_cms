// src/app/page.js
import { redirect } from "next/navigation";

export default function CMSRedirect() {
  redirect("/dashboard"); // or '/cms/home' if that's your actual route
}
