-- Таблица для хранения таблиц норм с их строками и настройками
CREATE TABLE IF NOT EXISTS t_p13795046_functional_diagnosti.norm_tables (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    doctor_id INTEGER NOT NULL REFERENCES t_p13795046_functional_diagnosti.doctors(id),
    study_type VARCHAR(50) NOT NULL,
    category VARCHAR(50) NOT NULL,
    parameter VARCHAR(100) NOT NULL,
    norm_type VARCHAR(20) NOT NULL,
    rows JSONB NOT NULL DEFAULT '[]'::jsonb,
    show_in_report BOOLEAN DEFAULT true,
    conclusion_below TEXT,
    conclusion_above TEXT,
    conclusion_borderline_low TEXT,
    conclusion_borderline_high TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_norm_tables_doctor ON t_p13795046_functional_diagnosti.norm_tables(doctor_id);
CREATE INDEX IF NOT EXISTS idx_norm_tables_study_type ON t_p13795046_functional_diagnosti.norm_tables(study_type);
CREATE INDEX IF NOT EXISTS idx_norm_tables_category ON t_p13795046_functional_diagnosti.norm_tables(category);
CREATE INDEX IF NOT EXISTS idx_norm_tables_parameter ON t_p13795046_functional_diagnosti.norm_tables(parameter);