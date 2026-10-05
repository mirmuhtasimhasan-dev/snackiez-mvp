// Real customer reviews collected from WhatsApp and Facebook Messenger chats.
// Phone numbers and addresses are NOT included. Names are shortened to first name + last initial.
// Run: npx tsx prisma/seed-reviews.ts   (safe to run again, it will not create duplicates)
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

type R = { name: string; text: string; rating: number; source: "WhatsApp" | "Facebook"; image?: string; hidden?: boolean };

// Order = display order. Strongest, most detailed reviews first.
const reviews: R[] = [
  { name: "Aunik S.", source: "Facebook", rating: 5, text: "Among all the late night food options, yours are the tastiest. And the delivery speed! I have never gotten food this fast in my whole life! The shawarma is on point. One of the most delicious shawarmas I've tasted, and it's reasonably priced too. Overall, this was a great experience, and I would definitely order again." },
  { name: "Afrah M.", source: "Facebook", rating: 5, text: "The food tasted so good and was perfectly crispy! The service and behavior were also really good 💞 Overall, everything was great. Thank you so much! ❤️" },
  { name: "Soomaiya C.", source: "Facebook", rating: 5, text: "Food was really good, especially the fries!! Huge thanks to the person who delivered it amidst the rain. Was a good experience overall!" },
  { name: "Aladdin K.", source: "Facebook", rating: 5, text: "Taste 10/10. And fries 🔥", image: "/reviews/review-aladdin.webp" },
  { name: "Verified customer", source: "WhatsApp", rating: 5, text: "It tasted even way better than the last time! Really satisfying. Thank you for keeping up the quality!" },
  { name: "Ayman R.", source: "Facebook", rating: 5, text: "IT WAS FANTASTIC ❤️❤️❤️ I'm one of your loyal customers. Keep up the good work!!!" },
  { name: "Verified customer", source: "Facebook", rating: 5, text: "Loaded fries were heaven literally. Etokhon bahire ache, AC r moddhe, tao soggy hoy nai. Ar delivery top notch. Ami koek second er jonno vabsi apnara amar bashar nichei chilen, age theke khabar ready kore." },
  { name: "Verified customer", source: "WhatsApp", rating: 5, text: "The tenders were really good. Crispy and juicy both at once. Really nice." },
  { name: "Ar K.", source: "Facebook", rating: 5, text: "100000000/100000000... totally awesome, fresh & too much tasty 😋 As always, all time best." },
  { name: "Teresa I.", source: "WhatsApp", rating: 5, text: "Thank you so much for the fast delivery and cooperation. Food was great too." },
  { name: "Riala I.", source: "Facebook", rating: 5, text: "Exactly what I was craving for! Thanks for fulfilling my expectations ❤️" },
  { name: "Fardeen Z.", source: "Facebook", rating: 5, text: "Thanks, the food was good. Especially the sliders. Sliders were amazing as usual." },
  { name: "Verified customer", source: "WhatsApp", rating: 5, text: "The taste was really good and the delivery was also on time. Overall it was a great experience. Thank you ✨" },
  { name: "Aadeed", source: "Facebook", rating: 5, text: "It was great, kindly maintain the quality and quantity you are providing right now!" },
  { name: "Meadow", source: "Facebook", rating: 5, text: "The food was soooooo good, like really good. And thanks for the fast delivery. We really loved it, we will order again." },
  { name: "Tahmina T.", source: "Facebook", rating: 5, text: "It was so tasty. Thank you. Bitezz will definitely be getting another order from me ❤️" },
  { name: "Ashiqul H.", source: "Facebook", rating: 5, text: "Apnader burger ta valo lage! 3rd time order kortesi. As always good." },
  { name: "Iharem R.", source: "Facebook", rating: 5, text: "The chicken fry is a great deal, and the shawarma is also good." },
  { name: "Sharmen K.", source: "Facebook", rating: 5, text: "It was too good. Loved the chicken shawarma." },
  { name: "Rakib", source: "Facebook", rating: 5, text: "Food was very tasty and fresh. Thank you for the service. My friend suggested your page for midnight cravings." },
  { name: "Tasin I.", source: "Facebook", rating: 5, text: "Amazing. Loved it! I will order more for sure, in sha Allah." },
  { name: "Samia M.", source: "Facebook", rating: 5, text: "Got the delivery, the food was so delicious. Thanks a lot." },
  { name: "Meherab M.", source: "Facebook", rating: 5, text: "It was good. Definitely gonna order next time. Thanks a lot." },
  { name: "Verified customer", source: "WhatsApp", rating: 5, text: "The food was very good! Really enjoyed it." },
  { name: "Mahmuda S.", source: "Facebook", rating: 5, text: "Bhaiya everything was good, I really liked it. The salt level was perfect." },
  { name: "Taiba M.", source: "Facebook", rating: 5, text: "Bhaiya, guests ra khelo, besh mojaa. Almost shesh. Shesh hoye gele abar order korbo ajkei." },
  { name: "Verified customer", source: "WhatsApp", rating: 5, text: "Khabar onek fresh and tasty chilo, specially burger ta ☺️" },
  { name: "Sohaib", source: "Facebook", rating: 5, text: "It was good. Specially the fries." },
  { name: "Edward K.", source: "Facebook", rating: 5, text: "Shawarma was great." },
  { name: "Zareen N.", source: "Facebook", rating: 5, text: "The food is good. For me the portion is okay. Loved the flavor too." },
  { name: "Tanjina Z.", source: "Facebook", rating: 5, text: "Best bro. Ami regular customer apnader." },
  { name: "Mubtasim M.", source: "Facebook", rating: 5, text: "Bhai arekta diye jan, free te khaiya koitesi. Btw jk, oshadharon hoise." },
  { name: "Nahida", source: "WhatsApp", rating: 5, text: "Food was so good. Keep it up ❤️" },
  { name: "Sabrina A.", source: "Facebook", rating: 5, text: "It was amazing. Thank you 💗" },
  { name: "Ahb A.", source: "Facebook", rating: 5, text: "The food was really good, like always." },
  { name: "Yasir M.", source: "Facebook", rating: 5, text: "Alhamdulillah. Good, keep it up bhaia. Next time burger." },
  { name: "Mehedi P.", source: "Facebook", rating: 5, text: "Was excellent." },
  { name: "Saiham H.", source: "Facebook", rating: 5, text: "The food was excellent." },
  { name: "Mashrif N.", source: "Facebook", rating: 5, text: "The food was great." },
  { name: "Syed R.", source: "Facebook", rating: 5, text: "Food was very tasty." },
  { name: "Sadman S.", source: "Facebook", rating: 5, text: "Thanks bhai, khabar mojar chilo 💯" },
  { name: "Humaira R.", source: "Facebook", rating: 5, text: "Besh moja chilo." },
  { name: "Tain A.", source: "Facebook", rating: 5, text: "Onek tasty, onek valo." },
  { name: "Joydip M.", source: "Facebook", rating: 5, text: "It was really good." },
  { name: "Verified customer", source: "WhatsApp", rating: 5, text: "It was really good." },
  { name: "Verified customer", source: "WhatsApp", rating: 5, text: "It was great, thank you!" },
  { name: "Nayeer C.", source: "Facebook", rating: 5, text: "It is great." },
  { name: "Afrah H.", source: "Facebook", rating: 5, text: "It's tasty." },
  { name: "Alia I.", source: "Facebook", rating: 5, text: "Onek moja. Thanks." },
  { name: "Rizvi A.", source: "Facebook", rating: 5, text: "Food valo chilo vai. Thanks." },
  { name: "Arian S.", source: "Facebook", rating: 5, text: "Alhamdulillah, good bro." },
  { name: "Redwana A.", source: "Facebook", rating: 5, text: "So good." },
  { name: "Nahin F.", source: "Facebook", rating: 5, text: "Food was good." },
  { name: "Asrar U.", source: "Facebook", rating: 5, text: "Food is good." },
  { name: "Tohura H.", source: "Facebook", rating: 5, text: "It's good." },
  { name: "Atiqul C.", source: "Facebook", rating: 5, text: "It was good." },
  { name: "Maisha K.", source: "Facebook", rating: 5, text: "It was good." },
  { name: "Wais H.", source: "WhatsApp", rating: 5, text: "It was good." },
  // Honest mixed feedback: saved but hidden from the site. Useful for the kitchen. Turn on in admin if you want.
  { name: "Minhajul S.", source: "Facebook", rating: 4, text: "10/10, but aro ektu boro hole better hoito.", hidden: true },
  { name: "Mann", source: "WhatsApp", rating: 4, text: "Actually pretty good! Maybe the size could be more, but otherwise much to my liking, flavourful.", hidden: true },
  { name: "Tahsina F.", source: "Facebook", rating: 3, text: "Decent for the price. Good quantity and quality of fries and chicken. Just way too saucy, thus making it sweet. Overall decent!", hidden: true },
];

async function main() {
  let created = 0, updated = 0;
  for (let i = 0; i < reviews.length; i++) {
    const r = reviews[i];
    const data = {
      name: r.name,
      text: r.text,
      rating: r.rating,
      source: r.source,
      image: r.image ?? null,
      isVisible: !r.hidden,
      sortOrder: i + 1,
      status: r.hidden ? "REJECTED" : "APPROVED",
      isVerified: true,
    } as any;
    const existing = await prisma.review.findFirst({ where: { name: r.name, text: r.text } });
    if (existing) { await prisma.review.update({ where: { id: existing.id }, data }); updated++; }
    else { await prisma.review.create({ data }); created++; }
  }
  // remove the 3 old sample reviews
  const samples = ["Tanvir, NSU", "Nusrat, IUB", "Rafi, Block D"];
  const removed = await prisma.review.deleteMany({ where: { name: { in: samples }, orderId: null } });
  console.log(`Reviews: ${created} created, ${updated} updated, ${removed.count} sample reviews removed.`);
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
