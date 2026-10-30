"""Store-Texte beider Stores in allen 13 Sprachen (02.10.2026).

Aufruf:  python3 scripts/store-texte.py   → store-assets/texte/<code>.json

Hier liegt die Wahrheit, nicht in den Konsolen. Wer in der Play Console oder in
App Store Connect einen Text von Hand aendert, zieht ihn hier nach.
Die Laengen prueft src/lib/store.test.ts (Play: Titel 30, Kurztext 80,
Volltext 4000; App Store: Name 30, Untertitel 30, Stichworte 100,
Werbetext 170, Beschreibung 4000).

⚠ Die Texte versprechen „ohne Werbung, ohne Kaeufe, ohne Konto“. Kommt M5
(Konten) oder M6 (Werbung), muessen sie mit — und die Datenschutz-Angaben in
beiden Konsolen auch (docs/store.md).

⚠ 30.10.2026: Apple lehnte 1.0 nach 4.3(a) ab („ähnliches Konzept“). Seitdem
steht in Einstieg und Werbetext zuerst, was es so nur hier gibt: Das Gebläse
bläst nur nach oben, gelenkt wird mit dem Rand des Strahls. „Ballon durch
Nadeln“ allein klingt wie viele andere Spiele.
"""
import json
from pathlib import Path

T = {}

T['de'] = dict(
 titel='LoonPop: Ballon-Abenteuer',
 kurz='Halte den Ballon mit dem Laubgebläse in der Luft – und weich den Nadeln aus!',
 untertitel='Blasen, lenken, nicht platzen',
 stichworte='ballon,gebläse,nadeln,geschicklichkeit,physik,endlos,arcade,wind,reaktion,casual,offline',
 werbung='Drehen lässt sich das Gebläse nicht: Du lenkst mit dem Rand des Luftstrahls. Fünfzehn Level und ein Endlos-Modus.',
 text=[
  'Ein Laubgebläse, das nur senkrecht nach oben bläst – und ein Ballon, den du damit durch Nadeln lenken musst.',
  'In LoonPop hältst du einen Ballon mit einem Laubgebläse in der Luft und lenkst ihn durch Reihen aus Nadeln nach oben. Das Gebläse bläst immer senkrecht nach oben. Gelenkt wird, indem du dich versetzt unter den Ballon stellst – dann schiebt ihn der Rand des Luftstrahls zur Seite. Klingt einfach? Der Ballon ist träge: Er reagiert verzögert und treibt nach dem Loslassen weiter. Wer vorausdenkt, gewinnt.',
  'FÜNFZEHN HANDGEBAUTE LEVEL\nVom ersten Lufthauch bis zum Gipfel: Seitenwind, Fallwind, pendelnde und fallende Nadeln, wandernde Nadelreihen, enge Zickzack-Gassen und Läufe gegen die Uhr. Jedes Level bringt etwas Neues.',
  'ENDLOS-MODUS\nImmer weiter rauf, so weit du kommst. Es wird immer schneller, und immer wieder kommen enge Passagen, die rot schimmern. Wie viele Meter schaffst du?',
  'AUSSERDEM\n• Ein Finger genügt: schieben und halten\n• Bestzeiten und Bestweite werden gespeichert\n• 13 Sprachen\n• Spielt offline, ohne Internetverbindung\n• Keine Werbung, keine In-App-Käufe, kein Konto\n• Rauschendes Gebläse und Vibration, beides abschaltbar\n• Keine Datensammlung',
 ])

T['en'] = dict(
 titel='LoonPop: Balloon Adventure',
 kurz='Keep the balloon in the air with a leaf blower – and dodge the needles!',
 untertitel='Blow, steer, don’t pop',
 stichworte='balloon,blower,needles,skill,physics,endless,arcade,wind,reflex,casual,offline,float,pop',
 werbung='The blower never tilts: you steer with the edge of the air stream. Fifteen levels and an endless mode.',
 text=[
  'A leaf blower that only blows straight up – and a balloon you have to steer through needles with it.',
  'In LoonPop you keep a balloon in the air with a leaf blower and guide it upwards through rows of needles. The blower always blows straight up. You steer by standing off-centre under the balloon – the edge of the air stream then pushes it sideways. Sounds easy? The balloon has inertia: it reacts with a delay and keeps drifting after you let go. Think ahead and you win.',
  'FIFTEEN HAND-CRAFTED LEVELS\nFrom the first breath of air to the summit: crosswinds, downdrafts, swinging and falling needles, sliding rows of needles, tight zigzag passages and races against the clock. Every level brings something new.',
  'ENDLESS MODE\nUp and up, as far as you can go. It keeps getting faster, and again and again narrow passages appear, glowing red. How many metres can you make?',
  'ALSO\n• One finger is all you need: slide and hold\n• Best times and best distance are saved\n• 13 languages\n• Plays offline, no internet connection needed\n• No ads, no in-app purchases, no account\n• Whooshing blower sound and haptics, both can be switched off\n• No data collection',
 ])

T['es'] = dict(
 titel='LoonPop: Aventura en globo',
 kurz='¡Mantén el globo en el aire con un soplador de hojas y esquiva las agujas!',
 untertitel='Sopla, guía y no revientes',
 stichworte='globo,soplador,agujas,habilidad,física,infinito,arcade,viento,reflejos,casual,sin conexión',
 werbung='El soplador no se inclina: diriges con el borde del chorro de aire. Quince niveles y un modo infinito.',
 text=[
  'Un soplador de hojas que solo sopla en vertical, y un globo que tienes que guiar entre agujas con él.',
  'En LoonPop mantienes un globo en el aire con un soplador de hojas y lo guías hacia arriba entre filas de agujas. El soplador siempre sopla en vertical hacia arriba. Para dirigirlo, te colocas un poco desplazado bajo el globo: el borde del chorro de aire lo empuja hacia un lado. ¿Parece fácil? El globo tiene inercia: reacciona con retraso y sigue flotando cuando sueltas. Quien piensa por adelantado, gana.',
  'QUINCE NIVELES HECHOS A MANO\nDel primer soplo hasta la cima: viento lateral, corrientes descendentes, agujas que oscilan y que caen, filas de agujas que se desplazan, estrechos pasillos en zigzag y carreras contra el reloj. Cada nivel trae algo nuevo.',
  'MODO INFINITO\nSiempre hacia arriba, hasta donde llegues. Cada vez es más rápido y aparecen pasos estrechos que brillan en rojo. ¿Cuántos metros lograrás?',
  'ADEMÁS\n• Basta un dedo: deslizar y mantener\n• Se guardan tus mejores tiempos y tu mejor distancia\n• 13 idiomas\n• Se juega sin conexión a internet\n• Sin anuncios, sin compras dentro de la app, sin cuenta\n• Sonido del soplador y vibración, ambos desactivables\n• Sin recopilación de datos',
 ])

T['fr'] = dict(
 titel='LoonPop : l’aventure ballon',
 kurz='Garde le ballon en l’air avec un souffleur de feuilles et évite les aiguilles !',
 untertitel='Souffle, guide, n’éclate pas',
 stichworte='ballon,souffleur,aiguilles,adresse,physique,infini,arcade,vent,réflexes,casual,hors ligne',
 werbung='Le souffleur ne s’incline jamais : tu diriges avec le bord du jet d’air. Quinze niveaux et un mode infini.',
 text=[
  'Un souffleur de feuilles qui ne souffle que vers le haut, et un ballon à guider avec lui entre les aiguilles.',
  'Dans LoonPop, tu gardes un ballon en l’air avec un souffleur de feuilles et tu le guides vers le haut à travers des rangées d’aiguilles. Le souffleur souffle toujours verticalement. Pour diriger, tu te places légèrement à côté du ballon : le bord du jet d’air le pousse sur le côté. Facile ? Le ballon a de l’inertie : il réagit avec un temps de retard et continue de dériver quand tu lâches. Celui qui anticipe gagne.',
  'QUINZE NIVEAUX FAITS MAIN\nDu premier souffle jusqu’au sommet : vent de côté, courants descendants, aiguilles qui se balancent ou qui tombent, rangées d’aiguilles qui coulissent, couloirs en zigzag et courses contre la montre. Chaque niveau apporte quelque chose de nouveau.',
  'MODE INFINI\nToujours plus haut, aussi loin que possible. Ça va de plus en plus vite, et des passages étroits qui brillent en rouge reviennent sans cesse. Combien de mètres feras-tu ?',
  'ET AUSSI\n• Un seul doigt suffit : glisser et maintenir\n• Meilleurs temps et meilleure distance enregistrés\n• 13 langues\n• Se joue hors ligne, sans connexion internet\n• Sans publicité, sans achats intégrés, sans compte\n• Bruit du souffleur et vibrations, désactivables\n• Aucune collecte de données',
 ])

T['it'] = dict(
 titel='LoonPop: Avventura in pallone',
 kurz='Tieni in aria il palloncino con un soffiatore di foglie ed evita gli aghi!',
 untertitel='Soffia, guida, non scoppiare',
 stichworte='palloncino,soffiatore,aghi,abilità,fisica,infinito,arcade,vento,riflessi,casual,offline',
 werbung='Il soffiatore non si inclina: guidi con il bordo del getto d’aria. Quindici livelli e una modalità infinita.',
 text=[
  'Un soffiatore di foglie che soffia solo verso l’alto, e un palloncino da guidare con lui tra gli aghi.',
  'In LoonPop tieni in aria un palloncino con un soffiatore di foglie e lo guidi verso l’alto tra file di aghi. Il soffiatore soffia sempre in verticale. Per dirigerlo ti sposti un po’ di lato sotto il palloncino: il bordo del getto d’aria lo spinge di fianco. Sembra facile? Il palloncino ha inerzia: reagisce in ritardo e continua a fluttuare quando lasci. Vince chi pensa in anticipo.',
  'QUINDICI LIVELLI FATTI A MANO\nDal primo soffio fino alla vetta: vento laterale, correnti discendenti, aghi che oscillano e che cadono, file di aghi che scorrono, stretti passaggi a zigzag e corse contro il tempo. Ogni livello porta qualcosa di nuovo.',
  'MODALITÀ INFINITA\nSempre più in alto, finché ce la fai. Diventa sempre più veloce e tornano continuamente passaggi stretti che brillano di rosso. Quanti metri riuscirai a fare?',
  'INOLTRE\n• Basta un dito: scorri e tieni premuto\n• Migliori tempi e migliore distanza salvati\n• 13 lingue\n• Si gioca offline, senza connessione internet\n• Niente pubblicità, niente acquisti in-app, nessun account\n• Suono del soffiatore e vibrazione, entrambi disattivabili\n• Nessuna raccolta di dati',
 ])

T['pt'] = dict(
 titel='LoonPop: Aventura de balão',
 kurz='Mantenha o balão no ar com um soprador de folhas e desvie das agulhas!',
 untertitel='Sopre, guie e não estoure',
 stichworte='balão,soprador,agulhas,habilidade,física,infinito,arcade,vento,reflexos,casual,offline',
 werbung='O soprador nunca inclina: você guia com a borda do jato de ar. Quinze fases e um modo infinito.',
 text=[
  'Um soprador de folhas que só sopra para cima, e um balão que você precisa guiar com ele entre agulhas.',
  'Em LoonPop você mantém um balão no ar com um soprador de folhas e o guia para cima entre fileiras de agulhas. O soprador sempre sopra na vertical. Para guiar, você se posiciona um pouco de lado embaixo do balão: a borda do jato de ar o empurra para o lado. Parece fácil? O balão tem inércia: ele reage com atraso e continua flutuando quando você solta. Quem pensa à frente vence.',
  'QUINZE FASES FEITAS À MÃO\nDo primeiro sopro até o cume: vento lateral, correntes descendentes, agulhas que balançam e que caem, fileiras de agulhas que deslizam, corredores estreitos em zigue-zague e corridas contra o relógio. Cada fase traz algo novo.',
  'MODO INFINITO\nSempre para cima, até onde você conseguir. Fica cada vez mais rápido, e passagens estreitas que brilham em vermelho aparecem o tempo todo. Quantos metros você vai alcançar?',
  'E MAIS\n• Basta um dedo: deslize e segure\n• Melhores tempos e melhor distância salvos\n• 13 idiomas\n• Funciona offline, sem internet\n• Sem anúncios, sem compras no app, sem conta\n• Som do soprador e vibração, ambos podem ser desligados\n• Nenhuma coleta de dados',
 ])

T['tr'] = dict(
 titel='LoonPop: Balon Macerası',
 kurz='Balonu yaprak üfleyiciyle havada tut ve iğnelerden kaç!',
 untertitel='Üfle, yönlendir, patlatma',
 stichworte='balon,üfleyici,iğne,beceri,fizik,sonsuz,arcade,rüzgar,refleks,casual,çevrimdışı',
 werbung='Üfleyici hiç eğilmez: hava akımının kenarıyla yön verirsin. On beş bölüm ve sonsuz mod.',
 text=[
  'Yalnızca dümdüz yukarı üfleyen bir yaprak üfleyici ve onunla iğnelerin arasından geçirmen gereken bir balon.',
  'LoonPop’ta bir balonu yaprak üfleyiciyle havada tutar ve iğne sıralarının arasından yukarı taşırsın. Üfleyici her zaman dümdüz yukarı üfler. Yön vermek için balonun biraz yanına geçersin: hava akımının kenarı onu yana iter. Kolay mı görünüyor? Balonun ataleti var: gecikmeli tepki verir ve bıraktıktan sonra da süzülmeye devam eder. Önceden düşünen kazanır.',
  'ON BEŞ ÖZEL TASARIM BÖLÜM\nİlk nefesten zirveye: yan rüzgâr, aşağı akımlar, sallanan ve düşen iğneler, kayan iğne sıraları, dar zikzak geçitler ve zamana karşı yarışlar. Her bölüm yeni bir şey getirir.',
  'SONSUZ MOD\nHep yukarı, gidebildiğin kadar. Giderek hızlanır ve kırmızı parlayan dar geçitler tekrar tekrar karşına çıkar. Kaç metre yapabilirsin?',
  'AYRICA\n• Tek parmak yeter: kaydır ve basılı tut\n• En iyi süreler ve en iyi mesafe kaydedilir\n• 13 dil\n• İnternetsiz oynanır\n• Reklam yok, uygulama içi satın alma yok, hesap yok\n• Üfleyici sesi ve titreşim, ikisi de kapatılabilir\n• Veri toplanmaz',
 ])

T['pl'] = dict(
 titel='LoonPop: Balonowa przygoda',
 kurz='Utrzymaj balon w powietrzu dmuchawą do liści i omijaj igły!',
 untertitel='Dmuchaj, steruj, nie pękaj',
 stichworte='balon,dmuchawa,igły,zręczność,fizyka,bez końca,arcade,wiatr,refleks,casual,offline',
 werbung='Dmuchawy nie da się przechylić: sterujesz krawędzią strumienia powietrza. Piętnaście poziomów i tryb bez końca.',
 text=[
  'Dmuchawa do liści, która dmucha tylko pionowo w górę, i balon, który musisz nią przeprowadzić między igłami.',
  'W LoonPop utrzymujesz balon w powietrzu dmuchawą do liści i prowadzisz go w górę przez rzędy igieł. Dmuchawa zawsze dmucha pionowo w górę. Sterujesz, stając trochę z boku pod balonem – krawędź strumienia powietrza spycha go wtedy w bok. Brzmi prosto? Balon ma bezwładność: reaguje z opóźnieniem i dryfuje dalej, gdy puścisz. Wygrywa ten, kto myśli z wyprzedzeniem.',
  'PIĘTNAŚCIE RĘCZNIE ZAPROJEKTOWANYCH POZIOMÓW\nOd pierwszego podmuchu aż na szczyt: boczny wiatr, prądy zstępujące, kołyszące się i spadające igły, przesuwające się rzędy igieł, wąskie zygzaki i wyścigi z czasem. Każdy poziom wnosi coś nowego.',
  'TRYB BEZ KOŃCA\nCoraz wyżej, jak daleko dasz radę. Robi się coraz szybciej, a co chwilę pojawiają się wąskie przejścia świecące na czerwono. Ile metrów pokonasz?',
  'PONADTO\n• Wystarczy jeden palec: przesuń i przytrzymaj\n• Zapisywane najlepsze czasy i najlepszy dystans\n• 13 języków\n• Działa offline, bez internetu\n• Bez reklam, bez zakupów w aplikacji, bez konta\n• Szum dmuchawy i wibracje, oba można wyłączyć\n• Bez zbierania danych',
 ])

T['ru'] = dict(
 titel='LoonPop: Шарик в небе',
 kurz='Держи шарик в воздухе воздуходувкой и уворачивайся от игл!',
 untertitel='Дуй, веди и не лопни',
 stichworte='шарик,воздуходувка,иглы,ловкость,физика,бесконечный,аркада,ветер,реакция,казуальная,офлайн',
 werbung='Воздуходувку нельзя наклонить: ты управляешь краем воздушной струи. Пятнадцать уровней и бесконечный режим.',
 text=[
  'Воздуходувка, которая дует только строго вверх, и шарик, который нужно провести ею сквозь иглы.',
  'В LoonPop ты держишь воздушный шарик в воздухе с помощью воздуходувки для листьев и ведёшь его вверх сквозь ряды игл. Воздуходувка всегда дует строго вверх. Чтобы управлять, встань немного сбоку под шариком — край воздушной струи сдвинет его в сторону. Кажется простым? У шарика есть инерция: он реагирует с задержкой и продолжает лететь, когда ты отпускаешь. Побеждает тот, кто думает наперёд.',
  'ПЯТНАДЦАТЬ УРОВНЕЙ РУЧНОЙ РАБОТЫ\nОт первого дуновения до вершины: боковой ветер, нисходящие потоки, качающиеся и падающие иглы, движущиеся ряды игл, узкие зигзаги и гонки на время. Каждый уровень приносит что-то новое.',
  'БЕСКОНЕЧНЫЙ РЕЖИМ\nВсё выше и выше, насколько хватит сил. Темп постоянно растёт, и снова и снова появляются узкие проходы, светящиеся красным. Сколько метров ты пролетишь?',
  'А ТАКЖЕ\n• Хватит одного пальца: двигай и удерживай\n• Лучшее время и лучшая дистанция сохраняются\n• 13 языков\n• Играй офлайн, без интернета\n• Без рекламы, без покупок, без аккаунта\n• Шум воздуходувки и вибрация, их можно выключить\n• Никакого сбора данных',
 ])

T['ja'] = dict(
 titel='LoonPop: 風船アドベンチャー',
 kurz='ブロワーで風船を浮かせて、針をよけながら上を目指そう！',
 untertitel='吹いて、導いて、割らないで',
 stichworte='風船,ブロワー,針,物理,エンドレス,アーケード,風,反射神経,カジュアル,オフライン,ゲーム,浮遊',
 werbung='ブロワーは傾けられない。風の端を使って風船を操ろう。15のレベルとエンドレスモード。',
 text=[
  '真上にしか風を送れないリーフブロワーと、それで針のすき間を抜けさせる風船。',
  'LoonPop では、リーフブロワーで風船を空中に浮かせ、並んだ針のすき間を抜けて上へと導きます。ブロワーの風はいつも真上に向かいます。風船の少し横に立つと、風の端が風船を横へ押し出す。それが操作のすべてです。簡単そう？ でも風船には慣性があり、反応は遅れ、指を離してもふわりと流れ続けます。先を読む人が勝つゲームです。',
  '手作りの15レベル\nはじめての風から頂上まで。横風、下降気流、揺れる針と落ちてくる針、動く針の列、狭いジグザグの通路、そしてタイムアタック。どのレベルにも新しい発見があります。',
  'エンドレスモード\nどこまでも上へ。だんだん速くなり、赤く光る狭い難所が何度も現れます。何メートル進めるかな？',
  'その他\n• 指一本でOK：スライドして長押し\n• ベストタイムと最高記録を保存\n• 13言語に対応\n• オフラインで遊べます\n• 広告なし・アプリ内課金なし・アカウント不要\n• ブロワーの音と振動（どちらもオフにできます）\n• データ収集なし',
 ])

T['ko'] = dict(
 titel='LoonPop: 풍선 어드벤처',
 kurz='송풍기로 풍선을 띄우고 바늘을 피해 위로 올라가세요!',
 untertitel='불고, 이끌고, 터뜨리지 마세요',
 stichworte='풍선,송풍기,바늘,물리,무한,아케이드,바람,반응속도,캐주얼,오프라인,게임,컨트롤',
 werbung='송풍기는 기울어지지 않아요. 바람의 가장자리로 풍선을 조종하세요. 15개 레벨과 무한 모드.',
 text=[
  '똑바로 위로만 부는 낙엽 송풍기, 그리고 그걸로 바늘 사이를 지나가게 해야 하는 풍선.',
  'LoonPop에서는 낙엽 송풍기로 풍선을 공중에 띄우고, 줄지어 선 바늘 사이로 위를 향해 이끌어야 해요. 송풍기는 언제나 똑바로 위로만 바람을 불어요. 풍선 아래에서 살짝 비켜 서면 바람의 가장자리가 풍선을 옆으로 밀어 줘요. 쉬워 보이나요? 풍선에는 관성이 있어서 늦게 반응하고, 손을 떼도 계속 떠밀려 가요. 미리 생각하는 사람이 이겨요.',
  '직접 만든 15개 레벨\n첫 바람부터 정상까지: 옆바람, 하강 기류, 흔들리는 바늘과 떨어지는 바늘, 움직이는 바늘 줄, 좁은 지그재그 길, 그리고 시간과의 싸움. 레벨마다 새로운 재미가 있어요.',
  '무한 모드\n끝없이 위로, 갈 수 있는 데까지. 점점 빨라지고, 빨갛게 빛나는 좁은 구간이 계속 나타나요. 몇 미터까지 갈 수 있을까요?',
  '그 밖에\n• 손가락 하나면 충분: 밀고 누르기\n• 최고 기록과 최장 거리 저장\n• 13개 언어 지원\n• 인터넷 없이 오프라인 플레이\n• 광고 없음, 인앱 구매 없음, 계정 없음\n• 송풍기 소리와 진동, 둘 다 끌 수 있어요\n• 데이터 수집 없음',
 ])

T['zh'] = dict(
 titel='LoonPop：气球大冒险',
 kurz='用吹叶机让气球飘在空中，避开所有的针！',
 untertitel='吹气、引导、别爆掉',
 stichworte='气球,吹叶机,针,技巧,物理,无尽,街机,风,反应,休闲,离线,飘浮,小游戏',
 werbung='吹叶机不能倾斜：你要用气流的边缘来引导气球。15 个关卡，外加无尽模式。',
 text=[
  '一台只能垂直向上吹的吹叶机，还有一个要靠它穿过针阵的气球。',
  '在 LoonPop 中，你要用吹叶机把气球托在空中，带着它从一排排针之间向上穿过。吹叶机永远垂直向上吹。想让气球偏向一边，就站到它下方稍微偏一点的位置——气流的边缘会把它推向侧面。听起来很简单？气球有惯性：它反应慢半拍，松手后还会继续飘。提前思考的人才能赢。',
  '15 个精心设计的关卡\n从第一口气到山顶：侧风、下沉气流、摆动和下落的针、移动的针排、狭窄的之字形通道，还有限时挑战。每一关都有新花样。',
  '无尽模式\n一直向上，能飞多远飞多远。速度越来越快，闪着红光的狭窄关口一次又一次出现。你能飞多少米？',
  '此外\n• 一根手指就够：滑动并按住\n• 保存最佳时间和最远距离\n• 支持 13 种语言\n• 无需联网即可游玩\n• 无广告、无内购、无需账号\n• 吹叶机的声音和震动，都可以关闭\n• 不收集任何数据',
 ])

T['ar'] = dict(
 titel='LoonPop: مغامرة البالون',
 kurz='أبقِ البالون في الهواء بمنفاخ الأوراق وتجنّب الإبر!',
 untertitel='انفخ ووجّه ولا تفجّره',
 stichworte='بالون,منفاخ,إبر,مهارة,فيزياء,بلا نهاية,أركيد,رياح,ردود فعل,ألعاب خفيفة,بدون إنترنت',
 werbung='المنفاخ لا يميل أبدًا: أنت توجّه بحافة تيار الهواء. خمس عشرة مرحلة ووضع بلا نهاية.',
 text=[
  'منفاخ أوراق لا ينفخ إلا إلى الأعلى مباشرة، وبالون عليك أن تقوده به بين الإبر.',
  'في LoonPop تُبقي بالونًا في الهواء بمنفاخ الأوراق وتقوده إلى الأعلى بين صفوف من الإبر. المنفاخ ينفخ دائمًا إلى الأعلى مباشرة. للتوجيه تقف تحت البالون منحرفًا قليلًا، فتدفعه حافة تيار الهواء إلى الجانب. تبدو سهلة؟ للبالون قصور ذاتي: يستجيب متأخرًا ويواصل الانجراف بعد أن تترك الشاشة. من يفكر مسبقًا يفوز.',
  'خمس عشرة مرحلة مصممة يدويًا\nمن النفَس الأول حتى القمة: رياح جانبية، وتيارات هابطة، وإبر تتأرجح وأخرى تسقط، وصفوف إبر متحركة، وممرات متعرجة ضيقة، وسباقات مع الزمن. كل مرحلة تحمل شيئًا جديدًا.',
  'وضع بلا نهاية\nإلى الأعلى دائمًا، بقدر ما تستطيع. تزداد السرعة باستمرار، وتظهر مرة بعد مرة ممرات ضيقة تتوهج باللون الأحمر. كم مترًا ستقطع؟',
  'وأيضًا\n• يكفي إصبع واحد: اسحب واضغط مطوّلًا\n• حفظ أفضل الأوقات وأبعد مسافة\n• 13 لغة\n• تعمل دون اتصال بالإنترنت\n• بلا إعلانات، بلا مشتريات داخل التطبيق، بلا حساب\n• صوت المنفاخ والاهتزاز، ويمكن إيقاف كليهما\n• لا جمع للبيانات',
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
