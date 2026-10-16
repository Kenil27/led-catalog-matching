# Retrieval evaluation

Date: 2026-09-26

Match levels used by `/api/search` are uncalibrated Phase 1 buckets (`high >= 0.75`, `possible >= 0.60`, else `low`). They are not probabilities.

## CATALOG HOLDOUT EVALUATION

This is **not** customer-photo accuracy.

Protocol: lifestyle catalog image queries the index using its **already-indexed vector** (no second Gemini embed); the query image itself is excluded; success is retrieving the same `productId` (typically via its studio view).

## Holdout metrics

Cases: 308

| Metric | Value |
| --- | --- |
| Top-1 | 40.9% |
| Top-3 | 63.0% |
| Top-5 | 67.2% |

Per-case:

```text
query-image	expected-productId	top-1	top-3	top-5
data/extracted/products/ceiling-lights-2026-p5-ryx-v01/lifestyle-3744.png	ceiling-lights-2026-p5-ryx-v01	false	false	false
data/extracted/products/ceiling-lights-2026-p6-1002-cl/lifestyle-2506.png	ceiling-lights-2026-p6-1002-cl	false	false	false
data/extracted/products/ceiling-lights-2026-p7-4492-380-480-600/lifestyle-2542.png	ceiling-lights-2026-p7-4492-380-480-600	true	true	true
data/extracted/products/ceiling-lights-2026-p8-9292-56/lifestyle-2576.png	ceiling-lights-2026-p8-9292-56	false	true	true
data/extracted/products/ceiling-lights-2026-p9-1013/lifestyle-2611.jpg	ceiling-lights-2026-p9-1013	false	true	true
data/extracted/products/ceiling-lights-2026-p10-1014/lifestyle-2647.png	ceiling-lights-2026-p10-1014	false	false	false
data/extracted/products/ceiling-lights-2026-p11-lm412-42-56-72/lifestyle-2683.png	ceiling-lights-2026-p11-lm412-42-56-72	true	true	true
data/extracted/products/ceiling-lights-2026-p12-dg9163/lifestyle-2716.jpg	ceiling-lights-2026-p12-dg9163	false	false	false
data/extracted/products/ceiling-lights-2026-p13-bm1992/lifestyle-2750.jpg	ceiling-lights-2026-p13-bm1992	false	false	false
data/extracted/products/ceiling-lights-2026-p14-bm1994-c/lifestyle-2784.png	ceiling-lights-2026-p14-bm1994-c	false	false	true
data/extracted/products/ceiling-lights-2026-p15-bm1994a-c/lifestyle-3876.png	ceiling-lights-2026-p15-bm1994a-c	false	false	false
data/extracted/products/ceiling-lights-2026-p16-lm712-32-52-a/lifestyle-2849.png	ceiling-lights-2026-p16-lm712-32-52-a	false	false	false
data/extracted/products/ceiling-lights-2026-p17-lm712-32-52-b/lifestyle-2882.png	ceiling-lights-2026-p17-lm712-32-52-b	false	false	false
data/extracted/products/ceiling-lights-2026-p18-lm9065-40-50/lifestyle-2918.png	ceiling-lights-2026-p18-lm9065-40-50	false	true	true
data/extracted/products/ceiling-lights-2026-p19-lm605-40-50/lifestyle-2952.png	ceiling-lights-2026-p19-lm605-40-50	true	true	true
data/extracted/products/ceiling-lights-2026-p20-lm8302/lifestyle-2985.png	ceiling-lights-2026-p20-lm8302	false	false	false
data/extracted/products/ceiling-lights-2026-p21-lm8952-50/lifestyle-3021.png	ceiling-lights-2026-p21-lm8952-50	false	false	false
data/extracted/products/ceiling-lights-2026-p22-mc-020/lifestyle-3055.png	ceiling-lights-2026-p22-mc-020	true	true	true
data/extracted/products/ceiling-lights-2026-p23-lm-x9069-37-47-57/lifestyle-3085.png	ceiling-lights-2026-p23-lm-x9069-37-47-57	true	true	true
data/extracted/products/ceiling-lights-2026-p24-lm8993-40-50/lifestyle-3118.png	ceiling-lights-2026-p24-lm8993-40-50	false	true	true
data/extracted/products/ceiling-lights-2026-p25-gll-3956-60/lifestyle-3154.png	ceiling-lights-2026-p25-gll-3956-60	false	true	true
data/extracted/products/ceiling-lights-2026-p26-x7012/lifestyle-3191.png	ceiling-lights-2026-p26-x7012	false	false	false
data/extracted/products/ceiling-lights-2026-p27-lm9040-1/lifestyle-3223.png	ceiling-lights-2026-p27-lm9040-1	false	false	true
data/extracted/products/ceiling-lights-2026-p28-a-2/lifestyle-3259.png	ceiling-lights-2026-p28-a-2	true	true	true
data/extracted/products/ceiling-lights-2026-p29-2370/lifestyle-3295.png	ceiling-lights-2026-p29-2370	true	true	true
data/extracted/products/ceiling-lights-2026-p30-lm9082-50b/lifestyle-3331.png	ceiling-lights-2026-p30-lm9082-50b	false	true	true
data/extracted/products/ceiling-lights-2026-p31-a231-c/lifestyle-3364.png	ceiling-lights-2026-p31-a231-c	true	true	true
data/extracted/products/ceiling-lights-2026-p32-walnutlight-source-led-3-in-1/lifestyle-3398.png	ceiling-lights-2026-p32-walnutlight-source-led-3-in-1	true	true	true
data/extracted/products/ceiling-lights-2026-p33-lm-x9010-32-47/lifestyle-3431.png	ceiling-lights-2026-p33-lm-x9010-32-47	false	true	true
data/extracted/products/ceiling-lights-2026-p34-1006/lifestyle-3467.jpg	ceiling-lights-2026-p34-1006	false	true	true
data/extracted/products/ceiling-lights-2026-p35-1012/lifestyle-3501.png	ceiling-lights-2026-p35-1012	false	false	false
data/extracted/products/ceiling-lights-2026-p36-1002-co/lifestyle-3539.png	ceiling-lights-2026-p36-1002-co	false	true	true
data/extracted/products/ceiling-lights-2026-p37-lm3080/lifestyle-3576.png	ceiling-lights-2026-p37-lm3080	false	true	true
data/extracted/products/ceiling-lights-2026-p38-lm-x9024-30/lifestyle-3609.png	ceiling-lights-2026-p38-lm-x9024-30	true	true	true
data/extracted/products/chandelier-lights-2026-p7-dz9125-1/lifestyle-7691.png	chandelier-lights-2026-p7-dz9125-1	false	false	false
data/extracted/products/chandelier-lights-2026-p8-dz9122-1/lifestyle-5184.png	chandelier-lights-2026-p8-dz9122-1	false	false	false
data/extracted/products/chandelier-lights-2026-p9-70055-18/lifestyle-5217.png	chandelier-lights-2026-p9-70055-18	false	false	false
data/extracted/products/chandelier-lights-2026-p10-70010-13/lifestyle-2500.png	chandelier-lights-2026-p10-70010-13	true	true	true
data/extracted/products/chandelier-lights-2026-p11-d318-3-bk/lifestyle-5282.png	chandelier-lights-2026-p11-d318-3-bk	false	true	true
data/extracted/products/chandelier-lights-2026-p12-d318-2-bk/lifestyle-5316.png	chandelier-lights-2026-p12-d318-2-bk	false	true	true
data/extracted/products/chandelier-lights-2026-p13-v2-3/lifestyle-5349.png	chandelier-lights-2026-p13-v2-3	false	false	false
data/extracted/products/chandelier-lights-2026-p14-d32-3/lifestyle-5386.png	chandelier-lights-2026-p14-d32-3	false	false	true
data/extracted/products/chandelier-lights-2026-p15-d123/lifestyle-5416.png	chandelier-lights-2026-p15-d123	false	false	false
data/extracted/products/chandelier-lights-2026-p16-d263-b/lifestyle-5453.png	chandelier-lights-2026-p16-d263-b	true	true	true
data/extracted/products/chandelier-lights-2026-p17-d288-g/lifestyle-5483.png	chandelier-lights-2026-p17-d288-g	false	false	false
data/extracted/products/chandelier-lights-2026-p18-lm2918-l/lifestyle-5516.png	chandelier-lights-2026-p18-lm2918-l	true	true	true
data/extracted/products/chandelier-lights-2026-p19-d3008-5-8/lifestyle-5546.png	chandelier-lights-2026-p19-d3008-5-8	true	true	true
data/extracted/products/chandelier-lights-2026-p20-l6636-5p/lifestyle-5579.png	chandelier-lights-2026-p20-l6636-5p	true	true	true
data/extracted/products/chandelier-lights-2026-p21-lm727-120/lifestyle-5614.png	chandelier-lights-2026-p21-lm727-120	true	true	true
data/extracted/products/chandelier-lights-2026-p22-hd2133-6/lifestyle-5648.png	chandelier-lights-2026-p22-hd2133-6	false	false	false
data/extracted/products/chandelier-lights-2026-p23-hd218-14/lifestyle-5679.png	chandelier-lights-2026-p23-hd218-14	false	false	false
data/extracted/products/chandelier-lights-2026-p24-hd2117-14/lifestyle-5710.png	chandelier-lights-2026-p24-hd2117-14	false	false	false
data/extracted/products/chandelier-lights-2026-p25-3129-h/lifestyle-5742.png	chandelier-lights-2026-p25-3129-h	false	true	true
data/extracted/products/chandelier-lights-2026-p26-a060-6/lifestyle-5774.png	chandelier-lights-2026-p26-a060-6	false	false	false
data/extracted/products/chandelier-lights-2026-p27-a235-6/lifestyle-5806.png	chandelier-lights-2026-p27-a235-6	false	false	true
data/extracted/products/chandelier-lights-2026-p28-a234-11/lifestyle-5839.png	chandelier-lights-2026-p28-a234-11	true	true	true
data/extracted/products/chandelier-lights-2026-p29-a140/lifestyle-5871.png	chandelier-lights-2026-p29-a140	false	false	true
data/extracted/products/chandelier-lights-2026-p30-a120-5/lifestyle-5903.png	chandelier-lights-2026-p30-a120-5	false	false	false
data/extracted/products/chandelier-lights-2026-p31-a166-16/lifestyle-5933.png	chandelier-lights-2026-p31-a166-16	false	false	false
data/extracted/products/chandelier-lights-2026-p32-a170-12/lifestyle-5965.png	chandelier-lights-2026-p32-a170-12	false	false	false
data/extracted/products/chandelier-lights-2026-p33-a038-10/lifestyle-5997.png	chandelier-lights-2026-p33-a038-10	true	true	true
data/extracted/products/chandelier-lights-2026-p34-a049-10/lifestyle-6028.png	chandelier-lights-2026-p34-a049-10	false	false	true
data/extracted/products/chandelier-lights-2026-p35-yh112a/lifestyle-6057.jpg	chandelier-lights-2026-p35-yh112a	false	false	false
data/extracted/products/chandelier-lights-2026-p36-a231-10/lifestyle-6090.png	chandelier-lights-2026-p36-a231-10	true	true	true
data/extracted/products/chandelier-lights-2026-p37-a233-5/lifestyle-6120.png	chandelier-lights-2026-p37-a233-5	true	true	true
data/extracted/products/chandelier-lights-2026-p38-7045-5/lifestyle-6155.png	chandelier-lights-2026-p38-7045-5	false	false	false
data/extracted/products/chandelier-lights-2026-p39-5701/lifestyle-6187.jpg	chandelier-lights-2026-p39-5701	true	true	true
data/extracted/products/chandelier-lights-2026-p40-d654-5/lifestyle-6219.png	chandelier-lights-2026-p40-d654-5	true	true	true
data/extracted/products/chandelier-lights-2026-p41-colour-golden/lifestyle-6251.jpg	chandelier-lights-2026-p41-colour-golden	true	true	true
data/extracted/products/chandelier-lights-2026-p42-d644-5-8/lifestyle-6282.png	chandelier-lights-2026-p42-d644-5-8	false	true	true
data/extracted/products/chandelier-lights-2026-p43-h2514-5-8/lifestyle-6315.png	chandelier-lights-2026-p43-h2514-5-8	false	false	false
data/extracted/products/chandelier-lights-2026-p44-289-dc10/lifestyle-6347.png	chandelier-lights-2026-p44-289-dc10	false	false	false
data/extracted/products/chandelier-lights-2026-p45-25-6-h/lifestyle-6376.png	chandelier-lights-2026-p45-25-6-h	true	true	true
data/extracted/products/chandelier-lights-2026-p46-257-d120/lifestyle-6411.png	chandelier-lights-2026-p46-257-d120	true	true	true
data/extracted/products/chandelier-lights-2026-p47-257-d3-d5/lifestyle-6443.png	chandelier-lights-2026-p47-257-d3-d5	true	true	true
data/extracted/products/chandelier-lights-2026-p48-7727-12/lifestyle-6473.png	chandelier-lights-2026-p48-7727-12	true	true	true
data/extracted/products/chandelier-lights-2026-p49-6644s-b9/lifestyle-6505.png	chandelier-lights-2026-p49-6644s-b9	false	false	false
data/extracted/products/chandelier-lights-2026-p50-6644s-c9/lifestyle-6537.png	chandelier-lights-2026-p50-6644s-c9	false	false	false
data/extracted/products/chandelier-lights-2026-p51-6644s-d9/lifestyle-6568.png	chandelier-lights-2026-p51-6644s-d9	true	true	true
data/extracted/products/chandelier-lights-2026-p52-5237-6/lifestyle-8206.jpg	chandelier-lights-2026-p52-5237-6	true	true	true
data/extracted/products/chandelier-lights-2026-p53-291-d9-d15/lifestyle-6632.png	chandelier-lights-2026-p53-291-d9-d15	false	false	false
data/extracted/products/chandelier-lights-2026-p54-25-6-j3/lifestyle-6665.png	chandelier-lights-2026-p54-25-6-j3	true	true	true
data/extracted/products/chandelier-lights-2026-p55-golden-white/lifestyle-6697.png	chandelier-lights-2026-p55-golden-white	false	true	true
data/extracted/products/chandelier-lights-2026-p56-d1005-6/lifestyle-6735.png	chandelier-lights-2026-p56-d1005-6	false	false	false
data/extracted/products/chandelier-lights-2026-p57-25-6-b8/lifestyle-6766.png	chandelier-lights-2026-p57-25-6-b8	false	true	true
data/extracted/products/chandelier-lights-2026-p58-25-6-f3/lifestyle-6797.png	chandelier-lights-2026-p58-25-6-f3	false	false	false
data/extracted/products/chandelier-lights-2026-p59-25-6-j6/lifestyle-6828.png	chandelier-lights-2026-p59-25-6-j6	false	false	false
data/extracted/products/chandelier-lights-2026-p60-25-6-l3/lifestyle-6859.png	chandelier-lights-2026-p60-25-6-l3	false	true	true
data/extracted/products/chandelier-lights-2026-p61-25-6-l5/lifestyle-6890.png	chandelier-lights-2026-p61-25-6-l5	false	false	false
data/extracted/products/chandelier-lights-2026-p62-planter-hanging/lifestyle-6921.png	chandelier-lights-2026-p62-planter-hanging	true	true	true
data/extracted/products/chandelier-lights-2026-p63-25-6-m3/lifestyle-6953.png	chandelier-lights-2026-p63-25-6-m3	false	true	true
data/extracted/products/chandelier-lights-2026-p64-5701-8/lifestyle-6985.png	chandelier-lights-2026-p64-5701-8	false	false	false
data/extracted/products/chandelier-lights-2026-p65-d225-24-gd/lifestyle-7016.png	chandelier-lights-2026-p65-d225-24-gd	false	true	true
data/extracted/products/chandelier-lights-2026-p66-d277-a-16/lifestyle-7049.png	chandelier-lights-2026-p66-d277-a-16	false	true	true
data/extracted/products/chandelier-lights-2026-p67-d277-d-19/lifestyle-7083.png	chandelier-lights-2026-p67-d277-d-19	false	true	true
data/extracted/products/chandelier-lights-2026-p68-5665-6-8/lifestyle-7119.png	chandelier-lights-2026-p68-5665-6-8	false	false	false
data/extracted/products/chandelier-lights-2026-p69-801-27/lifestyle-7150.png	chandelier-lights-2026-p69-801-27	false	true	true
data/extracted/products/chandelier-lights-2026-p70-mm6530/lifestyle-7181.png	chandelier-lights-2026-p70-mm6530	true	true	true
data/extracted/products/chandelier-lights-2026-p71-9-016-10-head/lifestyle-7213.png	chandelier-lights-2026-p71-9-016-10-head	false	true	true
data/extracted/products/chandelier-lights-2026-p72-9-017-20-head/lifestyle-7244.png	chandelier-lights-2026-p72-9-017-20-head	true	true	true
data/extracted/products/chandelier-lights-2026-p73-colour-black/lifestyle-7276.png	chandelier-lights-2026-p73-colour-black	true	true	true
data/extracted/products/chandelier-lights-2026-p74-d1612-1/lifestyle-7308.png	chandelier-lights-2026-p74-d1612-1	true	true	true
data/extracted/products/chandelier-lights-2026-p75-gls-eb-247-ch/lifestyle-7336.png	chandelier-lights-2026-p75-gls-eb-247-ch	false	true	true
data/extracted/products/chandelier-lights-2026-p76-jc-24047/lifestyle-7371.png	chandelier-lights-2026-p76-jc-24047	true	true	true
data/extracted/products/chandelier-lights-2026-p77-jc-24046/lifestyle-7402.png	chandelier-lights-2026-p77-jc-24046	false	true	true
data/extracted/products/chandelier-lights-2026-p78-5608-6-3/lifestyle-7433.png	chandelier-lights-2026-p78-5608-6-3	false	false	false
data/extracted/products/chandelier-lights-2026-p79-7241-3/lifestyle-7466.png	chandelier-lights-2026-p79-7241-3	true	true	true
data/extracted/products/chandelier-lights-luxe-2026-p8-j207-l1200/lifestyle-6863.png	chandelier-lights-luxe-2026-p8-j207-l1200	false	false	false
data/extracted/products/chandelier-lights-luxe-2026-p9-700011-12/lifestyle-6896.png	chandelier-lights-luxe-2026-p9-700011-12	true	true	true
data/extracted/products/chandelier-lights-luxe-2026-p10-98133-24/lifestyle-6930.png	chandelier-lights-luxe-2026-p10-98133-24	false	false	false
data/extracted/products/chandelier-lights-luxe-2026-p11-080-50/lifestyle-6963.png	chandelier-lights-luxe-2026-p11-080-50	false	false	false
data/extracted/products/chandelier-lights-luxe-2026-p12-090-30/lifestyle-6997.png	chandelier-lights-luxe-2026-p12-090-30	false	false	false
data/extracted/products/chandelier-lights-luxe-2026-p13-als002-6/lifestyle-7032.png	chandelier-lights-luxe-2026-p13-als002-6	false	false	false
data/extracted/products/chandelier-lights-luxe-2026-p14-dg-196a-1060/lifestyle-7064.png	chandelier-lights-luxe-2026-p14-dg-196a-1060	true	true	true
data/extracted/products/chandelier-lights-luxe-2026-p15-gl15/lifestyle-7097.png	chandelier-lights-luxe-2026-p15-gl15	false	false	false
data/extracted/products/chandelier-lights-luxe-2026-p16-lm8937-3b/lifestyle-7131.png	chandelier-lights-luxe-2026-p16-lm8937-3b	true	true	true
data/extracted/products/chandelier-lights-luxe-2026-p17-h8907-30/lifestyle-7167.png	chandelier-lights-luxe-2026-p17-h8907-30	true	true	true
data/extracted/products/chandelier-lights-luxe-2026-p18-d39073-s-m-l/lifestyle-7206.png	chandelier-lights-luxe-2026-p18-d39073-s-m-l	true	true	true
data/extracted/products/chandelier-lights-luxe-2026-p19-d6228-15/lifestyle-7239.png	chandelier-lights-luxe-2026-p19-d6228-15	true	true	true
data/extracted/products/chandelier-lights-luxe-2026-p20-d39065-6/lifestyle-7273.png	chandelier-lights-luxe-2026-p20-d39065-6	false	false	false
data/extracted/products/chandelier-lights-luxe-2026-p21-d39067-5l/lifestyle-7305.png	chandelier-lights-luxe-2026-p21-d39067-5l	true	true	true
data/extracted/products/chandelier-lights-luxe-2026-p22-2022/lifestyle-7337.png	chandelier-lights-luxe-2026-p22-2022	true	true	true
data/extracted/products/chandelier-lights-luxe-2026-p23-als010/lifestyle-7369.png	chandelier-lights-luxe-2026-p23-als010	true	true	true
data/extracted/products/chandelier-lights-luxe-2026-p24-1013/lifestyle-7399.png	chandelier-lights-luxe-2026-p24-1013	true	true	true
data/extracted/products/chandelier-lights-luxe-2026-p25-753-27/lifestyle-7431.png	chandelier-lights-luxe-2026-p25-753-27	true	true	true
data/extracted/products/chandelier-lights-luxe-2026-p26-322/lifestyle-7463.png	chandelier-lights-luxe-2026-p26-322	false	false	false
data/extracted/products/chandelier-lights-luxe-2026-p27-8871-12/lifestyle-7501.jpg	chandelier-lights-luxe-2026-p27-8871-12	false	false	false
data/extracted/products/chandelier-lights-luxe-2026-p28-8830-l800/lifestyle-7528.png	chandelier-lights-luxe-2026-p28-8830-l800	false	false	false
data/extracted/products/chandelier-lights-luxe-2026-p29-8830/lifestyle-7560.png	chandelier-lights-luxe-2026-p29-8830	false	false	false
data/extracted/products/chandelier-lights-luxe-2026-p30-8883-6h/lifestyle-7599.jpg	chandelier-lights-luxe-2026-p30-8883-6h	false	false	false
data/extracted/products/chandelier-lights-luxe-2026-p31-d39075-1u/lifestyle-7628.png	chandelier-lights-luxe-2026-p31-d39075-1u	false	false	false
data/extracted/products/chandelier-lights-luxe-2026-p32-d39075-1l/lifestyle-7660.png	chandelier-lights-luxe-2026-p32-d39075-1l	false	true	true
data/extracted/products/chandelier-lights-luxe-2026-p33-1147-12-head/lifestyle-7695.jpg	chandelier-lights-luxe-2026-p33-1147-12-head	false	false	false
data/extracted/products/chandelier-lights-luxe-2026-p34-6389-1500/lifestyle-7727.jpg	chandelier-lights-luxe-2026-p34-6389-1500	false	false	false
data/extracted/products/chandelier-lights-luxe-2026-p35-319-d15/lifestyle-7759.jpg	chandelier-lights-luxe-2026-p35-319-d15	false	false	false
data/extracted/products/chandelier-lights-luxe-2026-p36-320-x8/lifestyle-7790.jpg	chandelier-lights-luxe-2026-p36-320-x8	false	true	true
data/extracted/products/chandelier-lights-luxe-2026-p37-313-dc23/lifestyle-7821.jpg	chandelier-lights-luxe-2026-p37-313-dc23	false	true	true
data/extracted/products/chandelier-lights-luxe-2026-p38-8901/lifestyle-7852.jpg	chandelier-lights-luxe-2026-p38-8901	false	false	false
data/extracted/products/chandelier-lights-luxe-2026-p39-8839/lifestyle-7887.png	chandelier-lights-luxe-2026-p39-8839	false	false	false
data/extracted/products/chandelier-lights-luxe-2026-p40-8839-l800/lifestyle-7919.jpg	chandelier-lights-luxe-2026-p40-8839-l800	false	true	true
data/extracted/products/chandelier-lights-luxe-2026-p41-d6215/lifestyle-7951.png	chandelier-lights-luxe-2026-p41-d6215	false	false	false
data/extracted/products/chandelier-lights-luxe-2026-p42-d6204-25/lifestyle-7982.png	chandelier-lights-luxe-2026-p42-d6204-25	false	false	false
data/extracted/products/chandelier-lights-luxe-2026-p43-als003-18/lifestyle-8013.jpg	chandelier-lights-luxe-2026-p43-als003-18	false	false	false
data/extracted/products/chandelier-lights-luxe-2026-p44-862-l1200/lifestyle-8045.png	chandelier-lights-luxe-2026-p44-862-l1200	false	true	true
data/extracted/products/chandelier-lights-luxe-2026-p45-2840-60-head/lifestyle-8077.png	chandelier-lights-luxe-2026-p45-2840-60-head	false	false	false
data/extracted/products/chandelier-lights-luxe-2026-p46-290-d21/lifestyle-8108.png	chandelier-lights-luxe-2026-p46-290-d21	false	true	true
data/extracted/products/chandelier-lights-luxe-2026-p47-290-dc8/lifestyle-8139.png	chandelier-lights-luxe-2026-p47-290-dc8	false	false	false
data/extracted/products/chandelier-lights-luxe-2026-p48-lm1048-3/lifestyle-8171.png	chandelier-lights-luxe-2026-p48-lm1048-3	true	true	true
data/extracted/products/chandelier-lights-luxe-2026-p49-283-d800-9/lifestyle-8203.png	chandelier-lights-luxe-2026-p49-283-d800-9	true	true	true
data/extracted/products/chandelier-lights-luxe-2026-p50-283-d1150/lifestyle-8235.png	chandelier-lights-luxe-2026-p50-283-d1150	false	false	true
data/extracted/products/chandelier-lights-luxe-2026-p51-ky003/lifestyle-8265.png	chandelier-lights-luxe-2026-p51-ky003	false	true	true
data/extracted/products/chandelier-lights-luxe-2026-p52-282-dc3/lifestyle-8297.png	chandelier-lights-luxe-2026-p52-282-dc3	false	false	false
data/extracted/products/chandelier-lights-luxe-2026-p53-282-dc4/lifestyle-8328.png	chandelier-lights-luxe-2026-p53-282-dc4	false	false	false
data/extracted/products/chandelier-lights-luxe-2026-p54-282-d600/lifestyle-8359.png	chandelier-lights-luxe-2026-p54-282-d600	false	false	false
data/extracted/products/chandelier-lights-luxe-2026-p55-glass-multiple-colour/lifestyle-8391.png	chandelier-lights-luxe-2026-p55-glass-multiple-colour	false	false	true
data/extracted/products/chandelier-lights-luxe-2026-p56-ky005/lifestyle-8423.png	chandelier-lights-luxe-2026-p56-ky005	true	true	true
data/extracted/products/chandelier-lights-luxe-2026-p57-ky006/lifestyle-8454.png	chandelier-lights-luxe-2026-p57-ky006	true	true	true
data/extracted/products/chandelier-lights-luxe-2026-p58-896-7/lifestyle-8485.jpg	chandelier-lights-luxe-2026-p58-896-7	false	true	true
data/extracted/products/chandelier-lights-luxe-2026-p59-1016/lifestyle-8516.png	chandelier-lights-luxe-2026-p59-1016	false	false	false
data/extracted/products/chandelier-lights-luxe-2026-p60-890-16/lifestyle-8547.png	chandelier-lights-luxe-2026-p60-890-16	false	true	true
data/extracted/products/chandelier-lights-luxe-2026-p61-1012-10/lifestyle-8578.png	chandelier-lights-luxe-2026-p61-1012-10	false	false	true
data/extracted/products/chandelier-lights-luxe-2026-p62-d2217/lifestyle-8607.jpg	chandelier-lights-luxe-2026-p62-d2217	true	true	true
data/extracted/products/chandelier-lights-luxe-2026-p63-d6208/lifestyle-8641.png	chandelier-lights-luxe-2026-p63-d6208	true	true	true
data/extracted/products/chandelier-lights-luxe-2026-p64-als264-35/lifestyle-4138.png	chandelier-lights-luxe-2026-p64-als264-35	true	true	true
data/extracted/products/chandelier-lights-luxe-2026-p65-323/lifestyle-8704.png	chandelier-lights-luxe-2026-p65-323	false	true	true
data/extracted/products/chandelier-lights-luxe-2026-p66-d6214/lifestyle-8736.png	chandelier-lights-luxe-2026-p66-d6214	true	true	true
data/extracted/products/chandelier-lights-luxe-2026-p67-jc-2501-1/lifestyle-8766.png	chandelier-lights-luxe-2026-p67-jc-2501-1	false	false	false
data/extracted/products/chandelier-lights-luxe-2026-p68-9879-130/lifestyle-8799.png	chandelier-lights-luxe-2026-p68-9879-130	true	true	true
data/extracted/products/chandelier-lights-luxe-2026-p69-als007-24/lifestyle-8831.png	chandelier-lights-luxe-2026-p69-als007-24	false	false	false
data/extracted/products/chandelier-lights-luxe-2026-p70-d6205-1-2a/lifestyle-8867.jpg	chandelier-lights-luxe-2026-p70-d6205-1-2a	false	true	true
data/extracted/products/chandelier-lights-luxe-2026-p71-d6205-1b/lifestyle-8909.jpg	chandelier-lights-luxe-2026-p71-d6205-1b	false	false	false
data/extracted/products/chandelier-lights-luxe-2026-p72-d6205-2c/lifestyle-8943.jpg	chandelier-lights-luxe-2026-p72-d6205-2c	false	false	false
data/extracted/products/chandelier-lights-luxe-2026-p73-d6205-3-d/lifestyle-8977.jpg	chandelier-lights-luxe-2026-p73-d6205-3-d	false	false	false
data/extracted/products/chandelier-lights-luxe-2026-p74-h008/lifestyle-8998.png	chandelier-lights-luxe-2026-p74-h008	false	true	true
data/extracted/products/chandelier-lights-luxe-2026-p75-d6210/lifestyle-9028.png	chandelier-lights-luxe-2026-p75-d6210	false	false	false
data/extracted/products/chandelier-lights-luxe-2026-p76-9-008/lifestyle-9061.png	chandelier-lights-luxe-2026-p76-9-008	false	false	false
data/extracted/products/chandelier-lights-luxe-2026-p77-9-033/lifestyle-9092.png	chandelier-lights-luxe-2026-p77-9-033	false	false	false
data/extracted/products/chandelier-lights-luxe-2026-p78-9-028/lifestyle-9123.png	chandelier-lights-luxe-2026-p78-9-028	false	false	false
data/extracted/products/chandelier-lights-luxe-2026-p79-als006/lifestyle-9155.png	chandelier-lights-luxe-2026-p79-als006	false	true	true
data/extracted/products/chandelier-lights-luxe-2026-p80-9-030/lifestyle-9186.png	chandelier-lights-luxe-2026-p80-9-030	true	true	true
data/extracted/products/chandelier-lights-luxe-2026-p81-d6223-1-3-6/lifestyle-9218.png	chandelier-lights-luxe-2026-p81-d6223-1-3-6	false	true	true
data/extracted/products/chandelier-lights-luxe-2026-p82-gll-1008/lifestyle-9253.png	chandelier-lights-luxe-2026-p82-gll-1008	false	false	false
data/extracted/products/chandelier-lights-luxe-2026-p83-als264-6/lifestyle-9284.png	chandelier-lights-luxe-2026-p83-als264-6	false	true	true
data/extracted/products/chandelier-lights-luxe-2026-p84-d2220/lifestyle-9319.jpg	chandelier-lights-luxe-2026-p84-d2220	true	true	true
data/extracted/products/chandelier-lights-luxe-2026-p85-d2219/lifestyle-9348.png	chandelier-lights-luxe-2026-p85-d2219	true	true	true
data/extracted/products/chandelier-lights-luxe-2026-p86-lm8987-4/lifestyle-9379.png	chandelier-lights-luxe-2026-p86-lm8987-4	false	true	true
data/extracted/products/chandelier-lights-luxe-2026-p87-d6211-3/lifestyle-9411.png	chandelier-lights-luxe-2026-p87-d6211-3	true	true	true
data/extracted/products/chandelier-lights-luxe-2026-p88-h012/lifestyle-9442.png	chandelier-lights-luxe-2026-p88-h012	false	false	false
data/extracted/products/chandelier-lights-luxe-2026-p89-d39037-1-3-6/lifestyle-9474.jpg	chandelier-lights-luxe-2026-p89-d39037-1-3-6	true	true	true
data/extracted/products/chandelier-lights-luxe-2026-p90-wire-length-3-mtr/lifestyle-9510.png	chandelier-lights-luxe-2026-p90-wire-length-3-mtr	false	false	false
data/extracted/products/chandelier-lights-luxe-2026-p91-wire-length-5-mtr/lifestyle-9541.png	chandelier-lights-luxe-2026-p91-wire-length-5-mtr	false	false	false
data/extracted/products/chandelier-lights-luxe-2026-p92-f8065-800/lifestyle-9574.png	chandelier-lights-luxe-2026-p92-f8065-800	false	true	true
data/extracted/products/chandelier-lights-luxe-2026-p93-f8037-570/lifestyle-9605.png	chandelier-lights-luxe-2026-p93-f8037-570	false	true	true
data/extracted/products/chandelier-lights-luxe-2026-p94-f8030-600/lifestyle-9637.png	chandelier-lights-luxe-2026-p94-f8030-600	false	true	true
data/extracted/products/chandelier-lights-luxe-2026-p95-als008/lifestyle-9669.png	chandelier-lights-luxe-2026-p95-als008	true	true	true
data/extracted/products/chandelier-lights-luxe-2026-p96-9-032/lifestyle-9700.png	chandelier-lights-luxe-2026-p96-9-032	true	true	true
data/extracted/products/chandelier-lights-luxe-2026-p97-b8143-500/lifestyle-9728.png	chandelier-lights-luxe-2026-p97-b8143-500	false	false	true
data/extracted/products/chandelier-lights-luxe-2026-p98-a-1/lifestyle-9762.png	chandelier-lights-luxe-2026-p98-a-1	false	true	true
data/extracted/products/chandelier-lights-luxe-2026-p99-a-4/lifestyle-9793.png	chandelier-lights-luxe-2026-p99-a-4	false	false	false
data/extracted/products/chandelier-lights-luxe-2026-p100-als260/lifestyle-9824.png	chandelier-lights-luxe-2026-p100-als260	false	false	false
data/extracted/products/chandelier-lights-luxe-2026-p101-als004-16/lifestyle-9854.png	chandelier-lights-luxe-2026-p101-als004-16	false	false	true
data/extracted/products/chandelier-lights-luxe-2026-p102-green-yellow-purple-transparent-frosted/lifestyle-9887.png	chandelier-lights-luxe-2026-p102-green-yellow-purple-transparent-frosted	false	false	false
data/extracted/products/chandelier-lights-luxe-2026-p103-7642-13/lifestyle-9917.png	chandelier-lights-luxe-2026-p103-7642-13	false	false	false
data/extracted/products/chandelier-lights-luxe-2026-p104-d6222/lifestyle-9950.png	chandelier-lights-luxe-2026-p104-d6222	true	true	true
data/extracted/products/chandelier-lights-luxe-2026-p105-als009/lifestyle-9981.png	chandelier-lights-luxe-2026-p105-als009	true	true	true
data/extracted/products/floor-lamp-2026-p5-jc-2609a-rg/lifestyle-1114.png	floor-lamp-2026-p5-jc-2609a-rg	false	true	true
data/extracted/products/floor-lamp-2026-p6-f3562/lifestyle-2427.png	floor-lamp-2026-p6-f3562	false	false	false
data/extracted/products/floor-lamp-2026-p7-f3359/lifestyle-2463.png	floor-lamp-2026-p7-f3359	false	false	false
data/extracted/products/floor-lamp-2026-p8-f3397/lifestyle-2500.png	floor-lamp-2026-p8-f3397	false	true	true
data/extracted/products/floor-lamp-2026-p9-f3380/lifestyle-2536.png	floor-lamp-2026-p9-f3380	false	false	false
data/extracted/products/floor-lamp-2026-p10-f3265/lifestyle-2573.png	floor-lamp-2026-p10-f3265	false	false	true
data/extracted/products/floor-lamp-2026-p11-f3192/lifestyle-2606.png	floor-lamp-2026-p11-f3192	false	false	true
data/extracted/products/floor-lamp-2026-p12-f3014/lifestyle-2644.png	floor-lamp-2026-p12-f3014	false	false	false
data/extracted/products/floor-lamp-2026-p13-gl17-f/lifestyle-3741.png	floor-lamp-2026-p13-gl17-f	false	false	false
data/extracted/products/floor-lamp-2026-p14-315-l/lifestyle-2694.png	floor-lamp-2026-p14-315-l	false	false	false
data/extracted/products/floor-lamp-2026-p15-313-l/lifestyle-2731.jpg	floor-lamp-2026-p15-313-l	true	true	true
data/extracted/products/floor-lamp-2026-p16-with-usb-wireless-charging/lifestyle-2767.png	floor-lamp-2026-p16-with-usb-wireless-charging	false	true	true
data/extracted/products/floor-lamp-2026-p17-d202/lifestyle-2803.png	floor-lamp-2026-p17-d202	true	true	true
data/extracted/products/floor-lamp-2026-p18-283-l1600/lifestyle-3817.png	floor-lamp-2026-p18-283-l1600	false	false	false
data/extracted/products/floor-lamp-2026-p19-als264-l3/lifestyle-2875.png	floor-lamp-2026-p19-als264-l3	false	true	true
data/extracted/products/floor-lamp-2026-p20-tlb-f/lifestyle-3840.png	floor-lamp-2026-p20-tlb-f	true	true	true
data/extracted/products/floor-lamp-2026-p21-282-l7/lifestyle-2949.png	floor-lamp-2026-p21-282-l7	false	false	false
data/extracted/products/floor-lamp-2026-p22-jc-2323/lifestyle-2985.png	floor-lamp-2026-p22-jc-2323	true	true	true
data/extracted/products/floor-lamp-2026-p23-1494/lifestyle-3022.jpg	floor-lamp-2026-p23-1494	true	true	true
data/extracted/products/floor-lamp-2026-p24-gl-157/lifestyle-3056.png	floor-lamp-2026-p24-gl-157	true	true	true
data/extracted/products/floor-lamp-2026-p25-9-009-f/lifestyle-3094.png	floor-lamp-2026-p25-9-009-f	true	true	true
data/extracted/products/floor-lamp-2026-p26-t3380/lifestyle-3131.png	floor-lamp-2026-p26-t3380	false	true	true
data/extracted/products/floor-lamp-2026-p27-t3359/lifestyle-3165.png	floor-lamp-2026-p27-t3359	false	true	true
data/extracted/products/floor-lamp-2026-p28-t2514-1/lifestyle-3203.png	floor-lamp-2026-p28-t2514-1	true	true	true
data/extracted/products/floor-lamp-2026-p29-9-029/lifestyle-3240.png	floor-lamp-2026-p29-9-029	true	true	true
data/extracted/products/floor-lamp-2026-p30-t004-1/lifestyle-3277.png	floor-lamp-2026-p30-t004-1	true	true	true
data/extracted/products/floor-lamp-2026-p31-als264-t2/lifestyle-3314.png	floor-lamp-2026-p31-als264-t2	false	false	false
data/extracted/products/floor-lamp-2026-p32-282-t2/lifestyle-3351.png	floor-lamp-2026-p32-282-t2	true	true	true
data/extracted/products/floor-lamp-2026-p33-203/lifestyle-3386.png	floor-lamp-2026-p33-203	true	true	true
data/extracted/products/floor-lamp-2026-p34-als011/lifestyle-3423.png	floor-lamp-2026-p34-als011	true	true	true
data/extracted/products/floor-lamp-2026-p35-040/lifestyle-4005.png	floor-lamp-2026-p35-040	false	true	true
data/extracted/products/floor-lamp-2026-p36-jc-2520-rose-gold/lifestyle-3496.png	floor-lamp-2026-p36-jc-2520-rose-gold	true	true	true
data/extracted/products/geo-liting-floor-table-lamps-p2-012910/lifestyle-4.jpg	geo-liting-floor-table-lamps-p2-012910	true	true	true
data/extracted/products/geo-liting-floor-table-lamps-p3-029-1f/lifestyle-11.jpg	geo-liting-floor-table-lamps-p3-029-1f	true	true	true
data/extracted/products/geo-liting-floor-table-lamps-p4-5226/lifestyle-17.jpg	geo-liting-floor-table-lamps-p4-5226	true	true	true
data/extracted/products/geo-liting-floor-table-lamps-p5-052-f/lifestyle-23.jpg	geo-liting-floor-table-lamps-p5-052-f	true	true	true
data/extracted/products/geo-liting-floor-table-lamps-p6-023-f/lifestyle-27.jpg	geo-liting-floor-table-lamps-p6-023-f	true	true	true
data/extracted/products/geo-liting-floor-table-lamps-p7-009030/lifestyle-32.jpg	geo-liting-floor-table-lamps-p7-009030	false	true	true
data/extracted/products/geo-liting-floor-table-lamps-p8-5186/lifestyle-spread.jpg	geo-liting-floor-table-lamps-p8-5186	true	true	true
data/extracted/products/geo-liting-floor-table-lamps-p9-009600/lifestyle-42.jpg	geo-liting-floor-table-lamps-p9-009600	true	true	true
data/extracted/products/geo-liting-floor-table-lamps-p10-5020-fl/lifestyle-spread.jpg	geo-liting-floor-table-lamps-p10-5020-fl	false	true	true
data/extracted/products/geo-liting-floor-table-lamps-p11-5013-f/lifestyle-spread.jpg	geo-liting-floor-table-lamps-p11-5013-f	true	true	true
data/extracted/products/geo-liting-floor-table-lamps-p12-1039-f-wo-board/lifestyle-spread.jpg	geo-liting-floor-table-lamps-p12-1039-f-wo-board	true	true	true
data/extracted/products/geo-liting-floor-table-lamps-p14-7781-f/lifestyle-65.jpg	geo-liting-floor-table-lamps-p14-7781-f	true	true	true
data/extracted/products/geo-liting-floor-table-lamps-p15-400cr-wh/lifestyle-70.jpg	geo-liting-floor-table-lamps-p15-400cr-wh	true	true	true
data/extracted/products/geo-liting-floor-table-lamps-p16-2448-amb/lifestyle-90.jpg	geo-liting-floor-table-lamps-p16-2448-amb	false	false	false
data/extracted/products/geo-liting-floor-table-lamps-p18-gef-2202/lifestyle-spread.jpg	geo-liting-floor-table-lamps-p18-gef-2202	false	true	true
data/extracted/products/geo-liting-floor-table-lamps-p19-tl-05/lifestyle-spread.jpg	geo-liting-floor-table-lamps-p19-tl-05	true	true	true
data/extracted/products/geo-liting-floor-table-lamps-p20-5018-f/lifestyle-109.jpg	geo-liting-floor-table-lamps-p20-5018-f	true	true	true
data/extracted/products/geo-liting-floor-table-lamps-p21-6717-f/lifestyle-spread.jpg	geo-liting-floor-table-lamps-p21-6717-f	false	false	false
data/extracted/products/geo-liting-floor-table-lamps-p22-5200-6fl/lifestyle-spread.jpg	geo-liting-floor-table-lamps-p22-5200-6fl	true	true	true
data/extracted/products/geo-liting-floor-table-lamps-p23-088/lifestyle-spread.jpg	geo-liting-floor-table-lamps-p23-088	true	true	true
data/extracted/products/geo-liting-floor-table-lamps-p24-5520-ab-f/lifestyle-128.jpg	geo-liting-floor-table-lamps-p24-5520-ab-f	true	true	true
data/extracted/products/geo-liting-floor-table-lamps-p25-2406-f/lifestyle-spread.jpg	geo-liting-floor-table-lamps-p25-2406-f	false	true	true
data/extracted/products/geo-liting-floor-table-lamps-p26-2406-tl/lifestyle-140.jpg	geo-liting-floor-table-lamps-p26-2406-tl	false	true	true
data/extracted/products/geo-liting-floor-table-lamps-p27-2426-f/lifestyle-spread.jpg	geo-liting-floor-table-lamps-p27-2426-f	true	true	true
data/extracted/products/geo-liting-floor-table-lamps-p28-2426-tl/lifestyle-spread.jpg	geo-liting-floor-table-lamps-p28-2426-tl	true	true	true
data/extracted/products/geo-liting-floor-table-lamps-p29-3150-wh/lifestyle-spread.jpg	geo-liting-floor-table-lamps-p29-3150-wh	true	true	true
data/extracted/products/geo-liting-floor-table-lamps-p30-3160-wh/lifestyle-spread.jpg	geo-liting-floor-table-lamps-p30-3160-wh	true	true	true
data/extracted/products/geo-liting-floor-table-lamps-p31-3150-bk/lifestyle-spread.jpg	geo-liting-floor-table-lamps-p31-3150-bk	true	true	true
data/extracted/products/geo-liting-floor-table-lamps-p32-3160-bk/lifestyle-spread.jpg	geo-liting-floor-table-lamps-p32-3160-bk	true	true	true
data/extracted/products/geo-liting-floor-table-lamps-p33-0073-bl/lifestyle-174.jpg	geo-liting-floor-table-lamps-p33-0073-bl	false	false	false
data/extracted/products/geo-liting-floor-table-lamps-p34-4032-f/lifestyle-179.jpg	geo-liting-floor-table-lamps-p34-4032-f	false	true	true
data/extracted/products/geo-liting-floor-table-lamps-p35-4031-tl/lifestyle-184.jpg	geo-liting-floor-table-lamps-p35-4031-tl	false	true	true
data/extracted/products/geo-liting-floor-table-lamps-p36-807-f/lifestyle-189.jpg	geo-liting-floor-table-lamps-p36-807-f	true	true	true
data/extracted/products/geo-liting-floor-table-lamps-p37-055-wd/lifestyle-196.jpg	geo-liting-floor-table-lamps-p37-055-wd	false	true	true
data/extracted/products/geo-liting-floor-table-lamps-p38-056-bk/lifestyle-204.jpg	geo-liting-floor-table-lamps-p38-056-bk	false	true	true
data/extracted/products/geo-liting-floor-table-lamps-p39-26073-f/lifestyle-211.jpg	geo-liting-floor-table-lamps-p39-26073-f	true	true	true
data/extracted/products/geo-liting-floor-table-lamps-p41-6026ab/lifestyle-spread.jpg	geo-liting-floor-table-lamps-p41-6026ab	true	true	true
data/extracted/products/geo-liting-floor-table-lamps-p42-2047/lifestyle-spread.jpg	geo-liting-floor-table-lamps-p42-2047	true	true	true
data/extracted/products/geo-liting-floor-table-lamps-p43-4221/lifestyle-230.jpg	geo-liting-floor-table-lamps-p43-4221	true	true	true
data/extracted/products/geo-liting-floor-table-lamps-p44-20290-t/lifestyle-spread.jpg	geo-liting-floor-table-lamps-p44-20290-t	false	false	false
data/extracted/products/geo-liting-floor-table-lamps-p45-0002-tl/lifestyle-spread.jpg	geo-liting-floor-table-lamps-p45-0002-tl	false	true	true
data/extracted/products/geo-liting-floor-table-lamps-p46-4057-t/lifestyle-251.jpg	geo-liting-floor-table-lamps-p46-4057-t	true	true	true
data/extracted/products/geo-liting-floor-table-lamps-p47-6660-1/lifestyle-256.jpg	geo-liting-floor-table-lamps-p47-6660-1	true	true	true
data/extracted/products/geo-liting-floor-table-lamps-p48-6650-1/lifestyle-265.jpg	geo-liting-floor-table-lamps-p48-6650-1	false	false	false
data/extracted/products/geo-liting-floor-table-lamps-p49-6640-1/lifestyle-272.jpg	geo-liting-floor-table-lamps-p49-6640-1	false	true	true
data/extracted/products/geo-liting-floor-table-lamps-p50-6625-t/lifestyle-279.jpg	geo-liting-floor-table-lamps-p50-6625-t	true	true	true
data/extracted/products/geo-liting-floor-table-lamps-p51-5111-tl-ab/lifestyle-284.jpg	geo-liting-floor-table-lamps-p51-5111-tl-ab	false	false	false
data/extracted/products/geo-liting-floor-table-lamps-p52-6487-tl/lifestyle-spread.jpg	geo-liting-floor-table-lamps-p52-6487-tl	true	true	true
data/extracted/products/geo-liting-floor-table-lamps-p53-6670-1/lifestyle-296.jpg	geo-liting-floor-table-lamps-p53-6670-1	false	true	true
data/extracted/products/geo-liting-floor-table-lamps-p54-6630-ab/lifestyle-302.jpg	geo-liting-floor-table-lamps-p54-6630-ab	true	true	true
data/extracted/products/geo-liting-floor-table-lamps-p55-00779-wh/lifestyle-306.jpg	geo-liting-floor-table-lamps-p55-00779-wh	false	true	true
data/extracted/products/geo-liting-floor-table-lamps-p56-00780/lifestyle-317.jpg	geo-liting-floor-table-lamps-p56-00780	true	true	true
data/extracted/products/geo-liting-floor-table-lamps-p56-00785/lifestyle-314.jpg	geo-liting-floor-table-lamps-p56-00785	true	true	true
data/extracted/products/geo-liting-floor-table-lamps-p57-00779-bk/lifestyle-322.jpg	geo-liting-floor-table-lamps-p57-00779-bk	false	true	true
data/extracted/products/geo-liting-floor-table-lamps-p58-00568/lifestyle-329.jpg	geo-liting-floor-table-lamps-p58-00568	true	true	true
data/extracted/products/geo-liting-floor-table-lamps-p59-1650-t/lifestyle-spread.jpg	geo-liting-floor-table-lamps-p59-1650-t	true	true	true
data/extracted/products/geo-liting-floor-table-lamps-p60-039/lifestyle-spread.jpg	geo-liting-floor-table-lamps-p60-039	true	true	true
data/extracted/products/geo-liting-floor-table-lamps-p61-9711-tl/lifestyle-spread.jpg	geo-liting-floor-table-lamps-p61-9711-tl	true	true	true
data/extracted/products/geo-liting-floor-table-lamps-p62-1130-tl/lifestyle-spread.jpg	geo-liting-floor-table-lamps-p62-1130-tl	true	true	true
data/extracted/products/geo-liting-floor-table-lamps-p63-1126t/lifestyle-spread.jpg	geo-liting-floor-table-lamps-p63-1126t	true	true	true
data/extracted/products/geo-liting-floor-table-lamps-p64-2022-2ab/lifestyle-354.jpg	geo-liting-floor-table-lamps-p64-2022-2ab	true	true	true
data/extracted/products/geo-liting-floor-table-lamps-p65-0046-t-br/lifestyle-359.jpg	geo-liting-floor-table-lamps-p65-0046-t-br	false	true	true
data/extracted/products/geo-liting-floor-table-lamps-p66-0026-t-bl-gr/lifestyle-371.jpg	geo-liting-floor-table-lamps-p66-0026-t-bl-gr	true	true	true
data/extracted/products/geo-liting-floor-table-lamps-p67-0021-gr/lifestyle-396.jpg	geo-liting-floor-table-lamps-p67-0021-gr	true	true	true
data/extracted/products/geo-liting-floor-table-lamps-p68-4005-tl-bk/lifestyle-spread.jpg	geo-liting-floor-table-lamps-p68-4005-tl-bk	true	true	true
data/extracted/products/geo-liting-floor-table-lamps-p69-4005-tl-wh/lifestyle-spread.jpg	geo-liting-floor-table-lamps-p69-4005-tl-wh	false	true	true
data/extracted/products/geo-liting-floor-table-lamps-p70-2567-t/lifestyle-418.jpg	geo-liting-floor-table-lamps-p70-2567-t	false	false	false
data/extracted/products/geo-liting-floor-table-lamps-p71-7732-tl/lifestyle-426.jpg	geo-liting-floor-table-lamps-p71-7732-tl	false	false	false
data/extracted/products/geo-liting-floor-table-lamps-p72-1203/lifestyle-spread.jpg	geo-liting-floor-table-lamps-p72-1203	true	true	true
data/extracted/products/geo-liting-floor-table-lamps-p73-1201/lifestyle-440.jpg	geo-liting-floor-table-lamps-p73-1201	true	true	true
data/extracted/products/geo-liting-floor-table-lamps-p74-get-mk01/lifestyle-spread.jpg	geo-liting-floor-table-lamps-p74-get-mk01	false	false	false
```

### Holdout by catalog

| Catalog | Cases | Top-1 | Top-3 | Top-5 |
| --- | --- | --- | --- | --- |
| ceiling-lights-2026 | 34 | 29.4% | 58.8% | 64.7% |
| chandelier-lights-2026 | 73 | 37.0% | 57.5% | 63.0% |
| chandelier-lights-luxe-2026 | 98 | 29.6% | 50.0% | 55.1% |
| floor-lamp-2026 | 32 | 43.8% | 65.6% | 71.9% |
| geo-liting-floor-table-lamps | 71 | 64.8% | 87.3% | 87.3% |

## Customer-photo evaluation

No customer photos in `data/eval/customer/manifest.json`. Structure is ready; add `{ queryImage, expectedProductId }` cases later without changing retrieval code.

## Viability

Overall top-5 is 67.2% across 308 holdout cases. Geo Liting remains viable on this protocol (top-5 87.3%, 71 cases). GlitterOn ceiling/chandelier/floor pages are harder: many fixtures share a silhouette, and lifestyle room photos often neighbor other rooms before the same product's studio shot (237 cases). This is **not** customer-photo accuracy. Do not treat these numbers as production quality until field images are labeled.
