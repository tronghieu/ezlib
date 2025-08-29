-- Reviews seed data (Social Features)
-- Creates realistic book reviews from test users

INSERT INTO reviews (id, book_edition_id, general_book_id, reviewer_id, content, rating, language, visibility, social_metrics, created_at, updated_at)
VALUES
  ('950e8400-e29b-41d4-a716-446655440001',
   '750e8400-e29b-41d4-a716-446655440001',
   '650e8400-e29b-41d4-a716-446655440001',
   '400a0780-d043-4b05-8427-9816855365d1',
   'A powerful dystopian novel that feels increasingly relevant today. Orwell''s vision of totalitarianism is both terrifying and compelling.',
   5,
   'en',
   'public',
   '{"like_count": 12, "comment_count": 3, "borrow_influence_count": 2, "share_count": 1}',
   now() - interval '15 days',
   now() - interval '10 days'),
   
  ('950e8400-e29b-41d4-a716-446655440002',
   '750e8400-e29b-41d4-a716-446655440002',
   '650e8400-e29b-41d4-a716-446655440002',
   '400a0780-d043-4b05-8427-9816855365d2',
   'Austen''s wit and social commentary shine through in this timeless romance. Elizabeth Bennet remains one of literature''s most engaging protagonists.',
   4,
   'en',
   'public',
   '{"like_count": 8, "comment_count": 2, "borrow_influence_count": 1, "share_count": 0}',
   now() - interval '20 days',
   now() - interval '20 days'),
   
  ('950e8400-e29b-41d4-a716-446655440003',
   '750e8400-e29b-41d4-a716-446655440005',
   '650e8400-e29b-41d4-a716-446655440005',
   '700a0780-d043-4b05-8427-9816855365d1',
   'An incredible memoir about the power of education and family complexity. Westover''s journey from isolation to academia is inspiring and heartbreaking.',
   5,
   'en',
   'public',
   '{"like_count": 24, "comment_count": 6, "borrow_influence_count": 4, "share_count": 3}',
   now() - interval '12 days',
   now() - interval '8 days');