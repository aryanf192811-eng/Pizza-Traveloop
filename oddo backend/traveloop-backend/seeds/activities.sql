-- Paris
INSERT INTO activities (city_id, name, category, estimated_cost, duration_hrs, popularity) VALUES
((SELECT id FROM cities WHERE name='Paris'), 'Eiffel Tower Visit', 'Sightseeing', 2000, 3, 98),
((SELECT id FROM cities WHERE name='Paris'), 'Louvre Museum Tour', 'Culture', 2500, 4, 95),
((SELECT id FROM cities WHERE name='Paris'), 'Seine River Cruise', 'Sightseeing', 3000, 2, 88),
((SELECT id FROM cities WHERE name='Paris'), 'French Pastry Tour', 'Food', 1500, 2, 82);

-- Tokyo
INSERT INTO activities (city_id, name, category, estimated_cost, duration_hrs, popularity) VALUES
((SELECT id FROM cities WHERE name='Tokyo'), 'Shibuya Crossing Walk', 'Sightseeing', 0, 1, 97),
((SELECT id FROM cities WHERE name='Tokyo'), 'Tsukiji Fish Market Visit', 'Food', 2000, 2, 90),
((SELECT id FROM cities WHERE name='Tokyo'), 'Akihabara Electronics Tour', 'Shopping', 500, 3, 85),
((SELECT id FROM cities WHERE name='Tokyo'), 'Mount Fuji Day Trip', 'Adventure', 5000, 8, 96);

-- Bali
INSERT INTO activities (city_id, name, category, estimated_cost, duration_hrs, popularity) VALUES
((SELECT id FROM cities WHERE name='Bali'), 'Ubud Monkey Forest', 'Sightseeing', 800, 2, 88),
((SELECT id FROM cities WHERE name='Bali'), 'Seminyak Beach Day', 'Adventure', 0, 5, 85),
((SELECT id FROM cities WHERE name='Bali'), 'Balinese Cooking Class', 'Food', 3500, 4, 82),
((SELECT id FROM cities WHERE name='Bali'), 'Tanah Lot Temple Sunset', 'Culture', 600, 3, 91);

-- Goa
INSERT INTO activities (city_id, name, category, estimated_cost, duration_hrs, popularity) VALUES
((SELECT id FROM cities WHERE name='Goa'), 'Dudhsagar Falls Trek', 'Adventure', 2000, 6, 90),
((SELECT id FROM cities WHERE name='Goa'), 'Spice Plantation Tour', 'Culture', 1500, 3, 78),
((SELECT id FROM cities WHERE name='Goa'), 'Baga Beach Water Sports', 'Adventure', 3000, 4, 86),
((SELECT id FROM cities WHERE name='Goa'), 'Old Goa Churches Walk', 'Culture', 0, 2, 75);

-- Bangkok
INSERT INTO activities (city_id, name, category, estimated_cost, duration_hrs, popularity) VALUES
((SELECT id FROM cities WHERE name='Bangkok'), 'Grand Palace Visit', 'Culture', 1200, 3, 95),
((SELECT id FROM cities WHERE name='Bangkok'), 'Floating Market Tour', 'Food', 2000, 4, 88),
((SELECT id FROM cities WHERE name='Bangkok'), 'Chatuchak Weekend Market', 'Shopping', 500, 4, 82);

-- Dubai
INSERT INTO activities (city_id, name, category, estimated_cost, duration_hrs, popularity) VALUES
((SELECT id FROM cities WHERE name='Dubai'), 'Burj Khalifa Observation Deck', 'Sightseeing', 4000, 2, 96),
((SELECT id FROM cities WHERE name='Dubai'), 'Desert Safari with BBQ', 'Adventure', 6000, 6, 92),
((SELECT id FROM cities WHERE name='Dubai'), 'Dubai Mall Shopping', 'Shopping', 1000, 4, 85);

-- London
INSERT INTO activities (city_id, name, category, estimated_cost, duration_hrs, popularity) VALUES
((SELECT id FROM cities WHERE name='London'), 'British Museum Visit', 'Culture', 0, 4, 92),
((SELECT id FROM cities WHERE name='London'), 'Tower of London Tour', 'Culture', 2500, 3, 88),
((SELECT id FROM cities WHERE name='London'), 'Thames River Cruise', 'Sightseeing', 1500, 2, 82);

-- Rome
INSERT INTO activities (city_id, name, category, estimated_cost, duration_hrs, popularity) VALUES
((SELECT id FROM cities WHERE name='Rome'), 'Colosseum & Forum Tour', 'Culture', 2200, 4, 96),
((SELECT id FROM cities WHERE name='Rome'), 'Vatican Museums Visit', 'Culture', 2500, 4, 94),
((SELECT id FROM cities WHERE name='Rome'), 'Trastevere Food Walk', 'Food', 2000, 3, 86);

-- Jaipur
INSERT INTO activities (city_id, name, category, estimated_cost, duration_hrs, popularity) VALUES
((SELECT id FROM cities WHERE name='Jaipur'), 'Amber Fort Tour', 'Culture', 800, 3, 92),
((SELECT id FROM cities WHERE name='Jaipur'), 'Hawa Mahal & City Palace', 'Sightseeing', 600, 3, 88),
((SELECT id FROM cities WHERE name='Jaipur'), 'Johari Bazaar Gem Shopping', 'Shopping', 500, 2, 78);

-- Singapore
INSERT INTO activities (city_id, name, category, estimated_cost, duration_hrs, popularity) VALUES
((SELECT id FROM cities WHERE name='Singapore'), 'Gardens by the Bay', 'Sightseeing', 1500, 3, 93),
((SELECT id FROM cities WHERE name='Singapore'), 'Sentosa Island Day', 'Adventure', 3000, 5, 88),
((SELECT id FROM cities WHERE name='Singapore'), 'Hawker Centre Food Tour', 'Food', 800, 2, 90);

-- Barcelona
INSERT INTO activities (city_id, name, category, estimated_cost, duration_hrs, popularity) VALUES
((SELECT id FROM cities WHERE name='Barcelona'), 'Sagrada Familia Visit', 'Culture', 2000, 2, 96),
((SELECT id FROM cities WHERE name='Barcelona'), 'Gothic Quarter Walk', 'Sightseeing', 0, 3, 87),
((SELECT id FROM cities WHERE name='Barcelona'), 'La Boqueria Market', 'Food', 1000, 2, 85);

-- Santorini
INSERT INTO activities (city_id, name, category, estimated_cost, duration_hrs, popularity) VALUES
((SELECT id FROM cities WHERE name='Santorini'), 'Oia Sunset Walk', 'Sightseeing', 0, 2, 97),
((SELECT id FROM cities WHERE name='Santorini'), 'Volcano Boat Tour', 'Adventure', 4000, 4, 90),
((SELECT id FROM cities WHERE name='Santorini'), 'Wine Tasting Tour', 'Food', 3500, 3, 85);

-- Kyoto
INSERT INTO activities (city_id, name, category, estimated_cost, duration_hrs, popularity) VALUES
((SELECT id FROM cities WHERE name='Kyoto'), 'Fushimi Inari Shrine Hike', 'Adventure', 0, 3, 95),
((SELECT id FROM cities WHERE name='Kyoto'), 'Geisha District Walk', 'Culture', 0, 2, 90),
((SELECT id FROM cities WHERE name='Kyoto'), 'Tea Ceremony Experience', 'Culture', 2000, 2, 87);

-- Phuket
INSERT INTO activities (city_id, name, category, estimated_cost, duration_hrs, popularity) VALUES
((SELECT id FROM cities WHERE name='Phuket'), 'Phi Phi Islands Boat Tour', 'Adventure', 3500, 7, 94),
((SELECT id FROM cities WHERE name='Phuket'), 'Thai Cooking Class', 'Food', 2500, 4, 85),
((SELECT id FROM cities WHERE name='Phuket'), 'Big Buddha Visit', 'Culture', 0, 2, 80);

-- Delhi
INSERT INTO activities (city_id, name, category, estimated_cost, duration_hrs, popularity) VALUES
((SELECT id FROM cities WHERE name='Delhi'), 'Red Fort & Old Delhi Walk', 'Culture', 600, 4, 88),
((SELECT id FROM cities WHERE name='Delhi'), 'Qutub Minar Visit', 'Culture', 400, 2, 84),
((SELECT id FROM cities WHERE name='Delhi'), 'Chandni Chowk Street Food', 'Food', 800, 2, 90);

-- Mumbai
INSERT INTO activities (city_id, name, category, estimated_cost, duration_hrs, popularity) VALUES
((SELECT id FROM cities WHERE name='Mumbai'), 'Gateway of India & Elephanta', 'Culture', 500, 5, 88),
((SELECT id FROM cities WHERE name='Mumbai'), 'Dharavi Slum Tour', 'Culture', 1200, 3, 78),
((SELECT id FROM cities WHERE name='Mumbai'), 'Marine Drive Sunset Walk', 'Sightseeing', 0, 2, 85);
