-- Attrangii: inventory seed (55 products in total across the statements below). Run in the Supabase SQL Editor (runs as admin, so it bypasses RLS).
-- Stores resale price (selling_price) and pieces (stock_level) only; buying_price stays 0 (wholesale not kept).
-- Run storefront.sql FIRST (it adds products.images). Safe to re-run: existing SKUs keep their stock/price; only missing images are filled.
-- Images live in the Supabase 'product-images' bucket (public). A NULL image_url shows the placeholder.
insert into public.products (name, sku, category, selling_price, stock_level, low_stock_threshold, image_url, images)
select v.name, v.sku, v.category, v.price, v.pieces, 2, v.img, v.imgs
from (values
  ('F1 Blocks', 'F1-BLOCKS', 'Building Blocks', 1600, 3, null, '{}'::text[]),
  ('Blokees', 'BLOKEES', 'Building Blocks', 350, 19, 'https://fugbfrbychvdynnqbcji.supabase.co/storage/v1/object/public/product-images/blokees-01.jpg', array['https://fugbfrbychvdynnqbcji.supabase.co/storage/v1/object/public/product-images/blokees-01.jpg', 'https://fugbfrbychvdynnqbcji.supabase.co/storage/v1/object/public/product-images/blokees-02.jpg', 'https://fugbfrbychvdynnqbcji.supabase.co/storage/v1/object/public/product-images/blokees-03.jpg', 'https://fugbfrbychvdynnqbcji.supabase.co/storage/v1/object/public/product-images/blokees-04.jpg']),
  ('F1 Lego Cars', 'F1-LEGO-CARS', 'Building Blocks', 1600, 2, null, '{}'::text[]),
  ('Bubbles', 'BUBBLES', 'Toys & Novelty', 250, 6, 'https://fugbfrbychvdynnqbcji.supabase.co/storage/v1/object/public/product-images/bubbles-01.jpg', array['https://fugbfrbychvdynnqbcji.supabase.co/storage/v1/object/public/product-images/bubbles-01.jpg', 'https://fugbfrbychvdynnqbcji.supabase.co/storage/v1/object/public/product-images/bubbles-02.jpg', 'https://fugbfrbychvdynnqbcji.supabase.co/storage/v1/object/public/product-images/bubbles-03.jpg']),
  ('Ironman Mystery Box', 'IRONMAN-MYSTERY-BOX', 'Toys & Novelty', 450, 9, null, '{}'::text[]),
  ('Marvel Infinity', 'MARVEL-INFINITY', 'Action Figures & Statues', 450, 9, 'https://fugbfrbychvdynnqbcji.supabase.co/storage/v1/object/public/product-images/marvel-infinity-01.jpg', array['https://fugbfrbychvdynnqbcji.supabase.co/storage/v1/object/public/product-images/marvel-infinity-01.jpg', 'https://fugbfrbychvdynnqbcji.supabase.co/storage/v1/object/public/product-images/marvel-infinity-02.jpg', 'https://fugbfrbychvdynnqbcji.supabase.co/storage/v1/object/public/product-images/marvel-infinity-03.jpg', 'https://fugbfrbychvdynnqbcji.supabase.co/storage/v1/object/public/product-images/marvel-infinity-04.jpg']),
  ('Predator', 'PREDATOR', 'Action Figures & Statues', 3000, 2, null, '{}'::text[]),
  ('Terminator', 'TERMINATOR', 'Action Figures & Statues', 2500, 2, null, '{}'::text[]),
  ('Buzz - Toy Story', 'BUZZ-TOY-STORY', 'Action Figures & Statues', 1000, 1, null, '{}'::text[]),
  ('Mes Toys Spiderman with Tentacles', 'MES-SPIDERMAN-TENTACLES', 'Action Figures & Statues', 4000, 1, null, '{}'::text[]),
  ('ZD Toys Deadpool', 'ZD-DEADPOOL', 'Action Figures & Statues', 3700, 1, null, '{}'::text[]),
  ('ZD Toys Wolverine', 'ZD-WOLVERINE', 'Action Figures & Statues', 3700, 1, null, '{}'::text[]),
  ('ZD Toys Mark 85 Iron Man', 'ZD-MARK85-IRONMAN', 'Action Figures & Statues', 4000, 1, null, '{}'::text[]),
  ('Spiderman on Stone', 'SPIDERMAN-ON-STONE', 'Action Figures & Statues', 1800, 1, null, '{}'::text[]),
  ('Spiderman Mask (Jaw Movement)', 'SPIDERMAN-MASK-JAW', 'Action Figures & Statues', 1000, 1, null, '{}'::text[]),
  ('Mario', 'MARIO', 'Gaming Collectibles', 1000, 2, null, '{}'::text[]),
  ('Valorant Jet', 'VALORANT-JET', 'Gaming Collectibles', 1200, 1, null, '{}'::text[]),
  ('Genshin Impact', 'GENSHIN-IMPACT', 'Gaming Collectibles', 1000, 2, null, '{}'::text[]),
  ('GTA', 'GTA', 'Gaming Collectibles', 1000, 1, null, '{}'::text[]),
  ('Halo', 'HALO', 'Gaming Collectibles', 3000, 1, null, '{}'::text[]),
  ('God of War: Ghost of Sparta', 'GOW-GHOST-OF-SPARTA', 'Gaming Collectibles', 3500, 1, null, '{}'::text[]),
  ('God of War Statue', 'GOW-STATUE', 'Gaming Collectibles', 2000, 1, null, '{}'::text[])
) as v(name, sku, category, price, pieces, img, imgs)
on conflict (sku) do update set
  image_url = case when products.image_url is null or products.image_url like '/products/%' then excluded.image_url else products.image_url end,  -- also repairs the old relative /products/ paths
  images = case when coalesce(array_length(products.images, 1), 0) = 0 then excluded.images else products.images end;  -- fills missing images only; never resets stock/price

-- Individual designs (Bricks 15, Naruto 4, Demon Slayer 8). One product per design; 'files' = bucket image names, main image first.
insert into public.products (name, sku, category, selling_price, stock_level, low_stock_threshold, image_url, images)
select v.name, v.sku, 'Building Blocks', v.price, v.pieces, 2,
       b.base || split_part(v.files, ',', 1) || '.jpg',
       array(select b.base || f || '.jpg' from unnest(string_to_array(v.files, ',')) with ordinality as t(f, n) order by n)
from (values
  ('Bricks F3022 Red Masked Hero', 'BRICKS-F3022-RED-MASKED-HERO', 300, 1, 'bricks-09,bricks-01,bricks-02,bricks-18'),
  ('Bricks F3023 Green Giant', 'BRICKS-F3023-GREEN-GIANT', 300, 1, 'bricks-08,bricks-03,bricks-04,bricks-05,bricks-21'),
  ('Bricks H-18 Blonde Girl', 'BRICKS-H-18-BLONDE-GIRL', 300, 1, 'bricks-10,bricks-06,bricks-07,bricks-19'),
  ('Bricks H-34 Orange Dragon', 'BRICKS-H-34-ORANGE-DRAGON', 300, 1, 'bricks-11,bricks-12,bricks-20'),
  ('Bricks C1044 Red Cap Plumber', 'BRICKS-C1044-RED-CAP-PLUMBER', 300, 1, 'bricks-14,bricks-13,bricks-15,bricks-16'),
  ('Bricks H-17 Spiky Hair Fighter', 'BRICKS-H-17-SPIKY-HAIR-FIGHTER', 300, 1, 'bricks-17'),
  ('Bricks X5005 Panda', 'BRICKS-X5005-PANDA', 300, 1, 'bricks-22'),
  ('Bricks C1017 Pink White Cat', 'BRICKS-C1017-PINK-WHITE-CAT', 300, 1, 'bricks-23'),
  ('Bricks H-23 Brown Creature', 'BRICKS-H-23-BROWN-CREATURE', 300, 1, 'bricks-24'),
  ('Bricks H-26 Purple Ghost', 'BRICKS-H-26-PURPLE-GHOST', 300, 1, 'bricks-25'),
  ('Bricks F3045 Black Hair Girl', 'BRICKS-F3045-BLACK-HAIR-GIRL', 300, 1, 'bricks-26'),
  ('Bricks F3048 White Hat Figure', 'BRICKS-F3048-WHITE-HAT-FIGURE', 300, 1, 'bricks-27'),
  ('Bricks H-02 Blonde Ninja', 'BRICKS-H-02-BLONDE-NINJA', 300, 1, 'bricks-28,bricks-29'),
  ('Bricks F3039 Gold Hair Figure', 'BRICKS-F3039-GOLD-HAIR-FIGURE', 300, 1, 'bricks-30'),
  ('Bricks K5027 Blue Alien', 'BRICKS-K5027-BLUE-ALIEN', 300, 1, 'bricks-31,bricks-32'),
  ('Naruto Shinobi #01 White Dragon', 'NARUTO-SHINOBI-01-WHITE-DRAGON', 500, 2, 'naruto-09,naruto-06'),
  ('Naruto Shinobi #02 Nine-Tails', 'NARUTO-SHINOBI-02-NINE-TAILS', 500, 2, 'naruto-10,naruto-04,naruto-05'),
  ('Naruto Shinobi #03 Susanoo', 'NARUTO-SHINOBI-03-SUSANOO', 500, 2, 'naruto-11,naruto-01,naruto-02,naruto-03'),
  ('Naruto Shinobi #04 Green Dragon', 'NARUTO-SHINOBI-04-GREEN-DRAGON', 500, 2, 'naruto-08,naruto-07'),
  ('Demon Slayer Box 6', 'DEMON-SLAYER-BOX-6', 400, 2, 'demon-slayer-01,demon-slayer-02'),
  ('Demon Slayer Zenitsu', 'DEMON-SLAYER-ZENITSU', 400, 2, 'demon-slayer-03,demon-slayer-04'),
  ('Demon Slayer Giyu', 'DEMON-SLAYER-GIYU', 400, 2, 'demon-slayer-06,demon-slayer-05'),
  ('Demon Slayer Shinobu', 'DEMON-SLAYER-SHINOBU', 400, 2, 'demon-slayer-08,demon-slayer-07'),
  ('Demon Slayer Tanjiro', 'DEMON-SLAYER-TANJIRO', 400, 2, 'demon-slayer-10,demon-slayer-09'),
  ('Demon Slayer Rengoku', 'DEMON-SLAYER-RENGOKU', 400, 2, 'demon-slayer-11,demon-slayer-12'),
  ('Demon Slayer Nezuko', 'DEMON-SLAYER-NEZUKO', 400, 2, 'demon-slayer-14,demon-slayer-13'),
  ('Demon Slayer Box 1', 'DEMON-SLAYER-BOX-1', 400, 2, 'demon-slayer-15,demon-slayer-16')
) as v(name, sku, price, pieces, files),
(select 'https://fugbfrbychvdynnqbcji.supabase.co/storage/v1/object/public/product-images/'::text as base) b
on conflict (sku) do nothing;

-- Retire the old combined products (only if never ordered; otherwise just zero their stock so they can't be bought).
delete from public.products p where p.sku in ('BRICKS','NARUTO','DEMON-SLAYER')
  and not exists (select 1 from public.invoice_items ii where ii.product_id = p.id);
update public.products set stock_level = 0 where sku in ('BRICKS','NARUTO','DEMON-SLAYER');

-- Pokeballs: one product per design (6). Reuses the existing POKEBALLS row (keeps order history intact) as the first design.
update public.products set name = 'Pokeball Squirtle', sku = 'POKEBALL-SQUIRTLE', selling_price = 1400, stock_level = 1,
  image_url = 'https://fugbfrbychvdynnqbcji.supabase.co/storage/v1/object/public/product-images/' || split_part('pokeballs-02,pokeballs-01', ',', 1) || '.jpg',
  images = array(select 'https://fugbfrbychvdynnqbcji.supabase.co/storage/v1/object/public/product-images/' || f || '.jpg' from unnest(string_to_array('pokeballs-02,pokeballs-01', ',')) with ordinality as t(f, n) order by n)
where sku = 'POKEBALLS';

insert into public.products (name, sku, category, selling_price, stock_level, low_stock_threshold, image_url, images)
select v.name, v.sku, 'Toys & Novelty', v.price, v.pieces, 2,
       b.base || split_part(v.files, ',', 1) || '.jpg',
       array(select b.base || f || '.jpg' from unnest(string_to_array(v.files, ',')) with ordinality as t(f, n) order by n)
from (values
  ('Pokeball Squirtle', 'POKEBALL-SQUIRTLE', 1400, 1, 'pokeballs-02,pokeballs-01'),
  ('Pokeball Meowth', 'POKEBALL-MEOWTH', 1400, 1, 'pokeballs-03'),
  ('Pokeball Pikachu', 'POKEBALL-PIKACHU', 1400, 1, 'pokeballs-04,pokeballs-05,pokeballs-06'),
  ('Pokeball Eevee', 'POKEBALL-EEVEE', 1400, 1, 'pokeballs-07'),
  ('Pokeball Bulbasaur', 'POKEBALL-BULBASAUR', 1400, 1, 'pokeballs-08'),
  ('Pokeball Charmander', 'POKEBALL-CHARMANDER', 1400, 1, 'pokeballs-09')
) as v(name, sku, price, pieces, files),
(select 'https://fugbfrbychvdynnqbcji.supabase.co/storage/v1/object/public/product-images/'::text as base) b
on conflict (sku) do nothing;

-- Hidden from the public store (kept in the CRM inventory). Requires the show_on_storefront column from storefront.sql.
update public.products set show_on_storefront = false where sku in (
  'BRICKS-F3022-RED-MASKED-HERO',
  'BRICKS-H-18-BLONDE-GIRL',
  'BUZZ-TOY-STORY',
  'MES-SPIDERMAN-TENTACLES',
  'ZD-DEADPOOL',
  'ZD-WOLVERINE',
  'ZD-MARK85-IRONMAN',
  'SPIDERMAN-ON-STONE',
  'SPIDERMAN-MASK-JAW',
  'MARIO',
  'VALORANT-JET',
  'GENSHIN-IMPACT',
  'GTA',
  'HALO',
  'GOW-GHOST-OF-SPARTA',
  'GOW-STATUE',
  'MARVEL-INFINITY',
  'F1-BLOCKS',
  'POKEBALL-SQUIRTLE',
  'TERMINATOR',
  'PREDATOR',
  'POKEBALL-MEOWTH'
);

-- Actual Pokeball stock: only Meowth is in stock; the other designs are sold out.
update public.products set stock_level = 0 where sku in ('POKEBALL-SQUIRTLE','POKEBALL-PIKACHU','POKEBALL-EEVEE','POKEBALL-BULBASAUR','POKEBALL-CHARMANDER');
