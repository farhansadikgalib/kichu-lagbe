ALTER TABLE "orders" DROP CONSTRAINT "orders_area_id_delivery_areas_id_fk";--> statement-breakpoint
ALTER TABLE "orders" DROP COLUMN "area_id";--> statement-breakpoint
ALTER TABLE "orders" DROP COLUMN "area_name";--> statement-breakpoint
DROP TABLE "delivery_areas";
