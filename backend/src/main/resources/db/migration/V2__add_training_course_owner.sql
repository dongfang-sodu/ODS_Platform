ALTER TABLE training_courses ADD COLUMN owner_username VARCHAR(100);

UPDATE training_courses
SET owner_username = 'admin'
WHERE owner_username IS NULL;

ALTER TABLE training_courses ALTER COLUMN owner_username SET NOT NULL;
