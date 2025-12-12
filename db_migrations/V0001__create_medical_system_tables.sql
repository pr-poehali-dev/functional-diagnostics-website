-- Создание таблиц для системы медицинской диагностики

-- Таблица врачей
CREATE TABLE IF NOT EXISTS doctors (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    specialization VARCHAR(100),
    signature_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Таблица протоколов исследований
CREATE TABLE IF NOT EXISTS protocols (
    id SERIAL PRIMARY KEY,
    doctor_id INTEGER NOT NULL REFERENCES doctors(id),
    study_type VARCHAR(50) NOT NULL,
    patient_name VARCHAR(255) NOT NULL,
    patient_gender VARCHAR(10) NOT NULL,
    patient_birth_date DATE NOT NULL,
    patient_age INTEGER,
    patient_weight DECIMAL(5,2),
    patient_height DECIMAL(5,2),
    patient_bsa DECIMAL(4,2),
    ultrasound_device VARCHAR(255),
    study_date DATE NOT NULL,
    results JSONB NOT NULL,
    conclusion TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Таблица персональных норм врача
CREATE TABLE IF NOT EXISTS doctor_norms (
    id SERIAL PRIMARY KEY,
    doctor_id INTEGER NOT NULL REFERENCES doctors(id),
    study_type VARCHAR(50) NOT NULL,
    parameter_id VARCHAR(50) NOT NULL,
    condition_type VARCHAR(20) NOT NULL,
    condition_value VARCHAR(50),
    min_value DECIMAL(10,2),
    max_value DECIMAL(10,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(doctor_id, study_type, parameter_id, condition_type, condition_value)
);

-- Таблица шаблонов заключений
CREATE TABLE IF NOT EXISTS conclusion_templates (
    id SERIAL PRIMARY KEY,
    doctor_id INTEGER NOT NULL REFERENCES doctors(id),
    study_type VARCHAR(50) NOT NULL,
    template_name VARCHAR(255) NOT NULL,
    priority INTEGER DEFAULT 0,
    conditions JSONB NOT NULL,
    conclusion_text TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Таблица настроек быстрого ввода
CREATE TABLE IF NOT EXISTS input_settings (
    id SERIAL PRIMARY KEY,
    doctor_id INTEGER NOT NULL REFERENCES doctors(id),
    study_type VARCHAR(50) NOT NULL,
    field_order JSONB NOT NULL,
    enabled_fields JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(doctor_id, study_type)
);

-- Индексы для оптимизации запросов
CREATE INDEX IF NOT EXISTS idx_protocols_doctor_id ON protocols(doctor_id);
CREATE INDEX IF NOT EXISTS idx_protocols_study_date ON protocols(study_date);
CREATE INDEX IF NOT EXISTS idx_doctor_norms_doctor_id ON doctor_norms(doctor_id);
CREATE INDEX IF NOT EXISTS idx_conclusion_templates_doctor_id ON conclusion_templates(doctor_id);
CREATE INDEX IF NOT EXISTS idx_input_settings_doctor_id ON input_settings(doctor_id);

-- Комментарии к таблицам
COMMENT ON TABLE doctors IS 'Таблица врачей с учетными данными';
COMMENT ON TABLE protocols IS 'Протоколы исследований пациентов';
COMMENT ON TABLE doctor_norms IS 'Персонализированные нормы для каждого врача';
COMMENT ON TABLE conclusion_templates IS 'Шаблоны автоматических заключений';
COMMENT ON TABLE input_settings IS 'Настройки порядка ввода данных для каждого врача';
