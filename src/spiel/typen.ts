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
  /**
   * `hoch`    — das ganze Level passt auf den Schirm, der Ballon muss nach oben.
   * `strecke` — das Level ist breiter als der Schirm; die Kamera laeuft
   *             waagerecht mit, und der Ballon muss nach rechts.
   *
   * ⚠ Nicht aus der Groesse erraten: Bei welchem Seitenverhaeltnis gescrollt
   * wird, haengt sonst vom Geraet ab, und dasselbe Level waere auf einem
   * breiten Schirm ein anderes Spiel.
   */
  art: 'hoch' | 'strecke';
  groesse: { breite: number; hoehe: number };
  start: Punkt;
  /** Waagerechte Startposition des Geblaeses. */
  geblaeseStart: number;
  ziel: { pos: Punkt; radius: number };
  nadeln: Nadel[];
  zonen: Zone[];
  /**
   * Staendiger Wind ueber das ganze Level (px/s²). Auf Strecken treibt er den
   * Ballon nach rechts — sonst muesste man ihn ueber den Strahlrand
   * dorthinschieben, und eine Strecke von 2400 px dauerte eine halbe Minute
   * Seitwaertsschieben. Mit Grundwind wird daraus, was es sein soll: Der
   * Ballon treibt wie ein Blatt, du haeltst ihn in der Luft und lenkst.
   * Fehlt das Feld, steht die Luft.
   */
  grundwind?: Punkt;
  /**
   * Die Temposchraube. Traegheit ist das Fundament (siehe physik.ts) — schneller
   * wird ein Level NICHT durch andere Physik, sondern durch engere Gassen,
   * staerkeren Wind und ein Zeitlimit. Zwei Physik-Modi waeren zwei Spiele, die
   * sich beide nur halb gut anfuehlen.
   */
  tempo: {
    /** Wie kraeftig der Luftstrahl direkt an der Duese schiebt (px/s²). */
    blaskraft: number;
    /** Luftwiderstand (1/s). Hoeher = zaeher, traeger, verzeihender. */
    daempfung: number;
    /** Sekunden, 0 = ohne Limit. */
    zeitlimit: number;
  };
};

/**
 * Das Laubgeblaese — die Spielfigur. Es steht am unteren Rand, faehrt mit dem
 * Finger waagerecht mit und blaest SENKRECHT nach oben. Drehen laesst es sich
 * nicht: Seitlich gesteuert wird, indem man sich versetzt hinstellt (siehe
 * physik.ts, Strahlmodell).
 */
export type Geblaese = {
  /** Waagerechte Position der Duese in Levelkoordinaten. */
  x: number;
  /** Haelt der Finger gerade? */
  an: boolean;
  /**
   * 0…1. Laeuft schnell an und langsam aus — das Nachtreiben des Ballons nach
   * dem Loslassen ist das Spielgefuehl, kein Fehler.
   */
  staerke: number;
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
  geblaese: Geblaese;
  /** Vergangene Spielzeit in Sekunden. Treibt auch die Pendel-Nadeln. */
  zeit: number;
  ausgang: Ausgang;
};
