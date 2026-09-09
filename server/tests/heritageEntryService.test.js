jest.mock('../models/heritageEntryModel');
jest.mock('../services/geminiService');
jest.mock('../services/duplicateDetectionService');

const heritageEntryModel = require('../models/heritageEntryModel');
const geminiService = require('../services/geminiService');
const duplicateDetectionService = require('../services/duplicateDetectionService');
const { submitEntry } = require('../services/heritageEntryService');

const BASE_ENTRY = {
  id: 1, user_id: 7, title: 'The Aswang of San Isidro',
  raw_content: 'Noon pa man, may kwento tungkol sa isang aswang...',
};

beforeEach(() => {
  jest.clearAllMocks();
  heritageEntryModel.create.mockResolvedValue({ ...BASE_ENTRY });
  duplicateDetectionService.findPossibleDuplicates.mockResolvedValue([]);
  geminiService.categorizeContent.mockResolvedValue({ category: 'Legend', flaggedWords: [] });
  geminiService.generateEuphemisticVersion.mockResolvedValue('A long time ago, there was a story about a shapeshifter...');
  heritageEntryModel.updateCategoryAuto.mockResolvedValue();
  heritageEntryModel.updateEuphemisticContent.mockResolvedValue();
});

describe('submitEntry', () => {
  it('attaches the AI category and dual-version content on success', async () => {
    const { entry } = await submitEntry({ userId: 7, title: BASE_ENTRY.title, rawContent: BASE_ENTRY.raw_content });
    expect(entry.category_auto).toBe('Legend');
    expect(entry.euphemistic_content).toMatch(/shapeshifter/);
    expect(heritageEntryModel.updateCategoryAuto).toHaveBeenCalledWith(1, 'Legend');
    expect(heritageEntryModel.updateEuphemisticContent).toHaveBeenCalledWith(1, expect.any(String));
  });

  it('still returns the entry if AI categorization fails (fail-soft)', async () => {
    geminiService.categorizeContent.mockRejectedValue(new Error('rate limited'));
    const { entry } = await submitEntry({ userId: 7, title: BASE_ENTRY.title, rawContent: BASE_ENTRY.raw_content });
    expect(entry.id).toBe(1);
    expect(entry.category_auto).toBeUndefined();
    expect(heritageEntryModel.updateEuphemisticContent).toHaveBeenCalled();
  });

  it('still returns the entry if dual-version generation fails (fail-soft)', async () => {
    geminiService.generateEuphemisticVersion.mockRejectedValue(new Error('timeout'));
    const { entry } = await submitEntry({ userId: 7, title: BASE_ENTRY.title, rawContent: BASE_ENTRY.raw_content });
    expect(entry.id).toBe(1);
    expect(entry.euphemistic_content).toBeUndefined();
    expect(heritageEntryModel.updateCategoryAuto).toHaveBeenCalled();
  });

  it('surfaces possible duplicates without blocking submission', async () => {
    duplicateDetectionService.findPossibleDuplicates.mockResolvedValue([
      { id: 99, title: 'The Aswang of San Isidoro', score: 0.9 },
    ]);
    const { entry, possibleDuplicates } = await submitEntry({
      userId: 7, title: BASE_ENTRY.title, rawContent: BASE_ENTRY.raw_content,
    });
    expect(entry.id).toBe(1);
    expect(possibleDuplicates).toHaveLength(1);
    expect(possibleDuplicates[0].id).toBe(99);
  });
});