'use client';

// Système C, « Édition » : la typographie d'imprimerie (Stripe Press). Pas de boîte : des mots, des
// filets, des petites capitales. Le bouton principal est un mot souligné à l'encre qui se remplit à
// l'appui ; Cocher appose un tampon « Fait » ; la progression est un registre de folios ; le toast est une
// note en marge ; la palette est un index avec points de conduite.
import { Btn, RadioRow } from './Common';
import { DAYS } from './shared';

function Check({ checked, onChange, label }) {
  return (
    <button type="button" role="checkbox" aria-checked={checked} className="cl-check ed-check" onClick={() => onChange(!checked)}>
      <span className="ed-box" aria-hidden="true">
        <span className="ed-stamp">Fait</span>
      </span>
      {label && (
        <span className="cl-check-label">
          {label}
          <span className="ed-strike" aria-hidden="true" />
        </span>
      )}
    </button>
  );
}

function Progress({ done, total }) {
  return (
    <div className="ed-prog" role="progressbar" aria-label="Rangement forcé" aria-valuemin={0} aria-valuemax={total} aria-valuenow={done} aria-valuetext={`${done} rangés sur ${total}`}>
      <p className="ed-folio">
        <span className="ed-sc">folio</span> <b>{done}</b> <span className="ed-sc">sur</span> {total}
      </p>
      <span className="ed-edges" aria-hidden="true">
        {Array.from({ length: total }, (_, i) => (
          <i key={i} className={i < done ? 'is-done' : i === done ? 'is-cur' : ''} />
        ))}
      </span>
    </div>
  );
}

function DayPicker({ value, onChange }) {
  return (
    <RadioRow
      className="ed-days"
      label="Jour du report"
      value={value}
      onChange={onChange}
      options={DAYS.map((d) => ({
        id: d.id,
        label: (
          <>
            {d.short} <span className="ed-num">{d.num}</span>
          </>
        ),
      }))}
    />
  );
}

function DeleteCtl({ onDelete }) {
  return (
    <Btn variant="danger" kbd="S" icon={<span className="ed-glyph">†</span>} onClick={onDelete}>
      Supprimer
    </Btn>
  );
}

export const EDITION = {
  id: 'edition',
  kicker: 'Système C',
  name: 'Édition',
  tagline: 'Encre, filets, tampon',
  concept:
    'Un livre bien composé plutôt qu’une machine : aucune boîte, des mots. L’action principale est un mot en Caslon italique souligné à l’encre bordeaux ; les autres sont en petites capitales ou entre parenthèses ; les panneaux sont séparés par un double filet comme une page de Stripe Press.',
  signature:
    'L’encre qui monte. Au survol le soulignement s’épaissit, à l’appui l’encre remplit le mot (la course se voit de bas en haut) ; Cocher appose un tampon « Fait » et barre la ligne d’un filet ; le rangement forcé est un registre de 47 tranches de pages qui s’encrent ; le toast est une note en marge marquée d’un astérisque ; la palette est un index à points de conduite.',
  chipNote: 'Plage : petites capitales sous un filet épais de couleur. Tâche : italique précédée d’une case vide. Distinctes sans couleur, comme dans un sommaire.',
  failles: [
    'Des mots au lieu de boutons : la cible cliquable est moins évidente, surtout pour « Plus tard » entre parenthèses. Il faut des zones de clic invisibles de 44 px en mobile, et le premier jour on cherche où appuyer.',
    'C’est la ligne « crème, sérif, encre » que la recherche range dans le look IA, et Claude la porte : sur fond brun la parenté s’atténue, mais elle reste. La signature (encre qui monte, tampon, registre) doit faire la différence.',
    'Libre Caslon en italique à 15 px sur fond sombre est fin ; il ne tient que pour quelques mots (boutons, titres), jamais pour une phrase.',
    'Le tampon « Fait » penché et le registre de 47 traits sont les deux seuls ornements : ils plaisent les premiers jours puis deviennent du bruit si on coche 40 fois par jour (à garder à 120 ms, sans rebond, ce qui est le cas).',
    'Sans fond ni bordure, la carte « À ranger » se distingue moins de l’agenda : la hiérarchie repose sur les filets et la taille du titre, donc sur une composition qu’il faudra tenir partout.',
  ],
  enVrai: 'Base UI (Menu, Dialog), cmdk pour l’index, Sonner détourné en note de marge, dnd-kit, rien d’autre : le système est surtout typographique, donc le plus léger à porter.',
  glyph: { trash: <span className="ed-glyph">†</span>, undo: <span className="ed-glyph">&#8634;</span>, search: <span className="ed-glyph">§</span>, more: <span className="ed-glyph">¶</span> },
};
Object.assign(EDITION, { Check, Progress, DayPicker, DeleteCtl });
