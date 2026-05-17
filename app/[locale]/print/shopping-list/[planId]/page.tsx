import { notFound } from "next/navigation";
import {
  getPurchasePlan,
  calculatePlanShoppingList,
} from "@/lib/actions/purchase-plan";
import { AutoPrint } from "./auto-print";

export default async function PrintShoppingListPage({
  params,
}: {
  params: Promise<{ planId: string; locale: string }>;
}) {
  const { planId } = await params;
  const plan = await getPurchasePlan(planId);
  if (!plan) notFound();
  const list = await calculatePlanShoppingList(planId);

  const items = list?.results ?? [];
  const total = list?.estimatedTotal ?? null;
  const targetDate = plan.targetDate
    ? plan.targetDate.toISOString().slice(0, 10)
    : null;

  return (
    <div className="print-root">
      <AutoPrint />
      <style>{`
        .print-root {
          padding: 24px 32px;
          color: #000;
          background: #fff;
          font-size: 12pt;
        }
        .print-root h1 { font-size: 20pt; margin: 0 0 4px; }
        .print-root .sub { color: #555; margin: 0 0 20px; font-size: 10pt; }
        .print-root table { width: 100%; border-collapse: collapse; }
        .print-root th, .print-root td {
          text-align: left;
          padding: 6px 8px;
          border-bottom: 1px solid #ddd;
          font-size: 10pt;
          vertical-align: top;
        }
        .print-root th {
          border-bottom: 1.5px solid #333;
          font-weight: 600;
        }
        .print-root .num { text-align: right; font-variant-numeric: tabular-nums; white-space: nowrap; }
        .print-root .to-buy { font-weight: 600; }
        .print-root .total {
          margin-top: 16px;
          text-align: right;
          font-weight: 700;
          font-size: 12pt;
        }
        .print-root .empty {
          color: #777;
          font-style: italic;
          margin-top: 16px;
        }
        @media print {
          @page { size: A4; margin: 12mm; }
          body { background: #fff !important; }
          [data-sonner-toaster], nav, header, aside { display: none !important; }
        }
      `}</style>

      <h1>{plan.name}</h1>
      <p className="sub">
        Shopping list{targetDate ? ` — target ${targetDate}` : ""}
      </p>

      {items.length === 0 ? (
        <p className="empty">No items to purchase.</p>
      ) : (
        <>
          <table>
            <thead>
              <tr>
                <th>Ingredient</th>
                <th className="num">Needed</th>
                <th className="num">In stock</th>
                <th className="num">To buy</th>
                <th className="num">Cost (THB)</th>
              </tr>
            </thead>
            <tbody>
              {items.map((it) => (
                <tr key={it.ingredientId}>
                  <td>{it.ingredientName}</td>
                  <td className="num">
                    {it.needed.toFixed(2)} {it.baseUnit}
                  </td>
                  <td className="num">
                    {it.inStock.toFixed(2)} {it.baseUnit}
                  </td>
                  <td className="num to-buy">
                    {it.toBuy.toFixed(2)} {it.baseUnit}
                  </td>
                  <td className="num">
                    {it.estimatedCost !== null
                      ? `฿${it.estimatedCost.toFixed(2)}`
                      : "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {total !== null && (
            <p className="total">Estimated total: ฿{total.toFixed(2)}</p>
          )}
        </>
      )}
    </div>
  );
}
