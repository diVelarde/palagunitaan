const db = require('../config/db');

async function createMany(assessments, connection = db) {
  if (assessments.length === 0) return { affectedRows: 0 };

  const values = assessments.map(() => '(?, ?, ?, ?, ?, ?, ?, ?, ?)').join(', ');
  const params = assessments.flatMap((assessment) => [
    assessment.historyClaimId,
    assessment.heritageEntryId,
    assessment.validatorId,
    assessment.editorialActionId || null,
    assessment.sourceTypeFit,
    assessment.sourceCredibility,
    assessment.corroboration,
    assessment.claimedYearSupported,
    assessment.notes == null ? null : assessment.notes,
  ]);
  const [result] = await connection.query(
    `INSERT INTO claim_assessments
       (history_claim_id, heritage_entry_id, validator_id, editorial_action_id,
        source_type_fit, source_credibility, corroboration, claimed_year_supported, notes)
     VALUES ${values}`,
    params
  );
  return result;
}

async function findByEntryId(entryId) {
  const [rows] = await db.query(
    `SELECT ca.*, hehc.claimed_year, hehc.source_description
     FROM claim_assessments ca
     JOIN heritage_entry_history_claims hehc ON hehc.id = ca.history_claim_id
     WHERE ca.heritage_entry_id = ?
     ORDER BY ca.created_at ASC, ca.id ASC`,
    [entryId]
  );
  return rows;
}

module.exports = { createMany, findByEntryId };
