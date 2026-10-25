import { useState, useEffect, useRef } from 'react';
import { Building, MapPin, Home, PlusCircle, CheckCircle2, Lock, Search, X, Zap, ChevronRight } from 'lucide-react';
import { organizationApi } from '../../api';
import { useTranslation } from '../../contexts/LanguageContext';

export const OFFICIAL_RUM_FIELD_CODES = ['CRF', 'ECRF', 'NRF', 'NERF', 'NWRF', 'SRF', 'SERF', 'WRF'];

export default function OrganizationUnitSelector({
  value = {},
  onChange,
  error,
  required = false,
  showChurch = true,
  showSearch = true,
  quickFilterButtons = true
}) {
  const { t } = useTranslation();
  const [unions, setUnions] = useState([]);
  const [selectedUnionId, setSelectedUnionId] = useState('');

  const [fields, setFields] = useState([]);
  const [selectedFieldId, setSelectedFieldId] = useState(value.fieldId || '');
  const [loadingFields, setLoadingFields] = useState(false);

  const [districts, setDistricts] = useState([]);
  const [selectedDistrictId, setSelectedDistrictId] = useState(value.districtId || '');
  const [loadingDistricts, setLoadingDistricts] = useState(false);

  const [churches, setChurches] = useState([]);
  const [selectedChurchId, setSelectedChurchId] = useState(value.organizationUnitId || '');
  const [loadingChurches, setLoadingChurches] = useState(false);

  const [customChurchName, setCustomChurchName] = useState(value.customChurchName || '');

  // Global Search State across Fields & Districts
  const [allDistricts, setAllDistricts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchContainerRef = useRef(null);

  // Initial Load: Fetch Union, 8 RUM Fields, and all Districts for fast search
  useEffect(() => {
    let isMounted = true;
    setLoadingFields(true);

    const initLoad = async () => {
      try {
        let fetchedFields = [];
        let fetchedUnionId = null;

        // 1. Try fetching fields from /api/v1/org-units/fields
        const fieldsApiRes = await organizationApi.getFields().catch(() => null);
        if (fieldsApiRes?.data?.data && fieldsApiRes.data.data.length > 0) {
          fetchedFields = fieldsApiRes.data.data;
        }

        // 2. Try getting top-level Union via getChildren()
        const unionRes = await organizationApi.getChildren().catch(() => null);
        const unionData = unionRes?.data?.data || [];
        
        if (unionData.length > 0) {
          if (isMounted) setUnions(unionData);
          fetchedUnionId = unionData[0].id;
          if (isMounted) setSelectedUnionId(fetchedUnionId);

          if (fetchedFields.length === 0) {
            const fieldRes = await organizationApi.getChildren(fetchedUnionId).catch(() => null);
            fetchedFields = fieldRes?.data?.data || [];
          }
        }

        // 3. Fallback: If no fields returned by parentId, fetch level FIELD directly
        if (!fetchedFields || fetchedFields.length === 0) {
          const levelRes = await organizationApi.getByLevel('FIELD').catch(() => null);
          fetchedFields = levelRes?.data?.data || [];
        }

        // 4. Fallback: If still empty, fetch all and filter level FIELD
        if (!fetchedFields || fetchedFields.length === 0) {
          const allRes = await organizationApi.getAll().catch(() => null);
          const allData = allRes?.data?.data || [];
          fetchedFields = allData.filter(u => u.level === 'FIELD');
        }

        // Filter strictly to the 8 official fields under Rwanda Union Mission per Adventist Yearbook
        fetchedFields = fetchedFields.filter(f => 
          OFFICIAL_RUM_FIELD_CODES.includes(f.code) ||
          ['central', 'east central', 'north rwanda', 'north-east', 'north-west', 'south rwanda', 'south-east', 'west rwanda'].some(n => (f.name || '').toLowerCase().includes(n))
        );

        // Deduplicate by code if any duplicates exist
        const uniqueFieldMap = new Map();
        fetchedFields.forEach(f => {
          if (!uniqueFieldMap.has(f.code || f.name)) {
            uniqueFieldMap.set(f.code || f.name, f);
          }
        });
        fetchedFields = Array.from(uniqueFieldMap.values());

        // Sort fields alphabetically
        fetchedFields.sort((a, b) => (a.name || '').localeCompare(b.name || ''));

        if (isMounted) {
          setFields(fetchedFields);
        }

        // Fetch all districts for instant cross-field search
        try {
          const distLevelRes = await organizationApi.getByLevel('DISTRICT').catch(() => null);
          const distData = distLevelRes?.data?.data || [];
          if (isMounted && Array.isArray(distData)) {
            setAllDistricts(distData);
          }
        } catch (distErr) {
          console.warn('Could not pre-load all districts for search:', distErr);
        }

        // If fieldId was provided initially, load its districts
        if (value.fieldId) {
          fetchDistrictsForField(value.fieldId, isMounted);
        }
      } catch (err) {
        console.error('Error initializing OrganizationUnitSelector:', err);
      } finally {
        if (isMounted) setLoadingFields(false);
      }
    };

    initLoad();

    return () => { isMounted = false; };
  }, []);

  // Close search suggestions on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
        setIsSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch districts strictly belonging to a specific field
  const fetchDistrictsForField = async (fieldId, isMounted = true) => {
    if (!fieldId) {
      if (isMounted) setDistricts([]);
      return [];
    }

    if (isMounted) setLoadingDistricts(true);
    try {
      let fetchedDistricts = [];
      const res = await organizationApi.getChildren(fieldId).catch(() => null);
      const children = res?.data?.data || [];

      if (children.length > 0) {
        fetchedDistricts = children.filter(d => d.level === 'DISTRICT' || !d.level || String(d.parentId) === String(fieldId));
      }

      // Fallback if empty: fetch by level DISTRICT and strictly filter by parentId === fieldId
      if (!fetchedDistricts || fetchedDistricts.length === 0) {
        const levelRes = await organizationApi.getByLevel('DISTRICT').catch(() => null);
        const levelData = levelRes?.data?.data || [];
        fetchedDistricts = levelData.filter(d => String(d.parentId) === String(fieldId));
      }

      // Strict alphabetical sorting of districts under this field only
      fetchedDistricts.sort((a, b) => (a.name || '').localeCompare(b.name || ''));

      if (isMounted) {
        setDistricts(fetchedDistricts);
      }
      return fetchedDistricts;
    } catch (err) {
      console.error('Failed to load Districts for field ' + fieldId, err);
      if (isMounted) setDistricts([]);
      return [];
    } finally {
      if (isMounted) setLoadingDistricts(false);
    }
  };

  // Fetch churches strictly belonging to a specific district
  const fetchChurchesForDistrict = async (districtId, isMounted = true) => {
    if (!districtId || !showChurch) {
      if (isMounted) setChurches([]);
      return [];
    }

    if (isMounted) setLoadingChurches(true);
    try {
      let fetchedChurches = [];
      const res = await organizationApi.getChildren(districtId).catch(() => null);
      const children = res?.data?.data || [];

      if (children.length > 0) {
        fetchedChurches = children.filter(c => c.level === 'CHURCH' || !c.level || String(c.parentId) === String(districtId));
      }

      if (!fetchedChurches || fetchedChurches.length === 0) {
        const levelRes = await organizationApi.getByLevel('CHURCH').catch(() => null);
        const levelData = levelRes?.data?.data || [];
        fetchedChurches = levelData.filter(c => String(c.parentId) === String(districtId));
      }

      fetchedChurches.sort((a, b) => (a.name || '').localeCompare(b.name || ''));

      if (isMounted) {
        setChurches(fetchedChurches);
      }
      return fetchedChurches;
    } catch (err) {
      console.error('Failed to load Churches for district ' + districtId, err);
      if (isMounted) setChurches([]);
      return [];
    } finally {
      if (isMounted) setLoadingChurches(false);
    }
  };

  // Sync external value changes if provided
  useEffect(() => {
    if (value.fieldId !== undefined && String(value.fieldId) !== String(selectedFieldId)) {
      setSelectedFieldId(value.fieldId);
      if (value.fieldId) {
        fetchDistrictsForField(value.fieldId);
      } else {
        setDistricts([]);
      }
    }
    if (value.districtId !== undefined && String(value.districtId) !== String(selectedDistrictId)) {
      setSelectedDistrictId(value.districtId);
      if (value.districtId && showChurch) {
        fetchChurchesForDistrict(value.districtId);
      } else {
        setChurches([]);
      }
    }
    if (value.organizationUnitId !== undefined && String(value.organizationUnitId) !== String(selectedChurchId)) {
      setSelectedChurchId(value.organizationUnitId);
    }
    if (value.customChurchName !== undefined && value.customChurchName !== customChurchName) {
      setCustomChurchName(value.customChurchName);
    }
  }, [value.fieldId, value.districtId, value.organizationUnitId, value.customChurchName]);

  // Select a field directly
  const selectFieldById = async (fieldId) => {
    setSelectedFieldId(fieldId);
    setSelectedDistrictId('');
    setDistricts([]);
    setSelectedChurchId('');
    setChurches([]);
    setCustomChurchName('');

    if (!fieldId) {
      notifyParent('', '', '', '');
      return;
    }

    const loadedDistricts = await fetchDistrictsForField(fieldId);
    notifyParent('', '', '', fieldId, loadedDistricts);
  };

  // Fetch Districts when Field changes from dropdown
  const handleFieldChange = async (e) => {
    const fieldId = e.target.value;
    await selectFieldById(fieldId);
  };

  // Select a district directly
  const selectDistrictById = async (districtId, parentFieldId = null) => {
    const activeFldId = parentFieldId || selectedFieldId;
    let distList = districts;

    if (parentFieldId && String(parentFieldId) !== String(selectedFieldId)) {
      setSelectedFieldId(parentFieldId);
      distList = await fetchDistrictsForField(parentFieldId);
    }

    setSelectedDistrictId(districtId);
    setSelectedChurchId('');
    setChurches([]);
    setCustomChurchName('');

    if (!showChurch) {
      notifyParent(districtId, districtId, '', activeFldId, distList);
      return;
    }

    notifyParent('', districtId, '', activeFldId, distList);

    if (districtId) {
      await fetchChurchesForDistrict(districtId);
    }
  };

  // Fetch Churches when District changes from dropdown
  const handleDistrictChange = async (e) => {
    const districtId = e.target.value;
    await selectDistrictById(districtId);
  };

  // Handle Church Selection (including "OTHER")
  const handleChurchChange = (e) => {
    const churchId = e.target.value;
    setSelectedChurchId(churchId);

    if (churchId === 'OTHER') {
      notifyParent('', selectedDistrictId, customChurchName, selectedFieldId);
    } else if (churchId) {
      setCustomChurchName('');
      notifyParent(churchId, selectedDistrictId, '', selectedFieldId);
    } else {
      setCustomChurchName('');
      notifyParent('', selectedDistrictId, '', selectedFieldId);
    }
  };

  // Handle Manual Custom Church Input
  const handleCustomChurchInput = (e) => {
    const name = e.target.value;
    setCustomChurchName(name);
    if (selectedChurchId === 'OTHER') {
      notifyParent('', selectedDistrictId, name, selectedFieldId);
    }
  };

  // Clear / Reset filter completely
  const handleResetFilter = () => {
    setSelectedFieldId('');
    setSelectedDistrictId('');
    setDistricts([]);
    setSelectedChurchId('');
    setChurches([]);
    setCustomChurchName('');
    setSearchQuery('');
    notifyParent('', '', '', '');
  };

  // Notify parent form of value updates with rich field/district objects
  const notifyParent = (orgUnitId, distId, customName, fldId, currentDistrictsList = null, currentFieldsList = null) => {
    if (onChange) {
      const activeFieldId = fldId !== undefined ? fldId : selectedFieldId;
      const fieldsList = currentFieldsList || fields;
      const districtsList = currentDistrictsList || districts;
      const fieldObj = fieldsList.find(f => String(f.id) === String(activeFieldId)) || null;
      const districtObj = districtsList.find(d => String(d.id) === String(distId)) || null;
      const churchObj = churches.find(c => String(c.id) === String(orgUnitId)) || null;

      onChange({
        organizationUnitId: orgUnitId || (!showChurch ? distId : ''),
        districtId: distId || '',
        fieldId: activeFieldId || '',
        customChurchName: customName,
        fieldName: fieldObj?.name || '',
        districtName: districtObj?.name || '',
        churchName: churchObj?.name || customName || '',
        fieldCode: fieldObj?.code || '',
        districtCode: districtObj?.code || '',
        field: fieldObj,
        district: districtObj
      });
    }
  };

  // Search Results Computation
  const searchResults = (() => {
    if (!searchQuery.trim()) return { fields: [], districts: [] };
    const q = searchQuery.toLowerCase().trim();

    const matchedFields = fields.filter(f =>
      (f.name || '').toLowerCase().includes(q) ||
      (f.code || '').toLowerCase().includes(q) ||
      (f.location || '').toLowerCase().includes(q)
    );

    const matchedDistricts = allDistricts.filter(d =>
      (d.name || '').toLowerCase().includes(q) ||
      (d.code || '').toLowerCase().includes(q) ||
      (d.location || '').toLowerCase().includes(q) ||
      (d.leader || '').toLowerCase().includes(q)
    ).slice(0, 10);

    return { fields: matchedFields, districts: matchedDistricts };
  })();

  const hasSearchResults = searchQuery.trim().length > 0 && 
    (searchResults.fields.length > 0 || searchResults.districts.length > 0);

  const selectedUnion = unions.find((u) => u.id === selectedUnionId) || { name: 'Rwanda Union Mission' };

  return (
    <div className="space-y-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-[#0E172C] p-4 sm:p-5 shadow-xs">
      <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
        <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
          <Building className="w-4 h-4 text-primary-600 dark:text-primary-400" />
          {t('orgSelector.title', 'Organizational Hierarchy (Rwanda Network)')}
        </h3>
        <span className="text-xs font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1">
          <Lock className="w-3 h-3" /> {t('orgSelector.preSeededNote', 'Pre-seeded RUM Network')}
        </span>
      </div>

      {/* Instant Search Bar across Fields and Districts */}
      {showSearch && (
        <div ref={searchContainerRef} className="relative">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsSearchFocused(true);
              }}
              onFocus={() => setIsSearchFocused(true)}
              placeholder="🔍 Quick Search Field or District (e.g. 'NRF', 'North', 'Musanze', 'Kivuye')..."
              className="w-full pl-9 pr-8 py-2 text-xs sm:text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 shadow-xs outline-none transition"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Search Suggestions Popup */}
          {isSearchFocused && hasSearchResults && (
            <div className="absolute z-50 w-full mt-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl overflow-hidden max-h-72 overflow-y-auto animate-fadeIn divide-y divide-slate-100 dark:divide-slate-800">
              {searchResults.fields.length > 0 && (
                <div className="p-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 py-1 block">
                    Conferences / Fields
                  </span>
                  {searchResults.fields.map((f) => (
                    <button
                      key={`field-${f.id}`}
                      type="button"
                      onClick={() => {
                        selectFieldById(f.id);
                        setSearchQuery('');
                        setIsSearchFocused(false);
                      }}
                      className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-primary-50 dark:hover:bg-slate-800 flex items-center justify-between transition group"
                    >
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-primary-600 group-hover:scale-110 transition" />
                        <div>
                          <p className="text-xs font-bold text-slate-800 dark:text-slate-100">
                            {f.name} {f.code ? `(${f.code})` : ''}
                          </p>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400">
                            {f.location || 'Rwanda'} {f.leader ? `• Leader: ${f.leader}` : ''}
                          </p>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary-100 dark:bg-primary-950 text-primary-700 dark:text-primary-300">
                        Select Field
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {searchResults.districts.length > 0 && (
                <div className="p-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 py-1 block">
                    Pastoral Districts
                  </span>
                  {searchResults.districts.map((d) => (
                    <button
                      key={`district-${d.id}`}
                      type="button"
                      onClick={() => {
                        selectDistrictById(d.id, d.parentId);
                        setSearchQuery('');
                        setIsSearchFocused(false);
                      }}
                      className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-emerald-50 dark:hover:bg-slate-800 flex items-center justify-between transition group"
                    >
                      <div className="flex items-center gap-2">
                        <Building className="w-4 h-4 text-emerald-600 group-hover:scale-110 transition" />
                        <div>
                          <p className="text-xs font-bold text-slate-800 dark:text-slate-100">
                            {d.name} {d.code ? `(${d.code})` : ''}
                          </p>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400">
                            {d.location || ''} {d.leader ? `• Pastor: ${d.leader}` : ''}
                          </p>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                        Select District
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Quick Field Shortcut Chips */}
      {quickFilterButtons && (
        <div className="flex items-center gap-1.5 flex-wrap pt-0.5 pb-1">
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mr-1">
            Fields:
          </span>
          {fields.map((f) => {
            const isSelected = String(selectedFieldId) === String(f.id);

            return (
              <button
                key={`btn-field-${f.id}`}
                type="button"
                onClick={() => {
                  if (isSelected) {
                    handleResetFilter();
                  } else {
                    selectFieldById(f.id);
                  }
                }}
                className={`text-xs px-2.5 py-1 rounded-md font-semibold transition flex items-center gap-1 ${
                  isSelected
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-750'
                }`}
              >
                <span>{f.code || f.name}</span>
                {isSelected && <CheckCircle2 className="w-3 h-3 ml-0.5" />}
              </button>
            );
          })}

          {(selectedFieldId || selectedDistrictId) && (
            <button
              type="button"
              onClick={handleResetFilter}
              className="text-xs px-2 py-1 rounded-md font-medium text-slate-500 hover:text-rose-600 transition flex items-center gap-1"
            >
              <X className="w-3 h-3" /> Clear
            </button>
          )}
        </div>
      )}

      {/* Step 1: Select Union (Locked/Default to Rwanda Union Mission) */}
      <div>
        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1">
          {t('orgSelector.step1Union', 'Step 1: Union')} <span className="text-xs text-slate-400 font-normal">{t('orgSelector.step1Note', '(Official / Locked)')}</span>
        </label>
        <div className="relative">
          <input
            type="text"
            readOnly
            value={selectedUnion.name || 'Rwanda Union Mission'}
            className="w-full pl-9 pr-8 py-2.5 text-sm bg-slate-100 dark:bg-slate-800/60 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-300 font-medium cursor-not-allowed shadow-inner"
          />
          <Building className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <Lock className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
        </div>
      </div>

      {/* Step 2: Select Field */}
      <div>
        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
          <span>{t('orgSelector.step2Field', 'Step 2: Conference / Field')} {required && <span className="text-rose-500">*</span>}</span>
          {selectedFieldId && (
            <span className="text-[11px] font-bold text-primary-600 dark:text-primary-400 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Field Active
            </span>
          )}
        </label>
        <div className="relative">
          <select
            value={selectedFieldId}
            onChange={handleFieldChange}
            disabled={loadingFields || fields.length === 0}
            className="w-full pl-9 pr-8 py-2.5 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-slate-100 dark:disabled:bg-slate-900 disabled:text-slate-400 shadow-xs font-medium"
          >
            <option value="" className="text-slate-500 dark:text-slate-400">
              {loadingFields ? t('common.loading', 'Loading Fields...') : fields.length === 0 ? 'No Fields Available' : t('orgSelector.step2Placeholder', '-- Select Field / Conference --')}
            </option>
            {fields.map((field) => (
              <option key={field.id} value={field.id} className="text-slate-900 dark:text-white bg-white dark:bg-slate-800 font-medium">
                {field.name} {field.code ? `(${field.code})` : ''}
              </option>
            ))}
          </select>
          <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
        </div>
      </div>

      {/* Step 3: Select District */}
      <div>
        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
          {t('orgSelector.step3District', 'Step 3: District')} {required && <span className="text-rose-500">*</span>}
        </label>
        <div className="relative">
          <select
            value={selectedDistrictId}
            onChange={handleDistrictChange}
            disabled={!selectedFieldId || loadingDistricts}
            className="w-full pl-9 pr-8 py-2.5 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-slate-100 dark:disabled:bg-slate-900 disabled:text-slate-400 shadow-xs font-medium"
          >
            <option value="" className="text-slate-500 dark:text-slate-400">
              {!selectedFieldId
                ? t('orgSelector.step3SelectFieldFirst', '-- Select Field First --')
                : loadingDistricts
                ? t('common.loading', 'Loading Districts...')
                : districts.length === 0
                ? 'No Districts Found for Field'
                : t('orgSelector.step3Placeholder', '-- Select District --')}
            </option>
            {districts.map((district) => (
              <option key={district.id} value={district.id} className="text-slate-900 dark:text-white bg-white dark:bg-slate-800">
                {district.name} {district.code ? `(${district.code})` : ''}
              </option>
            ))}
          </select>
          <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
        </div>
      </div>

      {/* Step 4: Select Local Church */}
      {showChurch && (
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            {t('orgSelector.step4Church', 'Step 4: Local Church')} {required && <span className="text-rose-500">*</span>}
          </label>
          <div className="relative">
            <select
              value={selectedChurchId}
              onChange={handleChurchChange}
              disabled={!selectedDistrictId || loadingChurches}
              className="w-full pl-9 pr-8 py-2.5 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-slate-100 dark:disabled:bg-slate-900 disabled:text-slate-400 shadow-xs font-medium"
            >
              <option value="" className="text-slate-500 dark:text-slate-400">
                {!selectedDistrictId
                  ? t('orgSelector.step4SelectDistrictFirst', '-- Select District First --')
                  : loadingChurches
                  ? t('common.loading', 'Loading Churches...')
                  : t('orgSelector.step4Placeholder', '-- Select Local Church --')}
              </option>
              {churches.map((church) => (
                <option key={church.id} value={church.id} className="text-slate-900 dark:text-white bg-white dark:bg-slate-800">
                  {church.name} {church.isCustom ? ' (Community Added)' : ''}
                </option>
              ))}
              {selectedDistrictId && (
                <option value="OTHER" className="font-semibold text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-950">
                  {t('orgSelector.otherChurchOption', '+ Other (Type My Church Name)')}
                </option>
              )}
            </select>
            <Home className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          </div>
        </div>
      )}

      {/* Step 5: Conditional Text Input when "OTHER" is selected */}
      {showChurch && selectedChurchId === 'OTHER' && (
        <div className="pt-2 animate-fadeIn">
          <label className="block text-xs font-semibold text-primary-600 dark:text-primary-400 mb-1.5 flex items-center gap-1">
            <PlusCircle className="w-4 h-4 text-primary-600 dark:text-primary-400" />
            {t('orgSelector.step5CustomChurchLabel', 'Enter your Local Church Name')} {required && <span className="text-rose-500">*</span>}
          </label>
          <div className="relative">
            <input
              type="text"
              value={customChurchName}
              onChange={handleCustomChurchInput}
              placeholder={t('orgSelector.step5CustomChurchPlaceholder', 'Type official name of your SDA Church...')}
              className="w-full pl-9 pr-4 py-2.5 text-sm bg-white dark:bg-slate-800 border-2 border-primary-500 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-600 shadow-md font-medium"
              required={required}
            />
            <Home className="w-4 h-4 text-primary-500 absolute left-3 top-3.5" />
          </div>
          <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            {t('orgSelector.step5CustomChurchHelp', 'This church will be saved under the selected district so future members can select it.')}
          </p>
        </div>
      )}

      {/* Validation Error Message */}
      {error && (
        <p className="mt-1 text-xs font-medium text-rose-600 dark:text-rose-400">
          {error}
        </p>
      )}
    </div>
  );
}

