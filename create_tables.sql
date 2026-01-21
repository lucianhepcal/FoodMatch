-- Create recipes table in foodmatch database
CREATE TABLE recipes (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  time VARCHAR(50),
  difficulty VARCHAR(50),
  image VARCHAR(255),
  ingredients JSONB DEFAULT '[]'
);

-- Insert sample data
INSERT INTO recipes (name, time, difficulty, image, ingredients) VALUES
('Scrambled Eggs', '10 min', 'Easy', 'egg', '["eggs", "butter", "salt"]'),
('Pasta Carbonara', '20 min', 'Medium', 'utensils', '["pasta", "eggs", "bacon", "parmesan"]'),
('Pancakes', '15 min', 'Easy', 'pancake-alt', '["flour", "eggs", "milk", "butter"]'),
('Caesar Salad', '10 min', 'Easy', 'leaf', '["lettuce", "parmesan", "croutons", "caesar dressing"]'),
('Omelette', '10 min', 'Easy', 'egg', '["eggs", "milk", "butter", "salt", "pepper"]');
