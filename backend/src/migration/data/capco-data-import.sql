-- =============================================
-- CAPCO DATA EXPORT - All public tables
-- Generated: 2026-02-13
-- =============================================

-- Disable FK checks during import
SET session_replication_role = 'replica';

-- ===================
-- 1. USER_ROLES (3 rows)
-- ===================
INSERT INTO public.user_roles (id, user_id, role, created_at) VALUES
('e66302e1-5cfc-4fc5-bfe4-765c1ee4c2cd', '5e01a3d3-cacf-4004-a5ee-20983d49b004', 'collaborateur', '2026-01-19 23:55:10.672609+00'),
('699ebb9a-0c39-4507-87d8-4983978b026f', 'f5f5e4a3-8f1c-4462-a5aa-c53297a5316c', 'admin', '2026-01-20 00:09:39.555106+00'),
('046abc70-e4af-4ba2-9478-b81adf8a71d2', '9aa7f986-a54a-440e-9b89-b230c7806c75', 'compta', '2026-01-20 00:10:19.553334+00')
ON CONFLICT (id) DO NOTHING;

-- ===================
-- 2. PROPRIETAIRES (13 rows)
-- ===================
INSERT INTO public.proprietaires (id, nom, telephone, email, adresse, created_at, created_by) VALUES
('924f21f1-3a61-4198-b86c-505e42df4873', 'Adja COGNA', '776536739', NULL, 'Patte d''oie Builders, DAKAR', '2026-01-20 03:23:19.610684+00', 'f5f5e4a3-8f1c-4462-a5aa-c53297a5316c'),
('d6f6ba00-5b00-4db7-9008-746aa1f3213b', 'Adji Mbow TALL', '775649800', NULL, 'Nord foire, DAKAR', '2026-01-20 03:23:19.907277+00', 'f5f5e4a3-8f1c-4462-a5aa-c53297a5316c'),
('4bce363d-d483-49d4-bd2d-ed80c202a88a', 'Mame Khady SECK', '771561352', NULL, 'Thiaroye azur, DAKAR', '2026-01-20 03:23:20.20236+00', 'f5f5e4a3-8f1c-4462-a5aa-c53297a5316c'),
('1dd7f518-1c20-4d7c-92e1-56eee2812077', 'Arame DIOUF CISSE', '776158486', NULL, 'USA', '2026-01-20 03:23:20.47438+00', 'f5f5e4a3-8f1c-4462-a5aa-c53297a5316c'),
('961c0f1e-b2b5-4d49-bfbc-5895b078c3f3', 'FALO BEYE', '13143229700', NULL, 'USA', '2026-01-20 03:23:20.732321+00', 'f5f5e4a3-8f1c-4462-a5aa-c53297a5316c'),
('a08101af-be2f-46ce-ba0f-0698ee4e6358', 'Fama Isaac SENE', '776390416', NULL, 'Nord foire, DAKAR', '2026-01-20 03:23:20.979303+00', 'f5f5e4a3-8f1c-4462-a5aa-c53297a5316c'),
('6ad1e686-0225-4de2-bf48-a0fc3dec82fb', 'Hélène WONE', '33661563005', NULL, 'France', '2026-01-20 03:23:21.211387+00', 'f5f5e4a3-8f1c-4462-a5aa-c53297a5316c'),
('c64fc520-6558-4680-ba17-d95365a65cc5', 'Ibrahima DIOP', '775465663', NULL, 'Italie', '2026-01-20 03:23:21.444417+00', 'f5f5e4a3-8f1c-4462-a5aa-c53297a5316c'),
('9bf6d292-6d49-4139-bc41-93466a63d915', 'KARA DIOP', NULL, NULL, 'USA', '2026-01-20 03:23:21.682172+00', 'f5f5e4a3-8f1c-4462-a5aa-c53297a5316c'),
('d6755a4b-3dd9-4bfb-8851-49d1628e9d8c', 'Maniang NIANG', '778762772', NULL, 'Hann Maristes lot D/59, DAKAR', '2026-01-20 03:23:21.914949+00', 'f5f5e4a3-8f1c-4462-a5aa-c53297a5316c'),
('22394b3c-aaca-441c-8831-a898a9cc7227', 'Moctar SALL', NULL, NULL, 'Italie', '2026-01-20 03:23:22.154268+00', 'f5f5e4a3-8f1c-4462-a5aa-c53297a5316c'),
('ca924c55-eac8-4637-9e1d-97243a9a083f', 'Ndiaga LO', '776449607', NULL, 'Mbao, DAKAR', '2026-01-20 03:23:22.38794+00', 'f5f5e4a3-8f1c-4462-a5aa-c53297a5316c'),
('b08c7ebc-40d4-4760-86fc-54820670f103', 'Ousmane Madiagne DIOP', '775590414', NULL, 'Sacré Cœur 3, DAKAR / SUISSE', '2026-01-20 03:23:22.622312+00', 'f5f5e4a3-8f1c-4462-a5aa-c53297a5316c')
ON CONFLICT (id) DO NOTHING;

-- ===================
-- 3. LOCATAIRES (48 rows)
-- ===================
INSERT INTO public.locataires (id, nom, telephone, email, created_at, created_by) VALUES
('23b7eea9-e546-4d50-bafc-8a900904d200', 'Souleymane NIANG', '773332881', 'marie@email.com', '2026-01-20 03:23:22.961651+00', 'f5f5e4a3-8f1c-4462-a5aa-c53297a5316c'),
('49eb383c-d11c-4696-9733-c1157e812fcf', 'SEGA DIOP', NULL, NULL, '2026-01-20 03:23:23.193459+00', 'f5f5e4a3-8f1c-4462-a5aa-c53297a5316c'),
('65497f34-5733-4850-af68-3ec033831845', 'papa Mama Drame', '775675754', NULL, '2026-01-20 03:23:23.427416+00', 'f5f5e4a3-8f1c-4462-a5aa-c53297a5316c'),
('bdda901d-1274-4289-acec-597bd410e125', 'Cheikh Oumar DIOUF', NULL, NULL, '2026-01-20 03:23:23.663125+00', 'f5f5e4a3-8f1c-4462-a5aa-c53297a5316c'),
('51b7a4be-23c7-4b77-a7ec-c9c1c35bbf48', 'Bamba GNA DEBAROS', NULL, NULL, '2026-01-20 03:23:23.892427+00', 'f5f5e4a3-8f1c-4462-a5aa-c53297a5316c'),
('adf2316a-02c4-421d-a294-b189e65f641f', 'Maniang NIANG', NULL, NULL, '2026-01-20 03:23:24.112751+00', 'f5f5e4a3-8f1c-4462-a5aa-c53297a5316c'),
('989bf86b-638e-484d-8d3f-1428dacee02c', 'Oumar DIOP', NULL, NULL, '2026-01-20 03:23:24.355746+00', 'f5f5e4a3-8f1c-4462-a5aa-c53297a5316c'),
('b864a957-f802-4712-953e-35e509e3c659', 'Cheikh oilybia', NULL, NULL, '2026-01-20 03:23:24.589203+00', 'f5f5e4a3-8f1c-4462-a5aa-c53297a5316c'),
('b968aed1-429c-4eb5-bcc5-6281450d2286', 'Fatou Tacko DRAME', NULL, NULL, '2026-01-20 03:23:24.834942+00', 'f5f5e4a3-8f1c-4462-a5aa-c53297a5316c'),
('3ccf88bc-fa62-4d6c-be79-9f39e82d9e5a', 'Abdou DIOP', NULL, NULL, '2026-01-20 03:23:25.075184+00', 'f5f5e4a3-8f1c-4462-a5aa-c53297a5316c'),
('028ae9c8-5ee0-47d9-8a62-6883cdccd90c', 'Mame Diarra FAYE', NULL, NULL, '2026-01-20 03:23:25.314678+00', 'f5f5e4a3-8f1c-4462-a5aa-c53297a5316c'),
('b2914047-1c87-4e48-9cac-922f6f413825', 'Hamadou GASSAMA', NULL, NULL, '2026-01-20 03:23:25.558697+00', 'f5f5e4a3-8f1c-4462-a5aa-c53297a5316c'),
('e8cacbb6-fdb0-4871-bb4e-ee1340f568ea', 'Serigne Mbacké THIAM', NULL, NULL, '2026-01-20 03:23:25.80775+00', 'f5f5e4a3-8f1c-4462-a5aa-c53297a5316c'),
('65b5baa0-3aee-470f-bc59-75a16df7107a', 'Alioune DIALLO', NULL, NULL, '2026-01-20 03:23:26.050046+00', 'f5f5e4a3-8f1c-4462-a5aa-c53297a5316c'),
('5b08c03b-a055-47e8-8b70-08634a165677', 'Magueye NIANG', NULL, NULL, '2026-01-20 03:23:26.281919+00', 'f5f5e4a3-8f1c-4462-a5aa-c53297a5316c'),
('045af599-746e-41c1-9844-07b410f93dd9', 'Cheikh Oumar SARRE', NULL, NULL, '2026-01-20 03:23:26.516723+00', 'f5f5e4a3-8f1c-4462-a5aa-c53297a5316c'),
('0cbcec45-28cb-4d58-b65e-eb38357e0da1', 'Safiatou BA', NULL, NULL, '2026-01-20 03:23:26.752368+00', 'f5f5e4a3-8f1c-4462-a5aa-c53297a5316c'),
('35a8bd15-75d8-47c9-b8d0-5e145ce6edf0', 'Cheikh Fara GUEDEL (Khadim)', NULL, NULL, '2026-01-20 03:23:26.991384+00', 'f5f5e4a3-8f1c-4462-a5aa-c53297a5316c'),
('8ea2b3b3-4c80-43f4-a3b6-b27d558dfa59', 'Ousmane DIALLO', NULL, NULL, '2026-01-20 03:23:27.238622+00', 'f5f5e4a3-8f1c-4462-a5aa-c53297a5316c'),
('9d0465d4-a126-46ee-8b51-548def791718', 'Ramatoulaye SARR', NULL, NULL, '2026-01-20 03:23:27.480548+00', 'f5f5e4a3-8f1c-4462-a5aa-c53297a5316c'),
('07c261e5-aea4-41b3-85bd-07a01570c10c', 'AWA DIOP', NULL, NULL, '2026-01-20 03:23:27.718228+00', 'f5f5e4a3-8f1c-4462-a5aa-c53297a5316c'),
('3ac7f782-118c-44df-9f51-ccaa58b82b4f', 'Abdoukhadre DIEDJIOU', NULL, NULL, '2026-01-20 03:23:27.955707+00', 'f5f5e4a3-8f1c-4462-a5aa-c53297a5316c'),
('b32d098b-2bab-4ee1-8268-9c555c640b1d', 'Madione GAYE', NULL, NULL, '2026-01-20 03:23:28.181343+00', 'f5f5e4a3-8f1c-4462-a5aa-c53297a5316c'),
('23a5f0ba-144e-4677-aedd-6d2870599d75', 'MATTEL DIALLO', NULL, NULL, '2026-01-20 03:23:28.408041+00', 'f5f5e4a3-8f1c-4462-a5aa-c53297a5316c'),
('810655f2-d5b2-40aa-900b-61514ee8c287', 'Ibrahima GASSAMA', NULL, NULL, '2026-01-20 03:23:28.649004+00', 'f5f5e4a3-8f1c-4462-a5aa-c53297a5316c'),
('2fedc8e8-e4ea-4804-800d-f9c594198a33', 'Alione DIOP', NULL, NULL, '2026-01-20 03:23:28.892846+00', 'f5f5e4a3-8f1c-4462-a5aa-c53297a5316c'),
('f4aaedc4-36a7-4a77-86ae-87b170ba7eff', 'CAPITAL CONSEIL  CAPCO', NULL, NULL, '2026-01-20 03:23:29.12994+00', 'f5f5e4a3-8f1c-4462-a5aa-c53297a5316c'),
('26de143c-d8dc-41b1-b6a4-207ce87e34cc', 'Cheikh Yakhoub  DIA', NULL, NULL, '2026-01-20 03:23:29.366781+00', 'f5f5e4a3-8f1c-4462-a5aa-c53297a5316c'),
('b99940a1-1393-41e1-876f-36c9a7a12d23', 'Nafissatou CISSE', NULL, NULL, '2026-01-20 03:23:29.603033+00', 'f5f5e4a3-8f1c-4462-a5aa-c53297a5316c'),
('8d597048-ccf8-40a6-ab21-7ba1be8f32bd', 'Serigne Abo MBACKE', NULL, NULL, '2026-01-20 03:23:29.833174+00', 'f5f5e4a3-8f1c-4462-a5aa-c53297a5316c'),
('d894e3fd-6a4e-429c-9066-e9b954415c3a', 'Youssou NDIAYE', NULL, NULL, '2026-01-20 03:23:30.079841+00', 'f5f5e4a3-8f1c-4462-a5aa-c53297a5316c'),
('7f02a820-2fb3-4f4d-afbb-3195119b805c', 'Mame BALLA NDIAYE', NULL, NULL, '2026-01-20 03:23:30.308196+00', 'f5f5e4a3-8f1c-4462-a5aa-c53297a5316c'),
('92759158-6944-43bc-804e-db4cebeeb94a', 'Ahmet NDIAYE', NULL, NULL, '2026-01-20 03:23:30.545078+00', 'f5f5e4a3-8f1c-4462-a5aa-c53297a5316c'),
('fbd2e531-1783-47e2-af61-c6ba9dc61696', 'Gora BEYE', NULL, NULL, '2026-01-20 03:23:30.775524+00', 'f5f5e4a3-8f1c-4462-a5aa-c53297a5316c'),
('6ae72029-efa3-431b-8342-2e2c2792ab4a', 'Alioune  SECK', NULL, NULL, '2026-01-20 03:23:31.008569+00', 'f5f5e4a3-8f1c-4462-a5aa-c53297a5316c'),
('bba9d331-c14d-447a-85d0-8e10520811e9', 'Mamadou Cherif DIALLO', NULL, NULL, '2026-01-20 03:23:31.248994+00', 'f5f5e4a3-8f1c-4462-a5aa-c53297a5316c'),
('0c902658-32ac-4c01-b74b-714723de8c71', 'Pape Sidy FAYE', NULL, NULL, '2026-01-20 03:23:31.48845+00', 'f5f5e4a3-8f1c-4462-a5aa-c53297a5316c'),
('0c881068-93b7-434c-8602-dc1c893f07af', 'Abdou WALLOU', NULL, NULL, '2026-01-20 03:23:31.724286+00', 'f5f5e4a3-8f1c-4462-a5aa-c53297a5316c'),
('5812c308-237f-4074-808c-bd5ed757d288', 'Abdoulaye BA', NULL, NULL, '2026-01-20 03:23:31.950351+00', 'f5f5e4a3-8f1c-4462-a5aa-c53297a5316c'),
('c2df3f35-c30c-4fdb-bd05-76ee08a88c33', 'Kyle Coffman', NULL, NULL, '2026-01-20 03:23:32.181339+00', 'f5f5e4a3-8f1c-4462-a5aa-c53297a5316c'),
('864f77ca-dc38-4f55-88fb-19e0f3ade3db', 'Ovinigui MAOU', NULL, NULL, '2026-01-20 03:23:32.433688+00', 'f5f5e4a3-8f1c-4462-a5aa-c53297a5316c'),
('1fe8578f-79e3-48fc-9238-4a9f962ecbe8', 'Papa Momar DIOP', NULL, NULL, '2026-01-20 03:23:32.669282+00', 'f5f5e4a3-8f1c-4462-a5aa-c53297a5316c'),
('606b3347-e97d-4482-a5f7-b8e9ff0d95b7', 'PROFIX', NULL, NULL, '2026-01-20 03:23:32.90484+00', 'f5f5e4a3-8f1c-4462-a5aa-c53297a5316c'),
('0609b64a-d4a7-4588-8948-7221c21544a2', 'Abdoul Majid', NULL, NULL, '2026-01-20 03:23:33.153189+00', 'f5f5e4a3-8f1c-4462-a5aa-c53297a5316c'),
('d72b0cc5-787e-4d28-ba68-99310ffb22ae', 'Alioune DIOP', NULL, NULL, '2026-01-20 03:29:58.617203+00', 'f5f5e4a3-8f1c-4462-a5aa-c53297a5316c'),
('0d03e728-8397-403b-a06c-44fcdf7d29da', 'ECE', '+221771107460', NULL, '2026-01-20 22:17:51.893536+00', 'f5f5e4a3-8f1c-4462-a5aa-c53297a5316c'),
('b6a79313-8b53-4f33-9d56-ce0ff76f5ab4', 'Moussa DIAO', NULL, NULL, '2026-01-22 13:49:27.731853+00', 'f5f5e4a3-8f1c-4462-a5aa-c53297a5316c'),
('08e263b1-bb70-42d1-89f3-74b816fdd19b', 'Pape Mor SYLLA', '+221772554569', NULL, '2026-02-05 16:11:35.451181+00', 'f5f5e4a3-8f1c-4462-a5aa-c53297a5316c')
ON CONFLICT (id) DO NOTHING;
-- ===================
-- 4. IMMEUBLES (17 rows)
-- ===================
INSERT INTO public.immeubles (id, nom, reference, adresse, proprietaire_id, taux_commission_capco, notes, created_at, created_by) VALUES
('facb60f2-4753-4972-bad0-b7e2b7dd23e6', 'Cité des fonctionnaires, DIAMNIADIO', 'IMM-2026-0001', 'Cité des fonctionnaires, DIAMNIADIO', '924f21f1-3a61-4198-b86c-505e42df4873', 0.10, 'Villa RDC', '2026-01-20 03:29:47.049792+00', 'f5f5e4a3-8f1c-4462-a5aa-c53297a5316c'),
('ba75a43b-b97f-41ae-9aef-a1670fe9294e', 'Patte d''Oie Builders Builders Villa E/20', 'IMM-2026-0002', 'Patte d''Oie Builders Builders Villa E/20', '924f21f1-3a61-4198-b86c-505e42df4873', 10.00, 'Immeuble de 04 lots', '2026-01-20 03:29:47.458187+00', 'f5f5e4a3-8f1c-4462-a5aa-c53297a5316c'),
('f6b4b4a2-b4a6-4a50-84f9-a3686ae35fe0', 'Parcelles Assainies, THIES', 'IMM-2026-0003', 'Parcelles Assainies, THIES ', 'd6f6ba00-5b00-4db7-9008-746aa1f3213b', 10.00, 'Villa RDC', '2026-01-20 03:29:47.7796+00', 'f5f5e4a3-8f1c-4462-a5aa-c53297a5316c'),
('3a5f9e12-f2af-4aa1-a222-fa8bc5b55292', 'Cité APIX, tivaoune Peulh', 'IMM-2026-0004', 'Cité APIX, tivaoune Peulh', '4bce363d-d483-49d4-bd2d-ed80c202a88a', 10.00, 'Villa RDC', '2026-01-20 03:29:48.100226+00', 'f5f5e4a3-8f1c-4462-a5aa-c53297a5316c'),
('384d72bf-6554-4acf-8bd7-b64bd9116fff', 'Ngor Extension Lot 109', 'IMM-2026-0005', 'Ngor Extension Lot 109', '1dd7f518-1c20-4d7c-92e1-56eee2812077', 6.00, 'Immeuble de 5 lots', '2026-01-20 03:29:48.418366+00', 'f5f5e4a3-8f1c-4462-a5aa-c53297a5316c'),
('a9707900-8d38-4365-980a-8a1c8f78a9c4', 'Cité Aliou SOW, GUEDIAWAYE', 'IMM-2026-0006', 'Cité Aliou SOW, GUEDIAWAYE', '961c0f1e-b2b5-4d49-bfbc-5895b078c3f3', 5.00, 'Villa R+1', '2026-01-20 03:29:48.719253+00', 'f5f5e4a3-8f1c-4462-a5aa-c53297a5316c'),
('da121e3c-1126-44f9-b853-47b771dccff1', 'KM 15 DIAMEGUEUNE', 'IMM-2026-0007', 'KM 15 DIAMEGUEUNE ', 'a08101af-be2f-46ce-ba0f-0698ee4e6358', 8.00, 'Immeuble de 03 lots', '2026-01-20 03:29:49.044313+00', 'f5f5e4a3-8f1c-4462-a5aa-c53297a5316c'),
('7e3f6662-1f75-4c50-8ac3-02593b112717', 'Cité SIPRES, BAYAKH', 'IMM-2026-0008', 'Cité SIPRES, BAYAKH', '6ad1e686-0225-4de2-bf48-a0fc3dec82fb', 10.00, 'Villa R+1', '2026-01-20 03:29:49.357792+00', 'f5f5e4a3-8f1c-4462-a5aa-c53297a5316c'),
('a8c3dd72-d12f-4c8b-94ba-1001e244dd8c', 'HLM Grand Yoff', 'IMM-2026-0009', 'HLM Grand Yoff ', 'c64fc520-6558-4680-ba17-d95365a65cc5', 8.00, 'Immeuble de 06 lots', '2026-01-20 03:29:49.67094+00', 'f5f5e4a3-8f1c-4462-a5aa-c53297a5316c'),
('73b4ad8b-5dc6-403c-acbe-e1082af781cd', 'Liberté 4, Résidence ZEIKA', 'IMM-2026-0010', 'Liberté 4, Résidence ZEIKA', '9bf6d292-6d49-4139-bc41-93466a63d915', 10.00, '1 appartement', '2026-01-20 03:29:50.008181+00', 'f5f5e4a3-8f1c-4462-a5aa-c53297a5316c'),
('2766048d-4386-413b-b2e4-a5e3281f8880', 'Hann Maristes 1 D/59', 'IMM-2026-0011', 'Hann Maristes 1 D/59', 'd6755a4b-3dd9-4bfb-8851-49d1628e9d8c', 7.00, 'Immeuble de 12 lots', '2026-01-20 03:29:50.418826+00', 'f5f5e4a3-8f1c-4462-a5aa-c53297a5316c'),
('33b7b6cc-2fa8-4ec3-90ea-72b9865410fa', 'CAMBERENE 2', 'IMM-2026-0012', 'CAMBERENE 2', '22394b3c-aaca-441c-8831-a898a9cc7227', 10.00, 'Villa RDC', '2026-01-20 03:29:50.728097+00', 'f5f5e4a3-8f1c-4462-a5aa-c53297a5316c'),
('fbeeed16-79a1-4816-972a-b8075026c9e1', 'Cité Aliou SOW, Fass MBAO', 'IMM-2026-0013', 'Cité Aliou SOW, Fass MBAO', '22394b3c-aaca-441c-8831-a898a9cc7227', 10.00, 'Immeuble de 04 lots', '2026-01-20 03:29:51.037066+00', 'f5f5e4a3-8f1c-4462-a5aa-c53297a5316c'),
('d0e12094-140e-45d1-9bd3-fd76009c5b23', 'Liberté 6 Extension, lot 18', 'IMM-2026-0014', 'Liberté 6 Extension, lot 18', 'ca924c55-eac8-4637-9e1d-97243a9a083f', 5.00, 'Immeuble de 08 lots', '2026-01-20 03:29:51.351327+00', 'f5f5e4a3-8f1c-4462-a5aa-c53297a5316c'),
('04b7ec90-0d8d-4e0c-b6da-edbab1816c2d', 'Cité Pasteur lot i/27, Fass Mbao', 'IMM-2026-0015', 'Cité Pasteur lot i/27, Fass Mbao', 'b08c7ebc-40d4-4760-86fc-54820670f103', 10.00, 'Immeuble de 04 lots', '2026-01-20 03:29:51.666862+00', 'f5f5e4a3-8f1c-4462-a5aa-c53297a5316c'),
('2079af1f-ea16-4323-a7e7-43da6ae516e9', 'Sacré Cœur 3 villa n`9914', 'IMM-2026-0016', 'Sacré Cœur 3 villa n`9914 ', 'b08c7ebc-40d4-4760-86fc-54820670f103', 8.00, 'Immeuble de 03 lots', '2026-01-20 03:29:51.973258+00', 'f5f5e4a3-8f1c-4462-a5aa-c53297a5316c')
ON CONFLICT (id) DO NOTHING;