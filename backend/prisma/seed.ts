import { PrismaClient, Role, PostCategory, PostStatus, Gender, UserStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Clean existing data
  await prisma.report.deleteMany();
  await prisma.savedPost.deleteMany();
  await prisma.like.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.post.deleteMany();
  await prisma.user.deleteMany();

  const hashedPassword = await bcrypt.hash("Admin@123", 12);
  const userPassword = await bcrypt.hash("User@123", 12);

  // Create admin
  const admin = await prisma.user.create({
    data: {
      username: "admin",
      email: "admin@rajkotlive.in",
      password: hashedPassword,
      displayName: "RajkotLive Admin",
      role: Role.ADMIN,
      gender: Gender.MALE,
      bio: "Official admin of RajkotLive platform.",
    },
  });

  // Create sample users
  const user1 = await prisma.user.create({
    data: {
      username: "rajesh_patel",
      email: "rajesh@example.com",
      password: userPassword,
      displayName: "Rajesh Patel",
      gender: Gender.MALE,
      bio: "Rajkot ni galiyo ma rakhdu! 🏏",
    },
  });

  const user2 = await prisma.user.create({
    data: {
      username: "priya_shah",
      email: "priya@example.com",
      password: userPassword,
      displayName: "Priya Shah",
      gender: Gender.FEMALE,
      bio: "Foodie from Rajkot. Street food explorer.",
    },
  });

  const user3 = await prisma.user.create({
    data: {
      username: "kiran_joshi",
      email: "kiran@example.com",
      password: userPassword,
      displayName: "Kiran Joshi",
      gender: Gender.MALE,
      bio: "Event organizer and cultural enthusiast.",
    },
  });

  // Create sample posts
  const posts = await Promise.all([
    // EVENT posts
    prisma.post.create({
      data: {
        title: "Navratri at Racecourse 2025",
        content:
          "The grand Navratri celebration at Racecourse Ground is back! Join us for 9 nights of garba, dandiya, and cultural performances. Top artists performing live every night. Entry passes available at the gate.",
        category: PostCategory.EVENT,
        subcategory: "Navratri",
        tags: ["navratri", "garba", "racecourse", "festival"],
        eventDate: new Date("2025-10-02"),
        eventVenue: "Racecourse Ground, Rajkot",
        isOngoing: false,
        address: "Racecourse Ground, Kalavad Road, Rajkot",
        authorId: user3.id,
      },
    }),
    prisma.post.create({
      data: {
        title: "Makar Sankranti Kite Festival Ring Road",
        content:
          "Uttarayan is here! The annual kite festival on Ring Road is happening on January 14th. Kite stalls, food courts, and live music. Bring your family and enjoy the vibrant sky full of colorful kites.",
        category: PostCategory.EVENT,
        subcategory: "Uttarayan",
        tags: ["uttarayan", "kite-festival", "makar-sankranti"],
        eventDate: new Date("2025-01-14"),
        eventVenue: "Ring Road, Rajkot",
        address: "Ring Road, Near Aji Dam, Rajkot",
        authorId: user1.id,
      },
    }),

    // FOOD posts
    prisma.post.create({
      data: {
        title: "New Gathiya Shop opened near Kalavad Road",
        content:
          "A brand new gathiya shop has opened near Kalavad Road crossing. Fresh hot gathiya, jalebi, and fafda every morning from 7 AM. The taste is authentic and prices are very reasonable. Must try for breakfast lovers!",
        category: PostCategory.FOOD,
        subcategory: "Gathiya Shop",
        tags: ["gathiya", "breakfast", "kalavad-road", "new-shop"],
        address: "Near Kalavad Road Crossing, Rajkot",
        authorId: user2.id,
      },
    }),
    prisma.post.create({
      data: {
        title: "Best Jalebi in Rajkot - Shyam Sweets",
        content:
          "If you haven't tried the jalebi at Shyam Sweets near Dhebar Road, you are missing out. Crispy, hot, and perfectly sweet. They also serve amazing rabdi. Open from 8 AM to 10 PM daily.",
        category: PostCategory.FOOD,
        subcategory: "Sweet Shop",
        tags: ["jalebi", "sweets", "dhebar-road", "must-try"],
        address: "Dhebar Road, Rajkot",
        authorId: user2.id,
      },
    }),
    prisma.post.create({
      data: {
        title: "Street Food Trail: Aagman Chowk to Yagnik Road",
        content:
          "Explored the best street food spots from Aagman Chowk to Yagnik Road. Pani puri at the corner stall, dabeli near the bus stand, and ending with cutting chai. Rajkot street food is unmatched!",
        category: PostCategory.FOOD,
        subcategory: "Street Food",
        tags: ["street-food", "pani-puri", "dabeli", "food-trail"],
        address: "Aagman Chowk to Yagnik Road, Rajkot",
        authorId: user1.id,
      },
    }),

    // SPORTS posts
    prisma.post.create({
      data: {
        title: "Local Cricket Tournament at Khedut Ground",
        content:
          "The annual inter-society cricket tournament kicks off this weekend at Khedut Ground. 16 teams competing for the Rajkot Premier Trophy. Matches start at 8 AM every Saturday and Sunday.",
        category: PostCategory.SPORTS,
        subcategory: "Cricket",
        tags: ["cricket", "tournament", "khedut-ground", "local-sports"],
        eventDate: new Date("2025-03-15"),
        eventVenue: "Khedut Ground, Rajkot",
        address: "Khedut Ground, University Road, Rajkot",
        authorId: user1.id,
      },
    }),
    prisma.post.create({
      data: {
        title: "Kabaddi Championship at PDPU",
        content:
          "State-level Kabaddi Championship is being organized at PDPU campus ground. Teams from all over Gujarat are participating. Free entry for spectators. Come support our Rajkot warriors!",
        category: PostCategory.SPORTS,
        subcategory: "Kabaddi",
        tags: ["kabaddi", "championship", "pdpu", "state-level"],
        eventDate: new Date("2025-04-20"),
        eventVenue: "PDPU Campus, Rajkot",
        address: "PDPU Campus Ground, Rajkot",
        authorId: user3.id,
      },
    }),

    // DAYRO posts
    prisma.post.create({
      data: {
        title: "Kirtidan Gadhavi Live at Rotary Ground",
        content:
          "The king of Gujarati folk music, Kirtidan Gadhavi, is performing live at Rotary Ground this Saturday! Gates open at 6 PM. Book your tickets now before they sell out. An evening of soulful music awaits.",
        category: PostCategory.DAYRO,
        subcategory: "Upcoming Show",
        tags: ["kirtidan-gadhavi", "dayro", "live-music", "rotary-ground"],
        eventDate: new Date("2025-04-05"),
        eventVenue: "Rotary Ground, Rajkot",
        address: "Rotary Ground, 150 Feet Ring Road, Rajkot",
        authorId: user3.id,
      },
    }),
    prisma.post.create({
      data: {
        title: "Hemant Chauhan Dayro this Sunday",
        content:
          "Legendary bhajan singer Hemant Chauhan will be performing a special dayro this Sunday at Saurashtra University grounds. A divine musical experience for all devotional music lovers.",
        category: PostCategory.DAYRO,
        subcategory: "Upcoming Show",
        tags: ["hemant-chauhan", "bhajan", "dayro", "saurashtra-university"],
        eventDate: new Date("2025-04-06"),
        eventVenue: "Saurashtra University Ground, Rajkot",
        address: "Saurashtra University, Rajkot",
        authorId: user1.id,
      },
    }),

    // FOOD posts with images
    prisma.post.create({
      data: {
        title: "Famous Locho at Kanta Stree Vistar",
        content:
          "This tiny stall near Kanta Stree Vistar serves the most fluffy and spicy locho in Rajkot. Topped with sev, chutney, and a generous amount of oil — absolute comfort food. Only ₹30 per plate!",
        category: PostCategory.FOOD,
        subcategory: "Street Food",
        tags: ["locho", "street-food", "kanta", "cheap-eats"],
        images: ["/uploads/food1.jpg"],
        address: "Kanta Stree Vistar, Rajkot",
        authorId: user1.id,
      },
    }),
    prisma.post.create({
      data: {
        title: "Pav Bhaji Heaven near Jubilee Garden",
        content:
          "The pav bhaji stall near Jubilee Garden is on another level. Butter-loaded bhaji with crispy pav — you can smell it from two lanes away. Open from 5 PM to 11 PM daily. Weekend pe extra rush!",
        category: PostCategory.FOOD,
        subcategory: "Street Food",
        tags: ["pav-bhaji", "jubilee-garden", "evening-snack", "butter"],
        images: ["/uploads/food2.jpg"],
        address: "Near Jubilee Garden, Rajkot",
        authorId: user2.id,
      },
    }),
    prisma.post.create({
      data: {
        title: "Hidden Gem: Kathiyawadi Thali at Aji Dam Road",
        content:
          "Discovered a small family-run restaurant on Aji Dam Road that serves the most authentic Kathiyawadi thali. Bajra rotla, ringan no olo, chas, and undhiyu — all for ₹150. Pure homestyle taste!",
        category: PostCategory.FOOD,
        subcategory: "Restaurant",
        tags: ["kathiyawadi", "thali", "aji-dam-road", "hidden-gem", "homestyle"],
        images: ["/uploads/food3.jpg"],
        address: "Aji Dam Road, Rajkot",
        authorId: user3.id,
      },
    }),

    // OTHER post
    prisma.post.create({
      data: {
        title: "New Bus Route: Rajkot to Morbi via Highway",
        content:
          "The Rajkot Municipal Corporation has announced a new direct bus route from Rajkot ST Bus Stand to Morbi via the new highway. Buses will run every 30 minutes from 6 AM to 9 PM. Fare: ₹45.",
        category: PostCategory.OTHER,
        tags: ["bus-route", "transport", "rajkot-morbi", "public-transport"],
        address: "ST Bus Stand, Rajkot",
        authorId: admin.id,
      },
    }),
  ]);

  // Add some likes
  await Promise.all([
    prisma.like.create({ data: { userId: user1.id, postId: posts[0].id } }),
    prisma.like.create({ data: { userId: user2.id, postId: posts[0].id } }),
    prisma.like.create({ data: { userId: user3.id, postId: posts[2].id } }),
    prisma.like.create({ data: { userId: admin.id, postId: posts[7].id } }),
    prisma.like.create({ data: { userId: user1.id, postId: posts[3].id } }),
  ]);

  // Add some comments
  const comment1 = await prisma.comment.create({
    data: {
      content: "Can't wait for Navratri! Best 9 nights of the year!",
      authorId: user1.id,
      postId: posts[0].id,
    },
  });

  await prisma.comment.create({
    data: {
      content: "Same here! Already bought my chaniya choli 😍",
      authorId: user2.id,
      postId: posts[0].id,
      parentId: comment1.id,
    },
  });

  await prisma.comment.create({
    data: {
      content: "Their gathiya is the best I've had in years!",
      authorId: user1.id,
      postId: posts[2].id,
    },
  });

  await prisma.comment.create({
    data: {
      content: "Kirtidan bhai no dayro means full paisa vasool! 🎶",
      authorId: user2.id,
      postId: posts[7].id,
    },
  });

  // Add some reports
  await Promise.all([
    prisma.report.create({ data: { userId: user2.id, postId: posts[0].id, reason: "Misleading event date" } }),
    prisma.report.create({ data: { userId: user1.id, postId: posts[8].id, reason: "Spam content" } }),
    prisma.report.create({ data: { userId: user2.id, postId: posts[8].id, reason: "Inappropriate images" } }),
    prisma.report.create({ data: { userId: user3.id, postId: posts[8].id, reason: "Duplicate post" } }),
  ]);

  console.log("✅ Seed completed successfully!");
  console.log(`   Created: 1 admin, 3 users, ${posts.length} posts, 5 likes, 4 comments, 4 reports`);
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
