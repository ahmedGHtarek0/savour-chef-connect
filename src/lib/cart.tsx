import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type CartLine = {
  chefItemId: string;
  itemId: string;
  chefId: string;
  chefName: string;
  name: string;
  price: number;
  leadTimeHours: number;
  photo?: string | null;
  qty: number;
};

type CartCtx = {
  lines: CartLine[];
  add: (line: Omit<CartLine, "qty">, qty?: number) => void;
  setQty: (chefItemId: string, qty: number) => void;
  remove: (chefItemId: string) => void;
  clear: () => void;
  subtotal: number;
  count: number;
};

const Ctx = createContext<CartCtx | null>(null);
const KEY = "savora.cart.v1";

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setLines(JSON.parse(raw));
    } catch {}
  }, []);
  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(lines)); } catch {}
  }, [lines]);

  const add: CartCtx["add"] = (line, qty = 1) =>
    setLines((curr) => {
      const i = curr.findIndex((l) => l.chefItemId === line.chefItemId);
      if (i >= 0) {
        const next = [...curr];
        next[i] = { ...next[i], qty: next[i].qty + qty };
        return next;
      }
      return [...curr, { ...line, qty }];
    });

  const setQty: CartCtx["setQty"] = (id, qty) =>
    setLines((curr) => (qty <= 0 ? curr.filter((l) => l.chefItemId !== id) : curr.map((l) => (l.chefItemId === id ? { ...l, qty } : l))));

  const remove: CartCtx["remove"] = (id) => setLines((c) => c.filter((l) => l.chefItemId !== id));
  const clear = () => setLines([]);

  const subtotal = lines.reduce((s, l) => s + l.price * l.qty, 0);
  const count = lines.reduce((s, l) => s + l.qty, 0);

  return <Ctx.Provider value={{ lines, add, setQty, remove, clear, subtotal, count }}>{children}</Ctx.Provider>;
}

export function useCart() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useCart must be used within CartProvider");
  return c;
}