-- Add signed field to protocols table to track signature status
ALTER TABLE t_p13795046_functional_diagnosti.protocols 
ADD COLUMN signed BOOLEAN DEFAULT FALSE;