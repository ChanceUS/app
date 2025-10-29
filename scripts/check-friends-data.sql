-- Check all friend relationships
SELECT 
  f.id,
  f.user_id,
  f.friend_id,
  f.status,
  u1.username as request_sender,
  u2.username as request_receiver
FROM public.friends f
LEFT JOIN public.users u1 ON f.user_id = u1.id
LEFT JOIN public.users u2 ON f.friend_id = u2.id
ORDER BY f.created_at DESC;

