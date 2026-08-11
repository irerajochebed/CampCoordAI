import { useState, useEffect } from 'react';
import { Building, MapPin, Home, PlusCircle, CheckCircle2, Lock } from 'lucide-react';
import { organizationApi } from '../../api';
import { useTranslation } from '../../contexts/LanguageContext';

export default function OrganizationUnitSelector({
  value = {},
  onChange,
  error,
  required = false
}) {
  const { t } = useTranslation();
  const [unions, setUnions] = useState([]);
  const [selectedUnionId, setSelectedUnionId] = useState('');

  const [fields, setFields] = useState([]);
  const [selectedFieldId, setSelectedFieldId] = useState('');
  const [loadingFields, setLoadingFields] = useState(false);

  const [districts, setDistricts] = useState([]);
  const [selectedDistrictId, setSelectedDistrictId] = useState('');
  const [loadingDistricts, setLoadingDistricts] = useState(false);

  const [churches, setChurches] = useState([]);
  const [selectedChurchId, setSelectedChurchId] = useState('');
  const [loadingChurches, setLoadingChurches] = useState(false);

  const [customChurchName, setCustomChurchName] = useState(value.customChurchName || '');

  // Initial Load: Fetch Union & Fields
  useEffect(() => {
    let isMounted = true;
    setLoadingFields(true);

    const initLoad = async () => {
      try {
        let fetchedFields = [];
        let fetchedUnionId = null;

        // 1. Try getting top-level Union via getChildren()
        const unionRes = await organizationApi.getChildren().catch(() => null);
        const unionData = unionRes?.data?.data || [];
        
        if (unionData.length > 0) {
          if (isMounted) setUnions(unionData);
          fetchedUnionId = unionData[0].id;
          if (isMounted) setSelectedUnionId(fetchedUnionId);

          // Fetch fields under Union
          const fieldRes = await organizationApi.getChildren(fetchedUnionId).catch(() => null);
          fetchedFields = fieldRes?.data?.data || [];
        }

        // 2. Fallback: If no fields returned by parentId, fetch level FIELD directly
        if (!fetchedFields || fetchedFields.length === 0) {
          const levelRes = await organizationApi.getByLevel('FIELD').catch(() => null);
          fetchedFields = levelRes?.data?.data || [];
        }

        // 3. Fallback: If still empty, fetch all and filter level FIELD
        if (!fetchedFields || fetchedFields.length === 0) {
          const allRes = await organizationApi.getAll().catch(() => null);
          const allData = allRes?.data?.data || [];
          fetchedFields = allData.filter(u => u.level === 'FIELD');
        }

        if (isMounted) {
          setFields(fetchedFields);
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

  // Fetch Districts when Field changes
  const handleFieldChange = async (e) => {
    const fieldId = e.target.value;
    setSelectedFieldId(fieldId);
    setSelectedDistrictId('');
    setDistricts([]);
    setSelectedChurchId('');
    setChurches([]);
    setCustomChurchName('');
    notifyParent('', '', '');

    if (!fieldId) return;

    setLoadingDistricts(true);
    try {
      let fetchedDistricts = [];
      const res = await organizationApi.getChildren(fieldId).catch(() => null);
      fetchedDistricts = res?.data?.data || [];

      // Fallback if empty: fetch by level DISTRICT and filter parentId
      if (!fetchedDistricts || fetchedDistricts.length === 0) {
        const levelRes = await organizationApi.getByLevel('DISTRICT').catch(() => null);
        const levelData = levelRes?.data?.data || [];
        fetchedDistricts = levelData.filter(d => String(d.parentId) === String(fieldId));
        if (fetchedDistricts.length === 0 && levelData.length > 0) {
          fetchedDistricts = levelData;
        }
      }

      setDistricts(fetchedDistricts);
    } catch (err) {
      console.error('Failed to load Districts', err);
    } finally {
      setLoadingDistricts(false);
    }
  };

  // Fetch Churches when District changes
  const handleDistrictChange = async (e) => {
    const districtId = e.target.value;
    setSelectedDistrictId(districtId);
    setSelectedChurchId('');
    setChurches([]);
    setCustomChurchName('');
    notifyParent('', districtId, '');

    if (!districtId) return;

    setLoadingChurches(true);
    try {
      let fetchedChurches = [];
      const res = await organizationApi.getChildren(districtId).catch(() => null);
      fetchedChurches = res?.data?.data || [];

      if (!fetchedChurches || fetchedChurches.length === 0) {
        const levelRes = await organizationApi.getByLevel('CHURCH').catch(() => null);
        const levelData = levelRes?.data?.data || [];
        fetchedChurches = levelData.filter(c => String(c.parentId) === String(districtId));
      }

      setChurches(fetchedChurches);
    } catch (err) {
      console.error('Failed to load Churches', err);
    } finally {
      setLoadingChurches(false);
    }
  };

  // Handle Church Selection (including "OTHER")
  const handleChurchChange = (e) => {
    const churchId = e.target.value;
    setSelectedChurchId(churchId);

    if (churchId === 'OTHER') {
      notifyParent('', selectedDistrictId, customChurchName);
    } else if (churchId) {
      setCustomChurchName('');
      notifyParent(churchId, selectedDistrictId, '');
    } else {
      setCustomChurchName('');
      notifyParent('', selectedDistrictId, '');
    }
  };

  // Handle Manual Custom Church Input
  const handleCustomChurchInput = (e) => {
    const name = e.target.value;
    setCustomChurchName(name);
    if (selectedChurchId === 'OTHER') {
      notifyParent('', selectedDistrictId, name);
    }
  };

  // Notify parent form of value updates
  const notifyParent = (orgUnitId, distId, customName) => {
    if (onChange) {
      onChange({
        organizationUnitId: orgUnitId,
        districtId: distId,
        customChurchName: customName
      });
    }
  };

  const selectedUnion = unions.find((u) => u.id === selectedUnionId) || { name: 'Rwanda Union Mission' };

  return (
    <div className="space-y-4 rounded-xl border border-gray-200 bg-gray-50/50 p-4 sm:p-5 shadow-sm">
      <div className="flex items-center justify-between pb-2 border-b border-gray-200">
        <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
          <Building className="w-4 h-4 text-primary-600" />
          {t('orgSelector.title', 'Organizational Hierarchy (Rwanda Network)')}
        </h3>
        <span className="text-xs font-medium text-gray-500 flex items-center gap-1">
          <Lock className="w-3 h-3" /> {t('orgSelector.preSeededNote', 'Pre-seeded RUM Network')}
        </span>
      </div>

      {/* Step 1: Select Union (Locked/Default to Rwanda Union Mission) */}
      <div>
        <label className="block text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1">
          {t('orgSelector.step1Union', 'Step 1: Union')} <span className="text-xs text-gray-400 font-normal">{t('orgSelector.step1Note', '(Official / Locked)')}</span>
        </label>
        <div className="relative">
          <input
            type="text"
            readOnly
            value={selectedUnion.name || 'Rwanda Union Mission'}
            className="w-full pl-9 pr-8 py-2 text-sm bg-gray-100 border border-gray-300 rounded-lg text-gray-700 font-medium cursor-not-allowed shadow-inner"
          />
          <Building className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
          <Lock className="w-4 h-4 text-gray-400 absolute right-3 top-2.5" />
        </div>
      </div>

      {/* Step 2: Select Field */}
      <div>
        <label className="block text-xs font-semibold text-gray-700 mb-1">
          {t('orgSelector.step2Field', 'Step 2: Conference / Field')} {required && <span className="text-red-500">*</span>}
        </label>
        <div className="relative">
          <select
            value={selectedFieldId}
            onChange={handleFieldChange}
            disabled={loadingFields || fields.length === 0}
            className="w-full pl-9 pr-8 py-2 text-sm bg-white border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-100 disabled:text-gray-400 shadow-sm font-medium"
          >
            <option value="">
              {loadingFields ? t('common.loading', 'Loading Fields...') : fields.length === 0 ? 'No Fields Available' : t('orgSelector.step2Placeholder', '-- Select Field / Conference --')}
            </option>
            {fields.map((field) => (
              <option key={field.id} value={field.id}>
                {field.name} {field.code ? `(${field.code})` : ''}
              </option>
            ))}
          </select>
          <MapPin className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
        </div>
      </div>

      {/* Step 3: Select District */}
      <div>
        <label className="block text-xs font-semibold text-gray-700 mb-1">
          {t('orgSelector.step3District', 'Step 3: District')} {required && <span className="text-red-500">*</span>}
        </label>
        <div className="relative">
          <select
            value={selectedDistrictId}
            onChange={handleDistrictChange}
            disabled={!selectedFieldId || loadingDistricts}
            className="w-full pl-9 pr-8 py-2 text-sm bg-white border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-100 disabled:text-gray-400 shadow-sm font-medium"
          >
            <option value="">
              {!selectedFieldId
                ? t('orgSelector.step3SelectFieldFirst', '-- Select Field First --')
                : loadingDistricts
                ? t('common.loading', 'Loading Districts...')
                : districts.length === 0
                ? 'No Districts Found for Field'
                : t('orgSelector.step3Placeholder', '-- Select District --')}
            </option>
            {districts.map((district) => (
              <option key={district.id} value={district.id}>
                {district.name} {district.code ? `(${district.code})` : ''}
              </option>
            ))}
          </select>
          <MapPin className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
        </div>
      </div>

      {/* Step 4: Select Local Church */}
      <div>
        <label className="block text-xs font-semibold text-gray-700 mb-1">
          {t('orgSelector.step4Church', 'Step 4: Local Church')} {required && <span className="text-red-500">*</span>}
        </label>
        <div className="relative">
          <select
            value={selectedChurchId}
            onChange={handleChurchChange}
            disabled={!selectedDistrictId || loadingChurches}
            className="w-full pl-9 pr-8 py-2 text-sm bg-white border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-100 disabled:text-gray-400 shadow-sm font-medium"
          >
            <option value="">
              {!selectedDistrictId
                ? t('orgSelector.step4SelectDistrictFirst', '-- Select District First --')
                : loadingChurches
                ? t('common.loading', 'Loading Churches...')
                : t('orgSelector.step4Placeholder', '-- Select Local Church --')}
            </option>
            {churches.map((church) => (
              <option key={church.id} value={church.id}>
                {church.name} {church.isCustom ? ' (Community Added)' : ''}
              </option>
            ))}
            {selectedDistrictId && (
              <option value="OTHER" className="font-semibold text-primary-700 bg-primary-50">
                {t('orgSelector.otherChurchOption', '+ Other (Type My Church Name)')}
              </option>
            )}
          </select>
          <Home className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
        </div>
      </div>

      {/* Step 5: Conditional Text Input when "OTHER" is selected */}
      {selectedChurchId === 'OTHER' && (
        <div className="pt-2 animate-fadeIn">
          <label className="block text-xs font-semibold text-primary-700 mb-1 flex items-center gap-1">
            <PlusCircle className="w-4 h-4 text-primary-600" />
            {t('orgSelector.step5CustomChurchLabel', 'Enter your Local Church Name')} {required && <span className="text-red-500">*</span>}
          </label>
          <div className="relative">
            <input
              type="text"
              value={customChurchName}
              onChange={handleCustomChurchInput}
              placeholder={t('orgSelector.step5CustomChurchPlaceholder', 'Type official name of your SDA Church...')}
              className="w-full pl-9 pr-4 py-2 text-sm bg-white border-2 border-primary-500 rounded-lg text-gray-900 focus:ring-2 focus:ring-primary-500 focus:border-primary-600 shadow-md font-medium"
              required={required}
            />
            <Home className="w-4 h-4 text-primary-500 absolute left-3 top-3" />
          </div>
          <p className="mt-1 text-xs text-gray-500 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
            {t('orgSelector.step5CustomChurchHelp', 'This church will be saved under the selected district so future members can select it.')}
          </p>
        </div>
      )}

      {/* Validation Error Message */}
      {error && (
        <p className="mt-1 text-xs font-medium text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
