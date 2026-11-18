"use client";

import { useState } from "react";
import { logout } from "@/app/actions";
import { buttonClass } from "@/components/ui/styles";
import { Dialog } from "@/components/ui/dialog";

export function LogoutButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={buttonClass("secondary", "sm")}
      >
        Keluar
      </button>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title="Keluar dari dashboard?"
        titleId="logout-title"
      >
        <p className="text-sm text-muted">
          Sesi Anda akan berakhir dan Anda kembali ke halaman login.
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={() => setOpen(false)}
            className={buttonClass("secondary", "sm")}
          >
            Batal
          </button>
          <form action={logout}>
            <button type="submit" className={buttonClass("primary", "sm")}>
              Keluar
            </button>
          </form>
        </div>
      </Dialog>
    </>
  );
}
