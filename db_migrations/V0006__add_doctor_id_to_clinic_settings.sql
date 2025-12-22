ALTER TABLE t_p13795046_functional_diagnosti.clinic_settings 
ADD COLUMN IF NOT EXISTS doctor_id INTEGER REFERENCES t_p13795046_functional_diagnosti.doctors(id);

CREATE INDEX IF NOT EXISTS idx_clinic_settings_doctor_id 
ON t_p13795046_functional_diagnosti.clinic_settings(doctor_id);