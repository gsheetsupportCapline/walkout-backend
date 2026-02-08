const CodeCompatibility = require("../models/CodeCompatibility");
const AllowableChanges = require("../models/AllowableChanges");

/**
 * Helper function to build a composite key from Tooth+Surface (order-insensitive)
 * @param {Object} item - Item with Tooth and Surface properties
 * @returns {string} Composite key
 */
function getKey(item) {
  const t = item.Tooth || "";
  const s = item.Surface || "";
  return [t, s].sort().join("");
}

/**
 * Services for which tooth/surface mismatch should still count as match=true when service matches
 * These are typically diagnostic/preventive services that don't require specific tooth/surface
 */
const LENIENT_SERVICES = new Set([
  "D0210",
  "D0330",
  "D0220",
  "D0230",
  "D0272",
  "D0274",
  "D0120",
  "D0150",
]);

/**
 * Main function to analyze walkout data comparing Office and LC3 extracted data
 * @param {string} officeData - Office walkout extracted data (JSON string)
 * @param {string} lc3Data - LC3 walkout extracted data (JSON string)
 * @returns {Promise<Object>} Analysis result with merged matches and overall match status
 */
async function analyzeWalkoutData(officeData, lc3Data) {
  // Parse inputs
  let parsedOffice, parsedLC3;
  try {
    parsedOffice = JSON.parse(officeData);
    parsedLC3 = JSON.parse(lc3Data);
  } catch (e) {
    return {
      success: false,
      message: "Invalid JSON data",
      error: e.message,
    };
  }

  // Validate data structure
  if (
    !parsedOffice.data ||
    !parsedOffice.data.length ||
    !parsedLC3.data ||
    !parsedLC3.data.length
  ) {
    return {
      success: false,
      message: "No data found in one or both sources",
    };
  }

  const data1 = parsedOffice.data; // Office data
  const originalText2 = parsedLC3.data; // LC3 data
  let remaining2 = originalText2.slice();

  const fullMatch = [];
  const partialMatch = [];
  const notFound = [];
  const allowableChangesMatch = [];
  const finalNotFound = [];

  // ========================================
  // PASS 1️⃣: FULL MATCH
  // Find exact matches (service code + tooth/surface)
  // ========================================
  data1.forEach((item1) => {
    const key1 = getKey(item1);
    const idx = remaining2.findIndex((item2) => {
      const serviceCode = item2.Description?.service_code || "";
      return serviceCode === item1.Service && getKey(item2) === key1;
    });

    if (idx !== -1) {
      fullMatch.push({
        Service: item1.Service,
        serviceMatch: true,
        toothSurfaceMatch: true,
        match: true,
      });
      remaining2.splice(idx, 1);
      item1._matched = true;
    }
  });

  let unmatched1 = data1.filter((i) => !i._matched);

  // ========================================
  // Load compatibility map from MongoDB
  // ========================================
  const compatibilityData = await CodeCompatibility.find({});
  const compatibilityMap = {};
  compatibilityData.forEach((doc) => {
    compatibilityMap[doc.serviceCode] = doc.compatibleCodes;
  });

  // ========================================
  // PASS 2️⃣: PARTIAL MATCH
  // Service code matches, tooth/surface may differ
  // Uses scoring system to find best matches
  // ========================================
  const grouped = {};
  unmatched1.forEach((it) => {
    grouped[it.Service] = grouped[it.Service] || [];
    grouped[it.Service].push(it);
  });

  for (let svc in grouped) {
    let text1Items = grouped[svc];
    let candidateIndices = remaining2
      .map((it, i) => {
        const serviceCode = it.Description?.service_code || "";
        return serviceCode === svc ? i : -1;
      })
      .filter((i) => i !== -1);

    while (candidateIndices.length && text1Items.length) {
      const pairs = [];
      candidateIndices.forEach((ci) => {
        const cand = remaining2[ci];
        const keyCand = getKey(cand);
        text1Items.forEach((item1) => {
          const key1 = getKey(item1);
          const compOK = keyCand === key1;
          // Score: 1 for service match + 1 if composite key also matches
          pairs.push({ score: 1 + (compOK ? 1 : 0), item1, ci, compOK });
        });
      });

      if (!pairs.length) break;

      // Sort by highest score
      pairs.sort((a, b) => b.score - a.score);
      const best = pairs[0];

      // For lenient services, mark match=true even if tooth/surface mismatch
      const isLenient = LENIENT_SERVICES.has(svc);

      partialMatch.push({
        Service: svc,
        serviceMatch: true,
        toothSurfaceMatch: best.compOK,
        match: isLenient ? true : best.compOK,
      });

      best.item1._matched = true;
      const used = remaining2[best.ci];
      remaining2 = remaining2.filter((c) => c !== used);
      text1Items = text1Items.filter((i) => i !== best.item1);

      // Recalculate candidate indices
      candidateIndices = remaining2
        .map((it, i) => {
          const serviceCode = it.Description?.service_code || "";
          return serviceCode === svc ? i : -1;
        })
        .filter((i) => i !== -1);
    }
  }

  unmatched1 = data1.filter((i) => !i._matched);

  // ========================================
  // PASS 3️⃣: NOT FOUND
  // Items that didn't match in Pass 1 or 2
  // ========================================
  unmatched1.forEach((item1) => {
    notFound.push({
      Service: item1.Service,
      serviceMatch: false,
      toothSurfaceMatch: false,
      match: false,
      Tooth: item1.Tooth || null,
      Surface: item1.Surface || null,
    });
  });

  // ========================================
  // PASS 4️⃣: ALLOWABLE CHANGES
  // Check if unmatched items have acceptable alternatives in LC3 data
  // ========================================
  const allowableChangesData = await AllowableChanges.find({});

  for (const item of notFound) {
    const keyOrig = [item.Tooth || "", item.Surface || ""].sort().join("|");
    let foundAlt = false;
    let compOK = false;

    // Find if there's an allowable alternative for this service
    const allowable = allowableChangesData.find(
      (doc) => doc.originalService === item.Service
    );

    if (allowable) {
      const altService = allowable.alternativeService;
      const altEntry = originalText2.find((e) => {
        const serviceCode = e.Description?.service_code || "";
        return serviceCode === altService;
      });

      if (altEntry) {
        const keyAlt = getKey(altEntry);
        if (keyAlt === keyOrig) compOK = true;
        foundAlt = true;
      }
    }

    if (foundAlt) {
      allowableChangesMatch.push({
        Service: item.Service,
        serviceMatch: true,
        toothSurfaceMatch: compOK,
        match: compOK,
      });
    } else {
      finalNotFound.push(item);
    }
  }

  // ========================================
  // FINAL MERGE AND RESULT
  // ========================================
  const merged = fullMatch.concat(
    partialMatch,
    allowableChangesMatch,
    finalNotFound
  );
  const overallMatch = merged.every((m) => m.match);

  return {
    success: true,
    data: {
      mergedMatches: merged,
      overallMatch: overallMatch,
      summary: {
        total: merged.length,
        fullMatch: fullMatch.length,
        partialMatch: partialMatch.length,
        allowableChanges: allowableChangesMatch.length,
        notFound: finalNotFound.length,
      },
    },
  };
}

module.exports = { analyzeWalkoutData };
