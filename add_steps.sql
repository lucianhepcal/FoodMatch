-- Add steps column to recipes table
ALTER TABLE recipes ADD COLUMN steps JSONB;

-- Update existing recipes with cooking steps
UPDATE recipes SET steps = '[
  "Beat the eggs in a bowl",
  "Heat butter in a pan over medium heat",
  "Pour in the eggs and stir gently",
  "Cook until set, about 2-3 minutes",
  "Season with salt and serve hot"
]' WHERE name = 'Scrambled Eggs';

UPDATE recipes SET steps = '[
  "Cook pasta according to package directions",
  "Fry bacon until crispy, then chop",
  "Mix eggs with parmesan cheese",
  "Combine hot pasta with bacon",
  "Add egg mixture and toss quickly",
  "Season with salt and pepper"
]' WHERE name = 'Pasta Carbonara';

UPDATE recipes SET steps = '[
  "Mix flour, baking powder, and salt",
  "In another bowl, whisk eggs with milk",
  "Combine wet and dry ingredients",
  "Heat butter on griddle over medium heat",
  "Pour batter and cook until bubbles form",
  "Flip and cook until golden brown"
]' WHERE name = 'Pancakes';

UPDATE recipes SET steps = '[
  "Wash and chop lettuce",
  "Toss with croutons and parmesan",
  "Drizzle with caesar dressing",
  "Mix gently",
  "Serve immediately"
]' WHERE name = 'Caesar Salad';

UPDATE recipes SET steps = '[
  "Beat eggs with milk and salt",
  "Heat butter in non-stick pan",
  "Pour in egg mixture",
  "As eggs set, push them toward center",
  "Cook until mostly set but still creamy",
  "Add fillings if desired and fold in half"
]' WHERE name = 'Omelette';
