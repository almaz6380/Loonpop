// Die Begriffe des Spiels an einer Stelle.
//
// Bewusst schlichte Datensaetze ohne Methoden: Der Spielkern rechnet in reinen
// Funktionen ueber diesen Daten. Das haelt ihn testbar ohne Browser — und es ist
// die Voraussetzung dafuer, dass derselbe Seed auf jedem Geraet denselben Lauf
// ergibt (siehe endlos.ts).

export type Punkt = { x: number; y: number };

/** Eine Nadel ist eine Strecke. Beruehrung laesst den Ballon platzen. */
export type Nadel = {
  von: Punkt;
  bis: Punkt;
  /** Bewegte Nadeln: Weg und Tempo. Fehlt das Feld, steht sie still. */
  pendel?: { weg: Punkt; dauer: number };
};

/** Ein Bereich, der dauerhaft schiebt — Aufwind, Seitenwind, Fallschacht. */
export type Zone = {
  bereich: { x: number; y: number; breite: number; hoehe: number };
  kraft: Punkt;
};

export type Level = {
  id: number;
  name: string;
  groesse: { breite: number; hoehe: number };
  start: Punkt;
  ziel: { pos: Punkt; radius: number };
  nadeln: Nadel[];
  zonen: Zone[];
  /**
   * Die Temposchraube. Traegheit ist das Fundament (siehe physik.ts) — schneller
   * wird ein Level NICHT durch andere Physik, sondern durch engere Gassen,
   * staerkeren Wind und ein Zeitlimit. Zwei Physik-Modi waeren zwei Spiele, die
   * sich beide nur halb gut anfuehlen.
   */
  tempo: {
    /** Wie kraeftig das Geblaese schiebt (px/s²). */
    windKraft: number;
    /** Luftwiderstand (1/s). Hoeher = zaeher, traeger, verzeihender. */
    daempfung: number;
    /** Sekunden, 0 = ohne Limit. */
    zeitlimit: number;
  };
};

export type Ballon = {
  pos: Punkt;
  /** Die Position VOR dem letzten Schritt — nur fuers Zeichnen (Interpolation). */
  vorher: Punkt;
  geschw: Punkt;
  radius: number;
};

export type Ausgang = 'laeuft' | 'geschafft' | 'geplatzt' | 'zeit-aus';

export type Welt = {
  level: Level;
  ballon: Ballon;
  /** Wohin der Finger zeigt. null = niemand tippt. */
  windZiel: Punkt | null;
  /**
   * 0…1. Steigt beim Tippen schnell an und faellt beim Loslassen langsam ab —
   * das Nachtreiben ist das Spielgefuehl, kein Fehler. Siehe physik.ts.
   */
  windStaerke: number;
  /** Vergangene Spielzeit in Sekunden. Treibt auch die Pendel-Nadeln. */
  zeit: number;
  ausgang: Ausgang;
};
