// @vitest-environment jsdom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { SellerV13 } from './SellerV13';
import type { PublicFacility, SellerCatalogueResult } from './types';

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

const emptyCatalogue: SellerCatalogueResult = { authorized: true, catalogReady: false, facilities: [], products: [] };

const installedCatalogue: SellerCatalogueResult = {
  authorized: true,
  catalogReady: true,
  facilities: [
    { id: 'facility-1', name: 'Boutique A', category: 'Marché', address: null, currency: 'XOF', slotState: 'active', operationalState: 'ouvert', productCount: 0, facilityType: 'fixe', rayonKm: null, trustState: 'confirmed', contactPhone: null, contactWhatsapp: null },
  ],
  products: [],
};

const claimable: PublicFacility[] = [
  { id: 'f-open', name: 'Étal du Port', category: 'Poissonnerie', address: 'Port de Lomé', latitude: 6.13, longitude: 1.28, trust: 'unclaimed', plan: 'free', productCount: 0 },
];

function render(catalogue: SellerCatalogueResult, publicFacilities: PublicFacility[] = []) {
  act(() => {
    root.render(
      <SellerV13
        onClose={() => {}}
        catalogue={catalogue}
        publicFacilities={publicFacilities}
        ownedIds={[]}
      />,
    );
  });
}

const text = () => container.textContent ?? '';

describe('SellerV13 entry boundary (founder bug: switch → installed shell instead of claim/create)', () => {
  // Régression : le catalogue est un objet truthy même sans facilité. Avant le
  // correctif, `hasData` était vrai → l'entrée vendeur était sautée et l'écran
  // montrait la coquille d'un vendeur installé (barre, ON/OFF, catalogue).
  it('shows the claim/create entry — not the installed shell — for an account with no facility', () => {
    render(emptyCatalogue, claimable);
    expect(text()).toContain('Bienvenue — espace vendeur');
    expect(text()).toContain('Revendiquez une facilité déjà sur la carte');
    expect(text()).toContain('Créer une facilité');
    // la coquille d'un vendeur installé ne doit PAS apparaître
    expect(text()).not.toContain('Je suis actif en ce moment');
    expect(text()).not.toContain('État de la facilité');
    expect(text()).not.toContain('Scanner QR');
  });

  it('lists unclaimed nearby facilities with a direct claim affordance', () => {
    render(emptyCatalogue, claimable);
    expect(text()).toContain('Facilités à revendiquer près de vous');
    expect(text()).toContain('Étal du Port');
    expect(text()).toContain('Non revendiquée');
    const claimButton = container.querySelector<HTMLButtonElement>('.cardbox > b');
    expect(claimButton?.textContent).toContain('Étal du Port');
  });

  it('falls back to the map when no public facility is claimable', () => {
    render(emptyCatalogue, []);
    expect(text()).toContain('Ouvrir la carte pour revendiquer');
    expect(text()).not.toContain('Facilités à revendiquer près de vous');
  });

  it('shows the operating shell once the account actually owns a facility', () => {
    render(installedCatalogue, []);
    expect(text()).toContain('Je suis actif en ce moment');
    expect(text()).not.toContain('Bienvenue — espace vendeur');
  });

  it('opens straight into the create form when entered from "la facilité n\'est pas sur la carte"', () => {
    act(() => {
      root.render(<SellerV13 onClose={() => {}} catalogue={emptyCatalogue} publicFacilities={[]} ownedIds={[]} startInCreate />);
    });
    expect(text()).toContain("Type d'établissement");
    expect(text()).toContain('Créer ma facilité');
  });
});
