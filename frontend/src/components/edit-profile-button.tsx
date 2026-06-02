"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getAddress } from "@stellar/freighter-api";

export function EditProfileButton({
  username,
  walletAddress,
}: {
  username: string;
  walletAddress: string;
}) {
  const [isOwner, setIsOwner] = useState(false);

  useEffect(() => {
    getAddress()
      .then((result) => {
        const addr = "address" in result ? result.address : "";
        setIsOwner(Boolean(addr && addr === walletAddress));
      })
      .catch(() => {});
  }, [walletAddress]);

  if (!isOwner) return null;

  return (
    <Link
      href={`/profile/${username}/edit`}
      className="inline-flex min-h-[36px] items-center gap-1.5 rounded-xl border border-mint/30 bg-mint/10 px-4 py-1.5 text-sm font-semibold text-mint hover:bg-mint/20 transition-colors"
    >
      Edit profile
    </Link>
  );
}
