'use client';

// Système A, « Sellerie » : maroquinerie et reliure. Le cuir s'enfonce sous le doigt, les surpiqûres
// disent l'état (serrées au repos, qui avancent au chargement, qui se relâchent avant de supprimer), la case
// à cocher est un oeillet de laiton qui se pose, la progression est un signet qui glisse le long d'une couture.
import { Btn, Icon, RadioRow } from './Common';
import { DAYS } from './shared';

function Check({ checked, onChange, label }) {
  return (
    <button type="button" role="checkbox" aria-checked={checked} className="cl-check sl-check" onClick={() => onChange(!checked)}>
      <span className="sl-oeil" aria-hidden="true">
        <span className="sl-oeil-ring" />
        <span className="sl-oeil-hole" />
      </span>
      {label && <span className="cl-check-label">{label}</span>}
    </button>
  );
}

function Progress({ done, total }) {
  const p = Math.min(100, (done / total) * 100);
  return (
    <div className="sl-prog" role="progressbar" aria-label="Rangement forcé" aria-valuemin={0} aria-valuemax={total} aria-valuenow={done} aria-valuetext={`${done} rangés sur ${total}`}>
      <div className="sl-prog-head">
        <span className="sl-prog-num">
          {done}
          <span> / {total}</span>
        </span>
        <span className="sl-prog-rest">{total - done ? `reste ${total - done}` : 'tout est rangé'}</span>
      </div>
      <div className="sl-seam" style={{ '--p': p }}>
        <span className="sl-seam-done" />
        <span className="sl-ribbon" />
      </div>
    </div>
  );
}

function DayPicker({ value, onChange }) {
  return (
    <RadioRow
      className="sl-tabs"
      label="Jour du report"
      value={value}
      onChange={onChange}
      options={DAYS.map((d) => ({
        id: d.id,
        label: (
          <>
            <span className="sl-tab-d">{d.short}</span>
            <span className="sl-tab-n">{d.num}</span>
          </>
        ),
      }))}
    />
  );
}

function DeleteCtl({ onDelete }) {
  return (
    <Btn variant="danger" kbd="S" icon={<Icon name="trash" />} onClick={onDelete}>
      Supprimer
    </Btn>
  );
}

export const SELLERIE = {
  id: 'sellerie',
  kicker: 'Système A',
  name: 'Sellerie',
  tagline: 'Cuir, surpiqûre, oeillet',
  concept:
    'Chaque contrôle est une pièce de maroquinerie : une étiquette de cuir bordeaux à oeillet pour l’action principale, des pièces surpiquées pour le reste. Le geste a une matière : le cuir s’enfonce d’un pixel avec une ombre intérieure, la couture se resserre sous le doigt.',
  signature:
    'La couture comme langage d’état. Au repos elle est régulière ; elle avance quand ça charge ; elle se relâche (points écartés) au survol de Supprimer ; un oeillet de laiton se pose quand on coche ; le signet du jour pend de l’en-tête de l’agenda et glisse le long de la couture du rangement forcé.',
  chipNote: 'Plage : bande de cuir pleine, surpiquée, bord de couleur. Tâche : étiquette à oeillet, sans fond de couleur. Lisible en niveaux de gris par la forme.',
  failles: [
    'Le plus proche du skeuomorphisme que tu as écarté (Playdate, Teenage Engineering) : au bout d’une semaine, les pointillés partout peuvent faire « déco de boutique ». Il faut les rationner : seuls la carte en cours, le bouton principal et les plages en portent.',
    'La surpiqûre est un trait d’un pixel à 40 % d’opacité : sur un écran mal calibré ou en plein soleil, elle disparaît, et avec elle la moitié de la signature. Elle ne porte donc aucune information indispensable (seulement de l’ambiance).',
    'L’étiquette à pointe gauche du bouton principal coûte 12 px de large : en mobile, avec la touche V dessinée, « Valider » est le bouton le plus large de la carte et force le retour à la ligne des gestes.',
    'L’oeillet qui se pose dure 140 ms : au-dessus des 120 ms conseillées pour un geste fait des dizaines de fois par jour. À ramener à 100 ms si tu le gardes.',
    'Plage et tâche se distinguent par la forme (bande ou étiquette), mais en agenda serré une tâche de 15 min n’a plus la place de montrer son oeillet : il ne reste que la couleur.',
  ],
  enVrai: 'Base UI pour le menu et le dialogue de report, cmdk pour la palette, Sonner pour le toast, dnd-kit pour le glisser (capteurs clavier inclus), Motion pour l’entrée des blocs. La couture resterait en CSS pur.',
};
Object.assign(SELLERIE, { Check, Progress, DayPicker, DeleteCtl });
