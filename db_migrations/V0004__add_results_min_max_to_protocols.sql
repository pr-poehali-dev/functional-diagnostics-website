-- Добавление поля results_min_max для хранения минимальных и максимальных значений параметров
ALTER TABLE protocols ADD COLUMN IF NOT EXISTS results_min_max JSONB;

COMMENT ON COLUMN protocols.results_min_max IS 'Минимальные и максимальные значения параметров (для ЭКГ: ЧСС, PQ, QRS, QT)';