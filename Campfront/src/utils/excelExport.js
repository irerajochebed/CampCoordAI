import * as XLSX from 'xlsx';

/**
 * Exports a comprehensive, beautifully structured Excel workbook (.xlsx)
 * for CampCoordAI Readiness Assessment and Logistics Forecast.
 */
export function exportReadinessAuditToExcel({
  currentAssessment,
  aiData,
  simulationResult,
  user,
  t = (k, f) => f || k
}) {
  const wb = XLSX.utils.book_new();
  const eventName = currentAssessment?.eventName || 'All_Events';
  const timestamp = new Date().toISOString().split('T')[0];
  const dateFormatted = new Date().toLocaleString();
  const auditorName = user?.name || user?.email || 'Camp Administrator';

  // ==========================================
  // SHEET 1: Operational Readiness Audit
  // ==========================================
  const score = currentAssessment?.overallReadinessScore || 0;
  const classification = score >= 85 
    ? 'OPTIMAL READINESS (Meets all benchmarks)' 
    : score >= 65 
    ? 'MODERATE SHORTFALL RISK (Attention required)' 
    : 'CRITICAL LOGISTICAL RISK (Immediate intervention needed)';

  const auditSheetRows = [
    ['RWANDA UNION MISSION - SEVENTH-DAY ADVENTIST CHURCH'],
    ['CAMPCOORDAI - PRE-CAMP OPERATIONAL READINESS AUDIT DOSSIER'],
    [],
    ['AUDIT METADATA', ''],
    ['Event / Camp Name:', currentAssessment?.eventName || 'General Scope'],
    ['Administrative Field / Conference:', currentAssessment?.fieldName || 'Union Mission Wide'],
    ['Host Venue & Location:', currentAssessment?.venue || 'TBD'],
    ['Scheduled Dates:', `${currentAssessment?.startDate || 'N/A'} to ${currentAssessment?.endDate || 'N/A'}`],
    ['Milestone Timeline:', currentAssessment?.daysUntilStart ? `T-${currentAssessment.daysUntilStart} Days before start` : 'In Progress'],
    ['Generated On:', dateFormatted],
    ['Auditing Officer:', auditorName],
    [],
    ['OVERALL READINESS EVALUATION', ''],
    ['Readiness Health Score:', `${score} / 100 Points`],
    ['Operational Classification:', classification],
    [],
    ['5 CORE READINESS CRITERIA BREAKDOWN (Target: 20 Points Each)', '', '', '', ''],
    ['Pillar / Criteria', 'Score (/20)', 'Target', 'Current Metric / Telemetry', 'Logistical Status / Diagnostic Context'],
    [
      '1. Registration Trajectory',
      currentAssessment?.registrationScore ?? 0,
      20,
      `${currentAssessment?.currentRegistrations ?? 0} / ${currentAssessment?.expectedParticipants ?? 0} registered`,
      (currentAssessment?.registrationScore ?? 0) >= 16 ? 'Optimal trajectory' : 'Below target pace'
    ],
    [
      '2. Lodging & Dorm Capacity',
      currentAssessment?.lodgingScore ?? 0,
      20,
      `${currentAssessment?.totalBedCapacity ?? 0} beds vs ${currentAssessment?.projectedBedDemand ?? 0} needed`,
      (currentAssessment?.lodgingScore ?? 0) >= 16 ? 'Adequate capacity' : 'Lodging shortfall detected'
    ],
    [
      '3. Financial & MoMo Inflow',
      currentAssessment?.financeScore ?? 0,
      20,
      `${Number(currentAssessment?.collectedRevenue || 0).toLocaleString()} RWF verified collections`,
      (currentAssessment?.financeScore ?? 0) >= 16 ? 'Healthy cashflow' : 'Pending fee collections'
    ],
    [
      '4. A/V Sound & Tech Allocation',
      currentAssessment?.resourcesScore ?? 0,
      20,
      `${currentAssessment?.allocatedSoundSystems ?? 0} / ${currentAssessment?.requiredSoundSystems ?? 0} Sound Systems allocated`,
      (currentAssessment?.resourcesScore ?? 0) >= 16 ? 'Equipped' : 'Hardware conflict / shortfall'
    ],
    [
      '5. Program & Keynote Speakers',
      currentAssessment?.programScore ?? 0,
      20,
      `${currentAssessment?.confirmedSessions ?? 0} / ${currentAssessment?.totalSessions ?? 0} sessions confirmed (${currentAssessment?.unassignedSpeakersCount ?? 0} pending speakers)`,
      (currentAssessment?.programScore ?? 0) >= 16 ? 'Program finalized' : 'Sessions awaiting confirmation'
    ],
    [],
    ['IDENTIFIED PREPARATION SHORTFALLS & RISK FLAGS', '', '', '', ''],
    ['Severity', 'Category', 'Flagged Issue Title', 'Operational Details', 'Diagnostic Code']
  ];

  if (currentAssessment?.warnings && currentAssessment.warnings.length > 0) {
    currentAssessment.warnings.forEach((w) => {
      auditSheetRows.push([
        w.severity || 'MEDIUM',
        w.category || 'LOGISTICS',
        w.title || 'Logistical Warning',
        w.details || '',
        w.code || 'WARN-01'
      ]);
    });
  } else {
    auditSheetRows.push([
      'OPTIMAL',
      'GENERAL',
      'No critical preparation bottlenecks detected',
      'All 5 readiness pillars meet historical benchmarks.',
      'PASS'
    ]);
  }

  auditSheetRows.push([]);
  auditSheetRows.push(['RECOMMENDED MITIGATION ACTIONS & DIRECTIVES', '', '', '']);
  auditSheetRows.push(['Target Stakeholder / Role', 'Recommended Action Title', 'Action Directive & Instructions', 'Action Code']);

  if (currentAssessment?.recommendations && currentAssessment.recommendations.length > 0) {
    currentAssessment.recommendations.forEach((rec) => {
      auditSheetRows.push([
        rec.targetRole?.replace(/_/g, ' ') || 'CAMP_DIRECTOR',
        rec.actionTitle || 'Operational Directive',
        rec.suggestedAction || '',
        rec.actionType || 'NOTIFY'
      ]);
    });
  } else {
    auditSheetRows.push([
      'COORDINATORS',
      'Maintain Standard Protocol',
      'Continue regular monitoring and verify incoming participant registrations.',
      'MAINTAIN'
    ]);
  }

  const wsAudit = XLSX.utils.aoa_to_sheet(auditSheetRows);
  wsAudit['!cols'] = [
    { wch: 32 },
    { wch: 18 },
    { wch: 38 },
    { wch: 45 },
    { wch: 25 }
  ];
  XLSX.utils.book_append_sheet(wb, wsAudit, 'Readiness Audit');

  // ==========================================
  // SHEET 2: Macro Logistics & Forecasts
  // ==========================================
  const forecastSheetRows = [
    ['RWANDA UNION MISSION - CAMP MANAGEMENT SYSTEM'],
    ['LOGISTICS TELEMETRY & PREDICTIVE FORECASTING MODEL'],
    [],
    ['REPORT METRICS', ''],
    ['Generated On:', dateFormatted],
    ['Scope:', 'All Union Tracked Campgrounds'],
    [],
    ['HISTORICAL TELEMETRY & ATTENDANCE DATA', ''],
    ['Total Events Monitored:', aiData?.totalEvents ?? 0],
    ['Completed Historical Events:', aiData?.completedEventsCount ?? 0],
    ['Upcoming Pipeline Events:', aiData?.upcomingEventsCount ?? 0],
    ['Total Registrations Recorded:', aiData?.totalRegistrations ?? 0],
    ['Confirmed Registrations:', aiData?.totalConfirmedRegistrations ?? 0],
    ['Historical Turnout Conversion Rate:', `${aiData?.predictedTurnoutRate ?? 0}%`],
    ['Model Confidence Score:', `${aiData?.turnoutConfidenceScore ?? 0}%`],
    ['Total Verified Revenue Inflow:', `${Number(aiData?.totalVerifiedRevenue || 0).toLocaleString()} RWF`],
    ['Total Registration Revenue Volume:', `${Number(aiData?.totalRevenue || 0).toLocaleString()} RWF`],
    ['Campus Lodging Bed Capacity:', aiData?.totalBedCapacity ?? 0],
    ['Occupied Beds:', aiData?.totalOccupiedBeds ?? 0],
    ['Campus Lodging Occupancy Rate:', `${aiData?.overallOccupancyRate ?? 0}%`],
    ['Total Logistics Resources Cataloged:', aiData?.totalResources ?? 0],
    ['Allocated Resources in Field:', aiData?.totalAllocatedResources ?? 0],
    [],
    ['ACTIVE LOGISTICS SIMULATION SCENARIO', ''],
    ['Target Participant Capacity:', simulationResult?.simParticipants || (aiData?.defaultEventMaxParticipants ?? 100)],
    ['Registration Fee per Attendee:', `${Number(simulationResult?.simFee || 25000).toLocaleString()} RWF`],
    ['Projected Attendees (Turnout Model):', simulationResult?.projectedAttendees ?? 0],
    ['Projected Gross Revenue Inflow:', `${Number(simulationResult?.projectedRevenue || 0).toLocaleString()} RWF`],
    ['Required Lodging Beds:', simulationResult?.bedsRequired ?? 0],
    ['Available Bed Capacity:', simulationResult?.availableBeds ?? 0],
    ['Lodging Bed Deficit:', simulationResult?.bedDeficit ?? 0],
    ['Required Sound Systems:', simulationResult?.soundSystemsNeeded ?? 1],
    ['Required Projectors:', simulationResult?.projectorsNeeded ?? 1],
    ['Capacity Risk Classification:', simulationResult?.riskTitle || 'Optimal Capacity']
  ];

  const wsForecast = XLSX.utils.aoa_to_sheet(forecastSheetRows);
  wsForecast['!cols'] = [
    { wch: 38 },
    { wch: 32 }
  ];
  XLSX.utils.book_append_sheet(wb, wsForecast, 'Logistics Forecast');

  // Trigger Excel file download
  const cleanName = eventName.replace(/[^a-zA-Z0-9_-]/g, '_');
  const filename = `CampCoordAI_Readiness_Audit_${cleanName}_${timestamp}.xlsx`;
  XLSX.writeFile(wb, filename);

  return filename;
}
