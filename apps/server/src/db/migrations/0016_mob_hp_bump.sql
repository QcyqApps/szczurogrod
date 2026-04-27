-- Pierwszy pass balansu walki: HP mobów per tier × {1.30, 1.60, 1.70, 1.90}.
-- Docelowe tempo: walka z mobem tego samego poziomu co gracz = 4-5 rund
-- normalnych ataków przy gear typowym dla jego tiera. Obecna sytuacja:
-- L6 warrior ubija Dire Bata (T2, HP 100) w 2 norm ataki i one-shotuje na
-- crit — zero decyzji w walce. Bumpamy HP; crit-multiplier lecimy osobno
-- w kodzie (1.8 → 1.6). Wzór z 0008 / 0013.
UPDATE "enemy_templates" SET "hp" = CASE "tier"
  WHEN 1 THEN CEIL("hp" * 1.30)
  WHEN 2 THEN CEIL("hp" * 1.60)
  WHEN 3 THEN CEIL("hp" * 1.70)
  WHEN 4 THEN CEIL("hp" * 1.90)
  ELSE "hp"
END;
