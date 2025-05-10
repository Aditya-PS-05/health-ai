import React from "react";
import { authOptions, CustomSession } from "../api/auth/[...nextauth]/options";
import { getServerSession } from "next-auth";

export default async function dashboard() {
  const session: CustomSession | null = await getServerSession(authOptions);
  console.log("The session is ", session);

  return (
    <div>
      <h1>Dashboard</h1>
    </div>
  );
}
