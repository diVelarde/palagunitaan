import { useEffect, useState } from 'react';
import { validateImageFile } from '../utils/mediaValidation';
import CoverImagePicker from '../components/CoverImagePicker';
import heritageService from '../services/heritageService';
import mapService from '../services/mapService';
import HistoricalPeriodSelector from '../components/HistoricalPeriodSelector';
import './SubmitEntryPage.css';

const SOURCE_TYPES = ['Oral interview', 'Personal account', 'Archival text', 'Other'];

function validate({ title, rawContent, historyClaims }) {
  const errors = {};
  if (!title.trim()) errors.title = 'Title is required.';
  else if (title.length > 255) errors.title = 'Title must be 255 characters or fewer.';

  if (!rawContent.trim()) errors.rawContent = 'This field is required.';
  else if (rawContent.trim().length < 20) errors.rawContent = 'Please write at least 20 characters.';

  if (historyClaims.length > 20) errors.historyClaims = 'You can add up to 20 source claims.';
  else if (historyClaims.some((claim) => !claim.claimedYear || !claim.sourceDescription.trim())) {
    errors.historyClaims = 'Each source claim needs a claimed origin year and source description.';
  }

  return errors;
}

const EMPTY_FORM = {
  title: '', rawContent: '', sourceType: SOURCE_TYPES[0],
  sourceDescription: '', historicalPeriod: '', category: '',
  regionId: '', locationName: '', latitude: '', longitude: '',
  historyClaims: [],
};

function describeAi(ai) {
  if (!ai) return null;
  if (!ai.aiConfigured) {
    return 'The AI service is not configured on the server, so this entry was saved without a category or a plain-language version.';
  }
  const bits = [];
  if (ai.category) bits.push(`categorized as “${ai.category}”`);
  if (ai.euphemistic) bits.push('a plain-language version was generated');
  if (bits.length) return `AI ${bits.join(', and ')}.`;
  if (ai.errors?.length) {
    return 'The AI could not finish for this entry — it was saved anyway. You can retry from My Submissions.';
  }
  return null;
}

export default function SubmitEntryPage({
  onSubmit = async (data) => console.log('submit', data),
  uploadCoverImage = async () => null,
  fetchCategories = heritageService.getCategories,
  fetchRegions = mapService.getRegions,
  embedded = false,
  onSubmitted = () => {},
}) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  const [categories, setCategories] = useState([]);
  const [categoriesError, setCategoriesError] = useState('');
  const [regions, setRegions] = useState([]);
  const [regionsError, setRegionsError] = useState('');
  const [gettingLocation, setGettingLocation] = useState(false);
  const [locationMessage, setLocationMessage] = useState('');

  const [coverImage, setCoverImage] = useState(null);
  const [coverError, setCoverError] = useState(null);
  const [coverWarning, setCoverWarning] = useState(null);

  useEffect(() => {
    let active = true;
    fetchCategories()
      .then((list) => {
        if (active) {
          setCategories(list || []);
          setCategoriesError('');
        }
      })
      .catch((err) => {
        if (active) {
          setCategoriesError(err.response?.data?.message || 'Could not load categories. You can still submit without selecting one.');
        }
      });
    return () => { active = false; };
  }, [fetchCategories]);

  useEffect(() => {
    let active = true;
    fetchRegions()
      .then((list) => {
        if (active) setRegions(list || []);
      })
      .catch((err) => {
        if (active) {
          setRegionsError(err.response?.data?.message || 'Could not load regions. You can still submit without selecting one.');
        }
      });
    return () => {
      active = false;
    };
  }, [fetchRegions]);

  const field = (key) => ({
    value: form[key],
    onChange: (e) => setForm((f) => ({ ...f, [key]: e.target.value })),
  });

  function handleCoverSelect(file) {
    const problem = validateImageFile(file);
    setCoverError(problem);
    if (!problem) setCoverImage(file);
  }

  function useCurrentLocation() {
    setLocationMessage('');
    if (!navigator.geolocation) {
      setLocationMessage('Location is not available in this browser. You can enter coordinates manually.');
      return;
    }

    setGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setForm((current) => ({
          ...current,
          latitude: coords.latitude.toFixed(6),
          longitude: coords.longitude.toFixed(6),
        }));
        setLocationMessage('Current coordinates added. Confirm they point to the heritage location before submitting.');
        setGettingLocation(false);
      },
      (error) => {
        const message = error.code === error.PERMISSION_DENIED
          ? 'Location permission was denied. Enter the coordinates manually if you still want to add a map pin.'
          : error.code === error.TIMEOUT
            ? 'Could not determine your location in time. Try again or enter coordinates manually.'
            : 'Could not determine your location. Enter coordinates manually instead.';
        setLocationMessage(message);
        setGettingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 }
    );
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const fieldErrors = validate(form);
    setErrors(fieldErrors);
    if (Object.keys(fieldErrors).length) return;

    setSubmitting(true);
    setCoverWarning(null);
    try {
      const payload = {
        ...form,
        category: form.category || undefined,
        regionId: form.regionId ? Number(form.regionId) : undefined,
        latitude: form.latitude === '' ? undefined : Number(form.latitude),
        longitude: form.longitude === '' ? undefined : Number(form.longitude),
        historyClaims: form.historyClaims.map((claim) => ({
          ...claim,
          claimedYear: Number(claim.claimedYear),
          sourceYear: claim.sourceYear ? Number(claim.sourceYear) : null,
          sourceDescription: claim.sourceDescription.trim(),
          sourceUrl: claim.sourceUrl.trim() || null,
        })),
      };
      const res = await onSubmit(payload);
      setResult(res || null);
      if (res?.locationWarning) setLocationMessage(res.locationWarning);

      const createdEntry = res && res.entry;
      if (coverImage && createdEntry && createdEntry.id) {
        try {
          await uploadCoverImage(createdEntry.id, coverImage);
        } catch (err) {
          setCoverWarning(
            err.response?.data?.message ||
              'Your entry was submitted, but the photo could not be uploaded. You can add it later from My Submissions.'
          );
        }
      }

      setForm(EMPTY_FORM);
      setCoverImage(null);
      setCoverError(null);
      onSubmitted();
    } catch (err) {
      setErrors({
        form: err.response?.data?.message || err.message || 'Something went wrong. Please try again.',
      });
    } finally {
      setSubmitting(false);
    }
  }

  const aiSummary = result ? describeAi(result.ai) : null;

  return (
    <div className={embedded ? 'submit-entry-embedded' : 'submit-entry-page'}>
    <header className={`submit-entry-heading ${embedded ? 'submit-entry-heading-embedded' : ''}`}>
      <p className="submit-entry-eyebrow">Contribute to the archive</p>
      <h1>Submit Heritage Entry</h1>
      <p>Share a piece of cultural heritage. Your submission will be AI-processed and reviewed by validators before publication.</p>
    </header>

      {result?.possibleDuplicates?.length > 0 && (
        <div className="submit-entry-notice submit-entry-notice-warning">
          Your entry was submitted, but it looks similar to {result.possibleDuplicates.length} existing{' '}
          {result.possibleDuplicates.length === 1 ? 'entry' : 'entries'}. A validator will check for overlap.
        </div>
      )}
      {result && !result.possibleDuplicates?.length && (
        <div className="submit-entry-notice submit-entry-notice-success">
          Submitted — thank you. You can track its status from your dashboard.
        </div>
      )}

      {aiSummary && (
        <div
          className={`submit-entry-notice mb-6 ${
            result?.ai?.aiConfigured
              ? 'submit-entry-notice-info'
              : 'submit-entry-notice-warning'
          }`}
        >
          <p>{aiSummary}</p>
          {result?.entry?.category_auto && (
            <p className="mt-2 text-xs">
              <span className="uppercase tracking-wide font-medium">Category:</span>{' '}
              {result.entry.category_auto}
            </p>
          )}
        </div>
      )}

      {coverWarning && (
        <div className="submit-entry-notice submit-entry-notice-warning">
          {coverWarning}
        </div>
      )}
      {locationMessage && (
        <div className={`submit-entry-notice ${result?.locationWarning ? 'submit-entry-notice-warning' : 'submit-entry-notice-info'}`} role="status">
          {locationMessage}
        </div>
      )}
      {errors.form && (
        <div className="submit-entry-notice submit-entry-notice-error" role="alert">
          {errors.form}
        </div>
      )}

      {regionsError && <div className="submit-entry-notice submit-entry-notice-warning" role="status">{regionsError}</div>}
      {categoriesError && <div className="submit-entry-notice submit-entry-notice-warning" role="status">{categoriesError}</div>}
      <form onSubmit={handleSubmit} className="submit-entry-form">
        <div>
          <label className="submit-entry-label" htmlFor="entry-title">Title <span>*</span></label>
          <input
            id="entry-title"
            type="text"
            {...field('title')}
            className="submit-entry-control"
            placeholder="e.g. The Aswang of Barangay San Isidro"
          />
          {errors.title && <p className="submit-entry-field-error">{errors.title}</p>}
        </div>

        <div>
          <label className="submit-entry-label" htmlFor="entry-content">Content <span>*</span></label>
          <textarea
            id="entry-content"
            rows={8}
            {...field('rawContent')}
            className="submit-entry-control submit-entry-textarea"
            placeholder="Describe the heritage item in detail. Write it as it was told to you, or as you remember it."
          />
          {errors.rawContent && <p className="submit-entry-field-error">{errors.rawContent}</p>}
        </div>

        <div className="submit-entry-cover">
          <CoverImagePicker
            file={coverImage}
            error={coverError}
            busy={submitting}
            onSelect={handleCoverSelect}
            onError={setCoverError}
            label="Cover Image"
            hint="Shown on the archive card and at the top of your entry."
          />
        </div>

        <div className="submit-entry-grid">
          <div>
            <label className="submit-entry-label" htmlFor="entry-category">Category</label>
            <select
              id="entry-category"
              {...field('category')}
              className="submit-entry-control"
            >
              <option value="">Select or let AI classify</option>
              {categories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <p className="submit-entry-help">Leave blank to have AI suggest a category.</p>
          </div>
          <div>
            <label className="submit-entry-label" htmlFor="entry-region">Region</label>
            <select id="entry-region" {...field('regionId')} className="submit-entry-control">
              <option value="">Select region</option>
              {regions.map((region) => (
                <option key={region.id} value={region.id}>{region.name}{region.province ? `, ${region.province}` : ''}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="submit-entry-label" htmlFor="entry-period">Historical Period</label>
            <HistoricalPeriodSelector
              id="entry-period"
              value={form.historicalPeriod}
              onChange={(historicalPeriod) => setForm((current) => ({ ...current, historicalPeriod }))}
              className="submit-entry-control"
            />
          </div>
          <div>
            <label className="submit-entry-label" htmlFor="entry-source">Source Type</label>
            <select
              id="entry-source"
              {...field('sourceType')}
              className="submit-entry-control"
            >
              <option value="">Select source</option>
              {SOURCE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="submit-entry-label" htmlFor="entry-source-notes">Source Description</label>
          <input
            id="entry-source-notes"
            type="text"
            {...field('sourceDescription')}
            className="submit-entry-control"
            placeholder="e.g., Interview with Lola Maria, 87, Naga City"
          />
        </div>

        <section className="submit-entry-history">
          <div className="submit-entry-location-heading">
            <div>
              <h2>History claims <span className="submit-entry-optional">Optional</span></h2>
              <p>Add a source for each reported origin year. Keep the claimed year separate from when the source was recorded or published.</p>
            </div>
            <button
              type="button"
              onClick={() => setForm((current) => ({
                ...current,
                historyClaims: [...current.historyClaims, {
                  claimedYear: '', sourceType: '', sourceDescription: '', sourceYear: '', sourceUrl: '',
                }],
              }))}
              disabled={form.historyClaims.length >= 20}
              className="submit-entry-location-button"
            >
              Add a claim
            </button>
          </div>
          {form.historyClaims.map((claim, index) => (
            <fieldset className="submit-entry-history-claim" key={index}>
              <legend>Source claim {index + 1}</legend>
              <div className="submit-entry-grid">
                <div>
                  <label className="submit-entry-label" htmlFor={`claim-year-${index}`}>Claimed origin year <span>*</span></label>
                  <input
                    id={`claim-year-${index}`}
                    type="number"
                    min="1"
                    max="9999"
                    value={claim.claimedYear}
                    onChange={(event) => setForm((current) => ({
                      ...current,
                      historyClaims: current.historyClaims.map((item, itemIndex) => (
                        itemIndex === index ? { ...item, claimedYear: event.target.value } : item
                      )),
                    }))}
                    className="submit-entry-control"
                    placeholder="e.g., 1960"
                  />
                </div>
                <div>
                  <label className="submit-entry-label" htmlFor={`claim-source-type-${index}`}>Source type</label>
                  <select
                    id={`claim-source-type-${index}`}
                    value={claim.sourceType}
                    onChange={(event) => setForm((current) => ({
                      ...current,
                      historyClaims: current.historyClaims.map((item, itemIndex) => (
                        itemIndex === index ? { ...item, sourceType: event.target.value } : item
                      )),
                    }))}
                    className="submit-entry-control"
                  >
                    <option value="">Select source</option>
                    {SOURCE_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
                  </select>
                </div>
                <div>
                  <label className="submit-entry-label" htmlFor={`claim-source-year-${index}`}>Source recorded/published year</label>
                  <input
                    id={`claim-source-year-${index}`}
                    type="number"
                    min="1"
                    max="9999"
                    value={claim.sourceYear}
                    onChange={(event) => setForm((current) => ({
                      ...current,
                      historyClaims: current.historyClaims.map((item, itemIndex) => (
                        itemIndex === index ? { ...item, sourceYear: event.target.value } : item
                      )),
                    }))}
                    className="submit-entry-control"
                    placeholder="Optional"
                  />
                </div>
                <div>
                  <label className="submit-entry-label" htmlFor={`claim-source-url-${index}`}>Source link</label>
                  <input
                    id={`claim-source-url-${index}`}
                    type="url"
                    value={claim.sourceUrl}
                    onChange={(event) => setForm((current) => ({
                      ...current,
                      historyClaims: current.historyClaims.map((item, itemIndex) => (
                        itemIndex === index ? { ...item, sourceUrl: event.target.value } : item
                      )),
                    }))}
                    className="submit-entry-control"
                    placeholder="https://…"
                  />
                </div>
              </div>
              <label className="submit-entry-label" htmlFor={`claim-source-description-${index}`}>Source description <span>*</span></label>
              <textarea
                id={`claim-source-description-${index}`}
                rows={2}
                value={claim.sourceDescription}
                onChange={(event) => setForm((current) => ({
                  ...current,
                  historyClaims: current.historyClaims.map((item, itemIndex) => (
                    itemIndex === index ? { ...item, sourceDescription: event.target.value } : item
                  )),
                }))}
                className="submit-entry-control"
                placeholder="Who said or recorded this, and where can it be checked?"
              />
              <button
                type="button"
                onClick={() => setForm((current) => ({
                  ...current,
                  historyClaims: current.historyClaims.filter((_, itemIndex) => itemIndex !== index),
                }))}
                className="submit-entry-history-remove"
              >
                Remove claim
              </button>
            </fieldset>
          ))}
          {errors.historyClaims && <p className="submit-entry-field-error" role="alert">{errors.historyClaims}</p>}
        </section>

        <section className="submit-entry-location">
          <div className="submit-entry-location-heading">
            <div>
              <h2>Location <span className="submit-entry-optional">Optional</span></h2>
              <p>Pin the place connected to this story. Location is only used if you choose to add it.</p>
            </div>
            <button type="button" onClick={useCurrentLocation} disabled={gettingLocation} className="submit-entry-location-button">
              {gettingLocation ? 'Finding location…' : '◎ Use current location'}
            </button>
          </div>
          <div className="submit-entry-grid">
            <div>
              <label className="submit-entry-label" htmlFor="entry-location-name">Place name</label>
              <input id="entry-location-name" type="text" {...field('locationName')} className="submit-entry-control" placeholder="e.g., Naga City" />
            </div>
            <div>
              <label className="submit-entry-label" htmlFor="entry-latitude">Latitude</label>
              <input id="entry-latitude" type="number" step="any" {...field('latitude')} className="submit-entry-control" placeholder="e.g., 13.6218" />
            </div>
            <div>
              <label className="submit-entry-label" htmlFor="entry-longitude">Longitude</label>
              <input id="entry-longitude" type="number" step="any" {...field('longitude')} className="submit-entry-control" placeholder="e.g., 123.1948" />
            </div>
          </div>
          <p className="submit-entry-help">Browser location requires your permission. Confirm the pin points to the heritage location; you can edit the coordinates.</p>
        </section>

        <button
          type="submit"
          disabled={submitting}
          className="submit-entry-submit"
        >
          {submitting ? 'Submitting…' : 'Submit entry'}
        </button>
      </form>
    </div>
  );
}
