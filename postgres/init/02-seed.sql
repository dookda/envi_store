-- ENVIR Store – seed data
-- Current users and equipment items as of 2026-06-13.

INSERT INTO public."User" (id, "lineUserId", name, image, "createdAt", "updatedAt")
VALUES (
    'cmqbw429q0000o65bs8offnet',
    'Ufd66dd59708cfa4fafd767a8495cb5fb',
    'sakda.homhuan',
    'https://profile.line-scdn.net/0hjiX1GEA_NUZlSBrAnfNKEVkNOysSZjMOHS17dUFNa3RBfXNHDXkvKEgaa3IYK3MTDCgtKEZKaCJN',
    '2026-06-13 05:03:36.062',
    '2026-06-13 05:03:36.062'
);

INSERT INTO public."EquipmentItem"
    (id, "userId", "equipmentName", model, "customerName", location, image, "isArchived", "createdAt", "updatedAt")
VALUES
    ('cmqbw8isf0004o65b4emr5q9t',
     'cmqbw429q0000o65bs8offnet',
     'test', 'test', 'test', 'test',
     '/uploads/67190217-1fd7-4232-b33d-7ef4101481ca.webp',
     false,
     '2026-06-13 05:07:04.093',
     '2026-06-13 05:14:08.236'),

    ('cmqbwtkgd0001o65b4nnys569',
     'cmqbw429q0000o65bs8offnet',
     'XR-200', 'XR-200', 'Acme crop', 'Floo3',
     '/uploads/08f9e00c-91ba-4f64-969d-dc8b246ae368.webp',
     false,
     '2026-06-13 05:23:26.027',
     '2026-06-13 05:23:26.027');
