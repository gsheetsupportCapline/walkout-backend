# Walkout Form - Office Section

## Complete Frontend Implementation Guide

---

## 📚 Documentation Structure

This is the **MASTER DOCUMENT** that provides a complete overview and quick reference for implementing the Office Section of the Walkout Form.

For detailed information, refer to the individual part documents:

### 📖 Part 1: Overview, Architecture & Field Definitions

**File**: `FRONTEND_OFFICE_SECTION_PART1_OVERVIEW.md`

**Contents**:

- System overview and architecture
- Data flow and state management
- **AppointmentId integration** (CRITICAL - how to map walkouts to appointments)
- Complete field definitions (30+ fields)
- Data types and storage formats
- Why numbers are used for radio/dropdown fields

**Read this first** to understand the overall system.

---

### 📖 Part 2: Conditional Logic & Validation Rules

**File**: `FRONTEND_OFFICE_SECTION_PART2_VALIDATION.md`

**Contents**:

- Complete 16-level validation cascade
- Show/Hide element rules for each field
- When to skip fields and not send to backend
- Frontend calculations (auto-calculate collected amount, difference)
- Validation flow diagrams
- All error messages (frontend and backend)

**Read this second** to understand the complex conditional logic.

---

### 📖 Part 3: Complete API Documentation

**File**: `FRONTEND_OFFICE_SECTION_PART3_API.md`

**Contents**:

- All 5 API endpoints with complete examples
- Request/response structures for all scenarios
- Success and error responses
- How to handle appointmentId and walkoutId
- **Critical note**: submitToLC3 set once, never changes
- Error handling best practices

**Read this third** to understand API integration.

---

### 📖 Part 4: Implementation Guide & Code Examples

**File**: `FRONTEND_OFFICE_SECTION_PART4_IMPLEMENTATION.md`

**Contents**:

- Step-by-step implementation guide
- Complete React code examples
- State management strategies
- Form validation implementation
- UI/UX best practices
- Comprehensive testing checklist (10 scenarios)
- Common pitfalls and solutions

**Read this last** for hands-on implementation guidance.

---

## 🎯 Quick Start Guide

### 1. Understanding the System (5 minutes)

**What is the Office Section?**

- First step in the Walkout Form workflow
- Collects patient visit data, payment info, and document status
- Uses conditional logic - fields appear/disappear based on previous selections

**Key Concepts**:

- **appointmentId**: Maps walkout to appointment (essential for form persistence)
- **walkoutId**: Unique ID of walkout document (save after first submit)
- **submitToLC3**: First submission timestamp (set once, never updated)
- **Number Storage**: Radio buttons and dropdowns store incremental ID numbers, not text

---

### 2. Core Workflow (10 minutes)

```
User clicks appointment → Check if walkout exists
    ↓                           ↓
    No                         Yes
    ↓                           ↓
New form                   Load existing data
    ↓                           ↓
Fill & submit  ←────────────────┘
    ↓
Save walkoutId
    ↓
Use walkoutId for future updates
```

**Critical Rules**:

1. Always check for existing walkout before showing form
2. Save walkoutId after first submit
3. Use appointmentId to search for existing walkouts
4. submitToLC3 never changes after first submission

---

### 3. Validation Levels (15 minutes)

#### Level 1: Patient Came (ALWAYS MANDATORY)

```javascript
if (patientCame === 2) {
  // Patient didn't come
  // ONLY send: appointmentId, openTime, patientCame
  // HIDE all other fields
  // Status: "patient_not_came"
  // submitToLC3: null
}
```

#### Level 2-6: Basic Info (If patient came)

- postOpZeroProduction
- patientType
- hasInsurance → insuranceType → insurance (conditional chain)
- googleReviewRequest

#### Major Branch: Post-Op Zero Production Check

```javascript
if (postOpZeroProduction === 1) {
  // Skip ALL payment, rule engine, and document fields
  // HIDE entire payment section
  // HIDE entire document section
  // Status: "office_submitted"
}
```

#### Level 7-16: Payment & Documents (If normal production)

- Expected amount, payment modes, check digits
- Reason for less collection (if difference negative)
- Rule engine run → error/reason → fix details (conditional chain)
- 11 boolean document fields (5 mandatory, 6 optional)

**See Part 2** for complete validation details.

---

### 4. Show/Hide Rules (10 minutes)

**Golden Rule**: If a field won't be saved (per validation logic), HIDE its UI element completely.

**Examples**:

| Scenario                          | Hidden Fields                                          |
| --------------------------------- | ------------------------------------------------------ |
| Patient didn't come               | Everything except patientCame                          |
| Post-op zero production = Yes     | Payment section, Document section, Rule engine section |
| hasInsurance = No                 | insuranceType, insurance                               |
| insuranceType ≠ 2 or 6            | insurance                                              |
| Primary payment mode not selected | amountCollectedPrimaryMode                             |
| Payment mode ≠ 4                  | lastFourDigitsCheckForte                               |
| Difference ≥ 0                    | reasonLessCollection                                   |
| ruleEngineRun = No                | ruleEngineError, errorFixRemarks, issuesFixed          |
| ruleEngineRun = Yes               | ruleEngineNotRunReason                                 |
| ruleEngineError ≠ 1               | errorFixRemarks, issuesFixed                           |

**Implementation Tip**: Create a `updateFieldVisibility()` function that runs whenever form data changes.

---

### 5. API Integration (15 minutes)

#### API 1: Submit Office Section

```
POST {{base_url}}/api/walkouts/submit-office
```

**When to use**: First time submitting for this appointment

**Important**: Save the `_id` from response as `walkoutId`

#### API 2: Get All Walkouts (Check Existing)

```
GET {{base_url}}/api/walkouts?appointmentId={appointmentId}
```

**When to use**: On form open, to check if walkout already exists

#### API 3: Get Walkout by ID

```
GET {{base_url}}/api/walkouts/{walkoutId}
```

**When to use**: To fetch specific walkout details

#### API 4: Update Office Section

```
PUT {{base_url}}/api/walkouts/{walkoutId}/office
```

**When to use**: Re-submitting/updating existing walkout

**Critical**: submitToLC3 does NOT change on update!

#### API 5: Delete Walkout

```
DELETE {{base_url}}/api/walkouts/{walkoutId}
```

**When to use**: Admin/SuperAdmin only (soft delete)

**See Part 3** for complete request/response examples.

---

### 6. Code Structure (20 minutes)

#### Recommended Component Structure

```
WalkoutOfficeForm/
├── WalkoutOfficeForm.jsx          (Main container)
├── components/
│   ├── PatientStatusSection.jsx   (Level 1: patientCame)
│   ├── BasicInfoSection.jsx       (Level 2-6: basic fields)
│   ├── PaymentSection.jsx         (Level 7-13: payment fields)
│   ├── RuleEngineSection.jsx      (Level 14-15: rule engine)
│   ├── DocumentSection.jsx        (Level 16: checkboxes)
│   └── NotesSection.jsx           (newOfficeNote)
├── hooks/
│   ├── useWalkoutForm.js          (Form state management)
│   ├── useFieldVisibility.js     (Show/hide logic)
│   └── useFormValidation.js      (Validation logic)
└── utils/
    ├── formValidation.js          (Validation functions)
    ├── payloadCleaner.js          (Clean payload before submit)
    └── apiService.js              (API calls)
```

#### Key Functions You Need

```javascript
// 1. Check for existing walkout
async function checkExistingWalkout(appointmentId)

// 2. Update field visibility
function updateFieldVisibility(formData)

// 3. Handle field changes
function handleFieldChange(fieldName, value)

// 4. Validate form
function validateForm(formData)

// 5. Clean payload
function prepareSubmitPayload(formData)

// 6. Submit handler
async function handleSubmit(formData, walkoutId)
```

**See Part 4** for complete code examples.

---

## 🔑 Critical Implementation Points

### ✅ MUST DO

1. **Check for Existing Walkout on Form Open**

   ```javascript
   useEffect(() => {
     checkExistingWalkout(appointmentId);
   }, [appointmentId]);
   ```

2. **Save walkoutId After First Submit**

   ```javascript
   if (response.success && !walkoutId) {
     setWalkoutId(response.data._id);
     localStorage.setItem(`walkout_${appointmentId}`, response.data._id);
   }
   ```

3. **Update Visibility on Every Field Change**

   ```javascript
   useEffect(() => {
     updateFieldVisibility(formData);
   }, [formData]);
   ```

4. **Auto-Calculate Collected Amount and Difference**

   ```javascript
   // When primary or secondary amount changes
   const collected = primaryAmount + secondaryAmount;
   const difference = expected - collected;
   ```

5. **Clean Payload Before Submit**

   ```javascript
   // Don't send fields that should be hidden
   const payload = prepareSubmitPayload(formData);
   ```

6. **Use Correct Data Types**

   ```javascript
   // Radio/Dropdown: Number
   patientCame: parseInt(value);

   // Decimal fields: Number
   expectedPatientPortionOfficeWO: parseFloat(value);

   // Boolean: Boolean
   signedGeneralConsent: true / false;
   ```

### ❌ MUST NOT DO

1. **Don't Send Hidden Fields**

   - If field is hidden, don't include in payload
   - Example: If `hasInsurance = 2`, don't send `insuranceType` or `insurance`

2. **Don't Validate Hidden Fields**

   - Only validate fields that are currently visible
   - Example: Don't require `insurance` if `insuranceType ≠ 2 or 6`

3. **Don't Send submitToLC3 in Update Request**

   - Backend handles this automatically
   - It should never change after first submit

4. **Don't Allow Multiple Walkouts for Same Appointment**

   - Always check if walkout exists before creating new one
   - Use appointmentId to search

5. **Don't Use Strings for Number Fields**
   - `patientCame: "1"` ❌ Wrong
   - `patientCame: 1` ✅ Correct

---

## 📊 Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│  User Clicks Appointment                                     │
│  appointmentId = appointment._id                            │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  Check Existing Walkout                                      │
│  GET /api/walkouts?appointmentId={appointmentId}           │
└────────────┬────────────────────────────┬───────────────────┘
             │                            │
       No walkout                   Walkout exists
             │                            │
             ▼                            ▼
    ┌────────────────┐        ┌──────────────────────┐
    │  New Form      │        │  Load existing data   │
    │  walkoutId=null│        │  walkoutId = data._id │
    └────────┬───────┘        └──────────┬───────────┘
             │                            │
             └────────────┬───────────────┘
                          │
                          ▼
           ┌──────────────────────────────┐
           │  User Fills Form              │
           │  - Conditional visibility     │
           │  - Auto-calculations          │
           │  - Real-time validation       │
           └──────────────┬───────────────┘
                          │
                          ▼
           ┌──────────────────────────────┐
           │  Validate Form                │
           │  - Check required fields      │
           │  - Conditional validations    │
           └──────────────┬───────────────┘
                          │
                    Valid │
                          ▼
           ┌──────────────────────────────┐
           │  Prepare Payload              │
           │  - Remove hidden fields       │
           │  - Ensure correct data types  │
           └──────────────┬───────────────┘
                          │
                          ▼
        ┌─────────────────────────────────────┐
        │  Submit to API                       │
        │  POST /submit-office (if new)       │
        │  PUT /:id/office (if update)        │
        └─────────────────┬───────────────────┘
                          │
                    Success
                          ▼
           ┌──────────────────────────────┐
           │  Save walkoutId (if new)      │
           │  Show success message         │
           │  Update form state            │
           └──────────────────────────────┘
```

---

## 🧪 Testing Quick Reference

### Test Scenario Checklist

- [ ] **S1**: Patient didn't come → Only patientCame sent, status = patient_not_came
- [ ] **S2**: Post-op zero production → Payment/docs hidden, status = office_submitted
- [ ] **S3**: Insurance chain → insuranceType shows when hasInsurance=1, insurance shows when type=2/6
- [ ] **S4**: Payment calculations → Collected auto-sums, difference auto-calculates
- [ ] **S5**: Check/Forte → Last 4 digits required when mode=4, validates 4 digits
- [ ] **S6**: Negative difference → Reason dropdown appears when difference < 0
- [ ] **S7**: Rule engine error → Error details required when error=1
- [ ] **S8**: Rule engine not run → Reason required when run=2
- [ ] **S9**: Update walkout → Existing data loads, submitToLC3 doesn't change
- [ ] **S10**: Complete happy path → All validations pass, walkout created successfully

**See Part 4** for detailed test scenarios.

---

## 📞 Field Reference Quick Lookup

### Radio Button Fields (Store as Number)

| Field                | Mandatory When    | Special Rules                       |
| -------------------- | ----------------- | ----------------------------------- |
| patientCame          | Always            | If 2, skip everything else          |
| postOpZeroProduction | patientCame=1     | If 1, skip payment/docs             |
| patientType          | patientCame=1     | -                                   |
| hasInsurance         | patientCame=1     | If 1, show insuranceType            |
| insuranceType        | hasInsurance=1    | If 2 or 6, show insurance           |
| insurance            | insuranceType=2/6 | -                                   |
| googleReviewRequest  | patientCame=1     | -                                   |
| ruleEngineRun        | Normal production | If 1, show error; if 2, show reason |
| ruleEngineError      | ruleEngineRun=1   | If 1, show fix details              |
| issuesFixed          | ruleEngineError=1 | -                                   |

### Dropdown Fields (Store as Number)

| Field                       | Mandatory When  | Special Rules                                  |
| --------------------------- | --------------- | ---------------------------------------------- |
| patientPortionPrimaryMode   | Optional        | If set, amount required; if 4, digits required |
| patientPortionSecondaryMode | Optional        | If set, amount required; if 4, digits required |
| reasonLessCollection        | difference < 0  | -                                              |
| ruleEngineNotRunReason      | ruleEngineRun=2 | -                                              |

### Number Fields (Decimal Allowed)

| Field                          | Mandatory When     | Calculated?                |
| ------------------------------ | ------------------ | -------------------------- |
| expectedPatientPortionOfficeWO | Normal production  | No                         |
| patientPortionCollected        | -                  | Yes (primary + secondary)  |
| differenceInPatientPortion     | -                  | Yes (expected - collected) |
| amountCollectedPrimaryMode     | Primary mode set   | No                         |
| amountCollectedSecondaryMode   | Secondary mode set | No                         |
| lastFourDigitsCheckForte       | Mode = 4           | No                         |

### Boolean Fields (5 Mandatory, 6 Optional)

| Field                  | Mandatory? |
| ---------------------- | ---------- |
| signedGeneralConsent   | ✅ Yes     |
| signedTxPlan           | ✅ Yes     |
| xRayPanoAttached       | ✅ Yes     |
| prcUpdatedInRouteSheet | ✅ Yes     |
| routeSheet             | ✅ Yes     |
| signedTreatmentConsent | ❌ No      |
| preAuthAvailable       | ❌ No      |
| perioChart             | ❌ No      |
| nvd                    | ❌ No      |
| majorServiceForm       | ❌ No      |
| narrative              | ❌ No      |

---

## 🚨 Common Errors & Solutions

### Error: "patientCame is required"

**Cause**: Field not selected or not sent  
**Solution**: Always send patientCame field

### Error: "insuranceType is required when patient has insurance"

**Cause**: hasInsurance=1 but insuranceType not sent  
**Solution**: If hasInsurance=1, insuranceType is mandatory

### Error: "amountCollectedPrimaryMode is required when patientPortionPrimaryMode is provided"

**Cause**: Selected payment mode but didn't enter amount  
**Solution**: Always send amount when mode is selected

### Error: "lastFourDigitsCheckForte is required when payment mode is 4"

**Cause**: Selected Check/Forte (mode=4) but didn't enter digits  
**Solution**: Show digits field when mode=4

### Error: Walkout created twice for same appointment

**Cause**: Didn't check for existing walkout  
**Solution**: Always call `checkExistingWalkout()` on form open

### Error: submitToLC3 changed on update

**Cause**: Sending submitToLC3 in update request  
**Solution**: Don't send submitToLC3 in update, backend handles it

---

## 📝 Implementation Checklist

### Phase 1: Setup (Day 1)

- [ ] Read all 4 documentation parts
- [ ] Understand appointmentId integration
- [ ] Set up API service with authentication
- [ ] Create basic form structure
- [ ] Set up state management

### Phase 2: Core Logic (Day 2-3)

- [ ] Implement field visibility logic
- [ ] Implement field change handlers
- [ ] Implement auto-calculations
- [ ] Add validation functions
- [ ] Create payload cleaning function

### Phase 3: UI Components (Day 3-4)

- [ ] Create radio button component
- [ ] Create dropdown component
- [ ] Create number input component
- [ ] Create checkbox component
- [ ] Create textarea component
- [ ] Style form sections

### Phase 4: Integration (Day 4-5)

- [ ] Implement check existing walkout
- [ ] Implement submit handler
- [ ] Implement update handler
- [ ] Add loading states
- [ ] Add error handling
- [ ] Add success notifications

### Phase 5: Testing (Day 5-6)

- [ ] Test all 10 scenarios
- [ ] Test field visibility rules
- [ ] Test validation messages
- [ ] Test with existing walkout
- [ ] Test error cases
- [ ] Cross-browser testing

### Phase 6: Polish (Day 6-7)

- [ ] Add helpful tooltips
- [ ] Add field descriptions
- [ ] Improve error messages
- [ ] Add loading indicators
- [ ] Add confirmation dialogs
- [ ] Performance optimization

---

## 📚 Additional Resources

### Backend Models

- `models/Walkout.js` - Complete walkout schema
- `models/ButtonSet.js` - Radio button sets
- `models/DropdownSet.js` - Dropdown sets

### Backend Controllers

- `controllers/walkoutController.js` - All walkout operations
  - submitOfficeSection (main validation logic)
  - getAllWalkouts
  - getWalkoutById
  - updateOfficeSection
  - deleteWalkout

### API Routes

- `routes/walkoutRoutes.js` - All walkout endpoints

### Postman Collection

- `Walkout-Backend.postman_collection.json`
  - "Walkouts" folder with 5 requests
  - Complete request/response examples
  - Test scripts for saving walkoutId

---

## 🎓 Learning Path

### Beginner (New to the project)

1. Read **Part 1** - Understand overall system
2. Review field definitions table
3. Understand appointmentId concept
4. Read **Part 3** - API basics

### Intermediate (Starting implementation)

1. Read **Part 2** - Complete validation logic
2. Understand show/hide rules
3. Read **Part 4** - Implementation guide
4. Review code examples

### Advanced (Ready to code)

1. Follow step-by-step implementation
2. Use testing checklist
3. Review common pitfalls
4. Implement and test

---

## 📞 Support & Questions

### For Backend Questions:

- Check `documentation/COMPLETE_API_REFERENCE.md`
- Review Postman collection requests
- Check backend controller validation logic

### For Frontend Questions:

- Review all 4 parts of this documentation
- Check code examples in Part 4
- Follow testing checklist

### For Validation Logic Questions:

- Review Part 2 (16-level cascade)
- Check validation flow diagrams
- Test with Postman first

---

## 🎯 Success Criteria

Your implementation is successful when:

✅ User can open form for an appointment  
✅ Existing walkout data loads automatically  
✅ Fields show/hide based on user selections  
✅ Auto-calculations work correctly  
✅ Validation prevents invalid submissions  
✅ API calls succeed with correct payloads  
✅ walkoutId is saved after first submit  
✅ Updates preserve submitToLC3 timestamp  
✅ All 10 test scenarios pass  
✅ No duplicate walkouts for same appointment

---

## 📄 Document Information

**Created**: January 1, 2026  
**Version**: 1.0  
**For**: Frontend Developer Implementation  
**Backend API Version**: 1.0  
**Total Pages**: 4 detailed parts + 1 master document

**Part Documents**:

1. `FRONTEND_OFFICE_SECTION_PART1_OVERVIEW.md` (Architecture & Fields)
2. `FRONTEND_OFFICE_SECTION_PART2_VALIDATION.md` (Validation & Logic)
3. `FRONTEND_OFFICE_SECTION_PART3_API.md` (API Documentation)
4. `FRONTEND_OFFICE_SECTION_PART4_IMPLEMENTATION.md` (Code & Testing)

---

**🎉 You're now ready to implement the Office Section successfully!**

Start with Part 1, work through each part sequentially, and refer back to this master document for quick lookups.

Good luck! 🚀
