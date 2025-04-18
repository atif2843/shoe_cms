// src/app/components/withAuth.js
"use client";

import { useEffect, useState } from "react";
import { redirect, useRouter } from "next/navigation";
import { supabase } from "../lib/supabaseClient";

export default function withAuth(Component) {
  return function ProtectedComponent(props) {
    const router = useRouter();
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
      const getUser = async () => {
        const { data, error } = await supabase.auth.getUser();

        if (data?.user) {
          setIsAuthenticated(true);
        } else {
          redirect("/login");
        }

        setLoading(false);
      };

      getUser();
    }, []);

    if (loading) return <div>Loading...</div>;
    if (!isAuthenticated) return null;

    return <Component {...props} />;
  };
}
