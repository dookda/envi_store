-- ENVIR Store – simplified schema (no auth)
-- Runs automatically on first Postgres volume init.

SET client_encoding = 'UTF8';
SELECT pg_catalog.set_config('search_path', '', false);

CREATE TABLE public."EquipmentItem" (
    id              text NOT NULL,
    "equipmentName" text NOT NULL,
    model           text NOT NULL,
    "customerName"  text,
    location        text,
    latitude        double precision,
    longitude       double precision,
    image           text,
    "inUse"         boolean DEFAULT false NOT NULL,
    "installedAt"   timestamp(3) without time zone,
    "expiredAt"     timestamp(3) without time zone,
    "isArchived"    boolean DEFAULT false NOT NULL,
    "createdAt"     timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt"     timestamp(3) without time zone NOT NULL
);

ALTER TABLE ONLY public."EquipmentItem"
    ADD CONSTRAINT "EquipmentItem_pkey" PRIMARY KEY (id);

CREATE INDEX "EquipmentItem_equipmentName_idx" ON public."EquipmentItem" USING btree ("equipmentName");
CREATE INDEX "EquipmentItem_isArchived_idx"    ON public."EquipmentItem" USING btree ("isArchived");

-- Sample data
COPY public."EquipmentItem" (id, "equipmentName", model, "customerName", location, latitude, longitude, image, "inUse", "installedAt", "expiredAt", "isArchived", "createdAt", "updatedAt") FROM stdin;
sample001	Air Quality Monitor	AQM-100	Acme Corp	Building A, Floor 3	\N	\N	\N	f	\N	\N	f	2026-06-14 00:00:00	2026-06-14 00:00:00
sample002	XR-200	XR-200	Acme Corp	Floor 3	\N	\N	\N	t	2026-06-01 00:00:00	2026-12-31 00:00:00	f	2026-06-14 00:00:00	2026-06-14 00:00:00
\.
