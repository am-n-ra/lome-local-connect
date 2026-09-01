import { Btn, Card, Check, FCFA, MapBackdrop, Media, Pill, Pin, QrArt, Row, Screen, SectionTitle, TabBar, UserDot } from "./kit";
import type { MockScreen } from "./types";

const BUYER_TABS = ["Map", "Search", "Saved", "Requests", "Compte"];

export const buyerScreens: MockScreen[] = [
  {
    id: "b01",
    group: "Acheteur",
    title: "01 · Map Home",
    note: "La carte est le produit. Pas de dashboard, recherche flottante, pins, localisation.",
    render: () => (
      <div className="flex h-full flex-col">
        <div className="relative flex-1">
          <MapBackdrop>
            <div className="absolute left-0 right-0 top-4 px-4">
              <div className="flex items-center justify-between">
                <span className="text-lg font-bold tracking-tight text-forest">OMNI</span>
                <span className="rounded-full border border-border bg-card/90 px-2 py-1 text-[11px] font-semibold">☰</span>
              </div>
            </div>
            <Pin x={30} y={38} label="Meubles" />
            <Pin x={62} y={30} label="Bureau" tone="forest" />
            <Pin x={48} y={58} label="Marché" tone="muted" />
            <UserDot x={45} y={72} />
            <div className="absolute inset-x-4 bottom-4">
              <div className="rounded-2xl border border-border/70 bg-card/85 p-3 shadow-[var(--shadow-float)] backdrop-blur">
                <div className="rounded-xl bg-secondary px-3 py-2.5 text-sm text-muted-foreground">
                  Que cherchez-vous ?
                </div>
                <div className="mt-2 flex gap-2 overflow-x-auto">
                  {["Meubles", "Alimentation", "Électronique", "Services"].map((c) => (
                    <span key={c} className="whitespace-nowrap rounded-full border border-border bg-card px-3 py-1 text-[11px] font-semibold">
                      {c}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </MapBackdrop>
        </div>
        <TabBar items={BUYER_TABS} active="Map" />
      </div>
    ),
  },
  {
    id: "b02",
    group: "Acheteur",
    title: "02 · Recherche activée",
    render: () => (
      <div className="flex h-full flex-col">
        <div className="relative flex-1">
          <MapBackdrop>
            <div className="absolute inset-0 bg-background/85 backdrop-blur-sm" />
            <div className="absolute inset-x-0 top-0 p-4">
              <div className="flex items-center gap-2">
                <span className="text-lg">←</span>
                <div className="flex-1 rounded-xl border border-primary/40 bg-card px-3 py-2.5 text-sm text-foreground">
                  Que cherchez-vous ?<span className="animate-pulse text-primary">|</span>
                </div>
              </div>
              <SectionTitle>Récent</SectionTitle>
              {["Chaises noires", "Cartouche imprimante", "Samsung A55"].map((r) => (
                <Row key={r} label={r} value="↗" />
              ))}
              <SectionTitle>Chercher</SectionTitle>
              <div className="space-y-2">
                {["Un produit", "Un service", "Une facility"].map((r) => (
                  <Card key={r} className="text-sm font-medium">{r}</Card>
                ))}
              </div>
              <div className="mt-4 flex gap-2">
                <Btn variant="outline">🎙 Voix</Btn>
                <Btn variant="outline">◉ Scan</Btn>
              </div>
            </div>
          </MapBackdrop>
        </div>
        <TabBar items={BUYER_TABS} active="Search" />
      </div>
    ),
  },
  {
    id: "b03",
    group: "Acheteur",
    title: "03 · Contraintes",
    note: "Omni extrait produit, couleur, quantité, prix et rayon depuis la phrase.",
    render: () => (
      <Screen title="Recherche" subtitle="« 20 chaises noires à moins de 15 000 FCFA autour de moi »">
        <SectionTitle>Contraintes extraites</SectionTitle>
        <div className="flex flex-wrap gap-2">
          <Pill tone="primary">20 chaises</Pill>
          <Pill>Noires</Pill>
          <Pill tone="gold">≤ 15 000 FCFA</Pill>
          <Pill tone="forest">≤ 10 km</Pill>
          <Pill>+ Ajouter</Pill>
        </div>
        <SectionTitle>Affiner</SectionTitle>
        <Card className="space-y-3">
          <Row label="Quantité" value="20" />
          <Row label="Budget max" value={FCFA(15000)} />
          <Row label="Rayon" value="10 km" />
          <Row label="Ouvert maintenant" value="Oui" />
        </Card>
        <div className="mt-4">
          <Btn>Voir les résultats</Btn>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          Les contraintes filtrent l'offre : pas 500 résultats dont 480 hors conditions.
        </p>
      </Screen>
    ),
  },
  {
    id: "b04",
    group: "Acheteur",
    title: "04 · Résultats sur carte",
    render: () => (
      <div className="flex h-full flex-col">
        <div className="relative flex-1">
          <MapBackdrop>
            <Pin x={28} y={34} label="A" />
            <Pin x={58} y={28} label="B" />
            <Pin x={70} y={52} label="C" tone="forest" />
            <UserDot x={40} y={66} />
            <div className="absolute inset-x-0 bottom-0 space-y-2 p-3">
              <div className="text-[11px] font-semibold text-foreground/70">20 chaises · noir · ≤ 15k</div>
              <div className="flex gap-3 overflow-x-auto pb-1">
                {[
                  { n: "ABC Furniture", t: "6 min", q: "20+ disponibles*", p: 15000 },
                  { n: "XYZ Office", t: "9 min", q: "12 disponibles*", p: 14500 },
                ].map((f) => (
                  <Card key={f.n} className="w-[190px] shrink-0">
                    <div className="text-sm font-semibold">{f.n}</div>
                    <div className="text-xs text-muted-foreground">{f.t} · {f.q}</div>
                    <div className="mt-1 text-sm font-bold text-primary">{FCFA(f.p)}</div>
                    <div className="mt-1"><Pill tone="forest">● Ouvert</Pill></div>
                  </Card>
                ))}
              </div>
            </div>
          </MapBackdrop>
        </div>
        <TabBar items={BUYER_TABS} active="Search" />
      </div>
    ),
  },
  {
    id: "b05",
    group: "Acheteur",
    title: "05 · Facility preview",
    note: "Avant intention d'achat : pas de contact, pas d'itinéraire, pas de chat.",
    render: () => (
      <div className="flex h-full flex-col">
        <div className="relative flex-1">
          <MapBackdrop>
            <Pin x={40} y={30} label="ABC" />
          </MapBackdrop>
        </div>
        <div className="rounded-t-3xl border-t border-border bg-card p-4 shadow-[var(--shadow-sheet-raised)]">
          <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-border" />
          <Media label="ABC Furniture" h="h-24" />
          <div className="mt-3 flex items-center gap-2">
            <h3 className="text-base font-bold">ABC Furniture</h3>
            <Pill tone="forest">✓ Certifiée</Pill>
          </div>
          <p className="text-xs text-muted-foreground">Mobilier · 2,4 km · Ouvert jusqu'à 18:00</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {["Chaise", "Table", "Bureau", "Étagère"].map((p) => <Pill key={p}>{p}</Pill>)}
          </div>
          <div className="mt-3 space-y-2">
            <Btn>Vérifier la disponibilité</Btn>
            <Btn variant="outline">Voir la facility</Btn>
          </div>
          <p className="mt-2 text-center text-[11px] text-muted-foreground">
            Contact et itinéraire déverrouillés après l'intention d'achat.
          </p>
        </div>
      </div>
    ),
  },
  {
    id: "b06",
    group: "Acheteur",
    title: "06 · Page facility",
    render: () => (
      <Screen>
        <Media label="ABC Furniture" h="h-36" />
        <div className="mt-3 flex items-center gap-2">
          <h2 className="text-lg font-bold">ABC Furniture</h2>
          <Pill tone="forest">✓ Certifiée</Pill>
        </div>
        <p className="text-xs text-muted-foreground">Ouvert · 2,4 km · Mobilier</p>
        <div className="mt-3 space-y-2">
          <Btn>Vérifier la disponibilité</Btn>
          <Btn variant="outline">Voir les produits</Btn>
        </div>
        <SectionTitle>Produits</SectionTitle>
        <Card>
          {["Chaise — 15 000", "Table — 42 000", "Bureau — 68 000", "Sofa — 120 000"].map((p) => (
            <Row key={p} label={p.split(" — ")[0]} value={`${p.split(" — ")[1]} FCFA`} />
          ))}
        </Card>
        <SectionTitle>Services</SectionTitle>
        <Card><Row label="Livraison Lomé" value="5 000 FCFA" /><Row label="Mobilier sur mesure" value="Devis" /></Card>
        <SectionTitle>Offres</SectionTitle>
        <Card><Pill tone="gold">−5 % réduction Omni sur tout le mobilier</Pill></Card>
        <SectionTitle>À propos</SectionTitle>
        <Card className="text-xs text-muted-foreground">Atelier et showroom de mobilier de bureau, Lomé — Tokoin.</Card>
        <SectionTitle>Localisation</SectionTitle>
        <div className="h-28 overflow-hidden rounded-2xl border border-border"><MapBackdrop><Pin x={50} y={55} label="Ici" /></MapBackdrop></div>
      </Screen>
    ),
  },
  {
    id: "b07",
    group: "Acheteur",
    title: "07 · Sélection multi-produits",
    render: () => (
      <Screen title="Produits" subtitle="ABC Furniture">
        <Card className="space-y-1">
          {[
            ["Chaise noire", 15000, true],
            ["Bureau", 68000, true],
            ["Chaise de bureau", 32000, true],
            ["Table", 42000, false],
            ["Sofa", 120000, false],
          ].map(([n, p, on]) => (
            <div key={String(n)} className="flex items-center justify-between border-b border-border/60 py-2.5 last:border-0">
              <div>
                <div className="text-sm font-medium">{String(n)}</div>
                <div className="text-xs text-muted-foreground">{FCFA(Number(p))}</div>
              </div>
              <Check on={Boolean(on)} />
            </div>
          ))}
        </Card>
        <div className="mt-4 rounded-2xl border border-primary/30 bg-primary/5 p-3">
          <div className="text-sm font-semibold">3 produits sélectionnés</div>
          <p className="text-xs text-muted-foreground">Mini-panier de demande, pas encore une commande.</p>
          <div className="mt-2"><Btn>Demander la disponibilité</Btn></div>
        </div>
      </Screen>
    ),
  },
  {
    id: "b08",
    group: "Acheteur",
    title: "08 · Builder de demande",
    render: () => (
      <Screen title="Vérifier la disponibilité" subtitle="ABC Furniture">
        <Card className="space-y-3">
          {[["Chaise noire", 20], ["Bureau", 2], ["Chaise de bureau", 5]].map(([n, q]) => (
            <div key={String(n)} className="flex items-center justify-between">
              <div className="flex items-center gap-2"><Check on /> <span className="text-sm font-medium">{String(n)}</span></div>
              <div className="flex items-center gap-2 rounded-full border border-border px-2 py-1 text-sm">
                <span>−</span><span className="w-6 text-center font-bold">{String(q)}</span><span>+</span>
              </div>
            </div>
          ))}
        </Card>
        <SectionTitle>Notes</SectionTitle>
        <Card className="text-sm text-muted-foreground">« Livraison si possible »</Card>
        <div className="mt-4"><Btn>Envoyer la demande</Btn></div>
        <p className="mt-2 text-xs text-muted-foreground">Le vendeur reçoit une demande structurée, pas trois messages.</p>
      </Screen>
    ),
  },
  {
    id: "b09",
    group: "Acheteur",
    title: "09 · En attente",
    render: () => (
      <Screen title="Vérification en cours…" subtitle="ABC Furniture">
        <Card>
          {["Chaise noire", "Bureau", "Chaise de bureau"].map((n) => (
            <Row key={n} label={n} value={<Pill tone="gold">● En attente</Pill>} />
          ))}
        </Card>
        <div className="mt-4 rounded-2xl bg-secondary p-4 text-center text-sm text-muted-foreground">
          Vous pouvez quitter cet écran.<br />Nous vous notifions dès la réponse.
        </div>
        <div className="mt-4"><Btn variant="outline">Continuer à explorer</Btn></div>
      </Screen>
    ),
  },
  {
    id: "b10",
    group: "Acheteur",
    title: "10 · Résultat disponibilité",
    render: () => (
      <Screen title="Réponse reçue" subtitle="ABC Furniture">
        <Card>
          <Row label="Chaise noire" hint="20 demandées" value={<Pill tone="forest">✓ 20 dispo</Pill>} />
          <Row label="Bureau" hint="2 demandés" value={<Pill tone="forest">✓ 2 dispo</Pill>} />
          <Row label="Chaise de bureau" hint="5 demandées" value={<Pill tone="gold">~ 3 dispo</Pill>} />
        </Card>
        <div className="mt-3 rounded-2xl border border-gold/40 bg-gold/15 p-3 text-sm font-semibold">
          Réduction Omni disponible · −5 %
        </div>
        <SectionTitle>Aussi chez ce vendeur</SectionTitle>
        <div className="flex flex-wrap gap-2">{["Tables", "Sofas", "Étagères"].map((p) => <Pill key={p}>{p}</Pill>)}</div>
        <div className="mt-4 space-y-2">
          <Btn>Je veux acheter</Btn>
          <Btn variant="outline">Voir la demande mise à jour</Btn>
        </div>
      </Screen>
    ),
  },
  {
    id: "b11",
    group: "Acheteur",
    title: "11 · Comparaison multi-facility",
    note: "Bulk availability : sélection → dispatch → réponses → agrégation → ranking.",
    render: () => (
      <Screen title="Meilleures correspondances" subtitle="20 chaises noires · 12 facilities interrogées">
        <div className="mb-3 flex gap-2 overflow-x-auto">
          {["Best match", "Plus proche", "Prix bas", "Plus dispo", "Plus rapide"].map((f, i) => (
            <span key={f} className={`whitespace-nowrap rounded-full px-3 py-1 text-[11px] font-semibold ${i === 0 ? "bg-primary text-primary-foreground" : "border border-border bg-card"}`}>{f}</span>
          ))}
        </div>
        {[
          { n: "ABC Furniture", a: "20/20", p: 15000, d: "2,4 km" },
          { n: "XYZ Office", a: "20/20", p: 15500, d: "4,1 km" },
          { n: "Market Supplier", a: "15/20", p: 13500, d: "3,2 km" },
        ].map((f, i) => (
          <Card key={f.n} className="mb-2">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold">{i + 1}. {f.n}</div>
              <Pill tone={f.a.startsWith("20") ? "forest" : "gold"}>{f.a} dispo</Pill>
            </div>
            <div className="mt-1 text-xs text-muted-foreground">{FCFA(f.p)} · {f.d} · Ouvert</div>
          </Card>
        ))}
      </Screen>
    ),
  },
  {
    id: "b12",
    group: "Acheteur",
    title: "12 · Intention d'achat",
    note: "Point de bascule : avant = découverte, après = transaction.",
    render: () => (
      <Screen title="ABC Furniture" subtitle="Récapitulatif avant achat">
        <Card>
          <Row label="20 × Chaise noire" value={FCFA(300000)} />
          <Row label="2 × Bureau" value={FCFA(136000)} />
          <Row label="3 × Chaise de bureau" value={FCFA(96000)} />
          <Row label="Réduction Omni −5 %" value={`− ${FCFA(26600)}`} />
        </Card>
        <div className="mt-3 flex items-center justify-between rounded-2xl bg-forest/10 p-3">
          <span className="text-sm font-semibold">Total estimé</span>
          <span className="text-lg font-bold text-forest">{FCFA(505400)}</span>
        </div>
        <div className="mt-4"><Btn>JE VEUX ACHETER</Btn></div>
        <p className="mt-2 text-xs text-muted-foreground">
          Crée la transaction, le coupon, le QR et déverrouille contact + itinéraire.
        </p>
      </Screen>
    ),
  },
  {
    id: "b13",
    group: "Acheteur",
    title: "13 · Transaction room",
    render: () => (
      <div className="flex h-full flex-col">
        <Screen title="ABC Furniture" subtitle="TRANSACTION #OMN-48291">
          <Card>
            <Row label="20 × Chaise noire" />
            <Row label="2 × Bureau" />
            <Row label="3 × Chaise de bureau" />
          </Card>
          <div className="mt-3 space-y-2">
            <div className="flex items-center gap-2 text-sm"><Pill tone="forest">✓</Pill> Intention d'achat créée</div>
            <div className="flex items-center gap-2 text-sm"><Pill tone="forest">✓</Pill> QR de transaction généré</div>
            <div className="flex items-center gap-2 text-sm"><Pill tone="gold">●</Pill> En attente de vérification vendeur</div>
          </div>
          <SectionTitle>Déverrouillé</SectionTitle>
          <Card><Row label="Contact vendeur" value="+228 90 00 00 00" /><Row label="Itinéraire" value="6 min" /></Card>
          <div className="mt-3 flex gap-2"><Btn variant="outline">Voir le QR</Btn><Btn variant="ghost">Partager</Btn></div>
        </Screen>
        <div className="shrink-0 border-t border-border bg-card p-3">
          <div className="rounded-xl bg-secondary px-3 py-2 text-sm text-muted-foreground">Message au vendeur…</div>
        </div>
      </div>
    ),
  },
  {
    id: "b14",
    group: "Acheteur",
    title: "14 · QR & partage",
    render: () => (
      <Screen title="QR de transaction" subtitle="OMN-48291">
        <div className="flex flex-col items-center gap-3 py-2">
          <QrArt />
          <div className="text-center text-xs text-muted-foreground">Le serveur valide le token, pas l'image.</div>
        </div>
        <SectionTitle>Partager dans Omni</SectionTitle>
        <Btn variant="outline">Envoyer au vendeur via Omni</Btn>
        <SectionTitle>Hors Omni</SectionTitle>
        <div className="grid grid-cols-2 gap-2">
          {["WhatsApp", "SMS", "Telegram", "Copier le lien"].map((c) => (
            <Card key={c} className="text-center text-sm font-semibold">{c}</Card>
          ))}
        </div>
        <div className="mt-3"><Btn variant="ghost">Montrer le QR physiquement</Btn></div>
      </Screen>
    ),
  },
  {
    id: "b15",
    group: "Acheteur",
    title: "15 · Paiement",
    render: () => (
      <Screen title="Transaction confirmée ✓" subtitle="Vérifiée par le vendeur">
        <div className="rounded-2xl bg-forest/10 p-4 text-center">
          <div className="text-xs text-muted-foreground">Montant à payer</div>
          <div className="text-2xl font-bold text-forest">{FCFA(505400)}</div>
        </div>
        <SectionTitle>Mode de paiement</SectionTitle>
        <Card>
          {["Cash", "Mobile Money", "Virement bancaire", "Autre"].map((m, i) => (
            <Row key={m} label={m} value={i === 1 ? "◉" : "○"} />
          ))}
        </Card>
        <div className="mt-4"><Btn>Continuer</Btn></div>
        <SectionTitle>Instructions Mobile Money</SectionTitle>
        <Card className="space-y-1 text-sm">
          <Row label="Envoyer" value={FCFA(505400)} />
          <Row label="À" value="+228 90 00 00 00" />
          <Row label="Référence" value="OMN-48291" />
        </Card>
        <div className="mt-3"><Btn variant="forest">J'ai payé</Btn></div>
        <p className="mt-2 text-xs text-muted-foreground">Mode démo — Omni ne traite pas le paiement en V1.</p>
      </Screen>
    ),
  },
  {
    id: "b16",
    group: "Acheteur",
    title: "16 · Fulfilment",
    render: () => (
      <Screen title="Paiement déclaré" subtitle="OMN-48291">
        <Card>
          <Row label="Paiement signalé" value={<Pill tone="forest">✓</Pill>} />
          <Row label="Confirmation vendeur" value={<Pill tone="gold">● En attente</Pill>} />
        </Card>
        <SectionTitle>Récupération</SectionTitle>
        <Card>
          {["Retrait à la facility", "Livraison par le vendeur", "Livraison organisée par l'acheteur"].map((m, i) => (
            <Row key={m} label={m} value={i === 0 ? "◉" : "○"} />
          ))}
        </Card>
        <SectionTitle>Suivi</SectionTitle>
        <Card>
          <Row label="Paiement confirmé" value="—" />
          <Row label="Produit remis" value="—" />
          <Row label="Produit reçu" value={<Btn full={false} variant="outline">Confirmer</Btn>} />
        </Card>
      </Screen>
    ),
  },
  {
    id: "b17",
    group: "Acheteur",
    title: "17 · Transaction terminée",
    render: () => (
      <Screen>
        <div className="py-6 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-forest text-2xl text-forest-foreground">✓</div>
          <h2 className="text-lg font-bold">Transaction terminée</h2>
          <p className="text-xs text-muted-foreground">ABC Furniture · OMN-48291</p>
        </div>
        <Card>
          <Row label="20 × Chaise noire" />
          <Row label="2 × Bureau" />
          <Row label="3 × Chaise de bureau" />
          <Row label="Total" value={FCFA(505400)} />
          <Row label="Paiement" value="Mobile Money" />
        </Card>
        <div className="mt-4"><Btn>Noter le vendeur</Btn></div>
        <p className="mt-2 text-center text-xs text-muted-foreground">La notation est optionnelle.</p>
      </Screen>
    ),
  },
  {
    id: "b18",
    group: "Acheteur",
    title: "18 · Historique",
    render: () => (
      <div className="flex h-full flex-col">
        <Screen title="Transactions">
          <SectionTitle>Aujourd'hui</SectionTitle>
          <Card className="mb-2">
            <div className="flex items-center justify-between">
              <div><div className="text-sm font-semibold">ABC Furniture</div><div className="text-xs text-muted-foreground">OMN-48291</div></div>
              <div className="text-right"><Pill tone="forest">✓ Terminée</Pill><div className="text-sm font-bold">{FCFA(505400)}</div></div>
            </div>
          </Card>
          <SectionTitle>Hier</SectionTitle>
          <Card>
            <div className="flex items-center justify-between">
              <div><div className="text-sm font-semibold">XYZ Electronics</div><div className="text-xs text-muted-foreground">OMN-48120</div></div>
              <div className="text-right"><Pill tone="forest">✓ Terminée</Pill><div className="text-sm font-bold">{FCFA(84000)}</div></div>
            </div>
          </Card>
        </Screen>
        <TabBar items={BUYER_TABS} active="Requests" />
      </div>
    ),
  },
  {
    id: "b19",
    group: "Acheteur",
    title: "19 · Recherches & demandes",
    render: () => (
      <div className="flex h-full flex-col">
        <Screen title="Mes recherches">
          <SectionTitle>Mes demandes</SectionTitle>
          <Card>
            <Row label="Samsung A55" value={<Pill tone="gold">● Recherche d'offre</Pill>} />
            <Row label="Chaises de bureau noires" hint="20 unités" value={<Pill tone="forest">3 réponses</Pill>} />
          </Card>
          <SectionTitle>Recherches récentes</SectionTitle>
          <Card>
            {["Cartouche imprimante", "Chaises de bureau noires", "Samsung A55", "Laptop < 500k"].map((s) => (
              <Row key={s} label={s} value="↻" />
            ))}
          </Card>
        </Screen>
        <TabBar items={BUYER_TABS} active="Saved" />
      </div>
    ),
  },
  {
    id: "b20",
    group: "Acheteur",
    title: "20 · Compte acheteur",
    render: () => (
      <div className="flex h-full flex-col">
        <Screen title="Compte" subtitle="Kheir · kheir@omni.tg">
          <Card>
            {["Mes transactions", "Demandes de disponibilité", "Recherches enregistrées", "Historique de recherche", "Notifications"].map((i) => (
              <Row key={i} label={i} value="›" />
            ))}
          </Card>
          <SectionTitle>Omni</SectionTitle>
          <Card>
            <Row label="Omni Wallet" value={FCFA(12000)} />
            <Row label="Crédits disponibilité" hint="Bulk availability" value="87 / 100" />
            <Row label="Abonnement" value="Pro acheteur · 5 $/mois" />
          </Card>
          <div className="mt-4"><Btn variant="forest">Passer en mode Vendeur</Btn></div>
        </Screen>
        <TabBar items={BUYER_TABS} active="Compte" />
      </div>
    ),
  },
];
