-- Olaf's companion buff used to cut tavern healer gold cost (`healDiscount`).
-- After the combat.heal rewrite potions are the healing path, so re-target the
-- buff to "+20% healing from potions" via a new `healBonus` key. Trait text is
-- the player-facing copy — keep it in Polish.
UPDATE "companion_templates"
SET
  trait = '+8 MAG, mikstury leczą +20%',
  buff = jsonb_build_object('magBonus', 8, 'healBonus', 0.2)
WHERE slug = 'olaf';
