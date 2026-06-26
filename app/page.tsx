"use client";

import { useRouter } from "next/navigation";
import { ClinicLanding } from "@/components/ClinicLanding";
import { SiteHeader } from "@/components/SiteHeader";

export default function Home() {
  const router = useRouter();

  return (
    <>
      <SiteHeader />
      <ClinicLanding onStart={() => router.push("/start")} />
    </>
  );
}
