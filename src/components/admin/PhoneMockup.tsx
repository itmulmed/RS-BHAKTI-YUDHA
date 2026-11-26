import type { ReactNode } from 'react';

/** Bingkai smartphone. Isi bisa berupa iframe atau komponen langsung. */
export default function PhoneMockup({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto h-[590px] w-[290px] overflow-hidden rounded-[42px] border-[9px] border-slate-900 bg-white shadow-xl">
      <div className="relative h-full w-full overflow-y-auto overflow-x-hidden bg-white">{children}</div>
    </div>
  );
}
