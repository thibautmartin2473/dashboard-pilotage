'use client';

// Vitrine « Boutons de Cadran, charte Cuir » : trois systèmes de composants radicalement différents sur la
// charte cadran-cuir, chacun interactif en état local. Aucune écriture : rien n'est enregistré.
import Link from 'next/link';
import { useState } from 'react';
import Anneau from '@/components/demo/chartes-cadran/Anneau';
import { SystemDemo } from './Common';
import { EDITION } from './Edition';
import { PLANCHE } from './Planche';
import { SELLERIE } from './Sellerie';
import './cuir.css';

const SKINS = [SELLERIE, PLANCHE, EDITION];

export default function CuirLab({ initial }) {
  const start = Math.max(0, SKINS.findIndex((s) => s.id === initial));
  const [sys, setSys] = useState(start);
  const choose = (i) => {
    setSys(i);
    try {
      const u = new URL(window.location.href);
      u.searchParams.set('systeme', SKINS[i].id);
      window.history.replaceState(null, '', u);
    } catch {
      /* l'URL ne garde pas le choix : sans gravité */
    }
  };
  const skin = SKINS[sys];
  return (
    <div className="studio cl-root" data-charte="cadran-cuir">
      <p className="cl-banner">
        <span>Démo : rien n’est enregistré</span>
        <Link href="/demo">Toutes les démos</Link>
      </p>
      <header className="cl-top">
        <div className="cl-brand">
          <Anneau size={34} />
          <div>
            <p className="cl-kicker">Cadran, charte Cuir et bordeaux</p>
            <h1 className="cl-h1">Boutons de Cadran</h1>
          </div>
        </div>
        <div className="cl-switch" role="tablist" aria-label="Système de composants">
          {SKINS.map((s, i) => (
            <button
              key={s.id}
              type="button"
              role="tab"
              aria-selected={sys === i}
              aria-controls="cl-panel-sys"
              tabIndex={sys === i ? 0 : -1}
              className="cl-switch-opt"
              onClick={() => choose(i)}
              onKeyDown={(e) => {
                const d = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
                if (!d) return;
                e.preventDefault();
                const n = (i + d + SKINS.length) % SKINS.length;
                choose(n);
                e.currentTarget.parentElement.children[n]?.focus();
              }}
            >
              <span className="cl-switch-letter">{String.fromCharCode(65 + i)}</span>
              <span className="cl-switch-name">{s.name}</span>
              <span className="cl-switch-tag">{s.tagline}</span>
            </button>
          ))}
        </div>
      </header>

      <main id="cl-panel-sys" role="tabpanel" aria-label={skin.name}>
        <SystemDemo key={skin.id} skin={skin} />
      </main>

      <section className="cl-reco" aria-labelledby="cl-reco-h">
        <p className="cl-kicker">Recommandation</p>
        <h2 className="cl-h2" id="cl-reco-h">
          Édition pour le quotidien, deux pièces de Sellerie pour la matière
        </h2>
        <ol className="cl-reco-list">
          <li>
            <strong>Base : Édition.</strong> C’est le seul des trois qui tient dix heures par jour : presque pas de décor, une seule animation par geste (l’encre, le tampon), et c’est la ligne Stripe Press que tu as aimée. C’est aussi le plus léger à coder et à rendre accessible.
          </li>
          <li>
            <strong>Emprunter à Sellerie</strong> l’oeillet de Cocher (à 100 ms) et le signet du jour en cours : ils donnent au cuir une raison d’être sans couvrir l’écran de coutures. La surpiqûre, seulement sur la carte en cours de rangement.
          </li>
          <li>
            <strong>Garder de Planche de bord</strong> le compteur à rouleaux pour les chiffres qui changent (rangés, en retard) et l’aiguille de laiton du maintenant. Écarter le capot (confirmation déguisée), les touches à course et la molette : beaux en démo, lourds au quotidien.
          </li>
          <li>
            <strong>Écarté en route :</strong> un système « Horlogerie » (cadran de montre, couronne, guillochage) collait au nom Cadran, mais doublonnait Planche de bord sur la mécanique et tirait vers le luxe décoratif.
          </li>
        </ol>
        <p className="cl-note">Prochaine étape si tu valides : un seul système hybride sur le vrai Cockpit, puis les fonctionnalités.</p>
      </section>
    </div>
  );
}
