// Centralized demo data/constants inside components/ as requested
export const MOVIES = [
  { id: "m1", title: "Shadow City", poster: "https://images.unsplash.com/photo-1529101091764-c3526daf38fe?q=80&w=1200&auto=format&fit=crop", rating: 8.4, duration: 128, tags: ["Action", "Thriller"], hot: true, status: "now", trailer: "https://www.youtube.com/embed/dQw4w9WgXcQ", desc: "A rogue detective chases a masked syndicate across a neon-soaked metropolis." },
  { id: "m2", title: "Starlit Garden", poster: "https://images.unsplash.com/photo-1517602302552-471fe67acf66?q=80&w=1200&auto=format&fit=crop", rating: 7.6, duration: 104, tags: ["Romance", "Drama"], hot: true, status: "now", trailer: "https://www.youtube.com/embed/dQw4w9WgXcQ", desc: "Two strangers meet nightly under meteor showers and rewrite their fates." },
  { id: "m3", title: "Bitwise Horizon", poster: "https://images.unsplash.com/photo-1508780709619-79562169bc64?q=80&w=1200&auto=format&fit=crop", rating: 8.9, duration: 142, tags: ["Sci-Fi", "Adventure"], hot: false, status: "soon", trailer: "https://www.youtube.com/embed/dQw4w9WgXcQ", desc: "An engineer discovers a portal compiler that renders new realities." },
  { id: "m4", title: "Crimson Noodles", poster: "https://images.unsplash.com/photo-1482049016688-2d3e1b311543?q=80&w=1200&auto=format&fit=crop", rating: 7.9, duration: 96, tags: ["Comedy"], hot: true, status: "now", trailer: "https://www.youtube.com/embed/dQw4w9WgXcQ", desc: "A food-truck rivalry spirals into a citywide culinary prank war." },
  { id: "m5", title: "Paper Planets", poster: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=1200&auto=format&fit=crop", rating: 8.2, duration: 118, tags: ["Family", "Fantasy"], hot: false, status: "soon", trailer: "https://www.youtube.com/embed/dQw4w9WgXcQ", desc: "Siblings fold origami worlds that unexpectedly come alive." },
  { id: "m6", title: "Neon Dreams", poster: "https://images.unsplash.com/photo-1574267432553-4b4628081c31?q=80&w=1200&auto=format&fit=crop", rating: 8.7, duration: 135, tags: ["Action", "Sci-Fi"], hot: true, status: "now", trailer: "https://www.youtube.com/embed/dQw4w9WgXcQ", desc: "A cyberpunk adventure through virtual reality nightmares." },
  { id: "m7", title: "Ocean's Whisper", poster: "https://images.unsplash.com/photo-1439066615861-d1af74d74000?q=80&w=1200&auto=format&fit=crop", rating: 7.8, duration: 112, tags: ["Drama", "Adventure"], hot: false, status: "now", trailer: "https://www.youtube.com/embed/dQw4w9WgXcQ", desc: "A deep-sea explorer discovers ancient secrets beneath the waves." },
  { id: "m8", title: "Mystic Forest", poster: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?q=80&w=1200&auto=format&fit=crop", rating: 8.1, duration: 98, tags: ["Fantasy", "Adventure"], hot: true, status: "soon", trailer: "https://www.youtube.com/embed/dQw4w9WgXcQ", desc: "A young mage's journey through an enchanted woodland realm." },
  { id: "m9", title: "City Lights", poster: "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?q=80&w=1200&auto=format&fit=crop", rating: 7.5, duration: 105, tags: ["Drama", "Romance"], hot: false, status: "now", trailer: "https://www.youtube.com/embed/dQw4w9WgXcQ", desc: "Two artists find love in the bustling streets of a modern metropolis." },
  { id: "m10", title: "Space Odyssey", poster: "https://images.unsplash.com/photo-1446776877081-d282a0f896e2?q=80&w=1200&auto=format&fit=crop", rating: 9.1, duration: 165, tags: ["Sci-Fi", "Adventure"], hot: true, status: "soon", trailer: "https://www.youtube.com/embed/dQw4w9WgXcQ", desc: "Humanity's greatest journey to the stars and beyond." },
  { id: "m11", title: "Dragon's Legacy", poster: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=1200&auto=format&fit=crop", rating: 8.3, duration: 142, tags: ["Fantasy", "Action"], hot: false, status: "now", trailer: "https://www.youtube.com/embed/dQw4w9WgXcQ", desc: "An epic tale of dragons, magic, and ancient prophecies." },
  { id: "m12", title: "Midnight Express", poster: "https://images.unsplash.com/photo-1478720568477-bd8170a6b2a3?q=80&w=1200&auto=format&fit=crop", rating: 7.9, duration: 118, tags: ["Thriller", "Action"], hot: false, status: "soon", trailer: "https://www.youtube.com/embed/dQw4w9WgXcQ", desc: "A high-speed chase across the desert under cover of darkness." },
];

export const COMBOS = [
  { id: "c1", name: "Combo Solo", items: "Popcorn + Soda", price: 69000, image: "", type: "combo" },
  { id: "c2", name: "Couple Treat", items: "2 Popcorn + 2 Soda", price: 129000, image: "", type: "combo" },
  { id: "c3", name: "Family Pack", items: "2 Large + 3 Soda", price: 189000, image: "", type: "combo" },
  { id: "c4", name: "Bắp lẻ", items: "1 Bắp lớn", price: 45000, image: "", type: "food" },
  { id: "c5", name: "Nước lẻ", items: "1 Nước lớn", price: 35000, image: "", type: "drink" },
];

export const money = (v) => (v || 0).toLocaleString("vi-VN") + "đ";

export const DAYS = Array.from({ length: 7 }, (_, i) => {
  const d = new Date();
  d.setDate(d.getDate() + i);
  const name = d.toLocaleDateString("vi-VN", { weekday: "long" });
  const date = d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" });
  const label = d.toLocaleDateString("vi-VN", { weekday: "short", day: "2-digit", month: "2-digit" });
  return { 
    key: d.toISOString().slice(0, 10), 
    name,
    date,
    label 
  };
});

export const SHOWTIMES = Object.fromEntries(
  DAYS.map((d) => [
    d.key,
    [
      { time: "10:00", room: "R1" },
      { time: "13:30", room: "R2" },
      { time: "16:45", room: "R1" },
      { time: "20:15", room: "R3" },
    ].map((s, idx) => ({ ...s, code: `${d.key}-${idx}` })),
  ])
);

export const PRE_BOOKED = new Set(["A1", "A2", "B4", "C5", "D7", "F3", "G6"]);
