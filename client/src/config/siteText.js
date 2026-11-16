export const SITE_TEXT = {
  regionLabel: 'Bicol, Philippines',
  provinceName: 'Camarines Sur',
  regionName: 'Bicol',
  aboutIntroduction:
    'Palagunitaan documents and preserves Philippine folklore and intangible cultural heritage, beginning with stories from Camarines Sur in Bicol.',
  mapDescription: 'Map of heritage locations in Camarines Sur',
  mapIntroduction: 'Stories and heritage sites across Camarines Sur and the Bicol Region.',
  browseIntroduction: 'Explore published folklore and cultural heritage entries from the Bicol Region.',
  blogIntroduction:
    'Notes, reflections, and stories from the people documenting and preserving Bicol’s living heritage.',
  dashboardNote: 'Document and share the living heritage of Bicol.',
  footerArchiveDescription:
    'A cultural heritage information system for documenting, validating, and preserving Philippine regional folklore and intangible cultural heritage. Piloted in Camarines Sur, Bicol Region.',
  footerContributionDescription: 'Help preserve Bicolano folklore for future generations.',
};

export const ARCHIVE_PREVIEW = {
  stampBrand: 'PALAGUNITAAN',
  stampType: 'FIELD RECORD',
  stampNumber: '019',
  kicker: 'Field notes · oral tradition',
  title: 'A mountain remembered at dusk',
  quote:
    '“As evening settled, the elders spoke of the mountain as a presence—known by name, watched over, and spoken of with care.”',
  note: 'A story is held not only in its words, but in the voices and places that carry it.',
  sourceType: 'Oral tradition',
  previewLabel: 'Archive Preview',
  publishedLabel: 'Published Record',
  sampleFooter: `${SITE_TEXT.provinceName} · Oral Tradition · Archive Preview`,
};

export const SITE_REGIONS = [
  { name: 'Naga City', area: SITE_TEXT.provinceName },
  { name: SITE_TEXT.provinceName, area: `${SITE_TEXT.regionName} Region` },
  { name: 'Pili', area: SITE_TEXT.provinceName },
  { name: 'Iriga City', area: SITE_TEXT.provinceName },
];
