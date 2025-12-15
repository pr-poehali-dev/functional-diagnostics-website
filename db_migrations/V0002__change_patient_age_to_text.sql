-- Change patient_age column type from INTEGER to TEXT to support formatted age strings
ALTER TABLE t_p13795046_functional_diagnosti.protocols 
ALTER COLUMN patient_age TYPE TEXT USING patient_age::TEXT;