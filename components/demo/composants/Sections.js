'use client';

// Contenu des trois systèmes (concept, signature, faille, vraie pile) et planche des pièces : boutons,
// groupe segmenté, touches clavier, états, case Cocher, puces plage et tâche, voyants. État local seulement.
import { useState } from 'react';
import { Ann, Btn, Check, Chip, GuardSwitch, Kbd, Seg } from './ui';

export const SYS_IDS = ['planche', 'objet', 'carte'];

export const SYSTEMS = {
  planche: {
    name: 'Planche de bord',
    kicker: 'Instruments de GT et de cockpit, années 70',
    concept:
      'Le Cadran pris au mot : la face d’une planche de bord. Chaque état est un voyant qui s’allume, chaque chiffre roule sur un tambour, chaque geste a une course mécanique. Vert Aston pour ce qui est validé, bleu Martini pour les plages, ambre pour les tâches, rouge réservé aux alertes et à la bande de livrée.',
    signature: [
      'Compteur à rouleaux pour le reste à ranger',
      'Interrupteur à capot rouge pour Supprimer : le capot se lève au survol ou au focus, un seul clic suffit',
      'Molette crantée pour choisir le jour de Plus tard',
      'Voyants annonciateurs Rangement, Retard, Prêt ; touches de présélection d’autoradio pour le groupe segmenté',
    ],
    faille:
      'Le plus fort en caractère et le plus exposé à l’usure : métal brossé et gravure fatiguent sur dix heures par jour, et le capot ajoute un temps de visée sur un geste fréquent. À doser : la matière seulement sur les commandes, jamais sur les surfaces de lecture.',
    pile: 'Motion (ressorts des tambours et de la molette), NumberFlow (chiffres qui roulent, lisibles par les lecteurs d’écran), Base UI (Menu, Dialog, Slider pour la molette), pragmatic-drag-and-drop pour le glisser.',
    suggest: 'Suggestion',
    swatches: ['#1f5141', '#4c78a8', '#f0a43a', '#c62828'],
  },
  objet: {
    name: 'Objet industriel',
    kicker: 'Braun, Dieter Rams, Teenage Engineering',
    concept:
      'Un appareil plutôt qu’un écran : coque gris chaud, touches à course réelle sur leur socle, une couleur franche par fonction et la même partout (vert valider, bleu affecter, noir cocher, rouge supprimer, jaune plus tard, orange pour l’action principale), étiquettes sérigraphiées au-dessus des touches, afficheur à cristaux, grille stricte.',
    signature: [
      'Touches qui s’enfoncent de 3 px et restent enfoncées quand elles sont verrouillées',
      'Afficheur 7 segments et rangée de diodes pour la progression',
      'La couleur est la fonction : une touche jaune reporte, partout',
      'Le toast sort comme un ticket imprimé d’une fente',
    ],
    faille:
      'Clair et chaleureux, il rompt avec la charte Graphite sombre que tu as choisie, et le passer en sombre lui fait perdre son âme. Six couleurs de fonction se disputent l’œil dès qu’on les sort des touches : elles doivent rester sur les commandes, jamais sur l’agenda.',
    pile: 'Motion (course et verrou des touches), NumberFlow ou l’afficheur SVG maison de cette page, Base UI (Radio Group, Menu, Dialog), pragmatic-drag-and-drop.',
    suggest: 'Suggestion',
    swatches: ['#ff5b1f', '#2e7d4f', '#2f5fa8', '#e7b416'],
  },
  carte: {
    name: 'Table à cartes',
    kicker: 'Instruments de navigation : compas, règle, pointes sèches',
    concept:
      'Ta veine voile et foils : la journée comme une carte marine qu’on trace. Fond bleu nuit Martini, filets fins, graduations partout où il y a du temps, laiton pour l’action principale. On ne coche pas, on fait le point ; on ne glisse pas, on reporte une mesure ; la couronne du compas tourne à mesure que la colonne se vide.',
    signature: [
      'Case Cocher : le symbole du point fixé, cercle tracé puis point',
      'Couronne de compas graduée qui tourne avec la progression',
      'Glisser aux pointes sèches : la durée est mesurée à côté du fantôme, aimantation sur les bords des blocs',
      'Règle graduée à index pour Plus tard, plages hachurées comme une zone de carte',
    ],
    faille:
      'Le plus élégant et le moins lisible d’un coup d’œil : traits fins et graduations exigent contraste et taille, sinon on retombe dans le décoratif. Le quadrillage de fond doit rester presque invisible, et le vocabulaire marin ne doit jamais remplacer un verbe clair.',
    pile: 'Motion (couronne, tracés SVG par pathLength), NumberFlow, Base UI (Slider pour la règle, Menu, Dialog), pragmatic-drag-and-drop avec son indicateur de dépôt.',
    suggest: 'Cap proposé',
    swatches: ['#0b1726', '#4c78a8', '#d0ad62', '#ef6b5e'],
  },
};

function Block({ title, children, wide }) {
  return (
    <div className={`piece${wide ? ' piece-wide' : ''}`}>
      <h3 className="piece-h lbl">{title}</h3>
      <div className="piece-b">{children}</div>
    </div>
  );
}

const STATES = [
  { id: null, label: 'Repos' },
  { id: 'hover', label: 'Survol' },
  { id: 'active', label: 'Pression' },
  { id: 'focus', label: 'Focus clavier' },
  { id: 'disabled', label: 'Désactivé' },
  { id: 'loading', label: 'Chargement' },
];

export function Pieces({ sys, onToast, onPalette }) {
  const [seg, setSeg] = useState('5j');
  const [checks, setChecks] = useState({ a: false, b: true });
  const [loading, setLoading] = useState(false);
  const tryLoad = () => {
    if (loading) return;
    setLoading(true);
    setTimeout(() => setLoading(false), 1400);
  };
  return (
    <div className="pieces">
      <Block title="Boutons">
        <div className="row">
          <Btn variant="primary" fn="orange" icon="check" silk="Entrée" onClick={() => onToast('Bouton primaire : action principale de la zone')}>
            Valider
          </Btn>
          <Btn variant="secondary" fn="blue" icon="send" silk="A" onClick={() => onToast('Bouton secondaire')}>
            Affecter ailleurs
          </Btn>
          <Btn variant="quiet" fn="yellow" icon="clock" silk="P" onClick={() => onToast('Bouton discret')}>
            Plus tard
          </Btn>
          {sys === 'planche' ? (
            <GuardSwitch label="Supprimer" onFire={() => onToast('Supprimé (démo)', true)} />
          ) : (
            <Btn variant="danger" fn="red" icon="trash" silk="S" onClick={() => onToast('Supprimé (démo)', true)}>
              Supprimer
            </Btn>
          )}
          <Btn variant="icon" icon="undo" aria-label="Annuler le dernier geste" silk="Ctrl Z" onClick={() => onToast('Rien à annuler dans la planche des pièces')} />
        </div>
      </Block>

      <Block title="Groupe segmenté">
        <Seg
          label="Vue de l’agenda"
          options={[
            { id: '1j', label: 'Jour' },
            { id: '3j', label: '3 jours' },
            { id: '5j', label: '5 jours' },
          ]}
          value={seg}
          onChange={setSeg}
        />
        <p className="note">Flèches gauche et droite pour changer ; la sélection suit le focus.</p>
      </Block>

      <Block title="Raccourcis en touches dessinées">
        <div className="row row-kbd">
          <span>
            Palette <Kbd>Ctrl K</Kbd>
          </span>
          <span>
            Valider <Kbd>Entrée</Kbd>
          </span>
          <span>
            Affecter <Kbd>A</Kbd>
          </span>
          <span>
            Cocher <Kbd>C</Kbd>
          </span>
          <span>
            Supprimer <Kbd>S</Kbd>
          </span>
          <span>
            Plus tard <Kbd>P</Kbd>
          </span>
          <span>
            Annuler <Kbd>Ctrl Z</Kbd>
          </span>
          <span>
            Système <Kbd>1 2 3</Kbd>
          </span>
        </div>
      </Block>

      <Block title="États : survol, pression, focus, désactivé, chargement" wide>
        {['primary', 'secondary'].map((v) => (
          <div key={v} className="states">
            <span className="states-k lbl">{v === 'primary' ? 'Primaire' : 'Secondaire'}</span>
            {STATES.map((s) => (
              <figure key={s.label} className="state">
                <Btn
                  variant={v}
                  fn={v === 'primary' ? 'orange' : 'blue'}
                  force={s.id && s.id !== 'disabled' && s.id !== 'loading' ? s.id : undefined}
                  disabled={s.id === 'disabled'}
                  loading={s.id === 'loading'}
                  tabIndex={-1}
                  aria-hidden="true"
                >
                  {v === 'primary' ? 'Valider' : 'Affecter'}
                </Btn>
                <figcaption>{s.label}</figcaption>
              </figure>
            ))}
          </div>
        ))}
        <div className="row">
          <Btn variant="primary" fn="orange" loading={loading} onClick={tryLoad}>
            {loading ? 'Synchronisation' : 'Essayer le chargement'}
          </Btn>
          <span className="note">L’indicateur n’apparaît qu’au-delà de 150 ms en vrai ; ici il est forcé 1,4 s pour le voir.</span>
        </div>
      </Block>

      <Block title="Case Cocher">
        <div className="col">
          <Check sys={sys} checked={checks.a} onChange={(v) => setChecks((c) => ({ ...c, a: v }))} label="Réviser le chapitre 4" />
          <Check sys={sys} checked={checks.b} onChange={(v) => setChecks((c) => ({ ...c, b: v }))} label="Répondre au bureau des stages" />
          <Check sys={sys} checked={false} onChange={() => {}} label="Bloquée : dépend d’un mail" disabled />
        </div>
      </Block>

      <Block title="Puces : plage ou tâche">
        <div className="col">
          <Chip kind="plage" time="09:00-12:00">
            Plage : Corporate finance
          </Chip>
          <Chip kind="tache" time="14:00-14:45">
            Tâche : Envoyer la candidature
          </Chip>
          <Chip kind="ghost" time="15:00-15:30">
            Fantôme : proposée, pas posée
          </Chip>
        </div>
        <p className="note">La forme porte le sens (trait plein, contour, pointillés) : lisible sans la couleur.</p>
      </Block>

      <Block title="Voyants d’état">
        <div className="row">
          <Ann tone="amber" on>
            En cours
          </Ann>
          <Ann tone="red" on>
            En retard
          </Ann>
          <Ann tone="green" on>
            Rangé
          </Ann>
          <Ann tone="blue" on>
            Attend ta réponse
          </Ann>
          <Ann tone="amber" on={false}>
            Éteint
          </Ann>
        </div>
      </Block>

      <Block title="Retours">
        <div className="row">
          <Btn variant="secondary" icon="undo" onClick={() => onToast('Rangé : Bloc de travail, demain 14h', true)}>
            Montrer le toast
          </Btn>
          <Btn variant="secondary" icon="search" kbd="Ctrl K" onClick={onPalette}>
            Ouvrir la palette
          </Btn>
        </div>
      </Block>
    </div>
  );
}

export function Fiche({ meta }) {
  return (
    <dl className="fiche">
      <div>
        <dt className="lbl">Signature</dt>
        <dd>
          <ul>
            {meta.signature.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </dd>
      </div>
      <div>
        <dt className="lbl">Faille principale</dt>
        <dd>{meta.faille}</dd>
      </div>
      <div>
        <dt className="lbl">En vrai, on prendrait</dt>
        <dd>{meta.pile}</dd>
      </div>
    </dl>
  );
}
