import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "./drizzle/schema";

const DATABASE_URL = process.env.DATABASE_URL!;

async function main() {
  const connection = await mysql.createConnection(DATABASE_URL);
  const db = drizzle(connection, { schema, mode: "default" });

  console.log("Importing seed data...");

  // Insert user
  const [userResult] = await connection.execute(
    "INSERT INTO users (openId, name, email, createdAt, updatedAt) VALUES (?, ?, ?, NOW(), NOW())",
    ["test-user-1", "Max Muster", "max@example.com"]
  );
  const userId = (userResult as any).insertId;
  console.log(`User created with ID: ${userId}`);

  // Insert destinations
  const destinations = [
    ["Rheinfall", "Schaffhausen", "Natur", "Der größte Wasserfall Europas"],
    ["Matterhorn", "Wallis", "Berge", "Einer der bekanntesten Berge der Alpen"],
    ["Zürichsee", "Zürich", "Seen", "Malerischer See im Herzen der Schweiz"],
  ];

  for (const [name, region, category, description] of destinations) {
    await connection.execute(
      "INSERT INTO destinations (name, region, category, description, createdAt, updatedAt) VALUES (?, ?, ?, ?, NOW(), NOW())",
      [name, region, category, description]
    );
  }
  console.log(`${destinations.length} destinations created`);

  // Insert trips
  const trips = [
    {
      title: "Rheinfall Abenteuer",
      description: "Besuche den größten Wasserfall Europas",
      destination: "Rheinfall Schaffhausen",
      cost: "low",
      region: "Schaffhausen",
      address: "Rheinfallquai, 8212 Neuhausen",
      websiteUrl: "https://www.rheinfall.ch",
      latitude: "47.6774",
      longitude: "8.6151",
      ageRecommendation: "Für alle Altersgruppen",
      niceToKnow: "Bootsfahrten zum Felsen möglich",
    },
    {
      title: "Matterhorn Wanderung",
      description: "Unvergessliche Wanderung mit Blick auf das Matterhorn",
      destination: "Zermatt",
      cost: "high",
      region: "Wallis",
      address: "Bahnhofplatz 5, 3920 Zermatt",
      websiteUrl: "https://www.zermatt.ch",
      latitude: "45.9763",
      longitude: "7.6584",
      ageRecommendation: "Ab 12 Jahren",
      niceToKnow: "Gute Kondition erforderlich",
    },
    {
      title: "Zürichsee Schifffahrt",
      description: "Entspannte Bootsfahrt auf dem Zürichsee",
      destination: "Zürich",
      cost: "medium",
      region: "Zürich",
      address: "Bürkliplatz, 8001 Zürich",
      websiteUrl: "https://www.zsg.ch",
      latitude: "47.3667",
      longitude: "8.5408",
      ageRecommendation: "Für alle Altersgruppen",
      niceToKnow: "Verschiedene Routen verfügbar",
    },
    {
      title: "Jungfraujoch Ausflug",
      description: "Fahrt zum Top of Europe",
      destination: "Jungfraujoch",
      cost: "very_high",
      region: "Bern",
      address: "Harderstrasse 14, 3800 Interlaken",
      websiteUrl: "https://www.jungfrau.ch",
      latitude: "46.5369",
      longitude: "7.9625",
      ageRecommendation: "Für alle Altersgruppen",
      niceToKnow: "Warme Kleidung mitbringen",
    },
    {
      title: "Luzern Stadtbummel",
      description: "Entdecke die historische Altstadt",
      destination: "Luzern",
      cost: "free",
      region: "Luzern",
      address: "Kapellplatz, 6004 Luzern",
      websiteUrl: "https://www.luzern.com",
      latitude: "47.0502",
      longitude: "8.3093",
      ageRecommendation: "Für alle Altersgruppen",
      niceToKnow: "Viele Restaurants und Cafés",
    },
  ];

  for (const trip of trips) {
    await connection.execute(
      `INSERT INTO trips (userId, title, description, destination, cost, region, address, websiteUrl, latitude, longitude, isPublic, ageRecommendation, niceToKnow, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, NOW(), NOW())`,
      [
        userId,
        trip.title,
        trip.description,
        trip.destination,
        trip.cost,
        trip.region,
        trip.address,
        trip.websiteUrl,
        trip.latitude,
        trip.longitude,
        trip.ageRecommendation,
        trip.niceToKnow,
      ]
    );
  }
  console.log(`${trips.length} trips created`);

  await connection.end();
  console.log("Seed data imported successfully!");
}

main().catch(console.error);
