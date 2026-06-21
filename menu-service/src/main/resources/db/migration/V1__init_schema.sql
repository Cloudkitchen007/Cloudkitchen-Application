-- ============================================================
-- Cloud Kitchen Database Schema
-- Owned by menu-service (runs Flyway – creates all tables)
-- order-service connects to the same DB with Flyway disabled
-- ============================================================

CREATE TABLE IF NOT EXISTS categories (
    id          BIGSERIAL PRIMARY KEY,
    name        VARCHAR(100) NOT NULL UNIQUE,
    description VARCHAR(255),
    icon        VARCHAR(100),
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS menu_items (
    id           BIGSERIAL PRIMARY KEY,
    name         VARCHAR(150) NOT NULL,
    description  VARCHAR(500),
    price        NUMERIC(10,2) NOT NULL,
    category_id  BIGINT REFERENCES categories(id),
    image_url    VARCHAR(500),
    is_available BOOLEAN DEFAULT TRUE,
    is_veg       BOOLEAN DEFAULT FALSE,
    prep_time    INT DEFAULT 20,
    rating       NUMERIC(2,1) DEFAULT 4.0,
    created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS orders (
    id              BIGSERIAL PRIMARY KEY,
    customer_name   VARCHAR(150) NOT NULL,
    customer_email  VARCHAR(150) NOT NULL,
    customer_phone  VARCHAR(20)  NOT NULL,
    delivery_address TEXT        NOT NULL,
    status          VARCHAR(50)  DEFAULT 'PLACED',
    total_amount    NUMERIC(10,2) NOT NULL,
    payment_method  VARCHAR(50)   DEFAULT 'CASH_ON_DELIVERY',
    special_notes   TEXT,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS order_items (
    id           BIGSERIAL PRIMARY KEY,
    order_id     BIGINT REFERENCES orders(id) ON DELETE CASCADE,
    menu_item_id BIGINT REFERENCES menu_items(id),
    quantity     INT            NOT NULL,
    unit_price   NUMERIC(10,2) NOT NULL,
    subtotal     NUMERIC(10,2) NOT NULL
);

-- ============================================================
-- SEED DATA
-- ============================================================

INSERT INTO categories (name, description, icon) VALUES
('Starters',       'Crispy and delicious appetizers',  '🥗'),
('Main Course',    'Hearty and filling main dishes',   '🍛'),
('Breads',         'Fresh baked Indian breads',        '🫓'),
('Rice & Biryani', 'Aromatic rice dishes',             '🍚'),
('Desserts',       'Sweet endings to your meal',       '🍮'),
('Beverages',      'Refreshing drinks and lassi',      '🥤');

INSERT INTO menu_items (name, description, price, category_id, image_url, is_veg, prep_time, rating) VALUES
('Paneer Tikka',        'Marinated cottage cheese grilled to perfection',    '249.00', 1, 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=400', true,  15, 4.5),
('Chicken 65',          'Spicy deep-fried chicken with curry leaves',         '299.00', 1, 'https://images.unsplash.com/photo-1610057099443-fde8c4d50f91?w=400', false, 20, 4.7),
('Veg Spring Rolls',    'Crispy rolls filled with fresh vegetables',          '179.00', 1, 'https://images.unsplash.com/photo-1548802673-380ab8ebc7b7?w=400', true,  10, 4.2),
('Seekh Kebab',         'Minced lamb skewers with aromatic spices',           '349.00', 1, 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=400', false, 25, 4.6),
('Butter Chicken',      'Creamy tomato-based chicken curry',                  '399.00', 2, 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=400', false, 25, 4.8),
('Paneer Butter Masala','Rich and creamy paneer in tomato gravy',             '349.00', 2, 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=400', true,  20, 4.6),
('Dal Makhani',         'Slow-cooked black lentils in butter and cream',      '279.00', 2, 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400', true,  30, 4.7),
('Mutton Rogan Josh',   'Slow-cooked mutton with Kashmiri spices',            '499.00', 2, 'https://images.unsplash.com/photo-1574653853027-5382a3d23a15?w=400', false, 40, 4.9),
('Palak Paneer',        'Cottage cheese in smooth spinach gravy',             '319.00', 2, 'https://images.unsplash.com/photo-1604152135912-04a022e23696?w=400', true,  20, 4.5),
('Butter Naan',         'Soft leavened bread with butter',                    '59.00',  3, 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400', true,  10, 4.4),
('Garlic Naan',         'Naan topped with garlic and herbs',                  '79.00',  3, 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400', true,  10, 4.6),
('Tandoori Roti',       'Whole wheat bread baked in tandoor',                 '39.00',  3, 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400', true,  8,  4.3),
('Chicken Biryani',     'Fragrant basmati rice with tender chicken',          '449.00', 4, 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=400', false, 35, 4.9),
('Veg Biryani',         'Aromatic rice with fresh mixed vegetables',          '349.00', 4, 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=400', true,  30, 4.5),
('Mutton Biryani',      'Royal biryani with slow-cooked mutton',              '549.00', 4, 'https://images.unsplash.com/photo-1631515243349-e0cb75fb8d3a?w=400', false, 45, 4.8),
('Jeera Rice',          'Steamed basmati rice with cumin',                    '199.00', 4, 'https://images.unsplash.com/photo-1596797038530-2c107229654b?w=400', true,  15, 4.3),
('Gulab Jamun',         'Soft milk dumplings in rose-flavored syrup',         '149.00', 5, 'https://images.unsplash.com/photo-1601303516534-bf5859d5f4e9?w=400', true,  5,  4.7),
('Rasmalai',            'Soft cheese patties in sweetened milk',              '179.00', 5, 'https://images.unsplash.com/photo-1618449840665-9ed506d73a34?w=400', true,  5,  4.8),
('Kulfi',               'Traditional Indian ice cream with pistachios',       '129.00', 5, 'https://images.unsplash.com/photo-1587132137056-bfbf0166836e?w=400', true,  5,  4.6),
('Mango Lassi',         'Thick yogurt drink blended with sweet mango',        '129.00', 6, 'https://images.unsplash.com/photo-1527661591475-527312dd65f5?w=400', true,  5,  4.7),
('Masala Chai',         'Spiced Indian tea with milk',                        '59.00',  6, 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400', true,  5,  4.5),
('Fresh Lime Soda',     'Refreshing lime soda with mint',                     '79.00',  6, 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=400', true,  5,  4.4);
