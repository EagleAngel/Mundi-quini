// ── Participantes ──────────────────────────────────────────────────────
// AJUSTA estos datos con los nombres y equipos reales de tu familia
const participantsData = [
    { name: "José Primo",    teams: ["Ghana", "Argelia", "Inglaterra", "Uruguay"] },
    { name: "Tío Pepe",      teams: ["Costa de Marfil", "Senegal", "Suecia", "Argentina"] },
    { name: "Maestro Asel",  teams: ["Curazao", "Croacia", "Brasil", "Arabia Saudita"] },
    { name: "Marialaura",    teams: ["Sudáfrica", "Noruega", "Nueva Zelanda", "Irán"] },
    { name: "Ángel",         teams: ["España", "Australia", "Túnez", "Cabo Verde"] },
    { name: "Laura",         teams: ["Bosnia y Herzegovina", "Ecuador", "Irak", "Suiza"] },
    { name: "Vane",          teams: ["Corea del Sur", "Portugal", "RD del Congo", "Colombia"] },
    { name: "Andrea",        teams: ["Egipto", "Canadá", "Austria", "México"] },
    { name: "Sofi",          teams: ["Jordania", "Uzbekistán", "Panamá", "Escocia"] },
    { name: "Meche",         teams: ["Bélgica", "Haití", "Paraguay", "Estados Unidos"] },
    { name: "Uriel",         teams: ["Turquía", "Alemania", "Qatar", "Marruecos"] },
    { name: "Karla",         teams: ["Francia", "Chequia", "Japón", "Países Bajos"] }

  // ── RONDA DE 32 ──
  { key:"R32_01", isoDate:"2026-06-28T12:00", home:"Sudáfrica",         away:"Canadá",              homeScore:null, awayScore:null },
  { key:"R32_02", isoDate:"2026-06-29T12:00", home:"Brasil",            away:"Japón",               homeScore:null, awayScore:null },
  { key:"R32_03", isoDate:"2026-06-29T16:30", home:"Alemania",          away:"Paraguay",            homeScore:null, awayScore:null },
  { key:"R32_04", isoDate:"2026-06-29T19:00", home:"Países Bajos",      away:"Marruecos",           homeScore:null, awayScore:null },
  { key:"R32_05", isoDate:"2026-06-30T12:00", home:"Costa de Marfil",   away:"Noruega",             homeScore:null, awayScore:null },
  { key:"R32_06", isoDate:"2026-06-30T17:00", home:"Francia",           away:"Suecia",              homeScore:null, awayScore:null },
  { key:"R32_07", isoDate:"2026-06-30T19:00", home:"México",            away:"Ecuador",             homeScore:null, awayScore:null },
  { key:"R32_08", isoDate:"2026-07-01T12:00", home:"Inglaterra",        away:"RD del Congo",        homeScore:null, awayScore:null },
  { key:"R32_09", isoDate:"2026-07-01T13:00", home:"Bélgica",           away:"Senegal",             homeScore:null, awayScore:null },
  { key:"R32_10", isoDate:"2026-07-01T17:00", home:"Estados Unidos",    away:"Bosnia y Herzegovina",homeScore:null, awayScore:null },
  { key:"R32_11", isoDate:"2026-07-02T12:00", home:"España",            away:"Austria",             homeScore:null, awayScore:null },
  { key:"R32_12", isoDate:"2026-07-02T19:00", home:"Portugal",          away:"Croacia",             homeScore:null, awayScore:null },
  { key:"R32_13", isoDate:"2026-07-02T20:00", home:"Suiza",             away:"Argelia",             homeScore:null, awayScore:null },
  { key:"R32_14", isoDate:"2026-07-03T13:00", home:"Australia",         away:"Egipto",              homeScore:null, awayScore:null },
  { key:"R32_15", isoDate:"2026-07-03T18:00", home:"Argentina",         away:"Cabo Verde",          homeScore:null, awayScore:null },
  { key:"R32_16", isoDate:"2026-07-03T20:30", home:"Colombia",          away:"Ghana",               homeScore:null, awayScore:null },
  // ── OCTAVOS DE FINAL ──
  { key:"R16_01", isoDate:"2026-07-04T12:00", home:"Por definir",       away:"Por definir",         homeScore:null, awayScore:null },
  { key:"R16_02", isoDate:"2026-07-04T17:00", home:"Por definir",       away:"Por definir",         homeScore:null, awayScore:null },
  { key:"R16_03", isoDate:"2026-07-05T16:00", home:"Por definir",       away:"Por definir",         homeScore:null, awayScore:null },
  { key:"R16_04", isoDate:"2026-07-05T18:00", home:"Por definir",       away:"Por definir",         homeScore:null, awayScore:null },
  { key:"R16_05", isoDate:"2026-07-06T16:00", home:"Por definir",       away:"Por definir",         homeScore:null, awayScore:null },
  { key:"R16_06", isoDate:"2026-07-06T20:00", home:"Por definir",       away:"Por definir",         homeScore:null, awayScore:null },
  { key:"R16_07", isoDate:"2026-07-07T16:00", home:"Por definir",       away:"Por definir",         homeScore:null, awayScore:null },
  { key:"R16_08", isoDate:"2026-07-07T20:00", home:"Por definir",       away:"Por definir",         homeScore:null, awayScore:null },
  // ── CUARTOS DE FINAL ──
  { key:"QF_01",  isoDate:"2026-07-09T20:00", home:"Por definir",       away:"Por definir",         homeScore:null, awayScore:null },
  { key:"QF_02",  isoDate:"2026-07-10T20:00", home:"Por definir",       away:"Por definir",         homeScore:null, awayScore:null },
  { key:"QF_03",  isoDate:"2026-07-11T16:00", home:"Por definir",       away:"Por definir",         homeScore:null, awayScore:null },
  { key:"QF_04",  isoDate:"2026-07-12T16:00", home:"Por definir",       away:"Por definir",         homeScore:null, awayScore:null },
  // ── SEMIFINALES ──
  { key:"SF_01",  isoDate:"2026-07-14T20:00", home:"Por definir",       away:"Por definir",         homeScore:null, awayScore:null },
  { key:"SF_02",  isoDate:"2026-07-15T20:00", home:"Por definir",       away:"Por definir",         homeScore:null, awayScore:null },
  // ── TERCER LUGAR ──
  { key:"TP_01",  isoDate:"2026-07-18T16:00", home:"Por definir",       away:"Por definir",         homeScore:null, awayScore:null },
  // ── GRAN FINAL ──
  { key:"FIN_01", isoDate:"2026-07-19T17:00", home:"Por definir",       away:"Por definir",         homeScore:null, awayScore:null },
];

// ── Calendario completo Mundial 2026 ───────────────────────────────────
// isoDate: formato "YYYY-MM-DDThh:mm" hora de México (UTC-6)
// key: identificador único del partido
// homeScore / awayScore: null = no jugado, número = resultado oficial
const allMatches = [
  // ── GRUPO A ──
  { key:"A1", group:"A", isoDate:"2026-06-11T13:00", home:"México",              away:"Sudáfrica",          homeScore:2, awayScore:0 },
  { key:"A2", group:"A", isoDate:"2026-06-11T20:00", home:"Corea del Sur",       away:"Chequia",            homeScore:2, awayScore:1 },
  { key:"A3", group:"A", isoDate:"2026-06-18T10:00", home:"Chequia",             away:"Sudáfrica",          homeScore:1, awayScore:1 },
  { key:"A4", group:"A", isoDate:"2026-06-18T19:00", home:"México",              away:"Corea del Sur",      homeScore:1, awayScore:0 },
  { key:"A5", group:"A", isoDate:"2026-06-24T19:00", home:"Chequia",             away:"México",             homeScore:0, awayScore:3 },
  { key:"A6", group:"A", isoDate:"2026-06-24T19:00", home:"Sudáfrica",           away:"Corea del Sur",      homeScore:1, awayScore:0 },
  // ── GRUPO B ──
  { key:"B1", group:"B", isoDate:"2026-06-12T13:00", home:"Canadá",              away:"Bosnia y Herzegovina",homeScore:1, awayScore:1 },
  { key:"B2", group:"B", isoDate:"2026-06-13T13:00", home:"Qatar",               away:"Suiza",              homeScore:1, awayScore:1 },
  { key:"B3", group:"B", isoDate:"2026-06-18T13:00", home:"Suiza",               away:"Bosnia y Herzegovina",homeScore:4, awayScore:1 },
  { key:"B4", group:"B", isoDate:"2026-06-18T16:00", home:"Canadá",              away:"Qatar",              homeScore:6, awayScore:0 },
  { key:"B5", group:"B", isoDate:"2026-06-24T13:00", home:"Suiza",               away:"Canadá",             homeScore:2, awayScore:1 },
  { key:"B6", group:"B", isoDate:"2026-06-24T13:00", home:"Bosnia y Herzegovina",away:"Qatar",              homeScore:3, awayScore:1 },
  // ── GRUPO C ──
  { key:"C1", group:"C", isoDate:"2026-06-13T16:00", home:"Brasil",              away:"Marruecos",          homeScore:1, awayScore:1 },
  { key:"C2", group:"C", isoDate:"2026-06-13T19:00", home:"Haití",               away:"Escocia",            homeScore:0, awayScore:1 },
  { key:"C3", group:"C", isoDate:"2026-06-19T16:00", home:"Escocia",             away:"Marruecos",          homeScore:0, awayScore:1 },
  { key:"C4", group:"C", isoDate:"2026-06-19T19:00", home:"Brasil",              away:"Haití",              homeScore:3, awayScore:0 },
  { key:"C5", group:"C", isoDate:"2026-06-24T16:00", home:"Escocia",             away:"Brasil",             homeScore:0, awayScore:3 },
  { key:"C6", group:"C", isoDate:"2026-06-24T16:00", home:"Marruecos",           away:"Haití",              homeScore:4, awayScore:2 },
  // ── GRUPO D ──
  { key:"D1", group:"D", isoDate:"2026-06-12T19:00", home:"Estados Unidos",      away:"Paraguay",           homeScore:4, awayScore:1 },
  { key:"D2", group:"D", isoDate:"2026-06-13T22:00", home:"Australia",           away:"Turquía",            homeScore:2, awayScore:0 },
  { key:"D3", group:"D", isoDate:"2026-06-19T13:00", home:"Estados Unidos",      away:"Australia",          homeScore:2, awayScore:0 },
  { key:"D4", group:"D", isoDate:"2026-06-19T22:00", home:"Turquía",             away:"Paraguay",           homeScore:0, awayScore:1 },
  { key:"D5", group:"D", isoDate:"2026-06-25T20:00", home:"Turquía",             away:"Estados Unidos",     homeScore:3, awayScore:2 },
  { key:"D6", group:"D", isoDate:"2026-06-25T20:00", home:"Paraguay",            away:"Australia",          homeScore:0, awayScore:0 },
  // ── GRUPO E ──
  { key:"E1", group:"E", isoDate:"2026-06-14T11:00", home:"Alemania",            away:"Curazao",            homeScore:7, awayScore:1 },
  { key:"E2", group:"E", isoDate:"2026-06-14T17:00", home:"Costa de Marfil",     away:"Ecuador",            homeScore:1, awayScore:0 },
  { key:"E3", group:"E", isoDate:"2026-06-20T14:00", home:"Alemania",            away:"Costa de Marfil",    homeScore:2, awayScore:1 },
  { key:"E4", group:"E", isoDate:"2026-06-20T18:00", home:"Ecuador",             away:"Curazao",            homeScore:0, awayScore:0 },
  { key:"E5", group:"E", isoDate:"2026-06-25T14:00", home:"Ecuador",             away:"Alemania",           homeScore:2, awayScore:1 },
  { key:"E6", group:"E", isoDate:"2026-06-25T14:00", home:"Curazao",             away:"Costa de Marfil",    homeScore:0, awayScore:2 },
  // ── GRUPO F ──
  { key:"F1", group:"F", isoDate:"2026-06-14T14:00", home:"Países Bajos",        away:"Japón",              homeScore:2, awayScore:2 },
  { key:"F2", group:"F", isoDate:"2026-06-14T20:00", home:"Suecia",              away:"Túnez",              homeScore:5, awayScore:1 },
  { key:"F3", group:"F", isoDate:"2026-06-20T11:00", home:"Países Bajos",        away:"Suecia",             homeScore:5, awayScore:1 },
  { key:"F4", group:"F", isoDate:"2026-06-20T22:00", home:"Túnez",               away:"Japón",              homeScore:0, awayScore:4 },
  { key:"F5", group:"F", isoDate:"2026-06-25T17:00", home:"Japón",               away:"Suecia",             homeScore:1, awayScore:1 },
  { key:"F6", group:"F", isoDate:"2026-06-25T17:00", home:"Túnez",               away:"Países Bajos",       homeScore:1, awayScore:3 },
  // ── GRUPO G ──
  { key:"G1", group:"G", isoDate:"2026-06-15T13:00", home:"Bélgica",             away:"Egipto",             homeScore:1, awayScore:1 },
  { key:"G2", group:"G", isoDate:"2026-06-15T19:00", home:"Irán",                away:"Nueva Zelanda",      homeScore:2, awayScore:2 },
  { key:"G3", group:"G", isoDate:"2026-06-21T13:00", home:"Bélgica",             away:"Irán",               homeScore:0, awayScore:0 },
  { key:"G4", group:"G", isoDate:"2026-06-21T19:00", home:"Nueva Zelanda",       away:"Egipto",             homeScore:1, awayScore:3 },
  { key:"G5", group:"G", isoDate:"2026-06-26T21:00", home:"Egipto",              away:"Irán",               homeScore:1, awayScore:1 },
  { key:"G6", group:"G", isoDate:"2026-06-26T21:00", home:"Nueva Zelanda",       away:"Bélgica",            homeScore:1, awayScore:5 },
  // ── GRUPO H ──
  { key:"H1", group:"H", isoDate:"2026-06-15T10:00", home:"España",              away:"Cabo Verde",         homeScore:0, awayScore:0 },
  { key:"H2", group:"H", isoDate:"2026-06-15T16:00", home:"Arabia Saudita",      away:"Uruguay",            homeScore:1, awayScore:1 },
  { key:"H3", group:"H", isoDate:"2026-06-21T10:00", home:"España",              away:"Arabia Saudita",     homeScore:4, awayScore:0 },
  { key:"H4", group:"H", isoDate:"2026-06-21T16:00", home:"Uruguay",             away:"Cabo Verde",         homeScore:2, awayScore:2 },
  { key:"H5", group:"H", isoDate:"2026-06-26T18:00", home:"Cabo Verde",          away:"Arabia Saudita",     homeScore:0, awayScore:0 },
  { key:"H6", group:"H", isoDate:"2026-06-26T18:00", home:"Uruguay",             away:"España",             homeScore:0, awayScore:1 },
  // ── GRUPO I ──
  { key:"I1", group:"I", isoDate:"2026-06-16T13:00", home:"Francia",             away:"Senegal",            homeScore:3, awayScore:1 },
  { key:"I2", group:"I", isoDate:"2026-06-16T16:00", home:"Irak",                away:"Noruega",            homeScore:1, awayScore:4 },
  { key:"I3", group:"I", isoDate:"2026-06-22T15:00", home:"Francia",             away:"Irak",               homeScore:3, awayScore:0 },
  { key:"I4", group:"I", isoDate:"2026-06-22T18:00", home:"Noruega",             away:"Senegal",            homeScore:3, awayScore:2 },
  { key:"I5", group:"I", isoDate:"2026-06-26T13:00", home:"Noruega",             away:"Francia",            homeScore:1, awayScore:4 },
  { key:"I6", group:"I", isoDate:"2026-06-26T13:00", home:"Senegal",             away:"Irak",               homeScore:5, awayScore:0 },
  // ── GRUPO J ──
  { key:"J1", group:"J", isoDate:"2026-06-16T19:00", home:"Argentina",           away:"Argelia",            homeScore:3, awayScore:0 },
  { key:"J2", group:"J", isoDate:"2026-06-16T22:00", home:"Austria",             away:"Jordania",           homeScore:3, awayScore:1 },
  { key:"J3", group:"J", isoDate:"2026-06-22T11:00", home:"Argentina",           away:"Austria",            homeScore:2, awayScore:0 },
  { key:"J4", group:"J", isoDate:"2026-06-22T21:00", home:"Jordania",            away:"Argelia",            homeScore:1, awayScore:2 },
  { key:"J5", group:"J", isoDate:"2026-06-27T20:00", home:"Argelia",             away:"Austria",            homeScore:3, awayScore:3 },
  { key:"J6", group:"J", isoDate:"2026-06-27T20:00", home:"Jordania",            away:"Argentina",          homeScore:1, awayScore:3 },
  // ── GRUPO K ──
  { key:"K1", group:"K", isoDate:"2026-06-17T11:00", home:"Portugal",            away:"RD del Congo",       homeScore:1, awayScore:1 },
  { key:"K2", group:"K", isoDate:"2026-06-17T20:00", home:"Uzbekistán",          away:"Colombia",           homeScore:1, awayScore:3 },
  { key:"K3", group:"K", isoDate:"2026-06-23T11:00", home:"Portugal",            away:"Uzbekistán",         homeScore:5, awayScore:0 },
  { key:"K4", group:"K", isoDate:"2026-06-23T20:00", home:"Colombia",            away:"RD del Congo",       homeScore:1, awayScore:0 },
  { key:"K5", group:"K", isoDate:"2026-06-27T17:30", home:"Colombia",            away:"Portugal",           homeScore:0, awayScore:0 },
  { key:"K6", group:"K", isoDate:"2026-06-27T17:30", home:"RD del Congo",        away:"Uzbekistán",         homeScore:3, awayScore:1 },
  // ── GRUPO L ──
  { key:"L1", group:"L", isoDate:"2026-06-17T14:00", home:"Inglaterra",          away:"Croacia",            homeScore:4, awayScore:2 },
  { key:"L2", group:"L", isoDate:"2026-06-17T17:00", home:"Ghana",               away:"Panamá",             homeScore:1, awayScore:0 },
  { key:"L3", group:"L", isoDate:"2026-06-23T14:00", home:"Inglaterra",          away:"Ghana",              homeScore:0, awayScore:0 },
  { key:"L4", group:"L", isoDate:"2026-06-23T17:00", home:"Panamá",              away:"Croacia",            homeScore:0, awayScore:1 },
  { key:"L5", group:"L", isoDate:"2026-06-27T15:00", home:"Panamá",              away:"Inglaterra",         homeScore:0, awayScore:2 },
  { key:"L6", group:"L", isoDate:"2026-06-27T15:00", home:"Croacia",             away:"Ghana",              homeScore:2, awayScore:1 },

  // ── RONDA DE 32 ──
  { key:"R32_01", isoDate:"2026-06-28T12:00", home:"Sudáfrica",         away:"Canadá",              homeScore:null, awayScore:null },
  { key:"R32_02", isoDate:"2026-06-29T12:00", home:"Brasil",            away:"Japón",               homeScore:null, awayScore:null },
  { key:"R32_03", isoDate:"2026-06-29T16:30", home:"Alemania",          away:"Paraguay",            homeScore:null, awayScore:null },
  { key:"R32_04", isoDate:"2026-06-29T19:00", home:"Países Bajos",      away:"Marruecos",           homeScore:null, awayScore:null },
  { key:"R32_05", isoDate:"2026-06-30T12:00", home:"Costa de Marfil",   away:"Noruega",             homeScore:null, awayScore:null },
  { key:"R32_06", isoDate:"2026-06-30T17:00", home:"Francia",           away:"Suecia",              homeScore:null, awayScore:null },
  { key:"R32_07", isoDate:"2026-06-30T19:00", home:"México",            away:"Ecuador",             homeScore:null, awayScore:null },
  { key:"R32_08", isoDate:"2026-07-01T12:00", home:"Inglaterra",        away:"RD del Congo",        homeScore:null, awayScore:null },
  { key:"R32_09", isoDate:"2026-07-01T13:00", home:"Bélgica",           away:"Senegal",             homeScore:null, awayScore:null },
  { key:"R32_10", isoDate:"2026-07-01T17:00", home:"Estados Unidos",    away:"Bosnia y Herzegovina",homeScore:null, awayScore:null },
  { key:"R32_11", isoDate:"2026-07-02T12:00", home:"España",            away:"Austria",             homeScore:null, awayScore:null },
  { key:"R32_12", isoDate:"2026-07-02T19:00", home:"Portugal",          away:"Croacia",             homeScore:null, awayScore:null },
  { key:"R32_13", isoDate:"2026-07-02T20:00", home:"Suiza",             away:"Argelia",             homeScore:null, awayScore:null },
  { key:"R32_14", isoDate:"2026-07-03T13:00", home:"Australia",         away:"Egipto",              homeScore:null, awayScore:null },
  { key:"R32_15", isoDate:"2026-07-03T18:00", home:"Argentina",         away:"Cabo Verde",          homeScore:null, awayScore:null },
  { key:"R32_16", isoDate:"2026-07-03T20:30", home:"Colombia",          away:"Ghana",               homeScore:null, awayScore:null },
  // ── OCTAVOS DE FINAL ──
  { key:"R16_01", isoDate:"2026-07-04T12:00", home:"Por definir",       away:"Por definir",         homeScore:null, awayScore:null },
  { key:"R16_02", isoDate:"2026-07-04T17:00", home:"Por definir",       away:"Por definir",         homeScore:null, awayScore:null },
  { key:"R16_03", isoDate:"2026-07-05T16:00", home:"Por definir",       away:"Por definir",         homeScore:null, awayScore:null },
  { key:"R16_04", isoDate:"2026-07-05T18:00", home:"Por definir",       away:"Por definir",         homeScore:null, awayScore:null },
  { key:"R16_05", isoDate:"2026-07-06T16:00", home:"Por definir",       away:"Por definir",         homeScore:null, awayScore:null },
  { key:"R16_06", isoDate:"2026-07-06T20:00", home:"Por definir",       away:"Por definir",         homeScore:null, awayScore:null },
  { key:"R16_07", isoDate:"2026-07-07T16:00", home:"Por definir",       away:"Por definir",         homeScore:null, awayScore:null },
  { key:"R16_08", isoDate:"2026-07-07T20:00", home:"Por definir",       away:"Por definir",         homeScore:null, awayScore:null },
  // ── CUARTOS DE FINAL ──
  { key:"QF_01",  isoDate:"2026-07-09T20:00", home:"Por definir",       away:"Por definir",         homeScore:null, awayScore:null },
  { key:"QF_02",  isoDate:"2026-07-10T20:00", home:"Por definir",       away:"Por definir",         homeScore:null, awayScore:null },
  { key:"QF_03",  isoDate:"2026-07-11T16:00", home:"Por definir",       away:"Por definir",         homeScore:null, awayScore:null },
  { key:"QF_04",  isoDate:"2026-07-12T16:00", home:"Por definir",       away:"Por definir",         homeScore:null, awayScore:null },
  // ── SEMIFINALES ──
  { key:"SF_01",  isoDate:"2026-07-14T20:00", home:"Por definir",       away:"Por definir",         homeScore:null, awayScore:null },
  { key:"SF_02",  isoDate:"2026-07-15T20:00", home:"Por definir",       away:"Por definir",         homeScore:null, awayScore:null },
  // ── TERCER LUGAR ──
  { key:"TP_01",  isoDate:"2026-07-18T16:00", home:"Por definir",       away:"Por definir",         homeScore:null, awayScore:null },
  // ── GRAN FINAL ──
  { key:"FIN_01", isoDate:"2026-07-19T17:00", home:"Por definir",       away:"Por definir",         homeScore:null, awayScore:null },
];
