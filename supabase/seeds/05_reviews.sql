-- Reviews seed data
-- Creates realistic book reviews from our test users

INSERT INTO reviews (id, book_edition_id, general_book_id, reviewer_id, content, rating, language, visibility, social_metrics, created_at, updated_at)
VALUES
  -- Emily Chen reviews Harry Potter
  (
    '950e8400-e29b-41d4-a716-446655440001',
    '750e8400-e29b-41d4-a716-446655440005',
    '650e8400-e29b-41d4-a716-446655440006',
    '400a0780-d043-4b05-8427-9816855365d1',
    'This book completely changed my perspective on what YA fantasy could be. Rowling created such a vivid, immersive world that I still revisit regularly. The way she weaves together friendship, coming of age, and the battle between good and evil is masterful. Harry''s journey from a lonely boy to a confident young wizard is beautifully portrayed. The supporting characters like Hermione and Ron feel so real and relatable. This is comfort reading at its finest.',
    5,
    'en',
    'public',
    '{"likes": 23, "replies": 7, "shares": 4, "helpful_votes": 19}',
    now() - interval '8 days',
    now() - interval '8 days'
  ),

  -- Marcus Rodriguez reviews Pride and Prejudice
  (
    '950e8400-e29b-41d4-a716-446655440002',
    '750e8400-e29b-41d4-a716-446655440003',
    '650e8400-e29b-41d4-a716-446655440003',
    '400a0780-d043-4b05-8427-9816855365d2',
    'Austen''s wit and social commentary remain as sharp today as they were 200 years ago. Elizabeth Bennet is one of literature''s most compelling protagonists - intelligent, independent, and delightfully flawed. The romance between her and Darcy unfolds with perfect pacing, built on mutual growth rather than mere attraction. Austen''s ability to critique society while crafting an engaging love story is unparalleled. This Penguin Classics edition includes excellent footnotes that help modern readers understand the historical context.',
    5,
    'en', 
    'public',
    '{"likes": 45, "replies": 12, "shares": 8, "helpful_votes": 38}',
    now() - interval '12 days',
    now() - interval '12 days'
  ),

  -- Sarah Kim reviews Foundation
  (
    '950e8400-e29b-41d4-a716-446655440003',
    '750e8400-e29b-41d4-a716-446655440004',
    '650e8400-e29b-41d4-a716-446655440004',
    '400a0780-d043-4b05-8427-9816855365d3',
    'Asimov''s Foundation is a masterpiece of science fiction that feels incredibly relevant today. The concept of psychohistory - predicting societal trends through mathematical models - seems less far-fetched in our age of big data and algorithmic predictions. Hari Seldon is a fascinating character, and the way Asimov explores the rise and fall of civilizations is both epic and intimate. The writing style is accessible despite the complex ideas. A must-read for any sci-fi enthusiast.',
    5,
    'en',
    'public', 
    '{"likes": 31, "replies": 15, "shares": 6, "helpful_votes": 27}',
    now() - interval '6 days',
    now() - interval '6 days'
  ),

  -- Ahmed Hassan reviews Murder on the Orient Express  
  (
    '950e8400-e29b-41d4-a716-446655440004',
    '750e8400-e29b-41d4-a716-446655440006',
    '650e8400-e29b-41d4-a716-446655440005', 
    '400a0780-d043-4b05-8427-9816855365d4',
    'Christie at her absolute best! The confined setting of the Orient Express creates such delicious tension, and Poirot''s methodical investigation keeps you guessing until the very end. What I love most about this mystery is how Christie plays fair with the reader - all the clues are there, but the solution is so ingenious you likely won''t see it coming. The character development is remarkable given the book''s length. Each passenger feels distinct and purposeful to the plot.',
    5,
    'en',
    'public',
    '{"likes": 18, "replies": 5, "shares": 3, "helpful_votes": 16}',
    now() - interval '14 days',
    now() - interval '14 days'
  ),

  -- Luna Petrov reviews Harry Potter (different perspective)
  (
    '950e8400-e29b-41d4-a716-446655440005',
    '750e8400-e29b-41d4-a716-446655440005',
    '650e8400-e29b-41d4-a716-446655440006',
    '400a0780-d043-4b05-8427-9816855365d5',
    'Rereading this as an adult hits differently than when I was a kid. While I still love the magic and wonder, I now appreciate Rowling''s exploration of themes like prejudice, loss, and growing up. The world-building is incredible - Hogwarts feels like a real place I''ve visited. Some plot points feel a bit convenient now, but the heart of the story - friendship conquering all - remains powerful. This will always be the book that made me fall in love with reading.',
    4,
    'en',
    'public',
    '{"likes": 67, "replies": 23, "shares": 12, "helpful_votes": 52}',
    now() - interval '3 days',
    now() - interval '3 days'
  ),

  -- James Wilson reviews 1984
  (
    '950e8400-e29b-41d4-a716-446655440006',
    '750e8400-e29b-41d4-a716-446655440001',
    '650e8400-e29b-41d4-a716-446655440001',
    '400a0780-d043-4b05-8427-9816855365d6',
    'Orwell''s 1984 is more relevant today than ever. The concepts of doublethink, newspeak, and the omnipresent surveillance state feel eerily prescient in our digital age. Winston''s struggle against the Party is both heartbreaking and terrifying. The psychological manipulation depicted is so realistic it makes you question everything. This isn''t just a novel - it''s a warning that we should all heed. Heavy but essential reading.',
    5,
    'en',
    'public',
    '{"likes": 42, "replies": 18, "shares": 14, "helpful_votes": 35}',
    now() - interval '5 days',
    now() - interval '5 days'
  ),

  -- Sarah Kim reviews Animal Farm  
  (
    '950e8400-e29b-41d4-a716-446655440007',
    '750e8400-e29b-41d4-a716-446655440002',
    '650e8400-e29b-41d4-a716-446655440002',
    '400a0780-d043-4b05-8427-9816855365d3',
    'A brilliant allegory that works on multiple levels. As a story about farm animals, it''s engaging and accessible. As a critique of totalitarian regimes, it''s devastating and insightful. Orwell''s ability to distill complex political ideas into such a simple narrative is masterful. "All animals are equal, but some animals are more equal than others" is one of the most powerful lines in literature. Short but profound.',
    4,
    'en',
    'public',
    '{"likes": 28, "replies": 9, "shares": 5, "helpful_votes": 24}',
    now() - interval '9 days',
    now() - interval '9 days'
  ),

  -- Marcus Rodriguez reviews Pride and Prejudice (teaching perspective)
  (
    '950e8400-e29b-41d4-a716-446655440008',
    '750e8400-e29b-41d4-a716-446655440003',
    '650e8400-e29b-41d4-a716-446655440003',
    '400a0780-d043-4b05-8427-9816855365d2',
    'Teaching this novel for over a decade, I''m continually amazed by how each new generation of students connects with Elizabeth''s story. Austen''s exploration of marriage, money, and social mobility remains remarkably relevant. The secondary characters - particularly Mr. Collins and Lady Catherine - provide brilliant comic relief while advancing the plot. This particular edition''s introduction provides excellent historical context about Regency England.',
    5,
    'en',
    'followers',
    '{"likes": 15, "replies": 4, "shares": 2, "helpful_votes": 13}',
    now() - interval '16 days',
    now() - interval '16 days'
  );