COPY (
  SELECT id, title, slug, "activityType", category, difficulty 
  FROM learning_activities 
  WHERE "activityType" = 'theory_interactive' OR title LIKE '%Data Types%' OR title LIKE '%Quiz%'
  ORDER BY title
) TO STDOUT WITH CSV HEADER;
