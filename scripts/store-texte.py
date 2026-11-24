"""Store-Texte beider Stores in allen 13 Sprachen (02.10.2026).

Aufruf:  python3 scripts/store-texte.py   → store-assets/texte/<code>.json

Hier liegt die Wahrheit, nicht in den Konsolen. Wer in der Play Console oder in
App Store Connect einen Text von Hand aendert, zieht ihn hier nach.
Die Laengen prueft src/lib/store.test.ts (Play: Titel 30, Kurztext 80,
Volltext 4000; App Store: Name 30, Untertitel 30, Stichworte 100,
Werbetext 170, Beschreibung 4000).

⚠ Seit 1.1 gibt es Werbung (AdMob) und den Kauf „Werbung entfernen“. Die
Texte versprechen nur noch „kein Konto“. Kommt M5 (Konten), muessen sie mit,
dazu die Datenschutz-Angaben in beiden Konsolen (docs/store.md).

⚠ 30.10.2026: Apple lehnte 1.0 nach 4.3(a) ab („ähnliches Konzept“). Seitdem
steht in Einstieg und Werbetext zuerst, was es so nur hier gibt: Das Gebläse
bläst nur nach oben, gelenkt wird mit dem Rand des Strahls. „Ballon durch
Nadeln“ allein klingt wie viele andere Spiele.

⚠ 23.11.2026 Neugestaltung: Das Gebläse KIPPT jetzt (Josefs Entscheidung,
Regel 1a in CLAUDE.md), „lässt sich nicht drehen“ wäre falsch. Dazu 4 Welten
(51 Level), Sterne, Münzen, 9 Ballon-Skins und der Tagesflug.
"""
import json
from pathlib import Path

T = {}

T['de'] = dict(
 titel='LoonPop: Ballon-Abenteuer',
 kurz='Halte den Ballon mit dem Laubgebläse in der Luft – und weich den Nadeln aus!',
 untertitel='Blasen, lenken, nicht platzen',
 stichworte='ballon,gebläse,nadeln,geschicklichkeit,physik,endlos,arcade,wind,reaktion,casual,offline',
 werbung='Das Gebläse folgt deinem Finger und kippt, wohin du willst. Vier Welten, Sterne, Münzen, Ballon-Skins und jeden Tag ein neuer Tagesflug.',
 text=[
  'Ein Laubgebläse, das deinem Finger folgt und sich neigt – und ein Ballon, den du damit durch Nadeln lenken musst.',
  'In LoonPop hältst du einen Ballon mit einem Laubgebläse in der Luft und lenkst ihn durch Reihen aus Nadeln nach oben. Das Gebläse fährt deinem Finger hinterher und kippt in Fahrtrichtung, bis zu 40 Grad – je weiter dein Finger vorausliegt, desto schräger bläst es und desto kräftiger schiebt es den Ballon zur Seite. Steht es still, bläst es senkrecht nach oben, und der Rand des Luftstrahls drückt den Ballon sanft zur Seite. Ein kurzer Wisch gibt einen Windstoß. Klingt einfach? Der Ballon ist träge: Er reagiert verzögert und treibt nach dem Loslassen weiter. Wer vorausdenkt, gewinnt.',
  'VIER WELTEN, 51 LEVEL\nWiese, Stadt, Wüste und Nacht: 15 Level auf der Wiese, je 12 in den anderen Welten. Seitenwind, Fallwind, pendelnde und fallende Nadeln, wandernde Nadelreihen und enge Gassen. Jedes Level hat bis zu drei Sterne: Ziel erreichen, unter der Sternzeit bleiben, alle drei Münzen einsammeln. Mit den Sternen einer Welt öffnest du die nächste, mit den Münzen kaufst du neue Ballons.',
  'TAGESFLUG\nJeden Tag ein neuer Lauf, für alle gleich. Hol dir deine Tagesbestweite und halte deine Serie am Leben.',
  'ENDLOS-MODUS\nImmer weiter rauf, so weit du kommst. Es wird immer schneller, und immer wieder kommen enge Passagen, die rot schimmern. Wie viele Meter schaffst du?',
  'AUSSERDEM\n• 9 Ballon-Skins, darunter Herz, Heißluftballon und Gold\n• Neue 3D-Optik mit Knall, Konfetti und mehr\n• Nach dem Platzen einmal weiterfliegen – mit einem freiwilligen Video\n• Ein Finger genügt\n• 13 Sprachen\n• Spielt offline, ohne Internetverbindung\n• Kein Konto nötig\n• Werbung lässt sich mit einem einmaligen Kauf entfernen\n• Ton und Vibration, beides abschaltbar',
 ])

T['en'] = dict(
 titel='LoonPop: Balloon Adventure',
 kurz='Keep the balloon in the air with a leaf blower – and dodge the needles!',
 untertitel='Blow, steer, don’t pop',
 stichworte='balloon,blower,needles,skill,physics,endless,arcade,wind,reflex,casual,offline,float,pop',
 werbung='The blower follows your finger and tilts wherever you want. Four worlds, stars, coins, balloon skins and a new Daily Flight every day.',
 text=[
  'A leaf blower that follows your finger and tilts – and a balloon you have to steer through needles with it.',
  'In LoonPop you keep a balloon in the air with a leaf blower and guide it upwards through rows of needles. The blower follows your finger and tilts in the direction it moves, up to 40 degrees – the further your finger leads, the more it leans and the harder it pushes the balloon sideways. Standing still, it blows straight up, and the edge of the air stream nudges the balloon to the side. A quick swipe gives a gust of wind. Sounds easy? The balloon has inertia: it reacts with a delay and keeps drifting after you let go. Think ahead and you win.',
  'FOUR WORLDS, 51 LEVELS\nMeadow, City, Desert and Night: 15 levels in the meadow, 12 in each of the others. Crosswinds, downdrafts, swinging and falling needles, sliding rows of needles and tight passages. Every level has up to three stars: reach the goal, beat the star time, collect all three coins. Stars from one world unlock the next, and coins buy new balloons.',
  'DAILY FLIGHT\nA new run every day, the same for everyone. Set your daily best and keep your streak alive.',
  'ENDLESS MODE\nUp and up, as far as you can go. It keeps getting faster, and again and again narrow passages appear, glowing red. How many metres can you make?',
  'ALSO\n• 9 balloon skins, including heart, hot-air balloon and gold\n• New 3D look with pops, confetti and more\n• After popping, fly on once – with an optional video\n• One finger is all you need\n• 13 languages\n• Plays offline, no internet connection needed\n• No account needed\n• Remove ads with a one-time purchase\n• Sound and haptics, both can be switched off',
 ])

T['es'] = dict(
 titel='LoonPop: Aventura en globo',
 kurz='¡Mantén el globo en el aire con un soplador de hojas y esquiva las agujas!',
 untertitel='Sopla, guía y no revientes',
 stichworte='globo,soplador,agujas,habilidad,física,infinito,arcade,viento,reflejos,casual,sin conexión',
 werbung='El soplador sigue tu dedo y se inclina hacia donde quieras. Cuatro mundos, estrellas, monedas, globos nuevos y un Vuelo diario cada día.',
 text=[
  'Un soplador de hojas que sigue tu dedo y se inclina, y un globo que tienes que guiar entre agujas con él.',
  'En LoonPop mantienes un globo en el aire con un soplador de hojas y lo guías hacia arriba entre filas de agujas. El soplador sigue tu dedo y se inclina hacia donde se mueve, hasta 40 grados: cuanto más se adelanta tu dedo, más se inclina y con más fuerza empuja el globo hacia un lado. Quieto, sopla en vertical, y el borde del chorro de aire desplaza el globo suavemente. Un deslizamiento rápido lanza una ráfaga de viento. ¿Parece fácil? El globo tiene inercia: reacciona con retraso y sigue flotando cuando sueltas. Quien piensa por adelantado, gana.',
  'CUATRO MUNDOS, 51 NIVELES\nPradera, Ciudad, Desierto y Noche: 15 niveles en la pradera y 12 en cada uno de los demás. Viento lateral, corrientes descendentes, agujas que oscilan y que caen, filas de agujas que se desplazan y pasillos estrechos. Cada nivel tiene hasta tres estrellas: llegar a la meta, bajar del tiempo estrella y recoger las tres monedas. Las estrellas de un mundo abren el siguiente y con las monedas compras globos nuevos.',
  'VUELO DIARIO\nCada día una partida nueva, igual para todos. Consigue tu mejor marca del día y mantén tu racha.',
  'MODO INFINITO\nSiempre hacia arriba, hasta donde llegues. Cada vez es más rápido y aparecen pasos estrechos que brillan en rojo. ¿Cuántos metros lograrás?',
  'ADEMÁS\n• 9 diseños de globo, entre ellos corazón, globo aerostático y oro\n• Nuevo aspecto 3D con estallidos, confeti y más\n• Tras reventar, sigue volando una vez con un vídeo opcional\n• Basta un dedo\n• 13 idiomas\n• Se juega sin conexión a internet\n• No necesitas cuenta\n• Quita los anuncios con una sola compra\n• Sonido y vibración, ambos desactivables',
 ])

T['fr'] = dict(
 titel='LoonPop : l’aventure ballon',
 kurz='Garde le ballon en l’air avec un souffleur de feuilles et évite les aiguilles !',
 untertitel='Souffle, guide, n’éclate pas',
 stichworte='ballon,souffleur,aiguilles,adresse,physique,infini,arcade,vent,réflexes,casual,hors ligne',
 werbung='Le souffleur suit ton doigt et s’incline où tu veux. Quatre mondes, étoiles, pièces, ballons à débloquer et un Vol du jour chaque jour.',
 text=[
  'Un souffleur de feuilles qui suit ton doigt et s’incline, et un ballon à guider avec lui entre les aiguilles.',
  'Dans LoonPop, tu gardes un ballon en l’air avec un souffleur de feuilles et tu le guides vers le haut à travers des rangées d’aiguilles. Le souffleur suit ton doigt et s’incline dans le sens du mouvement, jusqu’à 40 degrés : plus ton doigt est en avance, plus il penche et plus il pousse le ballon sur le côté. À l’arrêt, il souffle tout droit vers le haut, et le bord du jet d’air pousse doucement le ballon de côté. Un petit coup de doigt donne une rafale. Facile ? Le ballon a de l’inertie : il réagit avec un temps de retard et continue de dériver quand tu lâches. Celui qui anticipe gagne.',
  'QUATRE MONDES, 51 NIVEAUX\nPrairie, Ville, Désert et Nuit : 15 niveaux dans la prairie, 12 dans chacun des autres. Vent de côté, courants descendants, aiguilles qui se balancent ou qui tombent, rangées d’aiguilles qui coulissent et passages étroits. Chaque niveau offre jusqu’à trois étoiles : atteindre l’arrivée, battre le temps étoile, ramasser les trois pièces. Les étoiles d’un monde ouvrent le suivant, et les pièces achètent de nouveaux ballons.',
  'VOL DU JOUR\nChaque jour un nouveau parcours, le même pour tout le monde. Bats ton record du jour et garde ta série en vie.',
  'MODE INFINI\nToujours plus haut, aussi loin que possible. Ça va de plus en plus vite, et des passages étroits qui brillent en rouge reviennent sans cesse. Combien de mètres feras-tu ?',
  'ET AUSSI\n• 9 ballons, dont un cœur, une montgolfière et un ballon doré\n• Nouveau look 3D avec explosions, confettis et plus\n• Après l’éclatement, repars une fois grâce à une vidéo facultative\n• Un seul doigt suffit\n• 13 langues\n• Se joue hors ligne, sans connexion internet\n• Aucun compte nécessaire\n• Supprime les pubs avec un achat unique\n• Son et vibrations, désactivables',
 ])

T['it'] = dict(
 titel='LoonPop: Avventura in pallone',
 kurz='Tieni in aria il palloncino con un soffiatore di foglie ed evita gli aghi!',
 untertitel='Soffia, guida, non scoppiare',
 stichworte='palloncino,soffiatore,aghi,abilità,fisica,infinito,arcade,vento,riflessi,casual,offline',
 werbung='Il soffiatore segue il tuo dito e si inclina dove vuoi. Quattro mondi, stelle, monete, nuovi palloncini e un Volo del giorno ogni giorno.',
 text=[
  'Un soffiatore di foglie che segue il tuo dito e si inclina, e un palloncino da guidare con lui tra gli aghi.',
  'In LoonPop tieni in aria un palloncino con un soffiatore di foglie e lo guidi verso l’alto tra file di aghi. Il soffiatore segue il tuo dito e si inclina nella direzione in cui si muove, fino a 40 gradi: più il dito è avanti, più si piega e più spinge forte il palloncino di lato. Da fermo soffia dritto verso l’alto, e il bordo del getto d’aria sposta dolcemente il palloncino. Uno scatto veloce del dito dà una folata di vento. Sembra facile? Il palloncino ha inerzia: reagisce in ritardo e continua a fluttuare quando lasci. Vince chi pensa in anticipo.',
  'QUATTRO MONDI, 51 LIVELLI\nPrato, Città, Deserto e Notte: 15 livelli nel prato, 12 in ciascuno degli altri. Vento laterale, correnti discendenti, aghi che oscillano e che cadono, file di aghi che scorrono e passaggi stretti. Ogni livello ha fino a tre stelle: raggiungere il traguardo, stare sotto il tempo stella, raccogliere tutte e tre le monete. Le stelle di un mondo aprono il successivo e con le monete compri nuovi palloncini.',
  'VOLO DEL GIORNO\nOgni giorno una nuova corsa, uguale per tutti. Fai il tuo record del giorno e mantieni viva la serie.',
  'MODALITÀ INFINITA\nSempre più in alto, finché ce la fai. Diventa sempre più veloce e tornano continuamente passaggi stretti che brillano di rosso. Quanti metri riuscirai a fare?',
  'INOLTRE\n• 9 palloncini, tra cui cuore, mongolfiera e oro\n• Nuova grafica 3D con scoppi, coriandoli e altro\n• Dopo lo scoppio, continua a volare una volta con un video facoltativo\n• Basta un dito\n• 13 lingue\n• Si gioca offline, senza connessione internet\n• Nessun account necessario\n• Rimuovi la pubblicità con un unico acquisto\n• Suono e vibrazione, entrambi disattivabili',
 ])

T['pt'] = dict(
 titel='LoonPop: Aventura de balão',
 kurz='Mantenha o balão no ar com um soprador de folhas e desvie das agulhas!',
 untertitel='Sopre, guie e não estoure',
 stichworte='balão,soprador,agulhas,habilidade,física,infinito,arcade,vento,reflexos,casual,offline',
 werbung='O soprador segue seu dedo e inclina para onde você quiser. Quatro mundos, estrelas, moedas, novos balões e um Voo do dia todo dia.',
 text=[
  'Um soprador de folhas que segue seu dedo e se inclina, e um balão que você precisa guiar com ele entre agulhas.',
  'Em LoonPop você mantém um balão no ar com um soprador de folhas e o guia para cima entre fileiras de agulhas. O soprador segue seu dedo e se inclina na direção do movimento, até 40 graus: quanto mais o dedo vai à frente, mais ele inclina e mais forte empurra o balão para o lado. Parado, ele sopra direto para cima, e a borda do jato de ar empurra o balão de leve para o lado. Um deslize rápido solta uma rajada de vento. Parece fácil? O balão tem inércia: ele reage com atraso e continua flutuando quando você solta. Quem pensa à frente vence.',
  'QUATRO MUNDOS, 51 FASES\nCampo, Cidade, Deserto e Noite: 15 fases no campo e 12 em cada um dos outros. Vento lateral, correntes descendentes, agulhas que balançam e que caem, fileiras de agulhas que deslizam e corredores estreitos. Cada fase tem até três estrelas: chegar ao fim, bater o tempo da estrela e pegar as três moedas. As estrelas de um mundo abrem o próximo, e com as moedas você compra novos balões.',
  'VOO DO DIA\nTodo dia uma nova partida, igual para todos. Faça seu recorde do dia e mantenha sua sequência.',
  'MODO INFINITO\nSempre para cima, até onde você conseguir. Fica cada vez mais rápido, e passagens estreitas que brilham em vermelho aparecem o tempo todo. Quantos metros você vai alcançar?',
  'E MAIS\n• 9 balões, entre eles coração, balão de ar quente e ouro\n• Novo visual 3D com estouros, confete e mais\n• Depois de estourar, continue voando uma vez com um vídeo opcional\n• Basta um dedo\n• 13 idiomas\n• Funciona offline, sem internet\n• Sem necessidade de conta\n• Remova os anúncios com uma compra única\n• Som e vibração, ambos podem ser desligados',
 ])

T['tr'] = dict(
 titel='LoonPop: Balon Macerası',
 kurz='Balonu yaprak üfleyiciyle havada tut ve iğnelerden kaç!',
 untertitel='Üfle, yönlendir, patlatma',
 stichworte='balon,üfleyici,iğne,beceri,fizik,sonsuz,arcade,rüzgar,refleks,casual,çevrimdışı',
 werbung='Üfleyici parmağını takip eder ve istediğin yöne eğilir. Dört dünya, yıldızlar, altınlar, balon görünümleri ve her gün yeni bir Günlük Uçuş.',
 text=[
  'Parmağını takip eden ve eğilen bir yaprak üfleyici ve onunla iğnelerin arasından geçirmen gereken bir balon.',
  'LoonPop’ta bir balonu yaprak üfleyiciyle havada tutar ve iğne sıralarının arasından yukarı taşırsın. Üfleyici parmağını takip eder ve gittiği yöne 40 dereceye kadar eğilir: Parmağın ne kadar öndeyse o kadar eğilir ve balonu o kadar güçlü yana iter. Dururken dümdüz yukarı üfler, hava akımının kenarı da balonu hafifçe yana iter. Kısa bir kaydırma bir rüzgâr darbesi verir. Kolay mı görünüyor? Balonun ataleti var: gecikmeli tepki verir ve bıraktıktan sonra da süzülmeye devam eder. Önceden düşünen kazanır.',
  'DÖRT DÜNYA, 51 BÖLÜM\nÇayır, Şehir, Çöl ve Gece: çayırda 15, diğerlerinin her birinde 12 bölüm. Yan rüzgâr, aşağı akımlar, sallanan ve düşen iğneler, kayan iğne sıraları ve dar geçitler. Her bölümde üç yıldıza kadar kazanırsın: hedefe ulaş, yıldız süresinin altında kal, üç altının hepsini topla. Bir dünyanın yıldızları sonrakini açar, altınlarla yeni balonlar alırsın.',
  'GÜNLÜK UÇUŞ\nHer gün herkes için aynı olan yeni bir uçuş. Günün en iyisini yap ve serini sürdür.',
  'SONSUZ MOD\nHep yukarı, gidebildiğin kadar. Giderek hızlanır ve kırmızı parlayan dar geçitler tekrar tekrar karşına çıkar. Kaç metre yapabilirsin?',
  'AYRICA\n• Kalp, sıcak hava balonu ve altın dahil 9 balon görünümü\n• Patlama, konfeti ve daha fazlasıyla yeni 3D görünüm\n• Patladıktan sonra isteğe bağlı bir videoyla bir kez uçmaya devam et\n• Tek parmak yeter\n• 13 dil\n• İnternetsiz oynanır\n• Hesap gerekmez\n• Reklamları tek seferlik bir satın alımla kaldır\n• Ses ve titreşim, ikisi de kapatılabilir',
 ])

T['pl'] = dict(
 titel='LoonPop: Balonowa przygoda',
 kurz='Utrzymaj balon w powietrzu dmuchawą do liści i omijaj igły!',
 untertitel='Dmuchaj, steruj, nie pękaj',
 stichworte='balon,dmuchawa,igły,zręczność,fizyka,bez końca,arcade,wiatr,refleks,casual,offline',
 werbung='Dmuchawa podąża za palcem i przechyla się, gdzie chcesz. Cztery światy, gwiazdki, monety, nowe balony i codziennie nowy Lot dnia.',
 text=[
  'Dmuchawa do liści, która podąża za twoim palcem i się przechyla, i balon, który musisz nią przeprowadzić między igłami.',
  'W LoonPop utrzymujesz balon w powietrzu dmuchawą do liści i prowadzisz go w górę przez rzędy igieł. Dmuchawa jedzie za twoim palcem i przechyla się w kierunku ruchu, nawet o 40 stopni – im dalej palec wyprzedza dmuchawę, tym mocniej się pochyla i tym silniej spycha balon w bok. Gdy stoi, dmucha pionowo w górę, a krawędź strumienia powietrza delikatnie przesuwa balon w bok. Krótkie machnięcie palcem daje podmuch wiatru. Brzmi prosto? Balon ma bezwładność: reaguje z opóźnieniem i dryfuje dalej, gdy puścisz. Wygrywa ten, kto myśli z wyprzedzeniem.',
  'CZTERY ŚWIATY, 51 POZIOMÓW\nŁąka, Miasto, Pustynia i Noc: 15 poziomów na łące i po 12 w pozostałych. Boczny wiatr, prądy zstępujące, kołyszące się i spadające igły, przesuwające się rzędy igieł i wąskie przejścia. Na każdym poziomie zdobędziesz do trzech gwiazdek: dotrzyj do celu, zmieść się w czasie na gwiazdkę i zbierz wszystkie trzy monety. Gwiazdki z jednego świata otwierają kolejny, a za monety kupisz nowe balony.',
  'LOT DNIA\nCodziennie nowy lot, taki sam dla wszystkich. Ustaw swój rekord dnia i podtrzymaj serię.',
  'TRYB BEZ KOŃCA\nCoraz wyżej, jak daleko dasz radę. Robi się coraz szybciej, a co chwilę pojawiają się wąskie przejścia świecące na czerwono. Ile metrów pokonasz?',
  'PONADTO\n• 9 wyglądów balonu, m.in. serce, balon na ogrzane powietrze i złoto\n• Nowa grafika 3D z wybuchami, konfetti i nie tylko\n• Po pęknięciu leć dalej raz dzięki dobrowolnemu filmikowi\n• Wystarczy jeden palec\n• 13 języków\n• Działa offline, bez internetu\n• Konto nie jest potrzebne\n• Usuń reklamy jednorazowym zakupem\n• Dźwięk i wibracje, oba można wyłączyć',
 ])

T['ru'] = dict(
 titel='LoonPop: Шарик в небе',
 kurz='Держи шарик в воздухе воздуходувкой и уворачивайся от игл!',
 untertitel='Дуй, веди и не лопни',
 stichworte='шарик,воздуходувка,иглы,ловкость,физика,бесконечный,аркада,ветер,реакция,казуальная,офлайн',
 werbung='Воздуходувка следует за пальцем и наклоняется куда нужно. Четыре мира, звёзды, монеты, облики шарика и каждый день новый Полёт дня.',
 text=[
  'Воздуходувка, которая едет за твоим пальцем и наклоняется, и шарик, который нужно провести ею сквозь иглы.',
  'В LoonPop ты держишь воздушный шарик в воздухе с помощью воздуходувки для листьев и ведёшь его вверх сквозь ряды игл. Воздуходувка едет за твоим пальцем и наклоняется в сторону движения — до 40 градусов: чем дальше палец впереди, тем сильнее наклон и тем мощнее она толкает шарик вбок. Когда она стоит, то дует строго вверх, а край воздушной струи мягко сдвигает шарик в сторону. Короткий взмах пальцем даёт порыв ветра. Кажется простым? У шарика есть инерция: он реагирует с задержкой и продолжает лететь, когда ты отпускаешь. Побеждает тот, кто думает наперёд.',
  'ЧЕТЫРЕ МИРА, 51 УРОВЕНЬ\nЛуг, Город, Пустыня и Ночь: 15 уровней на лугу и по 12 в остальных мирах. Боковой ветер, нисходящие потоки, качающиеся и падающие иглы, движущиеся ряды игл и узкие проходы. В каждом уровне до трёх звёзд: долети до цели, уложись во время на звезду, собери все три монеты. Звёзды одного мира открывают следующий, а на монеты покупаются новые шарики.',
  'ПОЛЁТ ДНЯ\nКаждый день новый забег, одинаковый для всех. Установи рекорд дня и не прерывай серию.',
  'БЕСКОНЕЧНЫЙ РЕЖИМ\nВсё выше и выше, насколько хватит сил. Темп постоянно растёт, и снова и снова появляются узкие проходы, светящиеся красным. Сколько метров ты пролетишь?',
  'А ТАКЖЕ\n• 9 обликов шарика, среди них сердце, воздушный шар и золото\n• Новая 3D-графика со взрывами, конфетти и не только\n• После того как шарик лопнул, можно один раз лететь дальше — за добровольное видео\n• Хватит одного пальца\n• 13 языков\n• Играй офлайн, без интернета\n• Аккаунт не нужен\n• Убери рекламу одной покупкой\n• Звук и вибрацию можно выключить',
 ])

T['ja'] = dict(
 titel='LoonPop: 風船アドベンチャー',
 kurz='ブロワーで風船を浮かせて、針をよけながら上を目指そう！',
 untertitel='吹いて、導いて、割らないで',
 stichworte='風船,ブロワー,針,物理,エンドレス,アーケード,風,反射神経,カジュアル,オフライン,ゲーム,浮遊',
 werbung='ブロワーが指についてきて、好きな方向に傾く。4つのワールド、星、コイン、風船スキン、そして毎日新しいデイリーフライト。',
 text=[
  '指についてきて傾くリーフブロワーと、それで針のすき間を抜けさせる風船。',
  'LoonPop では、リーフブロワーで風船を空中に浮かせ、並んだ針のすき間を抜けて上へと導きます。ブロワーは指を追いかけて動き、進む方向へ最大40度まで傾きます。指が先へ行くほど大きく傾き、風船を強く横へ押し出します。止まっているときは真上に吹き、風の端が風船をそっと横へ押します。指をさっとはらうと突風が起きます。簡単そう？ でも風船には慣性があり、反応は遅れ、指を離してもふわりと流れ続けます。先を読む人が勝つゲームです。',
  '4つのワールド、51レベル\n草原、街、砂漠、夜。草原に15、ほかのワールドに12ずつ。横風、下降気流、揺れる針と落ちてくる針、動く針の列、狭い通路。各レベルで最大3つの星：ゴールにたどり着く、スタータイム内にクリアする、コインを3枚すべて集める。星を集めると次のワールドが開き、コインで新しい風船が買えます。',
  'デイリーフライト\n毎日、全員共通の新しいコース。その日のベスト記録を出して、連続記録をつなげよう。',
  'エンドレスモード\nどこまでも上へ。だんだん速くなり、赤く光る狭い難所が何度も現れます。何メートル進めるかな？',
  'その他\n• ハート、熱気球、ゴールドなど9種類の風船スキン\n• 破裂や紙吹雪が楽しい新しい3Dグラフィック\n• 割れても、任意の動画を見れば1回だけ飛び続けられます\n• 指一本でOK\n• 13言語に対応\n• オフラインで遊べます\n• アカウント不要\n• 一度の購入で広告を削除できます\n• 音と振動（どちらもオフにできます）',
 ])

T['ko'] = dict(
 titel='LoonPop: 풍선 어드벤처',
 kurz='송풍기로 풍선을 띄우고 바늘을 피해 위로 올라가세요!',
 untertitel='불고, 이끌고, 터뜨리지 마세요',
 stichworte='풍선,송풍기,바늘,물리,무한,아케이드,바람,반응속도,캐주얼,오프라인,게임,컨트롤',
 werbung='송풍기가 손가락을 따라오며 원하는 방향으로 기울어요. 4개의 월드, 별, 코인, 풍선 스킨, 그리고 매일 새로운 오늘의 비행.',
 text=[
  '손가락을 따라오며 기울어지는 낙엽 송풍기, 그리고 그걸로 바늘 사이를 지나가게 해야 하는 풍선.',
  'LoonPop에서는 낙엽 송풍기로 풍선을 공중에 띄우고, 줄지어 선 바늘 사이로 위를 향해 이끌어야 해요. 송풍기는 손가락을 따라 움직이며 가는 방향으로 최대 40도까지 기울어요. 손가락이 앞설수록 더 많이 기울고, 풍선을 더 세게 옆으로 밀어요. 멈춰 있으면 똑바로 위로 불고, 바람의 가장자리가 풍선을 살짝 옆으로 밀어 줘요. 손가락을 짧게 휙 그으면 돌풍이 불어요. 쉬워 보이나요? 풍선에는 관성이 있어서 늦게 반응하고, 손을 떼도 계속 떠밀려 가요. 미리 생각하는 사람이 이겨요.',
  '4개의 월드, 51개 레벨\n초원, 도시, 사막, 밤: 초원에 15개, 나머지 월드에 12개씩. 옆바람, 하강 기류, 흔들리는 바늘과 떨어지는 바늘, 움직이는 바늘 줄, 좁은 길. 레벨마다 별을 최대 3개 얻을 수 있어요: 목표 도착, 별 시간 안에 통과, 코인 3개 모두 모으기. 한 월드의 별로 다음 월드가 열리고, 코인으로 새 풍선을 살 수 있어요.',
  '오늘의 비행\n매일 모두에게 똑같은 새 코스. 오늘의 최고 기록을 세우고 연속 기록을 이어 가세요.',
  '무한 모드\n끝없이 위로, 갈 수 있는 데까지. 점점 빨라지고, 빨갛게 빛나는 좁은 구간이 계속 나타나요. 몇 미터까지 갈 수 있을까요?',
  '그 밖에\n• 하트, 열기구, 골드 등 9가지 풍선 스킨\n• 펑 터지는 효과와 색종이가 있는 새로운 3D 그래픽\n• 터진 뒤에도 원하면 동영상을 보고 한 번 더 날 수 있어요\n• 손가락 하나면 충분\n• 13개 언어 지원\n• 인터넷 없이 오프라인 플레이\n• 계정 필요 없음\n• 한 번의 구매로 광고 제거\n• 소리와 진동, 둘 다 끌 수 있어요',
 ])

T['zh'] = dict(
 titel='LoonPop：气球大冒险',
 kurz='用吹叶机让气球飘在空中，避开所有的针！',
 untertitel='吹气、引导、别爆掉',
 stichworte='气球,吹叶机,针,技巧,物理,无尽,街机,风,反应,休闲,离线,飘浮,小游戏',
 werbung='吹叶机跟着手指走，想往哪边倾斜就往哪边。4 个世界、星星、金币、气球皮肤，每天还有新的每日飞行。',
 text=[
  '一台跟着手指移动、还会倾斜的吹叶机，还有一个要靠它穿过针阵的气球。',
  '在 LoonPop 中，你要用吹叶机把气球托在空中，带着它从一排排针之间向上穿过。吹叶机会跟着你的手指移动，并朝移动方向倾斜，最多 40 度：手指领先得越多，它倾斜得越厉害，把气球推向侧面的力量就越大。停着不动时，它垂直向上吹，气流的边缘会把气球轻轻推向一边。手指快速一划，就能吹出一阵强风。听起来很简单？气球有惯性：它反应慢半拍，松手后还会继续飘。提前思考的人才能赢。',
  '4 个世界，51 个关卡\n草地、城市、沙漠和夜晚：草地有 15 关，其余每个世界 12 关。侧风、下沉气流、摆动和下落的针、移动的针排，还有狭窄的通道。每关最多可得 3 颗星：到达终点、在星级时间内完成、收集全部 3 枚金币。用一个世界的星星解锁下一个世界，用金币购买新气球。',
  '每日飞行\n每天一条新路线，所有人都一样。刷新当天最佳成绩，保持你的连续纪录。',
  '无尽模式\n一直向上，能飞多远飞多远。速度越来越快，闪着红光的狭窄关口一次又一次出现。你能飞多少米？',
  '此外\n• 9 款气球皮肤，包括爱心、热气球和黄金\n• 全新 3D 画面，有爆炸、彩纸等特效\n• 气球爆了以后，可以自愿看一段视频继续飞一次\n• 一根手指就够\n• 支持 13 种语言\n• 无需联网即可游玩\n• 无需账号\n• 一次购买即可移除广告\n• 声音和震动都可以关闭',
 ])

T['ar'] = dict(
 titel='LoonPop: مغامرة البالون',
 kurz='أبقِ البالون في الهواء بمنفاخ الأوراق وتجنّب الإبر!',
 untertitel='انفخ ووجّه ولا تفجّره',
 stichworte='بالون,منفاخ,إبر,مهارة,فيزياء,بلا نهاية,أركيد,رياح,ردود فعل,ألعاب خفيفة,بدون إنترنت',
 werbung='المنفاخ يتبع إصبعك ويميل حيث تريد. أربعة عوالم ونجوم وعملات وأشكال للبالون، ورحلة يومية جديدة كل يوم.',
 text=[
  'منفاخ أوراق يتبع إصبعك ويميل، وبالون عليك أن تقوده به بين الإبر.',
  'في LoonPop تُبقي بالونًا في الهواء بمنفاخ الأوراق وتقوده إلى الأعلى بين صفوف من الإبر. يتحرك المنفاخ خلف إصبعك ويميل في اتجاه حركته حتى 40 درجة: كلما سبق إصبعك المنفاخ أكثر، ازداد ميله ودفع البالون إلى الجانب بقوة أكبر. وعندما يتوقف ينفخ إلى الأعلى مباشرة، وتدفع حافة تيار الهواء البالون برفق إلى الجانب. وتمريرة سريعة بإصبعك تطلق هبة ريح. تبدو سهلة؟ للبالون قصور ذاتي: يستجيب متأخرًا ويواصل الانجراف بعد أن تترك الشاشة. من يفكر مسبقًا يفوز.',
  'أربعة عوالم و51 مرحلة\nالمرج والمدينة والصحراء والليل: 15 مرحلة في المرج و12 في كل عالم من العوالم الأخرى. رياح جانبية، وتيارات هابطة، وإبر تتأرجح وأخرى تسقط، وصفوف إبر متحركة، وممرات ضيقة. في كل مرحلة حتى ثلاث نجوم: الوصول إلى الهدف، والبقاء تحت زمن النجمة، وجمع العملات الثلاث كلها. نجوم كل عالم تفتح العالم التالي، وبالعملات تشتري بالونات جديدة.',
  'الرحلة اليومية\nكل يوم جولة جديدة، هي نفسها للجميع. سجّل أفضل مسافة لليوم وحافظ على سلسلتك.',
  'وضع بلا نهاية\nإلى الأعلى دائمًا، بقدر ما تستطيع. تزداد السرعة باستمرار، وتظهر مرة بعد مرة ممرات ضيقة تتوهج باللون الأحمر. كم مترًا ستقطع؟',
  'وأيضًا\n• 9 أشكال للبالون، منها القلب والمنطاد والذهبي\n• مظهر ثلاثي الأبعاد جديد مع فرقعة وقصاصات ملونة وغيرها\n• بعد الانفجار يمكنك متابعة الطيران مرة واحدة بمشاهدة فيديو اختياري\n• يكفي إصبع واحد\n• 13 لغة\n• تعمل دون اتصال بالإنترنت\n• لا حاجة إلى حساب\n• أزل الإعلانات بعملية شراء واحدة\n• الصوت والاهتزاز، ويمكن إيقاف كليهما',
 ])

# Welcher Store-Code zu welcher Sprache gehoert. ⚠ Apple und Google nennen
# dieselbe Sprache verschieden (es-419 ↔ es-MX, zh-CN ↔ zh-Hans, it-IT ↔ it).
STORE_CODES = {
 'de': (['de-DE'], ['de-DE']), 'en': (['en-US', 'en-GB'], ['en-US', 'en-GB']),
 'es': (['es-ES', 'es-419'], ['es-ES', 'es-MX']), 'fr': (['fr-FR'], ['fr-FR']),
 'it': (['it-IT'], ['it']), 'pt': (['pt-BR', 'pt-PT'], ['pt-BR', 'pt-PT']),
 'tr': (['tr-TR'], ['tr']), 'pl': (['pl-PL'], ['pl']), 'ru': (['ru-RU'], ['ru']),
 'ja': (['ja-JP'], ['ja']), 'ko': (['ko-KR'], ['ko']), 'zh': (['zh-CN'], ['zh-Hans']),
 'ar': (['ar'], ['ar-SA']),
}

ziel = Path('store-assets/texte')
ziel.mkdir(parents=True, exist_ok=True)
for code, t in T.items():
    voll = '\n\n'.join(t['text'])
    play, apple = STORE_CODES[code]
    daten = {
        'storeCodes': {'play': play, 'appstore': apple},
        'play': {'title': t['titel'], 'shortDescription': t['kurz'], 'fullDescription': voll},
        'appstore': {'name': t['titel'], 'subtitle': t['untertitel'], 'keywords': t['stichworte'],
                     'promotionalText': t['werbung'], 'description': voll},
    }
    (ziel / f'{code}.json').write_text(json.dumps(daten, ensure_ascii=False, indent=2) + '\n')
print(len(T), 'Sprachen nach', ziel)
