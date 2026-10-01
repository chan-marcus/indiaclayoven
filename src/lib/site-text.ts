/*
 * Every piece of website wording the owner can edit from Dashboard → Website
 * text, grouped the way the dashboard shows it. The `text` here is the
 * default; edits are stored in Supabase (site_content) and override it.
 *
 * In long fields a new line starts a new line on the page. {phone} and
 * {cuisine} are filled in from Settings.
 */

type Field = { key: string; label: string; text: string; long?: boolean };

const f = (key: string, label: string, text: string): Field => ({ key, label, text });
const long = (key: string, label: string, text: string): Field => ({ key, label, text, long: true });

export const SITE_TEXT = [
  {
    page: "Home",
    path: "/",
    sections: [
      {
        title: "Top banner",
        fields: [
          f("home.hero.eyebrow", "Small heading", "Clement Street · San Francisco"),
          f("home.hero.title1", "Headline, first line", "Experience the"),
          f("home.hero.title2", "Headline, second line (gold)", "Taste of India"),
          long(
            "home.hero.intro",
            "Introduction",
            "Charcoal-fired clay oven cooking, hand-rolled breads and slow-simmered curries, served in the Richmond District since the neighbourhood learned our name.",
          ),
        ],
      },
      {
        title: "Information strip",
        fields: [
          f("home.info.call_note", "Under the phone number", "Reservations & takeout"),
          f("home.info.kitchen_note", "Under the cuisine", "Ask for gluten, dairy free or vegan"),
        ],
      },
      {
        title: "Three ways to eat with us",
        fields: [
          f("home.ways.order.title", "Card 1 title", "Order Online"),
          long("home.ways.order.copy", "Card 1 text", "Pickup or delivery from the full dinner menu, seven days a week."),
          f("home.ways.reserve.title", "Card 2 title", "Reservations"),
          long("home.ways.reserve.copy", "Card 2 text", "Book a table for dinner, or call and we will take care of the rest."),
          f("home.ways.catering.title", "Card 3 title", "Catering"),
          long(
            "home.ways.catering.copy",
            "Card 3 text",
            "Birthdays, engagements and corporate parties, hosted here or at your venue.",
          ),
        ],
      },
      {
        title: "Our story",
        fields: [
          f("home.story.eyebrow", "Small heading", "Our Story"),
          f("home.story.title", "Heading", "Cooked over charcoal, the way it has always been done"),
          long(
            "home.story.p1",
            "First paragraph",
            "India Clay Oven has served the Richmond District from a small storefront on Clement Street for many years. The cooking is traditional North Indian: a charcoal-fired tandoor for breads and kababs, heavy pots for the curries, and spices ground in the kitchen.",
          ),
          long(
            "home.story.p2",
            "Second paragraph",
            "Come in for the lunch buffet, stay for dinner with a drink from the full bar, or take it home to enjoy later. Gluten free, vegan and dairy free dishes are available whenever you ask for them.",
          ),
          f("home.story.block1.kicker", "Photo 1 small heading", "Heritage"),
          f("home.story.block1.title", "Photo 1 title", "The oven never went electric"),
          long(
            "home.story.block1.copy",
            "Photo 1 text",
            "Our tandoor runs on charcoal from open to close, cooked the same way for centuries now.",
          ),
          f("home.story.block2.kicker", "Photo 2 small heading", "Ingredients"),
          f("home.story.block2.title", "Photo 2 title", "Spices ground in our kitchen"),
          long(
            "home.story.block2.copy",
            "Photo 2 text",
            "Whole spices, bloomed in hot oil and ground here rather than bought by the case. Onions browned slowly, curries left to simmer.",
          ),
          f("home.story.block3.kicker", "Photo 3 small heading", "Hospitality"),
          f("home.story.block3.title", "Photo 3 title", "Regulars bring their families"),
          long(
            "home.story.block3.copy",
            "Photo 3 text",
            "At lunch the room fills for the buffet. In the evening the full menu comes out, along with the bar, and first-timers usually come back.",
          ),
        ],
      },
      {
        title: "Signature dishes",
        fields: [
          f("home.signature.eyebrow", "Small heading", "Our Menu"),
          f("home.signature.title", "Heading", "What people order again and again"),
        ],
      },
      {
        title: "Photo gallery",
        fields: [
          f("home.gallery.eyebrow", "Small heading", "From our guests"),
          f("home.gallery.title", "Heading", "Photographed on the table, not in a studio"),
        ],
      },
      {
        title: "Find us",
        fields: [
          f("home.findus.eyebrow", "Small heading", "Find us"),
          f("home.findus.title", "Heading", "Two blocks of Clement Street, one very old oven"),
          long(
            "home.findus.body",
            "Text",
            "We are on Clement between 25th and 26th Avenue, a short walk from Golden Gate Park.\nParking on the street is easiest before 6pm.",
          ),
        ],
      },
      {
        title: "Closing banner",
        fields: [
          f("home.closing.title", "Heading", "Hungry tonight?"),
          long(
            "home.closing.body",
            "Text",
            "Order for pickup or delivery, or call us at {phone} and we will have it ready.",
          ),
        ],
      },
    ],
  },
  {
    page: "About",
    path: "/about",
    sections: [
      {
        title: "Top banner",
        fields: [
          f("about.header.eyebrow", "Small heading", "About Us"),
          f("about.header.title", "Headline", "A neighbourhood clay oven on Clement Street"),
        ],
      },
      {
        title: "Our story",
        fields: [
          f("about.story.eyebrow", "Small heading", "Our story"),
          f("about.story.title", "Heading", "Traditional North Indian, cooked the long way"),
          long(
            "about.story.p1",
            "First paragraph",
            "India Clay Oven has served the Richmond District from a small storefront on Clement Street for many years. The cooking is traditional North Indian: a charcoal-fired tandoor for breads and kababs, heavy pots for the curries, and spices ground in the kitchen rather than bought by the case.",
          ),
          long(
            "about.story.p2",
            "Second paragraph",
            "At lunch the room fills for the daily buffet, a rotating spread of vegetarian dishes, chicken, rice, raita and fresh nan. In the evening the full dinner menu comes out, along with the bar. Regulars bring their families; first-timers usually come back.",
          ),
          long("about.story.p3", "Third paragraph", "Ask and we will make any dish gluten free, vegan or dairy free."),
        ],
      },
      {
        title: "The oven",
        fields: [
          f("about.oven.eyebrow", "Small heading", "The oven"),
          f("about.oven.title", "Heading", "The tandoor runs on charcoal from open to close"),
          long(
            "about.oven.body",
            "Text",
            "Breads are slapped against the clay wall and baked to order. Kababs come out on sizzling platters. Nothing here is finished in a microwave, which is why the nan arrives when it arrives.",
          ),
        ],
      },
      {
        title: "The kitchen",
        fields: [
          f("about.kitchen.eyebrow", "Small heading", "The kitchen"),
          f("about.kitchen.title", "Heading", "Curries are built the slow way"),
          long(
            "about.kitchen.body",
            "Text",
            "Onions browned properly, whole spices bloomed in hot oil, then left to simmer. A vindaloo should sting a little; a korma should not. We cook to the dish rather than to a house spice level, and we will happily adjust either way.",
          ),
        ],
      },
      {
        title: "The room",
        fields: [
          f("about.room.eyebrow", "Small heading", "The room"),
          f("about.room.title", "Heading", "A short walk from Golden Gate Park"),
          long(
            "about.room.body",
            "Text",
            "We are on Clement between 25th and 26th Avenue, in the middle of one of the best eating streets in San Francisco. Street parking is easiest before 6pm, and the full bar is open through dinner.",
          ),
        ],
      },
      {
        title: "Visit us",
        fields: [
          f("about.visit.eyebrow", "Small heading", "Visit us"),
          f("about.visit.title", "Heading", "Come by for the buffet, stay for dinner"),
          f("about.visit.hours_note", "Under the hours", "Full dinner menu 7 days a week"),
        ],
      },
    ],
  },
  {
    page: "Menu",
    path: "/menu",
    sections: [
      {
        title: "Top banner",
        fields: [
          f("menu.header.eyebrow", "Small heading", "Full Menu"),
          f("menu.header.title", "Headline", "Menu & Order"),
          long(
            "menu.header.intro",
            "Introduction",
            "Everything from the clay oven, ready for pickup or delivery. Tap any dish to see it up close.",
          ),
        ],
      },
      {
        title: "Dietary note",
        fields: [
          f("menu.dietary.label", "Bold label", "Dietary options:"),
          long(
            "menu.dietary.body",
            "Text",
            "we can prepare most dishes gluten free, vegan or dairy free. Add a note to your item or at checkout and the kitchen will take care of it.",
          ),
        ],
      },
    ],
  },
  {
    page: "Reservations",
    path: "/reservations",
    sections: [
      {
        title: "Top banner",
        fields: [
          f("reservations.header.eyebrow", "Small heading", "Reservations"),
          f("reservations.header.title", "Headline", "Book a table"),
          long(
            "reservations.header.intro",
            "Introduction",
            "Dinner is served seven nights a week. Tell us when you would like to come in and we will confirm by phone.",
          ),
        ],
      },
      {
        title: "Details",
        fields: [
          f("reservations.body.title", "Heading", "An evening on Clement Street"),
          long(
            "reservations.body.text",
            "Text",
            "The dining room is quiet enough to talk in and the full bar is open through dinner. Larger parties are welcome. We will put tables together.",
          ),
          f("reservations.dinner_note", "Dinner service line", "Seven nights a week"),
          f("reservations.buffet_note", "Lunch buffet note", "No reservation needed. Walk in."),
          long(
            "reservations.large_parties",
            "Large parties",
            "For nine or more, call {phone} and we will arrange the room.",
          ),
        ],
      },
    ],
  },
  {
    page: "Catering",
    path: "/catering",
    sections: [
      {
        title: "Top banner",
        fields: [
          f("catering.header.eyebrow", "Small heading", "Catering & Parties"),
          f("catering.header.title", "Headline", "Feed everyone well"),
          long(
            "catering.header.intro",
            "Introduction",
            "Birthdays, engagements, rehearsals and corporate events. Here on Clement Street or wherever you are.",
          ),
        ],
      },
      {
        title: "Three ways we do it",
        fields: [
          f("catering.ways.title", "Heading", "Three ways we do it"),
          f("catering.ways.1.title", "1 title", "In our dining room"),
          long(
            "catering.ways.1.copy",
            "1 text",
            "We can seat a party in the room or take it over entirely. Tables put together, the full bar, and the clay oven running all evening.",
          ),
          f("catering.ways.2.title", "2 title", "At your venue"),
          long(
            "catering.ways.2.copy",
            "2 text",
            "Trays of tandoori, curries, rice and fresh nan delivered and set up. We scale the spice to the room.",
          ),
          f("catering.ways.3.title", "3 title", "Built around your menu"),
          long(
            "catering.ways.3.copy",
            "3 text",
            "Pick from the full menu or let us put together a spread. Vegetarian, vegan, gluten-free and dairy-free are always covered.",
          ),
        ],
      },
      {
        title: "Enquiry form",
        fields: [
          f("catering.form.title", "Heading", "Tell us what you are planning"),
          long("catering.form.intro", "Text", "Send the details and we will come back with a menu and a price."),
        ],
      },
    ],
  },
  {
    page: "Checkout",
    path: "/checkout",
    sections: [
      {
        title: "Top banner",
        fields: [
          f("checkout.header.eyebrow", "Small heading", "Checkout"),
          f("checkout.header.title", "Headline", "Almost there"),
          long("checkout.header.intro", "Introduction", "Tell us where to send your order and when you want it."),
        ],
      },
    ],
  },
  {
    page: "Footer",
    path: "/",
    sections: [
      {
        title: "Footer (every page)",
        fields: [
          f("footer.tagline", "Tagline", "Experience the taste of India."),
          long("footer.blurb", "Description", "{cuisine}. Charcoal-fired, on Clement Street."),
          long(
            "footer.directions",
            "Directions strip",
            "We are on Clement between 25th and 26th Avenue, a short walk from Golden Gate Park.",
          ),
        ],
      },
    ],
  },
] as const satisfies readonly {
  page: string;
  path: string;
  sections: readonly { title: string; fields: readonly Field[] }[];
}[];

export type TextKey = (typeof SITE_TEXT)[number]["sections"][number]["fields"][number]["key"];
export type SiteText = Record<TextKey, string>;

const FIELDS: Field[] = SITE_TEXT.flatMap((p) => p.sections.flatMap((s) => [...s.fields]));

export const DEFAULT_TEXT = Object.fromEntries(FIELDS.map((x) => [x.key, x.text])) as SiteText;
export const TEXT_FIELD = new Map(FIELDS.map((x) => [x.key, x]));

/** Defaults with the owner's saved edits laid over them. */
export const mergeText = (overrides: Record<string, string>): SiteText => {
  const out = { ...DEFAULT_TEXT };
  for (const [k, v] of Object.entries(overrides)) if (k in out) out[k as TextKey] = v;
  return out;
};

/** Fills {phone} and {cuisine} from Settings. */
export const fillText = (text: string, vars: { phone: string; cuisine: string }) =>
  text.replaceAll("{phone}", vars.phone).replaceAll("{cuisine}", vars.cuisine);
