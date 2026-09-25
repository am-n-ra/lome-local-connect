-- R-3b — alignement de la confiance sur l'ENTITE (S-30)
--
-- Contexte : R-1 a cree les colonnes de confiance sur v2_entities (058) et les a backfillees
-- une fois. Mais AUCUNE ecriture ne les met a jour ensuite — les 8 sites d'ecriture ecrivent
-- sur v2_facilities. Les deux colonnes peuvent donc diverger silencieusement.
--
-- Cette migration est le filet de securite : elle recopie la confiance du LIEU vers l'ENTITE
-- pour toute entite divergente, afin qu'aucune lecture (desormais entite d'abord) ne serve
-- une valeur perimee.
--
-- Additif et idempotent : ne supprime aucune colonne, ne modifie rien quand les valeurs
-- concordent deja. Re-executable sans effet.

update v2_entities e
set trust_state = f.trust_state,
    qualifying_sales = f.qualifying_sales,
    updated_at = now()
from v2_facilities f
where e.id = f.entity_id
  and (e.trust_state is distinct from f.trust_state
       or e.qualifying_sales is distinct from f.qualifying_sales);
