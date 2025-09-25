--
-- PostgreSQL database dump
--

\restrict E3q9KlkwkQb7Nz1uNRqRWCLPr9dhxpp97g2yjfA6Gd12zsb1Obe5Snn9P6OYTg1

-- Dumped from database version 16.10
-- Dumped by pg_dump version 16.10

-- Started on 2025-09-25 13:01:00

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- TOC entry 5163 (class 0 OID 22022)
-- Dependencies: 215
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
c2380f6b-87c7-4cf0-845b-afc2b352fa6a	7e2b224609467db4e48de5289f50e85dfda093aa8c63ef28f5dcc7415e9187fe	2025-09-24 08:46:51.08614-07	20250915064621_add_comprehensive_lottery_features	\N	\N	2025-09-24 08:46:50.952539-07	1
000be3b3-2986-40a4-b057-980d14520bf5	3b62ff74cf620535dade5337ad637ccdfad5a2b258048d2a26a24964a6056b9f	2025-09-24 08:46:51.090303-07	20250915064836_fix_bet_limit_unique_constraint	\N	\N	2025-09-24 08:46:51.086851-07	1
514a5571-9468-4980-9823-8b1b6c96181d	dbcd04000123c7918dc72e016971ac4b6cccf018bc45fd1bef530bae39b062c4	2025-09-24 08:46:52.690301-07	20250924154652_ensure_audit_tables	\N	\N	2025-09-24 08:46:52.646147-07	1
63ce9156-62d9-4fa8-94bf-7932fdc15903	2b2f2cf83148061df518ffdcfa72f46ff2fac7cba9cef5bc8604eccc15ca8986	2025-09-24 08:46:51.093771-07	20250915065141_add_unique_constraints	\N	\N	2025-09-24 08:46:51.090628-07	1
f8d74948-9cca-4b7f-806e-e72a3ca842d5	30a8cf521fff0cc1642ea325d9168f6911b2fbbc10022340d16940ba8005c6c0	2025-09-24 08:46:51.102745-07	20250915071129_add_ticket_reprint_table	\N	\N	2025-09-24 08:46:51.0941-07	1
e54531f4-82a0-4874-ad3c-38af46106487	ef6cc8f8706e606eeecb62081cf85a6177b4cdfc4ea950e623cb79304f345e0c	2025-09-24 08:46:51.126854-07	20250916040236_add_function_management_system	\N	\N	2025-09-24 08:46:51.103595-07	1
6f0d2acf-8ccb-4764-8c47-e804cf0ef11a	972c45b0bf0ce0e02b6c4185b081b70d6f21e4cc5d19e3a2bdbb6ae8ce9598e2	2025-09-24 08:46:51.131596-07	20250917034021_remove_qr_code_unique_constraint	\N	\N	2025-09-24 08:46:51.127779-07	1
5fd8d5b0-e1b7-4cd0-8538-18928c5db158	b47a3d1e6a1742ccd83d2f0e32f659d645f7ca37d46a031bb7b75bf76dfa79a1	2025-09-24 08:46:51.14666-07	20250917111914_simplify_ticket_status	\N	\N	2025-09-24 08:46:51.132699-07	1
39b09201-ae34-4386-8e30-7ec382e1db34	50baba014816bbe4b8c0b29d91352101b1edd991b72877942d9cb6f4caf53f34	2025-09-24 08:46:51.16196-07	20250917114344_fix_ticket_agent_relation	\N	\N	2025-09-24 08:46:51.147359-07	1
8da4020f-ef27-4135-a47b-3c37076bfcb8	fb8e40a1a9ba53fa4aacf81655c1d3d4d00ef0ff44ddb0ef95496e80660d202a	2025-09-24 08:46:51.165869-07	20250917122458_add_rendered_ticket_field	\N	\N	2025-09-24 08:46:51.162874-07	1
2e66ad01-fb8b-42dd-bd44-247f4e7ea73d	cc2f30ceb63491b922e7f2739e1f27261340e7ccb7330b2de6c929ad6434a73f	2025-09-24 08:46:51.182654-07	20250918083848_add_system_functions	\N	\N	2025-09-24 08:46:51.167422-07	1
f429fe00-7ca4-4c92-95e6-eeeaed3061b8	10d6479846984e9f85e6bda26940247325bcd3cf835d5a1d5d86cc2b9ba2a8af	2025-09-24 08:46:51.206959-07	20250918124112_safe_upgrade	\N	\N	2025-09-24 08:46:51.184071-07	1
ce3ccfb5-8d1d-4a50-9b01-6f7a936faf62	3e7ee3ee28f24d16673754528e4ff4d80f538bca3cb0ecea0d8f6c8061a2576e	2025-09-24 08:46:51.211709-07	20250918124233_lottery_systemv2	\N	\N	2025-09-24 08:46:51.207958-07	1
ef7d8a47-f459-464c-809a-49391aca41c4	da06538f1d929c119809756bdb59b06966e930027f177b326deba95c7cbc7aa1	2025-09-24 08:46:51.227746-07	20250924_add_prize_configuration	\N	\N	2025-09-24 08:46:51.212449-07	1
\.


--
-- TOC entry 5165 (class 0 OID 22086)
-- Dependencies: 217
-- Data for Name: regions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.regions (id, name, "areaCoordinatorId", "createdAt", "updatedAt") FROM stdin;
1	Mactan	2	2025-09-24 16:23:28.392	2025-09-24 16:23:28.411
\.


--
-- TOC entry 5167 (class 0 OID 22096)
-- Dependencies: 219
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, username, password_hash, email, full_name, address, phone, region_id, coordinator_id, created_by, "createdAt", "updatedAt", agent_id, role, status) FROM stdin;
1	superadmin	$2a$12$c/5PJ5zQY9cbCT49StBliOw33OqdBBnd6I0QOylAlvcOrsmS1U/Kq	admin@lottery.com	Super Administrator	\N	\N	\N	\N	\N	2025-09-24 15:56:08.303	2025-09-24 15:56:08.303	\N	superadmin	active
2	areacor	$2a$12$7t11eu4GfmWiwWSIaBfNTOcwq5MGtLMVkDnmXsNLV1vw6cTKUn7ni	test@test.com	test	\N	12312	1	\N	1	2025-09-24 16:23:28.4	2025-09-24 16:23:28.4	\N	area_coordinator	active
3	cor1	$2a$12$OMYBbtUExFWVQYvnsdR.jeB1fqQ5bQKpxm/7j/QuF1eSUh3y9I2VS	cor1@test.com	cor1	\N	12312	\N	2	1	2025-09-24 16:23:46.755	2025-09-24 16:23:56.323	\N	coordinator	active
4	agent1	$2a$12$AD2K8hrX/MJ7vfLVTBESNeyB9ZZjkptLGAqRcGBnvxcMrFlBzrJYG	agent1@test.com	agent1	\N	12312	\N	3	1	2025-09-24 16:24:18.149	2025-09-24 16:24:18.149	\N	agent	active
\.


--
-- TOC entry 5191 (class 0 OID 22216)
-- Dependencies: 243
-- Data for Name: ticket_templates; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.ticket_templates (id, name, design, is_active, created_by, "createdAt", "updatedAt") FROM stdin;
1	Umatik Ticket Template	{"canvasWidth": 600, "canvasHeight": 900, "templateType": "umatik", "dynamicHeight": true, "templateDesign": 3, "backgroundColor": "#ffffff"}	t	1	2025-09-25 02:09:50.305	2025-09-25 02:09:50.307
\.


--
-- TOC entry 5193 (class 0 OID 22227)
-- Dependencies: 245
-- Data for Name: agent_ticket_templates; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.agent_ticket_templates (id, agent_id, template_id, assigned_at) FROM stdin;
1	4	1	2025-09-25 02:09:50.347
\.


--
-- TOC entry 5218 (class 0 OID 23742)
-- Dependencies: 270
-- Data for Name: audit_log; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.audit_log (id, user_id, table_name, record_id, details, ip_address, user_agent, created_at, operation, new_values, old_values, action) FROM stdin;
5	4	tickets	8	{"total_amount": 10, "ticket_number": "T1758767125963O0RH"}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	2025-09-24 19:25:26.088	UPDATE	\N	\N	INSERT
6	4	tickets	9	{"total_amount": 10, "ticket_number": "T1758767146358YRFN"}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	2025-09-24 19:25:46.369	UPDATE	\N	\N	INSERT
7	4	tickets	10	{"total_amount": 10, "ticket_number": "T1758768087136I57R"}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	2025-09-24 19:41:27.256	UPDATE	\N	\N	INSERT
8	4	tickets	11	{"total_amount": 10, "ticket_number": "T1758768464610VJ9P"}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	2025-09-24 19:47:44.729	UPDATE	\N	\N	INSERT
9	4	tickets	12	{"total_amount": 10, "ticket_number": "T1758769375582BD3E"}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	2025-09-24 20:02:55.696	UPDATE	\N	\N	INSERT
10	4	tickets	13	{"total_amount": 10, "ticket_number": "T1758769726514TZ3L"}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	2025-09-24 20:08:46.556	UPDATE	\N	\N	INSERT
11	4	tickets	14	{"total_amount": 10, "ticket_number": "T1758773915293PFNV"}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	2025-09-24 21:18:35.362	UPDATE	\N	\N	INSERT
12	4	tickets	15	{"total_amount": 10, "ticket_number": "T1758774067812J1GN"}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	2025-09-24 21:21:07.867	UPDATE	\N	\N	INSERT
13	4	tickets	16	{"total_amount": 10, "ticket_number": "T1758774087142YWBL"}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	2025-09-24 21:21:27.158	UPDATE	\N	\N	INSERT
\.


--
-- TOC entry 5171 (class 0 OID 22117)
-- Dependencies: 223
-- Data for Name: balance_transactions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.balance_transactions (id, user_id, amount, transaction_type, description, reference_id, processed_by, "createdAt", status) FROM stdin;
1	3	1000	load	Balance loaded by Super Administrator	\N	1	2025-09-24 16:24:58.572	completed
2	2	1000	load	Balance loaded by Super Administrator	\N	1	2025-09-24 16:25:01.595	completed
3	4	1000	load	Balance loaded by Super Administrator	\N	1	2025-09-24 16:25:04.566	completed
11	4	10	use	Ticket purchase: T1758767125963O0RH	\N	4	2025-09-24 19:25:26.088	completed
12	4	10	use	Ticket purchase: T1758767146358YRFN	\N	4	2025-09-24 19:25:46.369	completed
13	4	10	use	Ticket purchase: T1758768087136I57R	\N	4	2025-09-24 19:41:27.256	completed
14	4	10	use	Ticket purchase: T1758768464610VJ9P	\N	4	2025-09-24 19:47:44.729	completed
15	4	10	use	Ticket purchase: T1758769375582BD3E	\N	4	2025-09-24 20:02:55.696	completed
16	4	10	use	Ticket purchase: T1758769726514TZ3L	\N	4	2025-09-24 20:08:46.556	completed
17	4	10	use	Ticket purchase: T1758773915293PFNV	\N	4	2025-09-24 21:18:35.362	completed
18	4	10	use	Ticket purchase: T1758774067812J1GN	\N	4	2025-09-24 21:21:07.867	completed
19	4	10	use	Ticket purchase: T1758774087142YWBL	\N	4	2025-09-24 21:21:27.158	completed
\.


--
-- TOC entry 5185 (class 0 OID 22187)
-- Dependencies: 237
-- Data for Name: bet_limits; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.bet_limits (id, bet_type, limit_amount, is_active, created_by, "createdAt", "updatedAt") FROM stdin;
3	standard	1000	t	1	2025-09-24 17:08:24.455	2025-09-24 17:08:24.455
4	rambolito	1500	t	1	2025-09-24 17:08:24.49	2025-09-24 17:08:24.49
\.


--
-- TOC entry 5173 (class 0 OID 22127)
-- Dependencies: 225
-- Data for Name: draws; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.draws (id, draw_date, draw_time, winning_number, status, created_at, updated_at, cutoff_time) FROM stdin;
4	2025-09-25 00:00:00	twoPM	\N	open	2025-09-24 15:51:03.419	2025-09-24 15:51:03.419	2025-09-25 13:55:00
5	2025-09-25 00:00:00	fivePM	\N	open	2025-09-24 15:51:03.42	2025-09-24 15:51:03.42	2025-09-25 16:55:00
6	2025-09-25 00:00:00	ninePM	\N	open	2025-09-24 15:51:03.421	2025-09-24 15:51:03.421	2025-09-25 20:55:00
7	2025-09-26 00:00:00	twoPM	\N	open	2025-09-24 15:51:03.423	2025-09-24 15:51:03.423	2025-09-26 13:55:00
8	2025-09-26 00:00:00	fivePM	\N	open	2025-09-24 15:51:03.424	2025-09-24 15:51:03.424	2025-09-26 16:55:00
9	2025-09-26 00:00:00	ninePM	\N	open	2025-09-24 15:51:03.425	2025-09-24 15:51:03.425	2025-09-26 20:55:00
10	2025-09-27 00:00:00	twoPM	\N	open	2025-09-24 15:51:03.426	2025-09-24 15:51:03.426	2025-09-27 13:55:00
11	2025-09-27 00:00:00	fivePM	\N	open	2025-09-24 15:51:03.427	2025-09-24 15:51:03.427	2025-09-27 16:55:00
12	2025-09-27 00:00:00	ninePM	\N	open	2025-09-24 15:51:03.428	2025-09-24 15:51:03.428	2025-09-27 20:55:00
13	2025-09-28 00:00:00	twoPM	\N	open	2025-09-24 15:51:03.43	2025-09-24 15:51:03.43	2025-09-28 13:55:00
14	2025-09-28 00:00:00	fivePM	\N	open	2025-09-24 15:51:03.43	2025-09-24 15:51:03.43	2025-09-28 16:55:00
15	2025-09-28 00:00:00	ninePM	\N	open	2025-09-24 15:51:03.431	2025-09-24 15:51:03.431	2025-09-28 20:55:00
16	2025-09-29 00:00:00	twoPM	\N	open	2025-09-24 15:51:03.433	2025-09-24 15:51:03.433	2025-09-29 13:55:00
17	2025-09-29 00:00:00	fivePM	\N	open	2025-09-24 15:51:03.434	2025-09-24 15:51:03.434	2025-09-29 16:55:00
18	2025-09-29 00:00:00	ninePM	\N	open	2025-09-24 15:51:03.436	2025-09-24 15:51:03.436	2025-09-29 20:55:00
19	2025-09-30 00:00:00	twoPM	\N	open	2025-09-24 15:51:03.438	2025-09-24 15:51:03.438	2025-09-30 13:55:00
20	2025-09-30 00:00:00	fivePM	\N	open	2025-09-24 15:51:03.438	2025-09-24 15:51:03.438	2025-09-30 16:55:00
21	2025-09-30 00:00:00	ninePM	\N	open	2025-09-24 15:51:03.439	2025-09-24 15:51:03.439	2025-09-30 20:55:00
22	2025-10-01 00:00:00	twoPM	\N	open	2025-09-24 15:51:03.44	2025-09-24 15:51:03.44	2025-10-01 13:55:00
23	2025-10-01 00:00:00	fivePM	\N	open	2025-09-24 15:51:03.441	2025-09-24 15:51:03.441	2025-10-01 16:55:00
24	2025-10-01 00:00:00	ninePM	\N	open	2025-09-24 15:51:03.442	2025-09-24 15:51:03.442	2025-10-01 20:55:00
25	2025-10-02 00:00:00	twoPM	\N	open	2025-09-24 15:51:03.444	2025-09-24 15:51:03.444	2025-10-02 13:55:00
26	2025-10-02 00:00:00	fivePM	\N	open	2025-09-24 15:51:03.444	2025-09-24 15:51:03.444	2025-10-02 16:55:00
27	2025-10-02 00:00:00	ninePM	\N	open	2025-09-24 15:51:03.445	2025-09-24 15:51:03.445	2025-10-02 20:55:00
28	2025-10-03 00:00:00	twoPM	\N	open	2025-09-24 15:51:03.446	2025-09-24 15:51:03.446	2025-10-03 13:55:00
29	2025-10-03 00:00:00	fivePM	\N	open	2025-09-24 15:51:03.447	2025-09-24 15:51:03.447	2025-10-03 16:55:00
30	2025-10-03 00:00:00	ninePM	\N	open	2025-09-24 15:51:03.448	2025-09-24 15:51:03.448	2025-10-03 20:55:00
31	2025-10-04 00:00:00	twoPM	\N	open	2025-09-24 15:51:03.45	2025-09-24 15:51:03.45	2025-10-04 13:55:00
32	2025-10-04 00:00:00	fivePM	\N	open	2025-09-24 15:51:03.451	2025-09-24 15:51:03.451	2025-10-04 16:55:00
33	2025-10-04 00:00:00	ninePM	\N	open	2025-09-24 15:51:03.452	2025-09-24 15:51:03.452	2025-10-04 20:55:00
34	2025-10-05 00:00:00	twoPM	\N	open	2025-09-24 15:51:03.454	2025-09-24 15:51:03.454	2025-10-05 13:55:00
35	2025-10-05 00:00:00	fivePM	\N	open	2025-09-24 15:51:03.455	2025-09-24 15:51:03.455	2025-10-05 16:55:00
36	2025-10-05 00:00:00	ninePM	\N	open	2025-09-24 15:51:03.455	2025-09-24 15:51:03.455	2025-10-05 20:55:00
37	2025-10-06 00:00:00	twoPM	\N	open	2025-09-24 15:51:03.457	2025-09-24 15:51:03.457	2025-10-06 13:55:00
38	2025-10-06 00:00:00	fivePM	\N	open	2025-09-24 15:51:03.457	2025-09-24 15:51:03.457	2025-10-06 16:55:00
39	2025-10-06 00:00:00	ninePM	\N	open	2025-09-24 15:51:03.458	2025-09-24 15:51:03.458	2025-10-06 20:55:00
40	2025-10-07 00:00:00	twoPM	\N	open	2025-09-24 15:51:03.46	2025-09-24 15:51:03.46	2025-10-07 13:55:00
41	2025-10-07 00:00:00	fivePM	\N	open	2025-09-24 15:51:03.46	2025-09-24 15:51:03.46	2025-10-07 16:55:00
42	2025-10-07 00:00:00	ninePM	\N	open	2025-09-24 15:51:03.461	2025-09-24 15:51:03.461	2025-10-07 20:55:00
1	2025-09-24 00:00:00	twoPM	\N	closed	2025-09-24 15:51:03.412	2025-09-24 15:52:00.5	2025-09-24 13:55:00
2	2025-09-24 00:00:00	fivePM	\N	closed	2025-09-24 15:51:03.415	2025-09-24 15:52:00.505	2025-09-24 16:55:00
3	2025-09-24 00:00:00	ninePM	\N	closed	2025-09-24 15:51:03.416	2025-09-24 15:52:00.507	2025-09-24 20:55:00
43	2025-10-08 00:00:00	twoPM	\N	open	2025-09-24 16:06:09.643	2025-09-24 16:06:09.643	2025-10-08 13:55:00
44	2025-10-08 00:00:00	fivePM	\N	open	2025-09-24 16:06:09.645	2025-09-24 16:06:09.645	2025-10-08 16:55:00
45	2025-10-08 00:00:00	ninePM	\N	open	2025-09-24 16:06:09.647	2025-09-24 16:06:09.647	2025-10-08 20:55:00
\.


--
-- TOC entry 5197 (class 0 OID 22246)
-- Dependencies: 249
-- Data for Name: bet_limits_per_draw; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.bet_limits_per_draw (id, draw_id, bet_combination, bet_type, current_amount, limit_amount, is_sold_out, "updatedAt") FROM stdin;
11	45	123	standard	0	1000	f	2025-09-24 17:08:33.282
12	45	456	standard	0	1000	f	2025-09-24 17:08:33.299
13	45	789	standard	0	1000	f	2025-09-24 17:08:33.301
14	45	001	standard	0	1000	f	2025-09-24 17:08:33.302
15	45	999	standard	0	1000	f	2025-09-24 17:08:33.304
16	45	123	rambolito	0	1500	f	2025-09-24 17:08:33.306
17	45	456	rambolito	0	1500	f	2025-09-24 17:08:33.309
18	45	789	rambolito	0	1500	f	2025-09-24 17:08:33.31
19	45	001	rambolito	0	1500	f	2025-09-24 17:08:33.311
20	45	999	rambolito	0	1500	f	2025-09-24 17:08:33.312
\.


--
-- TOC entry 5175 (class 0 OID 22138)
-- Dependencies: 227
-- Data for Name: tickets; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.tickets (id, ticket_number, user_id, draw_id, total_amount, status, qr_code, template_id, "createdAt", "updatedAt", agent_id, bet_date, reprint_count, sequence_number) FROM stdin;
10	T1758768087136I57R	4	4	10	pending	data:image/png;base64,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	1	2025-09-25 19:41:27.256	2025-09-25 04:18:01.909	4	2025-09-24 19:41:27.256	0	A
11	T1758768464610VJ9P	4	5	10	pending	data:image/png;base64,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	1	2025-09-25 19:47:44.729	2025-09-25 04:18:01.909	4	2025-09-24 19:47:44.729	0	A
13	T1758769726514TZ3L	4	4	10	pending	data:image/png;base64,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	1	2025-09-25 20:08:46.556	2025-09-25 04:18:01.91	4	2025-09-24 20:08:46.556	0	A
8	T1758767125963O0RH	4	4	10	pending	data:image/png;base64,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	1	2025-09-25 19:25:26.088	2025-09-25 04:18:01.908	4	2025-09-24 19:25:26.088	0	A
9	T1758767146358YRFN	4	4	10	pending	data:image/png;base64,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	1	2025-09-25 19:25:46.369	2025-09-25 04:18:01.909	4	2025-09-24 19:25:46.369	0	A
12	T1758769375582BD3E	4	4	10	pending	data:image/png;base64,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	1	2025-09-25 20:02:55.696	2025-09-25 04:18:01.91	4	2025-09-24 20:02:55.696	0	A
14	T1758773915293PFNV	4	4	10	pending	data:image/png;base64,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	1	2025-09-25 21:18:35.362	2025-09-25 04:22:43.216	4	2025-09-24 21:18:35.362	0	A
15	T1758774067812J1GN	4	4	10	pending	data:image/png;base64,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	1	2025-09-25 21:21:07.867	2025-09-25 04:22:43.219	4	2025-09-24 21:21:07.867	0	A
16	T1758774087142YWBL	4	4	10	pending	data:image/png;base64,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	1	2025-09-25 21:21:27.158	2025-09-25 04:22:43.224	4	2025-09-24 21:21:27.158	0	A
\.


--
-- TOC entry 5209 (class 0 OID 23662)
-- Dependencies: 261
-- Data for Name: bets; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.bets (id, ticket_id, bet_type, bet_combination, bet_amount, "createdAt", "updatedAt") FROM stdin;
1	8	standard	852	10	2025-09-25 02:25:26.151	2025-09-25 02:25:26.151
2	9	standard	523	10	2025-09-25 02:25:46.402	2025-09-25 02:25:46.402
3	10	standard	322	10	2025-09-25 02:41:27.326	2025-09-25 02:41:27.326
4	11	standard	236	10	2025-09-25 02:47:44.815	2025-09-25 02:47:44.815
5	12	standard	123	10	2025-09-25 03:02:55.715	2025-09-25 03:02:55.715
6	13	standard	422	10	2025-09-25 03:08:46.567	2025-09-25 03:08:46.567
7	14	standard	522	10	2025-09-25 04:18:35.375	2025-09-25 04:18:35.375
8	15	standard	222	10	2025-09-25 04:21:07.88	2025-09-25 04:21:07.88
9	16	standard	552	10	2025-09-25 04:21:27.173	2025-09-25 04:21:27.173
\.


--
-- TOC entry 5179 (class 0 OID 22159)
-- Dependencies: 231
-- Data for Name: commissions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.commissions (id, user_id, draw_id, commission_rate, commission_amount, "createdAt") FROM stdin;
\.


--
-- TOC entry 5187 (class 0 OID 22196)
-- Dependencies: 239
-- Data for Name: current_bet_totals; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.current_bet_totals (id, draw_id, bet_combination, bet_type, total_amount, ticket_count, "updatedAt") FROM stdin;
1	4	852	standard	10	1	2025-09-25 02:25:26.186
2	4	523	standard	10	1	2025-09-25 02:25:46.404
3	4	322	standard	10	1	2025-09-25 02:41:27.356
4	5	236	standard	10	1	2025-09-25 02:47:44.82
5	4	123	standard	10	1	2025-09-25 03:02:55.718
6	4	422	standard	10	1	2025-09-25 03:08:46.569
7	4	522	standard	10	1	2025-09-25 04:18:35.378
8	4	222	standard	10	1	2025-09-25 04:21:07.882
9	4	552	standard	10	1	2025-09-25 04:21:27.176
\.


--
-- TOC entry 5195 (class 0 OID 22235)
-- Dependencies: 247
-- Data for Name: draw_results; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.draw_results (id, draw_id, winning_number, input_by, input_at, is_official) FROM stdin;
\.


--
-- TOC entry 5211 (class 0 OID 23672)
-- Dependencies: 263
-- Data for Name: login_audit; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.login_audit (id, user_id, username, ip_address, user_agent, reason, created_at, status) FROM stdin;
\.


--
-- TOC entry 5183 (class 0 OID 22176)
-- Dependencies: 235
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.notifications (id, user_id, title, message, type, is_read, related_ticket_id, related_draw_id, "createdAt") FROM stdin;
\.


--
-- TOC entry 5207 (class 0 OID 22552)
-- Dependencies: 259
-- Data for Name: prize_configurations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.prize_configurations (id, bet_type, multiplier, base_amount, base_prize, description, is_active, "createdAt", created_by_id, "updatedAt", updated_by_id) FROM stdin;
1	standard	450	10	4500	Standard betting: ₱10 bet = ₱4,500 prize (450x multiplier)	t	2025-09-24 16:33:38.099	1	2025-09-24 16:33:38.099	\N
2	rambolito	450	10	750	Rambolito betting: ₱10 bet = ₱750 prize (75x multiplier), Double: ₱1,500 (150x multiplier)	t	2025-09-24 16:33:38.105	1	2025-09-24 16:33:38.105	\N
\.


--
-- TOC entry 5216 (class 0 OID 23701)
-- Dependencies: 268
-- Data for Name: rate_limits; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.rate_limits (key, count, expires_at, created_at) FROM stdin;
\.


--
-- TOC entry 5201 (class 0 OID 22436)
-- Dependencies: 253
-- Data for Name: system_functions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.system_functions (id, name, key, description, category, "createdAt", "updatedAt", is_active) FROM stdin;
\.


--
-- TOC entry 5203 (class 0 OID 22447)
-- Dependencies: 255
-- Data for Name: role_function_permissions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.role_function_permissions (id, role, "createdAt", "updatedAt", function_id, is_enabled) FROM stdin;
\.


--
-- TOC entry 5177 (class 0 OID 22151)
-- Dependencies: 229
-- Data for Name: sales; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.sales (id, user_id, draw_id, bet_type, total_amount, ticket_count, "createdAt") FROM stdin;
1	4	4	standard	80	8	2025-09-25 00:00:00
2	4	5	standard	10	1	2025-09-25 00:00:00
\.


--
-- TOC entry 5215 (class 0 OID 23692)
-- Dependencies: 267
-- Data for Name: security_audit; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.security_audit (id, user_id, ip_address, user_agent, created_at, description, event_type) FROM stdin;
\.


--
-- TOC entry 5213 (class 0 OID 23682)
-- Dependencies: 265
-- Data for Name: system_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.system_logs (id, user_id, action, category, details, ip_address, user_agent, created_at) FROM stdin;
\.


--
-- TOC entry 5189 (class 0 OID 22207)
-- Dependencies: 241
-- Data for Name: system_settings; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.system_settings (id, setting_key, setting_value, description, updated_by, updated_at) FROM stdin;
\.


--
-- TOC entry 5205 (class 0 OID 22520)
-- Dependencies: 257
-- Data for Name: ticket_reprints; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.ticket_reprints (id, ticket_id, reprinted_by_id, reprint_number, "createdAt") FROM stdin;
\.


--
-- TOC entry 5169 (class 0 OID 22107)
-- Dependencies: 221
-- Data for Name: user_balances; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.user_balances (id, user_id, current_balance, last_updated, "createdAt") FROM stdin;
1	1	0	2025-09-24 15:56:08.305	2025-09-24 15:56:08.307
3	3	1000	2025-09-24 16:24:58.562	2025-09-24 16:23:46.761
2	2	1000	2025-09-24 16:25:01.592	2025-09-24 16:23:28.416
4	4	910	2025-09-24 21:21:27.158	2025-09-24 16:24:18.152
\.


--
-- TOC entry 5220 (class 0 OID 23759)
-- Dependencies: 272
-- Data for Name: user_bet_limits; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.user_bet_limits (id, user_id, draw_id, bet_type, max_amount, current_amount, created_at, updated_at) FROM stdin;
10	4	5	standard	1000.00	10.00	2025-09-24 19:47:44.728733	2025-09-24 19:47:44.728733
7	4	4	standard	1000.00	80.00	2025-09-24 19:25:26.08836	2025-09-24 19:25:26.08836
\.


--
-- TOC entry 5199 (class 0 OID 22257)
-- Dependencies: 251
-- Data for Name: winning_prizes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.winning_prizes (id, bet_type, prize_amount, is_active, "createdAt", "updatedAt") FROM stdin;
\.


--
-- TOC entry 5181 (class 0 OID 22167)
-- Dependencies: 233
-- Data for Name: winning_tickets; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.winning_tickets (id, ticket_id, draw_id, prize_amount, is_claimed, claimed_at, "createdAt") FROM stdin;
\.


--
-- TOC entry 5226 (class 0 OID 0)
-- Dependencies: 244
-- Name: agent_ticket_templates_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.agent_ticket_templates_id_seq', 1, true);


--
-- TOC entry 5227 (class 0 OID 0)
-- Dependencies: 269
-- Name: audit_log_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.audit_log_id_seq', 13, true);


--
-- TOC entry 5228 (class 0 OID 0)
-- Dependencies: 222
-- Name: balance_transactions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.balance_transactions_id_seq', 19, true);


--
-- TOC entry 5229 (class 0 OID 0)
-- Dependencies: 236
-- Name: bet_limits_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.bet_limits_id_seq', 4, true);


--
-- TOC entry 5230 (class 0 OID 0)
-- Dependencies: 248
-- Name: bet_limits_per_draw_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.bet_limits_per_draw_id_seq', 20, true);


--
-- TOC entry 5231 (class 0 OID 0)
-- Dependencies: 260
-- Name: bets_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.bets_id_seq', 9, true);


--
-- TOC entry 5232 (class 0 OID 0)
-- Dependencies: 230
-- Name: commissions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.commissions_id_seq', 1, false);


--
-- TOC entry 5233 (class 0 OID 0)
-- Dependencies: 238
-- Name: current_bet_totals_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.current_bet_totals_id_seq', 9, true);


--
-- TOC entry 5234 (class 0 OID 0)
-- Dependencies: 246
-- Name: draw_results_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.draw_results_id_seq', 1, false);


--
-- TOC entry 5235 (class 0 OID 0)
-- Dependencies: 224
-- Name: draws_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.draws_id_seq', 45, true);


--
-- TOC entry 5236 (class 0 OID 0)
-- Dependencies: 262
-- Name: login_audit_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.login_audit_id_seq', 1, false);


--
-- TOC entry 5237 (class 0 OID 0)
-- Dependencies: 234
-- Name: notifications_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.notifications_id_seq', 1, false);


--
-- TOC entry 5238 (class 0 OID 0)
-- Dependencies: 258
-- Name: prize_configurations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.prize_configurations_id_seq', 2, true);


--
-- TOC entry 5239 (class 0 OID 0)
-- Dependencies: 216
-- Name: regions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.regions_id_seq', 1, true);


--
-- TOC entry 5240 (class 0 OID 0)
-- Dependencies: 254
-- Name: role_function_permissions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.role_function_permissions_id_seq', 1, false);


--
-- TOC entry 5241 (class 0 OID 0)
-- Dependencies: 228
-- Name: sales_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.sales_id_seq', 2, true);


--
-- TOC entry 5242 (class 0 OID 0)
-- Dependencies: 266
-- Name: security_audit_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.security_audit_id_seq', 1, false);


--
-- TOC entry 5243 (class 0 OID 0)
-- Dependencies: 252
-- Name: system_functions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.system_functions_id_seq', 1, false);


--
-- TOC entry 5244 (class 0 OID 0)
-- Dependencies: 264
-- Name: system_logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.system_logs_id_seq', 1, false);


--
-- TOC entry 5245 (class 0 OID 0)
-- Dependencies: 240
-- Name: system_settings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.system_settings_id_seq', 1, false);


--
-- TOC entry 5246 (class 0 OID 0)
-- Dependencies: 256
-- Name: ticket_reprints_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.ticket_reprints_id_seq', 1, false);


--
-- TOC entry 5247 (class 0 OID 0)
-- Dependencies: 242
-- Name: ticket_templates_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.ticket_templates_id_seq', 1, true);


--
-- TOC entry 5248 (class 0 OID 0)
-- Dependencies: 226
-- Name: tickets_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.tickets_id_seq', 16, true);


--
-- TOC entry 5249 (class 0 OID 0)
-- Dependencies: 220
-- Name: user_balances_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.user_balances_id_seq', 7, true);


--
-- TOC entry 5250 (class 0 OID 0)
-- Dependencies: 271
-- Name: user_bet_limits_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.user_bet_limits_id_seq', 15, true);


--
-- TOC entry 5251 (class 0 OID 0)
-- Dependencies: 218
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_id_seq', 4, true);


--
-- TOC entry 5252 (class 0 OID 0)
-- Dependencies: 250
-- Name: winning_prizes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.winning_prizes_id_seq', 1, false);


--
-- TOC entry 5253 (class 0 OID 0)
-- Dependencies: 232
-- Name: winning_tickets_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.winning_tickets_id_seq', 1, false);


-- Completed on 2025-09-25 13:01:01

--
-- PostgreSQL database dump complete
--

\unrestrict E3q9KlkwkQb7Nz1uNRqRWCLPr9dhxpp97g2yjfA6Gd12zsb1Obe5Snn9P6OYTg1

