import type { RoutingProvider } from '../trunk/types';

/**
 * RT-D1 — quand faut-il exiger une identité (et éventuellement une intention)
 * avant de servir un itinéraire ?
 *
 * Principe : on ne restreint une fonctionnalité que là où elle coûte. Le coût réel
 * dépend du moteur, et le moteur est une variable d'environnement :
 *
 *   - `mapbox` : facturé à la requête → on exige une identité et on passe par le
 *     budget par utilisateur (`route-quota.ts`). C'est ce qui borne la dépense.
 *   - `osrm`   : notre propre serveur, coût marginal nul → aucune raison de
 *     fermer les aperçus anonymes, on ne facture rien à personne.
 *
 * Ce choix est meilleur qu'un verrou global : il ne casse pas la démo pilote
 * (aperçus anonymes) quand le routage est gratuit, et il protège la facture
 * uniquement quand il y a une facture. Le jour où `MAPBOX_ACCESS_TOKEN` est
 * posé, la protection s'active d'elle-même — l'oubli de configuration le plus
 * dangereux devient impossible.
 *
 * Le verrou d'intention, lui, reste un choix produit explicite et NON activé par
 * défaut : il supprime tout aperçu d'itinéraire avant décision, ce qui peut
 * coûter des conversions. Le fondateur décide avec `ROUTING_REQUIRE_INTENT`.
 */
export type RoutingGate = 'none' | 'identity' | 'intent';

export function routingGate(input: { provider: RoutingProvider | null; env?: NodeJS.ProcessEnv }): RoutingGate {
  const env = input.env ?? process.env;
  const override = env.ROUTING_ACCESS_MODE?.trim().toLowerCase();

  // Outrepassement explicite, pour rester maître en cas d'incident.
  if (override === 'never') return 'none';
  if (override === 'always') return env.ROUTING_REQUIRE_INTENT === '1' ? 'intent' : 'identity';
  if (override === 'billed') {
    if (input.provider !== 'mapbox') return 'none';
    return env.ROUTING_REQUIRE_INTENT === '1' ? 'intent' : 'identity';
  }

  if (input.provider !== 'mapbox') return 'none';
  return env.ROUTING_REQUIRE_INTENT === '1' ? 'intent' : 'identity';
}