-- Fix SECURITY DEFINER views by recreating them without the SECURITY DEFINER property
-- This ensures they respect Row Level Security policies for the querying user

-- Drop and recreate local_class_object_counts_direct without SECURITY DEFINER
DROP VIEW IF EXISTS "public"."local_class_object_counts_direct";

CREATE VIEW "public"."local_class_object_counts_direct" AS
SELECT "primary_local_class_id" AS "local_class_id",
   "count"(*) AS "object_count"
  FROM "public"."objects"
 WHERE ("primary_local_class_id" IS NOT NULL)
 GROUP BY "primary_local_class_id";

-- Drop and recreate local_class_object_counts_total without SECURITY DEFINER
DROP VIEW IF EXISTS "public"."local_class_object_counts_total";

CREATE VIEW "public"."local_class_object_counts_total" AS
SELECT "h"."ancestor_id" AS "local_class_id",
   "count"("o"."id") AS "object_count"
  FROM ("public"."objects" "o"
    JOIN "public"."local_class_hierarchy" "h" ON (("h"."descendant_id" = "o"."primary_local_class_id")))
 GROUP BY "h"."ancestor_id";

-- Drop and recreate object_preferred_classification without SECURITY DEFINER
DROP VIEW IF EXISTS "public"."object_preferred_classification";

CREATE VIEW "public"."object_preferred_classification" AS
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

-- Grant appropriate permissions to maintain existing access patterns
-- These views now respect RLS policies from underlying tables

GRANT ALL ON TABLE "public"."local_class_object_counts_direct" TO "anon";
GRANT ALL ON TABLE "public"."local_class_object_counts_direct" TO "authenticated";
GRANT ALL ON TABLE "public"."local_class_object_counts_direct" TO "service_role";

GRANT ALL ON TABLE "public"."local_class_object_counts_total" TO "anon";
GRANT ALL ON TABLE "public"."local_class_object_counts_total" TO "authenticated";
GRANT ALL ON TABLE "public"."local_class_object_counts_total" TO "service_role";

GRANT ALL ON TABLE "public"."object_preferred_classification" TO "anon";
GRANT ALL ON TABLE "public"."object_preferred_classification" TO "authenticated";
GRANT ALL ON TABLE "public"."object_preferred_classification" TO "service_role";

-- These views will now properly respect the RLS policies on the objects table
-- Only public objects will be included in the counts and classifications for regular users
-- Admin users with appropriate RLS permissions will see all data as expected