# LC3 API Quick Reference

## 🚀 Quick Start

### 1. Submit Complete LC3 Section

```http
PUT /api/walkouts/:id/lc3
Authorization: Bearer {{auth_token}}
Content-Type: application/json

{
  "ruleEngine": {
    "fieldsetStatus": "complete",
    "didLc3RunRules": 1,
    "ruleEngineUniqueId": "RE-2026-12345"
  },
  "documentCheck": {
    "fieldsetStatus": "complete",
    "signedGeneralConsent": 1,
    "signedTreatmentConsent": 1
  },
  "lc3Remarks": "All documents verified"
}
```

### 2. Get Walkout with LC3 Data

```http
GET /api/walkouts/:id
Authorization: Bearer {{auth_token}}
```

---

## 📋 Field Value Reference

### Dropdown Values (Number)

- `1` = Yes
- `2` = No
- `3` = Not Available (for document/attachment checks)

### Fieldset Status

- `"incomplete"` = In progress
- `"complete"` = Finished

---

## 🔧 Common Operations

### Add On-Hold Note

```json
{
  "onHoldNote": "Waiting for insurance confirmation"
}
```

### Update Single Fieldset

```json
{
  "ruleEngine": {
    "didLc3RunRules": 1,
    "ruleEngineUniqueId": "RE-2026-12345"
  }
}
```

### Add Failed Rule

```json
{
  "ruleEngine": {
    "failedRules": [
      {
        "message": "Missing pre-authorization",
        "resolved": false
      }
    ]
  }
}
```

---

## ✅ Validation Requirements

1. **Office Section Must Be Submitted First**

   - Returns 400 error if not submitted
   - Check `officeSection.officeSubmittedAt` exists

2. **All Fieldsets are Optional**

   - Can submit any combination
   - Updates merge with existing data

3. **Number Fields Can Be Negative/Decimal**
   - `expectedPPInLC3`: ✅ -50.25
   - `productionInLC3`: ✅ 850.00

---

## 📊 Complete Example

```json
{
  "ruleEngine": {
    "fieldsetStatus": "complete",
    "didLc3RunRules": 1,
    "ruleEngineUniqueId": "RE-2026-12345",
    "reasonForNotRun": "",
    "failedRules": [
      {
        "message": "Missing pre-authorization for major service",
        "resolved": false
      },
      {
        "message": "Patient portion calculation mismatch",
        "resolved": true
      }
    ],
    "lastFetchedId": "RE-2026-12345"
  },
  "documentCheck": {
    "fieldsetStatus": "complete",
    "signedGeneralConsent": 1,
    "signedTreatmentConsent": 1,
    "preAuthAvailable": 2,
    "signedTxPlan": 1,
    "perioChart": 3,
    "nvd": 1,
    "routeSheet": 1,
    "prcUpdatedInRouteSheet": 1,
    "narrative": 1
  },
  "attachmentsCheck": {
    "fieldsetStatus": "complete",
    "xRayPanoAttached": 1,
    "majorServiceForm": 2,
    "bwPaAttached": 1,
    "fmxAttached": 3,
    "cephAttached": 3
  },
  "patientPortionCheck": {
    "fieldsetStatus": "complete",
    "expectedPPInLC3": 250.5,
    "differenceInPPWalkoutVsLC3": 10.5,
    "isPPVerified": 1,
    "isPPUpdatedInLC3": 1
  },
  "productionDetails": {
    "fieldsetStatus": "complete",
    "productionInLC3": 850.0,
    "differenceInProdWalkoutVsLC3": 0,
    "didLc3TakeApproval": 2,
    "reasonsToHold": [1, 3, 5],
    "wasWalkoutHoldInLC3": 2,
    "wasEligibilityWrong": 2,
    "wereAllNotesReadable": 1,
    "wereExtensionsHandledCorrectly": 1
  },
  "providerNotes": {
    "fieldsetStatus": "complete",
    "isNoteValidated": 1,
    "numberOfElements": 4,
    "providerNote": "Patient responded well to treatment. Follow-up in 2 weeks.",
    "hygienistNote": "Oral hygiene improved since last visit. Continue current routine."
  },
  "lc3Remarks": "All documents verified and processed. Ready for audit.",
  "onHoldNote": "Waiting for insurance pre-authorization confirmation."
}
```

---

## 🎯 Response Structure

### Success (200 OK)

```json
{
  "success": true,
  "message": "LC3 section submitted successfully",
  "data": {
    "_id": "walkout_id",
    "walkoutStatus": "lc3_submitted",
    "lc3Section": {
      // All LC3 data including metadata
      "lc3SubmittedAt": "2024-12-15T10:30:00Z",
      "lc3SubmittedBy": "user_id"
    }
  }
}
```

### Error (400 Bad Request)

```json
{
  "success": false,
  "message": "Office section must be submitted before LC3 section"
}
```

---

## 💡 Tips

1. **Postman Collection**: Use the updated Postman collection for testing
2. **Auto-Save**: walkout_id is auto-saved after office submission
3. **Partial Updates**: Submit only the fieldsets you need to update
4. **On-Hold Notes**: Each call with `onHoldNote` adds a new note to the array
5. **Status**: First LC3 submit auto-sets status to `lc3_submitted`

---

## 📞 Need Help?

Check [LC3_IMPLEMENTATION_SUMMARY.md](./LC3_IMPLEMENTATION_SUMMARY.md) for detailed documentation.
