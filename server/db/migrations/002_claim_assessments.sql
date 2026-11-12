CREATE TABLE IF NOT EXISTS claim_assessments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  history_claim_id INT NOT NULL,
  heritage_entry_id INT NOT NULL,
  validator_id INT NOT NULL,
  editorial_action_id INT NULL,
  source_type_fit ENUM('met', 'partly', 'not_met') NOT NULL,
  source_credibility ENUM('met', 'partly', 'not_met') NOT NULL,
  corroboration ENUM('met', 'partly', 'not_met') NOT NULL,
  claimed_year_supported ENUM('met', 'partly', 'not_met') NOT NULL,
  notes TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_claim_assessments_history_claim
    FOREIGN KEY (history_claim_id) REFERENCES heritage_entry_history_claims(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_claim_assessments_heritage_entry
    FOREIGN KEY (heritage_entry_id) REFERENCES heritage_entries(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_claim_assessments_validator
    FOREIGN KEY (validator_id) REFERENCES users(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_claim_assessments_editorial_action
    FOREIGN KEY (editorial_action_id) REFERENCES editorial_actions(id)
    ON DELETE SET NULL
);
