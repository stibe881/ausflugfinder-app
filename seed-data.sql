-- Testdaten für AusflugFinder App
-- Schweizer Ausflugsziele

-- Benutzer 1 (für Trips)
INSERT INTO users (openId, name, email, createdAt, updatedAt) VALUES
('test-user-1', 'Max Muster', 'max@example.com', NOW(), NOW());

SET @userId = LAST_INSERT_ID();

-- Destinations
INSERT INTO destinations (name, region, category, description, createdAt, updatedAt) VALUES
('Rheinfall', 'Schaffhausen', 'Natur', 'Der größte Wasserfall Europas', NOW(), NOW()),
('Matterhorn', 'Wallis', 'Berge', 'Einer der bekanntesten Berge der Alpen', NOW(), NOW()),
('Zürichsee', 'Zürich', 'Seen', 'Malerischer See im Herzen der Schweiz', NOW(), NOW()),
('Jungfraujoch', 'Bern', 'Berge', 'Top of Europe - Höchstgelegener Bahnhof Europas', NOW(), NOW()),
('Luzern Altstadt', 'Luzern', 'Kultur', 'Historische Altstadt mit Kapellbrücke', NOW(), NOW()),
('Aletschgletscher', 'Wallis', 'Natur', 'Größter Gletscher der Alpen', NOW(), NOW()),
('Berner Oberland', 'Bern', 'Berge', 'Atemberaubende Berglandschaft', NOW(), NOW()),
('Genfer See', 'Genf', 'Seen', 'Größter See der Schweiz', NOW(), NOW()),
('Pilatus', 'Luzern', 'Berge', 'Hausberg von Luzern mit Panoramaaussicht', NOW(), NOW()),
('Verzasca Tal', 'Tessin', 'Natur', 'Kristallklares Wasser und grüne Täler', NOW(), NOW());

-- Trips
INSERT INTO trips (userId, title, description, destination, cost, region, address, websiteUrl, latitude, longitude, isPublic, ageRecommendation, niceToKnow, createdAt, updatedAt) VALUES
(@userId, 'Rheinfall Abenteuer', 'Besuche den größten Wasserfall Europas mit spektakulären Aussichtsplattformen', 'Rheinfall Schaffhausen', 'low', 'Schaffhausen', 'Rheinfallquai, 8212 Neuhausen am Rheinfall', 'https://www.rheinfall.ch', '47.6774', '8.6151', 1, 'Für alle Altersgruppen', 'Bootsfahrten zum Felsen möglich', NOW(), NOW()),

(@userId, 'Matterhorn Wanderung', 'Unvergessliche Wanderung mit Blick auf das ikonische Matterhorn', 'Zermatt', 'high', 'Wallis', 'Bahnhofplatz 5, 3920 Zermatt', 'https://www.zermatt.ch', '45.9763', '7.6584', 1, 'Ab 12 Jahren', 'Gute Kondition erforderlich', NOW(), NOW()),

(@userId, 'Zürichsee Schifffahrt', 'Entspannte Bootsfahrt auf dem malerischen Zürichsee', 'Zürich', 'medium', 'Zürich', 'Bürkliplatz, 8001 Zürich', 'https://www.zsg.ch', '47.3667', '8.5408', 1, 'Für alle Altersgruppen', 'Verschiedene Routen verfügbar', NOW(), NOW()),

(@userId, 'Jungfraujoch Ausflug', 'Fahrt zum Top of Europe - höchstgelegener Bahnhof Europas', 'Jungfraujoch', 'very_high', 'Bern', 'Harderstrasse 14, 3800 Interlaken', 'https://www.jungfrau.ch', '46.5369', '7.9625', 1, 'Für alle Altersgruppen', 'Warme Kleidung mitbringen', NOW(), NOW()),

(@userId, 'Luzern Stadtbummel', 'Entdecke die historische Altstadt mit der berühmten Kapellbrücke', 'Luzern', 'free', 'Luzern', 'Kapellplatz, 6004 Luzern', 'https://www.luzern.com', '47.0502', '8.3093', 1, 'Für alle Altersgruppen', 'Viele Restaurants und Cafés', NOW(), NOW()),

(@userId, 'Aletschgletscher Wanderung', 'Wanderung zum größten Gletscher der Alpen', 'Aletsch Arena', 'medium', 'Wallis', 'Furkastrasse, 3984 Fiesch', 'https://www.aletscharena.ch', '46.4028', '8.1542', 1, 'Ab 10 Jahren', 'UNESCO Welterbe', NOW(), NOW()),

(@userId, 'Berner Oberland Tour', 'Mehrtägige Tour durch die atemberaubende Berglandschaft', 'Grindelwald', 'high', 'Bern', 'Dorfstrasse 110, 3818 Grindelwald', 'https://www.grindelwald.ch', '46.6242', '8.0412', 1, 'Ab 14 Jahren', 'Übernachtung empfohlen', NOW(), NOW()),

(@userId, 'Genfer See Radtour', 'Radtour entlang des größten Sees der Schweiz', 'Genf', 'low', 'Genf', 'Quai du Mont-Blanc, 1201 Genève', 'https://www.geneve.com', '46.2044', '6.1432', 1, 'Ab 8 Jahren', 'Fahrradverleih verfügbar', NOW(), NOW()),

(@userId, 'Pilatus Panorama', 'Seilbahnfahrt auf den Pilatus mit 360° Panoramaaussicht', 'Pilatus', 'medium', 'Luzern', 'Schlossweg 1, 6010 Kriens', 'https://www.pilatus.ch', '46.9789', '8.2525', 1, 'Für alle Altersgruppen', 'Weltrekord-Zahnradbahn', NOW(), NOW()),

(@userId, 'Verzasca Tal Wanderung', 'Wanderung durch das malerische Tal mit kristallklarem Wasser', 'Lavertezzo', 'free', 'Tessin', '6633 Lavertezzo', 'https://www.ticino.ch', '46.2597', '8.8372', 1, 'Ab 6 Jahren', 'Badestellen vorhanden', NOW(), NOW()),

(@userId, 'Schloss Chillon', 'Besichtigung der mittelalterlichen Wasserburg am Genfer See', 'Montreux', 'low', 'Waadt', 'Avenue de Chillon 21, 1820 Veytaux', 'https://www.chillon.ch', '46.4143', '6.9275', 1, 'Für alle Altersgruppen', 'Audioguide verfügbar', NOW(), NOW()),

(@userId, 'Creux du Van', 'Spektakulärer Felskessel im Neuenburger Jura', 'Neuchâtel', 'free', 'Neuenburg', '2149 Champ-du-Moulin', 'https://www.j3l.ch', '46.9294', '6.7128', 1, 'Ab 10 Jahren', 'Wanderschuhe empfohlen', NOW(), NOW()),

(@userId, 'Titlis Gletscherpark', 'Gletschererlebnis mit Hängebrücke und Eisgrotte', 'Engelberg', 'high', 'Obwalden', 'Gerschnialp, 6390 Engelberg', 'https://www.titlis.ch', '46.7714', '8.4354', 1, 'Für alle Altersgruppen', 'Revolving Cable Car', NOW(), NOW()),

(@userId, 'Blausee Naturpark', 'Idyllischer blauer Bergsee im Kandertal', 'Kandersteg', 'low', 'Bern', 'Blausee 222, 3717 Blausee', 'https://www.blausee.ch', '46.5292', '7.6744', 1, 'Für alle Altersgruppen', 'Restaurant vorhanden', NOW(), NOW()),

(@userId, 'Appenzell Dorf', 'Traditionelles Schweizer Dorf mit bunten Häusern', 'Appenzell', 'free', 'Appenzell', 'Hauptgasse, 9050 Appenzell', 'https://www.appenzell.ch', '47.3306', '9.4092', 1, 'Für alle Altersgruppen', 'Käserei-Besichtigung möglich', NOW(), NOW());

-- Photos für einige Trips
SET @trip1 = (SELECT id FROM trips WHERE title = 'Rheinfall Abenteuer' LIMIT 1);
SET @trip2 = (SELECT id FROM trips WHERE title = 'Matterhorn Wanderung' LIMIT 1);
SET @trip3 = (SELECT id FROM trips WHERE title = 'Zürichsee Schifffahrt' LIMIT 1);

INSERT INTO photos (tripId, url, caption, createdAt, updatedAt) VALUES
(@trip1, 'https://images.unsplash.com/photo-1527004013197-933c4bb611b3?w=800', 'Rheinfall von oben', NOW(), NOW()),
(@trip1, 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800', 'Aussichtsplattform', NOW(), NOW()),
(@trip2, 'https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=800', 'Matterhorn Panorama', NOW(), NOW()),
(@trip2, 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800', 'Wanderweg', NOW(), NOW()),
(@trip3, 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800', 'Zürichsee Ufer', NOW(), NOW());

-- Videos
INSERT INTO videos (tripId, url, title, createdAt, updatedAt) VALUES
(@trip1, 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'Rheinfall Drohnenaufnahme', NOW(), NOW()),
(@trip2, 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'Matterhorn Zeitraffer', NOW(), NOW());

SELECT 'Testdaten erfolgreich importiert!' as Status;
SELECT COUNT(*) as 'Anzahl Trips' FROM trips;
SELECT COUNT(*) as 'Anzahl Destinations' FROM destinations;
