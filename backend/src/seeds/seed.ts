import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

import { User } from "../models";
import { Post } from "../models";
import { Comment } from "../models";
import { Like } from "../models";
import { SavedPost } from "../models";
import { Report } from "../models";

const SALT_ROUNDS = 12;

async function seed() {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    console.error("❌ MONGODB_URI not set in .env");
    process.exit(1);
  }

  await mongoose.connect(mongoUri);
  console.log("✅ Connected to MongoDB");

  // Clean existing data
  await Promise.all([
    Report.deleteMany({}),
    SavedPost.deleteMany({}),
    Like.deleteMany({}),
    Comment.deleteMany({}),
    Post.deleteMany({}),
    User.deleteMany({}),
  ]);
  console.log("🗑️  Cleared all collections");

  const hashedAdmin = await bcrypt.hash("Admin@123", SALT_ROUNDS);
  const hashedUser = await bcrypt.hash("User@123", SALT_ROUNDS);

  // Create users
  const admin = await User.create({
    username: "admin",
    email: "admin@rajkotlive.in",
    password: hashedAdmin,
    displayName: "RajkotLive Admin",
    role: "ADMIN",
    gender: "MALE",
    bio: "Official admin of RajkotLive platform",
  });

  const user1 = await User.create({
    username: "rajesh_patel",
    email: "rajesh@example.com",
    password: hashedUser,
    displayName: "Rajesh Patel",
    gender: "MALE",
    bio: "Proud Rajkotian | Food lover | Event organizer",
  });

  const user2 = await User.create({
    username: "priya_shah",
    email: "priya@example.com",
    password: hashedUser,
    displayName: "Priya Shah",
    gender: "FEMALE",
    bio: "Photographer | Culture enthusiast | Rajkot diaries",
  });

  const user3 = await User.create({
    username: "kiran_mehta",
    email: "kiran@example.com",
    password: hashedUser,
    displayName: "Kiran Mehta",
    gender: "MALE",
    bio: "Sports journalist | Cricket fanatic",
  });

  console.log("👤 Created 1 admin + 3 users");

  // Create posts
  const postsData = [
    {
      title: "Navratri 2025 at Race Course Ground",
      content: "The biggest Navratri celebration in Rajkot is back! Join us for 9 nights of garba, dandiya, and cultural programs at Race Course Ground. Live music by popular artists. Free entry!",
      category: "EVENT",
      subcategory: "Navratri",
      tags: ["navratri", "garba", "dandiya", "racecourse"],
      eventDate: new Date("2025-10-02T19:00:00Z"),
      eventVenue: "Race Course Ground, Rajkot",
      isOngoing: false,
      address: "Race Course Ground, Kalavad Road, Rajkot",
      authorId: user1._id,
    },
    {
      title: "Best Dabeli in Rajkot - Street Food Guide",
      content: "After trying 20+ dabeli stalls, here are my top picks. The dabeli at Kalawad Road chowk is unmatched! Crispy, spicy, and just Rs 20. Must try the cheese dabeli variant.",
      category: "FOOD",
      subcategory: "Street Food",
      tags: ["dabeli", "streetfood", "kalawadroad"],
      authorId: user2._id,
      address: "Kalawad Road Chowk, Rajkot",
    },
    {
      title: "Rajkot Premier League - Cricket Tournament",
      content: "Annual cricket tournament featuring 16 local teams. Matches at Khanderi Cricket Academy. Come watch some amazing local talent! Tournament runs for 2 weeks.",
      category: "SPORTS",
      subcategory: "Cricket",
      tags: ["cricket", "rpl", "tournament"],
      eventDate: new Date("2025-12-15T09:00:00Z"),
      eventVenue: "Khanderi Cricket Academy",
      authorId: user3._id,
      address: "Khanderi Cricket Academy, Rajkot",
    },
    {
      title: "Morning Chai Culture of Rajkot",
      content: "Rajkot wakes up with chai! From the iconic tapris near Aji Dam to the modern cafes at Crystal Mall, every corner has its own chai story. Here are 10 spots you must visit.",
      category: "DAYRO",
      tags: ["chai", "mornings", "culture", "rajkot"],
      authorId: user1._id,
    },
    {
      title: "New Water Park Opening Near 150 Feet Ring Road",
      content: "Rajkot is getting a brand new water park with international-standard slides and a wave pool. Expected to open by summer 2025. Located near 150 feet ring road.",
      category: "OTHER",
      tags: ["waterpark", "newopening", "ringroad"],
      authorId: user2._id,
      address: "150 Feet Ring Road, Rajkot",
    },
    {
      title: "Kite Festival 2025 - Uttarayan Special",
      content: "Rajkot's sky will be filled with colorful kites this Uttarayan! Special kite-making workshops, competitions, and food stalls at Jubilee Garden.",
      category: "EVENT",
      subcategory: "Uttarayan",
      tags: ["uttarayan", "kites", "festival"],
      eventDate: new Date("2025-01-14T06:00:00Z"),
      eventVenue: "Jubilee Garden, Rajkot",
      authorId: user3._id,
      address: "Jubilee Garden, Rajkot",
    },
    {
      title: "Hidden Gems - Restaurants in Rajkot",
      content: "Forget the popular places! These 5 hidden gem restaurants serve the most authentic Kathiyawadi food. My favorite is the one near Trikon Baug. Amazing dal-bati-churma!",
      category: "FOOD",
      subcategory: "Restaurants",
      tags: ["restaurants", "kathiyawadi", "hiddenGems"],
      authorId: user1._id,
    },
    {
      title: "Rajkot Marathon 2025",
      content: "Annual Rajkot Marathon is here! 5K, 10K, and Half Marathon categories. Registration open now. Route covers the scenic parts of the city including Aji Dam road.",
      category: "SPORTS",
      subcategory: "Running",
      tags: ["marathon", "running", "fitness"],
      eventDate: new Date("2025-02-23T06:00:00Z"),
      eventVenue: "Race Course Ground",
      authorId: user2._id,
      address: "Race Course Ground, Rajkot",
    },
    {
      title: "The Changing Skyline of Rajkot",
      content: "From new malls to high-rise buildings, Rajkot is transforming rapidly. A look at how the city has changed in the last 5 years and what's coming next.",
      category: "DAYRO",
      tags: ["development", "skyline", "growth"],
      authorId: user3._id,
    },
    {
      title: "Weekend Getaways from Rajkot",
      content: "Top 5 weekend getaway destinations within 200km of Rajkot. From the beaches of Dwarka to the forests of Gir, perfect for a quick escape!",
      category: "OTHER",
      tags: ["travel", "weekendgetaway", "nearrajkot"],
      authorId: user1._id,
    },
  ];

  const posts = await Post.insertMany(postsData);
  console.log(`📝 Created ${posts.length} posts`);

  // Add likes
  await Promise.all([
    Like.create({ userId: user1._id, postId: posts[1]._id }),
    Like.create({ userId: user2._id, postId: posts[0]._id }),
    Like.create({ userId: user3._id, postId: posts[0]._id }),
    Like.create({ userId: user1._id, postId: posts[2]._id }),
    Like.create({ userId: user3._id, postId: posts[3]._id }),
  ]);
  console.log("❤️  Created 5 likes");

  // Add comments
  const comment1 = await Comment.create({
    content: "Can't wait for Navratri! Best time of the year in Rajkot!",
    authorId: user2._id,
    postId: posts[0]._id,
  });

  await Comment.create({
    content: "Same here! Already bought my outfit!",
    authorId: user3._id,
    postId: posts[0]._id,
    parentId: comment1._id,
  });

  await Comment.create({
    content: "That dabeli stall is my favorite too! The special masala is amazing.",
    authorId: user1._id,
    postId: posts[1]._id,
  });

  await Comment.create({
    content: "Great list! I would add the pani puri stall near Jubilee Garden too.",
    authorId: user3._id,
    postId: posts[1]._id,
  });

  console.log("💬 Created 4 comments");

  // Add saved posts
  await Promise.all([
    SavedPost.create({ userId: user1._id, postId: posts[0]._id }),
    SavedPost.create({ userId: user2._id, postId: posts[2]._id }),
  ]);
  console.log("🔖 Created 2 saved posts");

  // Add reports
  await Promise.all([
    Report.create({ userId: user2._id, postId: posts[8]._id, reason: "Misleading event date" }),
    Report.create({ userId: user1._id, postId: posts[8]._id, reason: "Spam content" }),
    Report.create({ userId: user3._id, postId: posts[8]._id, reason: "Duplicate post" }),
    Report.create({ userId: user2._id, postId: posts[9]._id, reason: "Inappropriate images" }),
  ]);
  console.log("🚩 Created 4 reports");

  console.log("\n✅ Seed completed successfully!");
  console.log(`   Created: 1 admin, 3 users, ${posts.length} posts, 5 likes, 4 comments, 2 saved, 4 reports`);

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
