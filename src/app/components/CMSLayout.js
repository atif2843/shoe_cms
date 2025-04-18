import { Children } from "react";
import Sidebar from "./Sidebar";

export default function CMSLayout() {
  return (
    <div className="flex h-screen">
      <Sidebar />
    </div>
  );
}
