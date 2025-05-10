import React from "react";
import { authOptions, CustomSession } from "../api/auth/[...nextauth]/options";
import { getServerSession } from "next-auth";
import UploadPage from "@/components/Base/UploadPage";

export default async function dashboard() {
  const session: CustomSession | null = await getServerSession(authOptions);

  return (
    <div>
      <div>
        <h1>Welcome! {session?.user?.name}</h1>

        <UploadPage />
      </div>
    </div>
  );
}
