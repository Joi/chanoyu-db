-- Minimal seed data without objects table to test schema sync
-- This will be used temporarily to verify the tags column is removed

-- Just insert basic required data
INSERT INTO "public"."tea_schools" ("id", "name", "name_ja") VALUES
	('d58e9d3b-292a-49b2-97b1-b3da0b5a3f27', 'Urasenke', '裏千家');

INSERT INTO "public"."accounts" ("id", "email", "full_name_en", "full_name_ja", "role", "password_hash", "created_at", "tea_school_id", "profile_picture_id", "biography_en", "biography_ja", "website", "active") VALUES
	('44cef97e-416b-4128-a8c5-560a5101cf95', 'joi@ito.com', 'Joichi Ito', '伊藤穰一', 'owner', '956dd3d117c076f9a212069e922eb528:b185024cebc77a091fb8965dff7b9da1e3414578a4fe8a6f373863922f400729', '2025-08-17 13:47:37.809175+00', 'd58e9d3b-292a-49b2-97b1-b3da0b5a3f27', NULL, NULL, NULL, NULL, NULL);