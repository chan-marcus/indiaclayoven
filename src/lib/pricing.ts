import type { Choice, MenuItem, OptionGroup } from "@/lib/types";

/* Two kinds of priced option, shared by the menu, the cart and the server so
   the price a customer sees is the price they're charged:

   - Sizes (`setsPrice`): each choice has its own price, set on each dish.
     Tandoori Chicken Half $15 / Whole $26. The pick replaces the dish price.
   - Extras: a choice adds a fixed amount on every dish (Extra paneer +$3). */

const money = (n: number) => n.toLocaleString("en-US", { style: "currency", currency: "USD" });
const cents = (n: number) => Math.round(n * 100) / 100;

/** What picking `choice` from an extras option adds. Sizes add nothing. */
export function addOn(group: OptionGroup, choice: string): number {
  if (group.setsPrice) return 0;
  const i = group.options.indexOf(choice);
  return i === -1 ? 0 : (group.prices[i] ?? 0);
}

/** The dish's price for one choice of a size option. */
export function sizePrice(item: MenuItem, group: OptionGroup, choice: string): number {
  const i = group.options.indexOf(choice);
  return item.choicePrices[group.id]?.[i] ?? item.price;
}

/** The size option on this dish, if it has one (a dish has at most one). */
export function sizeGroup(item: MenuItem, groups: OptionGroup[]): OptionGroup | undefined {
  return groups.find((g) => g.setsPrice && item.optionGroupIds.includes(g.id));
}

/** One dish with these choices, in dollars, rounded to the cent. */
export function unitPrice(item: MenuItem, choices: Choice[] | undefined, groups: OptionGroup[]): number {
  let price = item.price;
  for (const c of choices ?? []) {
    const g = groups.find((x) => x.id === c.groupId);
    if (!g) continue;
    if (g.setsPrice) price = sizePrice(item, g, c.choice) + (price - item.price);
    else price += addOn(g, c.choice);
  }
  return cents(price);
}

/** What a choice contributes, as stored on the order: the size price, or the extra. */
export function choicePrice(item: MenuItem, group: OptionGroup, choice: string): number {
  return group.setsPrice ? sizePrice(item, group, choice) : addOn(group, choice);
}

/** True when a choice on this dish can change its price, so it reads "From $X". */
export function hasPricedChoices(item: MenuItem, groups: OptionGroup[]): boolean {
  const size = sizeGroup(item, groups);
  if (size && new Set(size.options.map((o) => sizePrice(item, size, o))).size > 1) return true;
  return groups.some((g) => !g.setsPrice && item.optionGroupIds.includes(g.id) && g.prices.some((p) => p > 0));
}

/** The lowest price the dish can be ordered at, before extras. */
export function fromPrice(item: MenuItem, groups: OptionGroup[]): number {
  const size = sizeGroup(item, groups);
  return size ? Math.min(...size.options.map((o) => sizePrice(item, size, o))) : item.price;
}

/** "+$3.00" for an extra, "" for a choice that costs nothing extra. */
export function addOnLabel(amount: number): string {
  return amount > 0 ? `+${money(amount)}` : "";
}

/** How a choice's price reads on its button: "$15.00" for a size, "+$3.00" for an extra. */
export function choiceLabel(item: MenuItem, group: OptionGroup, choice: string): string {
  return group.setsPrice ? money(sizePrice(item, group, choice)) : addOnLabel(addOn(group, choice));
}

/** "Half · Full +$12.00", for listing an option's choices in the dashboard. */
export function choicesSummary(group: OptionGroup): string {
  return group.options
    .map((o, i) => [o, group.setsPrice ? "" : addOnLabel(group.prices[i] ?? 0)].filter(Boolean).join(" "))
    .join(" · ");
}
