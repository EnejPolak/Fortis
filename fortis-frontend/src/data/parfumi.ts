export type ParfumDetailData = {
  imageSrc: string;
  name: string;
  metaLine1: string;
  metaLine2: string;
  description: string;
  notes?: string;
  ingredients?: string;
};

export type KolekcijaItem = {
  slug: string;
  imageSrc: string;
  alt: string;
  brand: string;
  name: string;
  imageClassName?: string;
};

const META_PLACEHOLDER = "100 ml";
const META_PLACEHOLDER_2 = "Eau de Parfum";

/** Polni podatki za posamezne parfume (opis, notes, ingredients). Če slug ni v seznamu, se uporabijo privzeti meta. */
const PARFUM_DETAIL_OVERRIDES: Partial<Record<string, Pick<ParfumDetailData, "metaLine1" | "metaLine2" | "description" | "notes" | "ingredients">>> = {
  "kinetic-insomnia": {
    metaLine1: "100 ml",
    metaLine2: "Eau de Parfum",
    description:
      "Insomnija po naročilu – ko se odpoveš spanju, ker je življenje, ki ga živiš, veliko lepše od tvojih najbolj divjih sanj.\nParfumer: Miguel Matos",
    notes:
      "TOP NOTES:\nleather, tobacco, lemon, juniper berries\n\nMIDDLE NOTES:\nmarine notes, cypriol, patchouli\n\nBASE NOTES:\namber, woody notes, sweet notes",
    ingredients:
      "ALCOHOL DENAT., PARFUM, AQUA, ALPHA-ISOMETHYL IONONE, CITRAL, CITRONELLOL, GERANIOL, LIMONENE, LINALOOL.",
  },
  "kinetic-aura": {
    metaLine1: "100 ml",
    metaLine2: "Eau de Parfum",
    description:
      "AURA je navdihnjena z idejo nevidnega, nematerialnega prostora, ki obdaja ljudi, živali in predmete. Plasti dišave se ovijejo okoli osebe kot mreža vibracij. Prepoznavna barva AURE simbolizira toplino in čutnost ter odraža barvo njenega ključnega akorda: maline.\nParfumer: Chris Maurice (Christian Carbonnel)",
    notes:
      "TOP NOTES:\nCalabrian bergamot, Brazilian orange, grapefruit, pineapple\n\nMIDDLE NOTES:\nraspberry, passion fruit from Perú, plum, lily of the valley, Indian jasmine sambac, vanilla\n\nBASE NOTES:\nwoody notes, caramel, oakmoss, amber, musk",
    ingredients:
      "ALCOHOL DENAT, PARFUM, AQUA, ALPHA-ISOMETHYL IONONE, BENZYL ALCOHOL, BENZYL SALICYLATE, CITRAL, COUMARIN, FARNESOL, GERANIOL, HYDROXYCITRONELLAL, LIMONENE, LINALOOL.",
  },
  "kinetic-kayu": {
    metaLine1: "100 ml",
    metaLine2: "Eau de Parfum",
    description:
      "KAYU v indonezijščini pomeni „les“. Z mešanjem suhih in zemeljskih not se pokloni domovini najbolj cenjenega oud-a na svetu – Tajski in Laosu. Oda lesov, posuta s pudrasto mehkočino.\nParfumer: Chris Maurice (Christian Carbonnel)",
    notes:
      "TOP NOTES:\nrosemary, Italian mandarin, vanilla\n\nMIDDLE NOTES:\nguaiac wood, Virginian cedar, incense from Oman\n\nBASE NOTES:\noud blend of nature Trat Thai & Udomsai Laos, tonka bean, musk, powdery notes",
    ingredients:
      "ALCOHOL DENAT., PARFUM, AQUA, CINNAMAL, CITRAL, COUMARIN, HYDROXYCITRONELLAL, LIMONENE, LINALOOL.",
  },
  "kinetic-mosaic": {
    metaLine1: "100 ml",
    metaLine2: "Eau de Parfum",
    description:
      "MOSAIC je o tem, da dišava postane očitna vsem človeškim čutem. MOSAIC se je rodil iz fascinacije z gibanjem, preobrazbo in vedno spreminjajočo se naravo dojemanja. Tako kot mozaik nikoli ni ena sama slika, temveč sestavina neštetih drobcev, je bila ta dišava ustvarjena, da ujame lepoto nenehnega preurejanja. Odraža način, kako se oblike, barve in teksture premikajo pred našimi očmi, in kako se čustva in občutki lahko s vsakim srečanjem preoblikujejo. Navdih je prišel iz želje ustvariti dišavo, ki ne bi ostala statična, temveč bi živela, dihala in se razvijala – kaleidoskop, ki vsakič, ko se k njemu vrneš, razkrije novo sliko. MOSAIC te vabi, da presežeš vohanje in doživiš dišavo z vsemi čuti: da vidiš njene barve, da se dotakneš njenih tekstur in da okusiš njene kontraste. To je olfaktorno potovanje v dvoumnost, presenečenje in igrivost, kjer nobena dva trenutka nista nikoli enaka.\nParfumer: Marc Daniel Heimgartner",
    notes:
      "TOP NOTES:\nrhubarb, saffron, bitter orange, kumquat, pink peppercorn, sugar\n\nHEART NOTES:\nfrankincense, cumin, violet leaves, cedar-wood, caramel\n\nBASE NOTES:\nvanilla, vetiver, ginger, turmeric, ambergris, moss, oud, suede",
    ingredients:
      "ALCOHOL DENAT., PARFUM, TETRAMETHYL ACETYLOCTAHYDRONAPHTHALENES, ALPHA-ISOMETHYL IONONE, VANILLIN, COUMARIN, HYDROXYCITRONELLAL, LINALYL ACETATE, POGOSTEMON CABLIN OIL, LIMONENE, CITRUS AURANTIUM BERGAMIA PEEL OIL, PINENE, CITRUS AURANTIUM PEEL OIL, EUGENOL, HEXADECANOLACTONE, CINNAMOMUM ZEYLANICUM BARK OIL, LINALOOL, CINNAMAL, BETA-CARYOPHYLLENE, EUGENIA CARYOPHYLLUS OIL, LAVANDULA OIL/EXTRACT, CITRAL, BENZYL SALICYLATE, TERPINEOL, ALPHA-TERPINENE, EUGENYL ACETATE, TERPINOLENE, DIMETHYL PHENETHYL ACETATE, GERANYL ACETATE, GERANIOL, ISOEUGENOL, BENZYL BENZOATE, CITRONELLOL.",
  },
  "kinetic-sillage": {
    metaLine1: "100 ml",
    metaLine2: "Eau de Parfum",
    description:
      "Francoska beseda sillage pomeni sled, ki jo v vodi pusti jadrnica. V kontekstu dišave sillage opisujejo kot sled parfuma, ki ostane v zraku, ko oseba že odide. Vlečka obleke, pavov rep, nevidna sled. Tik za tabo.\nParfumer: Chris Maurice (Christian Carbonnel)",
    notes:
      "TOP NOTES:\noud, violet, saffron\n\nMIDDLE NOTES:\nolibanum, jasmine, raspberry\n\nBASE NOTES:\nsuede, musk, vanilla, benzoe, amber",
    ingredients:
      "ALCOHOL DENAT., PARFUM, AQUA, BENZYL SALICYLATE, CINNAMYL ALCOHOL, CITRAL, COUMARIN, EUGENOL, LIMONENE, LINALOOL.",
  },
  "kinetic-verdigris": {
    metaLine1: "100 ml",
    metaLine2: "Eau de Parfum",
    description:
      "Ali je morje brez modrine sploh mogoče? VERDIGRIS igra s predstavo morske vode na povsem novi ravnini in prestavi koncept proti kopnemu. Tu se morje rodi na stičišču neba, zraka in sonca.\nParfumer: Chris Maurice (Christian Carbonnel)",
    notes:
      "TOP NOTES:\norange, lemon, bergamot, jasmine, lime\n\nMIDDLE NOTES:\ncalone, freesia, coriander, cyclamen, nutmeg, violet, rose & mignonette\n\nBASE NOTES:\namber, patchouli, cedar, musk & oakmoss",
    ingredients:
      "ALCOHOL DENAT., PARFUM, LIMONENE, AQUA, LINALOOL, BENZYL SALICYLATE, CITRAL, CITRONELLOL, EUGENOL, HEXYL CINNAMAL.",
  },
  "hedonik-divine-perversion": {
    metaLine1: "30 ml",
    metaLine2: "Extrait de Parfum",
    description:
      "Francesca je ta parfum posvetila noti usnja – ta material je osrednja sestavina Hedonika in hkrati ena njenih najljubših not. Usnje je v tej kompoziciji dejansko ključno in izstopa od uvodnih not do suhe osnove. Francesca rada igra s protislovji: na eni strani je uporabila sladke, sadne in karamelne note, na drugi pa intenzivne usnate in jantarne kot kontrast. Rada uporablja tudi živalske note, ki dodajo intenzivnost, občutek človeške narave in telesnosti ter parfum naredijo nepremagljivo čutnega.\n\nPri izdelavi tega parfuma ni bila prizadeta nobena žival. Živalski odtenki so ustvarjeni z izbiro materialov, ki ne izvirajo iz živali.",
    notes:
      "TOP NOTES:\nraspberry, pink pepper\n\nMIDDLE NOTES:\nrose, iris, caramel\n\nBASE NOTES:\nleather, amber, woody notes, animalic notes",
    ingredients:
      "ALCOHOL DENAT., PARFUM, ALPHA-ISOMETHYL IONONE, COUMARIN, D-LIMONENE, GERANIOL, BENZYL ALCOHOL, CITRONELLOL, LINALOOL, BENZYL BENZOATE, HYDROXYCITRONELLAL, CITRAL, EUGENOL, CINNAMAL, AMYL CINNAMAL, BENZYL SALICYLATE, FARNESOL, ISOEUGENOL.",
  },
  "hedonik-exquisite-affair": {
    metaLine1: "30 ml",
    metaLine2: "Extrait de Parfum",
    description:
      "Ta dišava ujame bistvo sladkega in čutnega v nepričakovani zvezi med breskvijo in usnjem – zato presenetljivo. Skrivna zveza dveh kontrastnih a hkrati dopolnjujočih se karakterjev: nedolžnosti in zapeljevanja. To zvezo simbolno prikazuje harmonija breskve in usnja. »Exquisite« sopostavitev ustvari netrivialno, igrivo in nekonvencionalno dišavo.",
    notes:
      "TOP NOTES:\nBergamot, Mandarin, Pink Pepper\n\nMIDDLE NOTES:\nPeach, Osmanthus, Cinnamon, Cassis\n\nBASE NOTES:\nAnimalic leather, Patchouli Heart, Sandalwood, Cotton Candy, Vanilla",
    ingredients:
      "ALCOHOL DENAT., PARFUM, LIMONENE, ALPHA-ISOMETHYL IONONE, LINALOOL, CINNAMAL, CITRONELLOL, EUGENOL, CINNAMYL ALCOHOL, GERANIOL, CITRAL, BENZYL CINNAMATE, BENZYL BENZOATE, AMYL CINNAMAL, BENZYL SALICYLATE.",
  },
  "hedonik-obsessive-devotion": {
    metaLine1: "30 ml",
    metaLine2: "Extrait de Parfum",
    description:
      "Obsessive Devotion: ime uteleša moja čustva in občudovanje do mogočne sestavine parfumerije – absolut champace. Obsesivna misel je vodila ustvarjanje te dišave. Usnje je ena od drugih not in osebna obsedenost ter hkrati podpis te linije parfumov znamke.",
    notes:
      "TOP NOTES:\nBergamot, Grapefruit\n\nMIDDLE NOTES:\nPeach, Pink Pepper, Ylang Ylang, Champaca\n\nBASE NOTES:\nIris, Smokey Leather, Oakmoss, Patchouli Heart, Sandalwood",
    ingredients:
      "ALCOHOL DENAT., PARFUM, ALPHA-ISOMETHYL IONONE, LINALOOL, LIMONENE, HYDROXYCITRONELLAL, BENZYL BENZOATE, CITRONELLOL, GERANIOL, BENZYL SALICYLATE, COUMARIN, FARNESOL, BENZYL CINNAMATE, EUGENOL, CITRAL, BENZYL ALCOHOL, ISOEUGENOL.",
  },
  "meo-nota-di-viaggio-1": {
    metaLine1: "100 ml",
    metaLine2: "Parfum",
    description:
      "Vse se je začelo v Istanbulu. Vsak od nas v življenju doživi obred prehoda, zame pa je bilo to tisto potovanje — sredi kaotičnih glasov Velikega bazarja in vrtinčaste dišave začimb s starodavnega trga. 1# Nota di Viaggio (Rites de passage) je moj poklon nomadom, dušam, ki so vedno v gibanju, in uhajajočim duhovom. Topel in začinjen parfum, ki z uvodnimi notami črnega popra, grenivke in bergamota slavi vrata na Vzhod, ki jih je nekoč predstavljal Carigrad.",
    notes:
      "Bergamot, Birch, Cade, Cedar wood, Cinnamon, Elemi, Geranium, Ginger, Grapefruit, Incense, Jasmine, Oud, Patchouli, Pink Pepper, Saffron, Sichuan Pepper, Tobacco Abs, Vanilla, Vetiver",
    ingredients: "",
  },
  "meo-nota-di-viaggio-2": {
    metaLine1: "100 ml",
    metaLine2: "Parfum",
    description:
      "Potovanje v Maroko — himna radosti, sreči potovanja in lepoti srečanja. Shukran v arabščini pomeni „hvala“. 2# Nota di Viaggio (Shukran…) je moja osebna želja, da svoja potovanja v Maroku pripovedujem skozi parfum — sveti obred za ljudstvo Berberov, ki postane vsakodnevna kretnja srečanja za vsakega popotnika: čaj z meto.",
    notes:
      "Eucalyptus, Lemon, Lemongrass, Litsea Cubeba, Moroccan chamomile, Moroccan dwarf mint, Sandalwood, Tobacco, Verbena",
    ingredients: "",
  },
  "meo-notturno": {
    metaLine1: "100 ml",
    metaLine2: "Parfum",
    description:
      "Poklon noči in poeziji. Notturno pripoveduje o mojem notranjem potovanju — temnem tunelu, kjer sem se lahko ustavil in premišljeval o lepoti poezije, o besedi, vklesani s črnilom življenja. Opojne note ruma označijo pot kot udarec. Eterično potovanje v oddaljen čas, v namišljene temne sobe uma.",
    notes:
      "Amber, Birch, Cedar, Incense, Ink Agreement, Leather, Moss, Pineapple, Rum, Sandalwood",
    ingredients: "",
  },
  "meo-narcotico": {
    metaLine1: "100 ml",
    metaLine2: "Parfum",
    description:
      "Srečanje z našimi najglobljimi spomini je lahko preobremenjujoče — to sem poskušal ustvariti z Narcotico, osebno in globoko potovanje v najbolj skrite olfaktorne spomine moje duše. Narcotico pripoveduje skozi potovanje v Palermo — mesto tisoč kontrastov, med njegovimi ulicami in cerkvami — duhovno potovanje duše, mojega osebnega odnosa s Svetim.",
    notes:
      "Benzoin, Guaiac Wood, Incense, Labdanum, Oud, Patchouli, Thyme, Tonka bean, Vetiver",
    ingredients: "",
  },
  "meo-odor93": {
    metaLine1: "100 ml",
    metaLine2: "Parfum",
    description:
      "Odor 93 je potovanje v svet pravljic. Čustvena posvetitev skupini Current 93 in njenemu ustanovitelju Davidu Tibetu. Dišeča zgodba odpre zaveso med dimnimi in začinjenimi notami. Obred pripovedovanja se praznuje; megla skriva pred očmi, kar se je zgodilo, in povzdiguje našo domišljijo — to onirično potovanje. Koraki postajajo počasnejši in parfum odpre srce zgodbe.",
    notes:
      "Cumin, Guaiac Wood, Narcissus, Patchouli, Tuberose",
    ingredients: "",
  },
  "meo-littlesong": {
    metaLine1: "100 ml",
    metaLine2: "Parfum",
    description:
      "Little Song pripoveduje o metamorfozi časa, ki neusmiljeno teče skozi naša življenja. Parfum, ki govori o moji samoti in o mojem intimnem občutku časa, ki teče in spreminja stvari. Little Song govori s preteklostjo. Kako lahko pripovedujemo o minevanju časa? Kako najdemo vonj metamorfoze? V začetni vibraciji njegovih citrusnih in začinjenih not poslušam upanje.",
    notes:
      "Coffee, Rose, Tobacco",
    ingredients: "",
  },
  "meo-varanasi": {
    metaLine1: "100 ml",
    metaLine2: "Parfum",
    description:
      "Varanasi je navdihnjen z mojim potovanjem v Indijo leta 2017 — pripoveduje, kaj od Indije je ostalo v mojem srcu, v mojih mislih, v moji duši in v mojem nosu. Varanasi je sveto in profano mesto vonja, bogato s kontrasti in pomeni. Ta parfum sem sestavil tako, da sem se dal voditi od visceralnega čustva, ki sem ga občutil tisti dan, ko sem držal sveto vodo Gangesa v rokah; iskal sem v svojem olfaktornem spominu in našel vir, iz katerega je bilo vse ustvarjeno.",
    notes:
      "Ambergris, Ambrette, Cardamom, Cypriol, Gurjum, Incense, Jasmine, Leather Accord, Nardo, Nutmeg, Oud, Rose, Saffron, Vetiver",
    ingredients: "",
  },
  "meo-sogni": {
    metaLine1: "100 ml",
    metaLine2: "Parfum",
    description:
      "Sogni pripoveduje o tistem trenutku, obešenem med sanjami in resničnim življenjem, o tistem hipu, ko sta naša um in srce še vedno na oddaljenem kraju in se počutimo izgubljene, zmedene, obešene… S Sogni sem pripovedoval zgodbo svoje ljubezni do Japonske, spomine na pretekla potovanja, svojo strast do Kawabatine literature, Kurosawinih filmov in bonsajev. Poskušal sem pripovedovati novo zgodbo skozi toplo leseno dišavo — moje japonske sanje.",
    notes:
      "Amber, Bamboo, Cedar wood, Guaiac Wood, Incense, Kodo Ritual, Musk, Oak Wood, Peony, Pine Needles, Rice Absolute, Roasted Green Tea, Sandalwood, Tatami, Tobacco, Vetiver",
    ingredients: "",
  },
  "headspace-kirsch": {
    metaLine1: "30 ml",
    metaLine2: "Eau de Parfum",
    description:
      "Zapeljevanje je spretnost; privlačnost, instinkt. Prizorišče je pripravljeno: lesena miza, usnjene blazinice, nekaj perunik za okras in, vabljivo, sočne češnje. Izmenjavanje med viteško občutljivostjo in implicitno živalskostjo. Noblesse oblige, najprej postrezi drugemu, poklon ceremonialnim tradicijam sakeja in kirscha. Nazdravimo sreči, prenovi in neskončnim možnostim pozno nočnih ur. Spoznavajta se in požirata drug drugega hkrati. Uživajta v sedanjosti s strastjo in hvaležnostjo. Povabi ali privoli. Vse, kar ostane, je izbira med efemerno ali večno avanturo.\n\n87,80 % sestavin naravnega izvora.",
    notes:
      "A chic, all-consuming cherry.\n\nRed Fruit Accord, Cherry Accord, Saffron, Iris Concrete, Rum Absolute, Leather, Oak Moss Absolute, Ambrox.\n\nLeather, Fruity, Powdery",
    ingredients:
      "Alcohol Denat., Parfum (Fragrance), Aqua (Water), Evernia Prunastri Extract",
  },
  "headspace-absinth": {
    metaLine1: "30 ml",
    metaLine2: "Eau de Parfum",
    description:
      "V brenčanju vibrirajočega kluba se telesa dotikajo drug drugega, vabljivo in dotakljivo z nepremišljeno predanostjo. Neobvladljivo vzdušje zabave, ki nima konca. Globoko v noč, ko decibeli naraščajo, zavore izgubljajo stražo. Divji naval zvokov in vonjev globoko v zgodnje ure.\n\n91,86 % sestavin naravnega izvora.",
    notes:
      "An aromatic and green leather, stunningly chic.\n\nWormwood, Violet Leaf, Narcissus, Patchouli Heart, Vetiver, Leather Accord, Styrax.\n\nGreen, Aromatic, Leather",
    ingredients:
      "Alcohol Denat., Parfum (Fragrance), Aqua (Water), Limonene, Coumarin, Linalool, Alpha-isomethyl Ionone, Citral, Eugenol, Methyl 2-octynoate, Geraniol, Citronellol",
  },
  "headspace-genviere": {
    metaLine1: "30 ml",
    metaLine2: "Eau de Parfum",
    description:
      "Na robu noči, ko se začnejo valiti dobri časi, nežno uživaj kozarec gina, na ledu. Skupaj s svojim plemenom uživaj na tej zabavi prav toliko kot na misli o prihodnjih.\n\n92,50 % sestavin naravnega izvora.",
    notes:
      "Mandarin, Pink Pepper CO2, Juniper Berries Balkans, Cedarwood, Olibanum.\n\nCitrusy, Spicy, Woody",
    ingredients:
      "Alcohol Denat., Parfum (Fragrance), Aqua (Water), Limonene, Linalool, Citral, Citronellol, Eugenol, Cinnamal, Isoeugenol",
  },
  "headspace-myrrhe": {
    metaLine1: "30 ml",
    metaLine2: "Eau de Parfum",
    description:
      "Strma hrib skriva majhno, nedotaknjeno plažo z belim peskom, pometeno z morskim vetrom. Kot naključno puščena tam, impozantna skala, mokra od morskega prša, tvori mineralno nišo. Še vedno topla od včerajšnjega sonca, idealna za meditacijo. Kraj, kjer občasno sediš, z zaprtimi očmi, obrnjen proti neskončnim valovom. Mistična tišina in spokojnost. Sveža in sijoča mirra.",
    notes:
      "Cinnamon Ceylon, Myrrh Extra Pure, Patchouli Indonesia, Olibanum, Cedarwood.\n\nOriental, Spicy, Woody",
    ingredients:
      "Alcohol Denat., Parfum (Fragrance), Aqua (Water), Limonene, BHT, Coumarin, Alpha-isomethyl Ionone, Citronellol, Linalool, Eugenol, Geraniol, Benzyl Benzoate, Citral, Cinnamal, Benzyl Cinnamate",
  },
  "headspace-santal": {
    metaLine1: "30 ml",
    metaLine2: "Eau de Parfum",
    description:
      "Nedolžna hvala lahkote, čiste breztežnosti in preprostosti obstoja. Ujeti energijo tistega čarobnega trenutka, ko neznano ni več strašno in vse postane brez truda, ko se človek neizogibno čuti veličastnega in nepremagljivega, kot da hodi po zraku. Iskrica roza šampanjca brezhibno dišečega z velikim večernim sandalovim lesom.\n\n88,67 % sestavin naravnega izvora.",
    notes:
      "Red Fruit Accord, Saffron, Rose, Sandalwood, Olibanum, Patchouli Heart, Vetiver.\n\nWoody, Fruity",
    ingredients:
      "Alcohol Denat., Parfum (Fragrance), Aqua (Water), Citronellol, Coumarin, Limonene, Eugenol, Cinnamal, Farnesol, Geraniol, Linalool, Isoeugenol",
  },
  "headspace-sauge": {
    metaLine1: "30 ml",
    metaLine2: "Eau de Parfum",
    description:
      "Ob prvem svitu zore impulzivna narava nosi ostro svežino bele vode gorskega potoka. Tudi najšibkejši vonj je evforično povečan. Nežni vonj komaj razcvetelih divjih rastlin prežema zrak in simbolizira obljubo prenove, upanje možnosti. Začinjena žajblja na fougère zgradbi.\n\n92,53 % sestavin naravnega izvora.",
    notes:
      "Madagascar Black Pepper, Angelica Root, Clary Sage, Geranium, Cumin, Cypress, Olibanum, Tonka Bean, Cypriol Heart, Sandalwood.\n\nHerbaceous, Fougere, Woody",
    ingredients:
      "Alcohol Denat., Parfum (Fragrance), Aqua (Water), Limonene, Coumarin, Citronellol, Linalool, Geraniol, Citral",
  },
  "headspace-syrax": {
    metaLine1: "30 ml",
    metaLine2: "Eau de Parfum",
    description:
      "Trenutek privilegija, um in telo popolnoma povezana, človek in konj nenadoma postaneta eno. Medsebojna ukrotitev. Nalezljiva toplina kostanjevatega konja z breskvasto kožo prebudi željo po nebrzdani jahanju. Hvala pobegu v galopu, končna metafora neukročene svobode. Intenziven in usnat živalski jantar.\n\n94,09 % sestavin naravnega izvora.",
    notes:
      "Cypriol, Labdanum, Osmanthus, Indonesian Patchouli, Vetiver, Saffron, Amber.\n\nAmber, Woody",
    ingredients:
      "Alcohol Denat., Parfum (Fragrance), Aqua (Water), Alpha-isomethyl Ionone, Coumarin, Benzyl Alcohol",
  },
  "headspace-tubereuse": {
    metaLine1: "30 ml",
    metaLine2: "Eau de Parfum",
    description:
      "Soba s pogledom: na njeni goli koži spomin na telesno ekstazo in v zraku vitka sled cigaretnega dima. Neizbrisna sled ljubezni, goreči spomin na poželjivo strast. Narkotičen parfum, drhtenje prepovedanega, vrnitev k naravnim instinktom parfuma. Narkotična tuberoza z dimnim zelenim začetkom.\n\n90,52 % sestavin naravnega izvora.",
    notes:
      "Tuberose, Galbanum, Mastic, Blackcurrant Bud, Tobacco, Bourbon Vanilla CO2, Cedarwood.\n\nGreen, Floriental",
    ingredients:
      "Alcohol Denat., Parfum (Fragrance), Aqua (Water), Hexyl Cinnamal, Linalool, Coumarin, Eugenol, Benzyl Benzoate, Isoeugenol, Limonene, Benzyl Alcohol",
  },
  "barutti-berlin-in-winter": {
    metaLine1: "30 ml",
    metaLine2: "Extrait de Parfum",
    description:
      "Alkoholno, bujno in sadno. Ta opojna dišava evocira intimne in udobne noči ob kaminu. Kompozicija se odpre s svežo noto grškega mastiksa, obloženo s sladkostjo slive, lista ribeza in alkoholnostjo viskija. Kanček pražene kave ji daje nezmotljivo moderno ostrino. Sanjarski šepet vrtnice se skriva v ozadju. Dišava za vse vreme z očarljivimi zgodbami.",
    notes:
      "Lavender (Greece), Mastic oil (Chios), Rose (Greece), Iris, Cassis, Plum, Myrrh, Frankincense (Oman), Irish Coffee, NOOUD, Amber, Leather",
    ingredients:
      "Alcohol (denat), Fragrance, Aqua (Water), Geraniol, Eugenol, Linalool, Citronellol, Coumarin, Benzyl Benzoate, Limonene, Isoeugenol",
  },
  "barutti-chai": {
    metaLine1: "30 ml",
    metaLine2: "Extrait de Parfum",
    description:
      "Chai latte sem prvič odkril, ko sem bil doktorski študent v Nemčiji. Leta kasneje, ko sem začel s parfumerijo, so me zanimale začimbe in odločil sem se preveriti, ali lahko rekonstruiram eno od svojih najljubših pijač. Rezultat je parfumska različica chai lattea, a bolj sofisticirana. Še posebej sem ponosen na to, kako je v parfumu predstavljen del mlečne pene.",
    notes:
      "Cinnamon, Cloves, Ginger, Cardamom, Pepper, Black Tea, Steamed Milk, Cocoa, Roses, Vanilla, Musk, Leather",
    ingredients:
      "Alcohol (denat), Fragrance, Aqua (Water), Linalool, Eugenol, Geraniol, Cinnamal, Limonene, Cinnamic Alcohol",
  },
  "barutti-dama-koupa": {
    metaLine1: "30 ml",
    metaLine2: "Extrait de Parfum",
    description:
      "Dama Koupa iz grščine pomeni „Kraljica src“. Pri razvoju sem si zadal nalogo ustvariti zapeljivo a čutno dišavo, ki ne bi bila vulgarna ali vsiljiva. Ta formula je za popolnost potrebovala približno 2 leti. V srcu dišave je irisni akord, ki vključuje malo masla iz perunike (orris butter). Ta sestavina je v parfumeriji res posebna. Izvira iz korenin bradate perunike, istih perunik, ki jih je slavno slikal Van Gogh. Čeprav ima žensko ime, zagotovo ni le ženska dišava in odlično deluje tudi na moških.",
    notes:
      "Macaroons, Iris, Osmanthus, Musk, Amber, White woods, Beeswax, Fir Balsam Absolute",
    ingredients:
      "Alcohol (denat), Fragrance, Aqua (Water), Benzyl Benzoate",
  },
  "barutti-nooud": {
    metaLine1: "30 ml",
    metaLine2: "Extrait de Parfum",
    description:
      "Rezultat iskanja popolne rekonstrukcije ouda. Na trgu je na voljo veliko predmešanih oudov za parfumerje, vendar se jih raje izogibam. Vedno želim vedeti, s čim delam. Ena od težav pri delu s predmešanimi sestavinami je, da ne veste, kaj točno je v mešanici. In ne morete prilagoditi ploskev, ki vam niso všeč. Med razvojem sem opazil zanimivo igro besed: „no-oud“ se lahko bere tudi kot „nude“ (gol). Po le nekaj prilagoditvah je bil naš NOOUD končan. To je enonotna temna, dimna oud dišava, idealna za slojevanje ali kot zapeljiva samostojna dišava.",
    notes:
      "Dry Oud",
    ingredients:
      "Alcohol (denat), Fragrance, Aqua (Water), Benzyl Benzoate",
  },
  "barutti-oh-my-deer": {
    metaLine1: "30 ml",
    metaLine2: "Extrait de Parfum",
    description:
      "Oh My Deer! Umazana glava je večna radost, pravijo! Parfum se je začel kot vaja pri rekreiranju vonja jelenjega mošusa; akord je bil hitro narejen, a izdaja kot samostojna dišava se je zdela dolgočasna in odveč, zato je bila okoli njega zgrajena celotna kompozicija. S poudarkom na kontrastu se parfum odpre zelo svetlo in žareče, nato se počasi preoblikuje v to čutno, objemajočo dišavo, ki hkrati daje vznemirjenje in udobje. Kot v pesmi The Honeymooners skupine Lucky Jim: „Moje telo naj bo tvoj fokus, tvoje delo naj bo moja radost“ – ali preprosto: brez truda ni napredka!",
    notes:
      "Black pepper, Sichuan pepper, Aldehydes, Metallic notes, Lily of the valley accord, Incense, Amber, Vanilla, Soft barnyard accord, and tons of Musk",
    ingredients:
      "Alcohol (denat), Fragrance, Aqua (Water), Alpha-isomethyl Ionone, Coumarin, Limonene, Hydroxycitronellal, Benzyl Benzoate, Linalool",
  },
  "barutti-preverso": {
    metaLine1: "30 ml",
    metaLine2: "Extrait de Parfum",
    description:
      "Ime izvira iz nemškega izraza Pervers Gut, ki v prostem prevodu pomeni perverzno dobro. Ta izraz pogosto uporabljam za hrano ali pijače, ki so močno obložene s čokolado. Ime ustreza parfumu, saj ne vsebuje le okusnih not, temveč tudi ogromne količine le-teh. Zgrajen je okoli čokoladnega/lešnikov akorda, ki ga kontrastira tobak in zelo seksi suha osnova. Zagotovo pritegne poglede in bo povzročil pozornost, ko ga nosite. Zagotovljeno.",
    notes:
      "Rum, Roasted nut, Cocoa powder, Caramel fudge, Fig, Tobacco leaf, Styrax, Musk, Ambergris",
    ingredients:
      "Alcohol (denat), Fragrance, Aqua (Water), Evernia Prunastri (Oak Moss) Extract, Benzyl Benzoate",
  },
  "bepolar": {
    metaLine1: "30 ml",
    metaLine2: "Extrait de Parfum",
    description:
      "Eklektični parfumer Angelo Orazio Pregoni je v stranskem projektu ustvaril tri parfume. Ta je eden od njih in prikazuje četrto stanje bipolarne motnje – občutek, ko ti je vseeno za vse. Zato je flaska oblikovana po tabletki, vonj pa je namerno medicinski in vedno enak, kot vsakodnevni ritual. Bepolar podira predsodke, povezane z bipolarno motnjo, in notranje konflikte ter protislovja jaza spremeni v čisto in pristno lepoto. Raziskuje individualnost človeka, pestro in večbarvno, ter povzdigne njeno izjemno občutljivost. Bepolar je konceptualni luksuz. Bepolar je umetnost.",
    notes:
      "HEAD (Drunkness):\nElderberry, Mandarin, Pineapple\n\nHEART (Week End):\nAnise, Pink Pepper, Violet\n\nBASE (We Can):\nJuniper, Bay Laurel, Tobacco",
    ingredients: "",
  },
};

export const KOLEKCIJA_ITEMS: KolekcijaItem[] = [
  { slug: "kinetic-aura", imageSrc: "/Kinetic/Aura.png", alt: "Aura", brand: "Kinetic Parfums Barcelona", name: "Aura" },
  { slug: "kinetic-insomnia", imageSrc: "/Kinetic/Insomnia.png", alt: "Insomnia", brand: "Kinetic Parfums Barcelona", name: "Insomnia" },
  { slug: "kinetic-kayu", imageSrc: "/Kinetic/Kayu.png", alt: "Kayu", brand: "Kinetic Parfums Barcelona", name: "Kayu" },
  { slug: "kinetic-mosaic", imageSrc: "/Kinetic/Mosaic.png", alt: "Mosaic", brand: "Kinetic Parfums Barcelona", name: "Mosaic" },
  { slug: "kinetic-sillage", imageSrc: "/Kinetic/Sillage.png", alt: "Sillage", brand: "Kinetic Parfums Barcelona", name: "Sillage" },
  { slug: "kinetic-verdigris", imageSrc: "/Kinetic/Verdigris.png", alt: "Verdigris", brand: "Kinetic Parfums Barcelona", name: "Verdigris" },
  { slug: "hedonik-divine-perversion", imageSrc: "/Hedonik/DivinePerversion.webp", alt: "Divine Perversion", brand: "Hedonik", name: "Divine Perversion" },
  { slug: "hedonik-exquisite-affair", imageSrc: "/Hedonik/ExquisiteAffair.png", alt: "Exquisite Affair", brand: "Hedonik", name: "Exquisite Affair" },
  { slug: "hedonik-obsessive-devotion", imageSrc: "/Hedonik/ObsessiveDevotion.webp", alt: "Obsessive Devotion", brand: "Hedonik", name: "Obsessive Devotion" },
  { slug: "meo-nota-di-viaggio-1", imageSrc: "/Meo/1%23NotaDiViaggio.png", alt: "Nota Di Viaggio 1", brand: "Meo Fusciuni", name: "Nota Di Viaggio 1" },
  { slug: "meo-sogni", imageSrc: "/Meo/Sogni.png", alt: "Sogni", brand: "Meo Fusciuni", name: "Sogni" },
  { slug: "meo-narcotico", imageSrc: "/Meo/Narcotico.png", alt: "Narcotico", brand: "Meo Fusciuni", name: "Narcotico", imageClassName: "kolekcija-image kolekcija-image-narcotico" },
  { slug: "meo-notturno", imageSrc: "/Meo/Notturno.png", alt: "Notturno", brand: "Meo Fusciuni", name: "Notturno" },
  { slug: "meo-varanasi", imageSrc: "/Meo/Varanasi.png", alt: "Varanasi", brand: "Meo Fusciuni", name: "Varanasi" },
  { slug: "meo-littlesong", imageSrc: "/Meo/LittleSong.png", alt: "LittleSong", brand: "Meo Fusciuni", name: "LittleSong" },
  { slug: "meo-nota-di-viaggio-2", imageSrc: "/Meo/2%23NotaDiViaggio.png", alt: "Nota Di Viaggio 2", brand: "Meo Fusciuni", name: "Nota Di Viaggio 2" },
  { slug: "meo-odor93", imageSrc: "/Meo/Odor93.png", alt: "Odor93", brand: "Meo Fusciuni", name: "Odor93" },
  { slug: "headspace-absinth", imageSrc: "/Headspace/absinth.webp", alt: "Absinth", brand: "Headspace", name: "Absinth" },
  { slug: "headspace-genviere", imageSrc: "/Headspace/Genviere.png", alt: "Genviere", brand: "Headspace", name: "Genviere" },
  { slug: "headspace-kirsch", imageSrc: "/Headspace/kirsch.webp", alt: "Kirsch", brand: "Headspace", name: "Kirsch" },
  { slug: "headspace-myrrhe", imageSrc: "/Headspace/Myrrhe.png", alt: "Myrrhe", brand: "Headspace", name: "Myrrhe" },
  { slug: "headspace-santal", imageSrc: "/Headspace/santal.webp", alt: "Santal", brand: "Headspace", name: "Santal" },
  { slug: "headspace-sauge", imageSrc: "/Headspace/Sauge.png", alt: "Sauge", brand: "Headspace", name: "Sauge" },
  { slug: "headspace-syrax", imageSrc: "/Headspace/Syrax.png", alt: "Syrax", brand: "Headspace", name: "Syrax" },
  { slug: "headspace-tubereuse", imageSrc: "/Headspace/tubereuse.png", alt: "Tubereuse", brand: "Headspace", name: "Tubereuse" },
  { slug: "barutti-berlin-in-winter", imageSrc: "/Barutti/BerlininWinter.png", alt: "Berlin in Winter", brand: "Barutti", name: "Berlin in Winter" },
  { slug: "barutti-chai", imageSrc: "/Barutti/Chai.png", alt: "Chai", brand: "Barutti", name: "Chai" },
  { slug: "barutti-dama-koupa", imageSrc: "/Barutti/Dama%20Koupa.png", alt: "Dama Koupa", brand: "Barutti", name: "Dama Koupa" },
  { slug: "barutti-nooud", imageSrc: "/Barutti/Nooud.png", alt: "Nooud", brand: "Barutti", name: "Nooud" },
  { slug: "barutti-oh-my-deer", imageSrc: "/Barutti/OhMyDeer.png", alt: "Oh My Deer", brand: "Barutti", name: "Oh My Deer" },
  { slug: "barutti-preverso", imageSrc: "/Barutti/Preverso.png", alt: "Preverso", brand: "Barutti", name: "Preverso" },
  { slug: "bepolar", imageSrc: "/Bepolar/Bepolar.png", alt: "Bepolar", brand: "Bepolar", name: "Bepolar" },
];

const PARFUM_BY_SLUG: Record<string, ParfumDetailData> = {};
KOLEKCIJA_ITEMS.forEach((item) => {
  const overrides = PARFUM_DETAIL_OVERRIDES[item.slug];
  PARFUM_BY_SLUG[item.slug] = {
    imageSrc: item.imageSrc,
    name: item.name,
    metaLine1: overrides?.metaLine1 ?? META_PLACEHOLDER,
    metaLine2: overrides?.metaLine2 ?? META_PLACEHOLDER_2,
    description: overrides?.description ?? "",
    notes: overrides?.notes ?? "",
    ingredients: overrides?.ingredients ?? "",
  };
});

export function getParfumBySlug(slug: string): ParfumDetailData | null {
  return PARFUM_BY_SLUG[slug] ?? null;
}
