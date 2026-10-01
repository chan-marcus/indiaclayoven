import type { Choice, MenuItem, OptionGroup } from "@/lib/types";

/* Option choices can add to a dish's price (e.g. Full chicken +$12). These
   helpers are shared by the menu, the cart and the server, so the price a
   customer sees is the price they're charged. */

/** What picking `choice` from `group` adds to the dish price. */
export function addOn(group: OptionGroup, choice: string): number {
  const i = group.options.indexOf(choice);
  return i === -1 ? 0 : (group.prices[i] ?? 0);
}

/** One dish with these choices, in dollars, rounded to the cent. */
export function unitPrice(item: MenuItem, choices: Choice[] | undefined, groups: OptionGroup[]): number {
  const extra = (choices ?? []).reduce((sum, c) => {
    const g = groups.find((x) => x.id === c.groupId);
    return sum + (g ? addOn(g, c.choice) : 0);
  }, 0);
  return Math.round((item.price + extra) * 100) / 100;
}

/** True when a choice on this dish can raise its price, so it reads "From $X". */
export function hasPricedChoices(item: MenuItem, groups: OptionGroup[]): boolean {
  return groups.some((g) => item.optionGroupIds.includes(g.id) && g.prices.some((p) => p > 0));
}

/** "+$12.00" for a priced choice, "" for one that costs nothing extra. */
export function addOnLabel(amount: number): string {
  return amount > 0 ? `+${amount.toLocaleString("en-US", { style: "currency", currency: "USD" })}` : "";
}

/** "Half · Full +$12.00", for listing a group's choices in the dashboard. */
export function choicesSummary(group: OptionGroup): string {
  return group.options
    .map((o, i) => [o, addOnLabel(group.prices[i] ?? 0)].filter(Boolean).join(" "))
    .join(" · ");
}
