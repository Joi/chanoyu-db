-- Force recreation of views with explicit SECURITY INVOKER to override any SECURITY DEFINER settings
-- This ensures views respect RLS policies of the querying user, not the view creator

-- Drop views completely first
DROP VIEW IF EXISTS "public"."local_class_object_counts_direct" CASCADE;
DROP VIEW IF EXISTS "public"."local_class_object_counts_total" CASCADE; 
DROP VIEW IF EXISTS "public"."object_preferred_classification" CASCADE;

-- Create views with explicit SECURITY INVOKER (default, but being explicit)
-- SECURITY INVOKER means the view will respect RLS policies of the querying user

CREATE VIEW "public"."local_class_object_counts_direct" 
WITH (security_invoker=true) AS
SELECT "primary_local_class_id" AS "local_class_id",
   "count"(*) AS "object_count"
  FROM "public"."objects"
 WHERE ("primary_local_class_id" IS NOT NULL)
 GROUP BY "primary_local_class_id";

CREATE VIEW "public"."local_class_object_counts_total"
WITH (security_invoker=true) AS
SELECT "h"."ancestor_id" AS "local_class_id",
   "count"("o"."id") AS "object_count"
  FROM ("public"."objects" "o"
    JOIN "public"."local_class_hierarchy" "h" ON (("h"."descendant_id" = "o"."primary_local_class_id")))
 GROUP BY "h"."ancestor_id";

CREATE VIEW "public"."object_preferred_classification"
WITH (security_invoker=true) AS
SELECT "o"."id" AS "object_id",
   "o"."token",
   "lc"."id" AS "local_class_id",
   "lc"."label_en" AS "local_class_label_en",
   "lc"."label_ja" AS "local_class_label_ja",
   "c"."id" AS "classification_id",
   "c"."scheme" AS "classification_scheme",
   "c"."uri" AS "classification_uri",
   "c"."label" AS "classification_label",
   "c"."label_ja" AS "classification_label_ja"
  FROM (("public"."objects" "o"
    JOIN "public"."local_classes" "lc" ON (("lc"."id" = "o"."primary_local_class_id")))
    LEFT JOIN "public"."classifications" "c" ON (("c"."id" = "lc"."preferred_classification_id")));

-- Restore permissions
GRANT ALL ON TABLE "public"."local_class_object_counts_direct" TO "anon";
GRANT ALL ON TABLE "public"."local_class_object_counts_direct" TO "authenticated";
GRANT ALL ON TABLE "public"."local_class_object_counts_direct" TO "service_role";

GRANT ALL ON TABLE "public"."local_class_object_counts_total" TO "anon";
GRANT ALL ON TABLE "public"."local_class_object_counts_total" TO "authenticated";
GRANT ALL ON TABLE "public"."local_class_object_counts_total" TO "service_role";

GRANT ALL ON TABLE "public"."object_preferred_classification" TO "anon";
GRANT ALL ON TABLE "public"."object_preferred_classification" TO "authenticated";
GRANT ALL ON TABLE "public"."object_preferred_classification" TO "service_role";

-- Comment to document the security model
COMMENT ON VIEW "public"."local_class_object_counts_direct" IS 'Security invoker view that respects RLS policies on objects table';
COMMENT ON VIEW "public"."local_class_object_counts_total" IS 'Security invoker view that respects RLS policies on objects table';
COMMENT ON VIEW "public"."object_preferred_classification" IS 'Security invoker view that respects RLS policies on objects table';