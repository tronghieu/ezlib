# Enhanced Story Creation Guidelines - Cross-Cutting Concerns Prevention

<!-- Powered by BMAD™ Core -->

## Purpose

These enhanced guidelines prevent Scrum Masters from missing critical cross-cutting architectural concerns (like i18n, authentication, multi-tenancy, etc.) during story creation. This systematic approach ensures all stories properly consider downstream Epic requirements and architectural constraints.

## MANDATORY Enhancement to Create Next Story Task

**CRITICAL**: These steps must be inserted into the existing `create-next-story.md` workflow at **Step 4.5** (after "Verify Project Structure Alignment" and before "Populate Story Template").

### Step 4.5: Cross-Cutting Concerns Analysis (MANDATORY)

Before populating the story template, the SM MUST perform this systematic analysis:

#### 4.5.1 Epic Dependency Impact Analysis

**REQUIRED ACTION**: For EVERY story, review ALL future epics to identify downstream impacts:

```markdown
## Epic Cross-Reference Checklist

### Epic 2 Analysis (Core Operations):

- [ ] Does this story create UI elements that need translation? → Flag for i18n consideration
- [ ] Does this story handle user input that needs validation? → Check validation message localization
- [ ] Does this story create member-facing features? → Consider role-based access patterns

### Epic 3 Analysis (Enhanced Circulation):

- [ ] Does this story create data that due dates will depend on? → Consider date formatting
- [ ] Does this story create notification triggers? → Consider message localization
- [ ] Does this story affect reporting calculations? → Consider number formatting

### Epic 4 Analysis (Advanced Features):

- [ ] Does this story create reports or analytics? → Consider regional formatting
- [ ] Does this story create admin interfaces? → Consider staff role management
- [ ] Does this story create user-facing text? → MANDATORY i18n consideration
```

#### 4.5.2 Architectural Cross-Cutting Concerns Checklist

**REQUIRED VALIDATION**: Every story must explicitly address these concerns:

```markdown
## Cross-Cutting Concerns Validation

### 🌐 Internationalization (i18n) Impact

- [ ] **User-Facing Text**: Does this story create ANY user-visible text?
- [ ] **Form Validation**: Does this story create form validation messages?
- [ ] **Error Messages**: Does this story create error or success messages?
- [ ] **Date/Time Display**: Does this story display dates, times, or numbers?
- [ ] **Email Templates**: Does this story create email notifications?
- [ ] **DECISION**: i18n Required: YES/NO with justification

### 🔐 Authentication & Authorization Impact

- [ ] **User Context**: Does this story require knowing who the current user is?
- [ ] **Role Permissions**: Does this story need different behavior for different roles?
- [ ] **Library Context**: Does this story require knowing which library context?
- [ ] **RLS Integration**: Does this story read/write data that needs library isolation?
- [ ] **DECISION**: Auth Integration Required: YES/NO with specific requirements

### 🏢 Multi-Tenant Architecture Impact

- [ ] **Library Scoping**: Does this story create data that belongs to a specific library?
- [ ] **Cross-Library Impact**: Could this story affect other libraries if not properly isolated?
- [ ] **Staff Role Context**: Does this story need to differentiate between staff roles?
- [ ] **DECISION**: Multi-tenant Considerations: List specific RLS/scoping requirements

### ♿ Accessibility & UX Impact

- [ ] **Keyboard Navigation**: Does this story create interactive elements?
- [ ] **Screen Reader**: Does this story create complex UI that needs ARIA labels?
- [ ] **Color/Contrast**: Does this story use color to convey information?
- [ ] **DECISION**: Accessibility Requirements: List specific WCAG 2.1 considerations

### 📊 Performance & Scale Impact

- [ ] **Large Data Sets**: Could this story handle 5000+ books or 1000+ members?
- [ ] **Real-time Updates**: Does this story need live data synchronization?
- [ ] **Database Queries**: Does this story create new database query patterns?
- [ ] **DECISION**: Performance Considerations: List specific optimizations needed
```

#### 4.5.3 Story Interdependency Analysis

**REQUIRED DOCUMENTATION**: Map dependencies and integration points:

```markdown
## Story Integration Analysis

### Upstream Dependencies (Stories this depends on):

- Story X.X: [Specific dependency and integration point]
- Story X.X: [Specific dependency and integration point]

### Downstream Impact (Stories that will depend on this):

- Story X.X: [How this story will be leveraged]
- Story X.X: [How this story will be leveraged]

### Cross-Cutting Feature Integration:

- **Authentication System**: [How this story integrates with existing auth]
- **i18n Framework**: [How this story will be localized in Epic 4]
- **Multi-tenant Architecture**: [How this story respects library isolation]
- **Component System**: [What reusable components this story creates/uses]
```

#### 4.5.4 Technical Debt & Future Epic Preparation

**REQUIRED ASSESSMENT**: Evaluate impact on future work:

```markdown
## Future Epic Preparation Assessment

### Technical Debt Creation Risk:

- [ ] Could this story create patterns that conflict with Epic 4 i18n requirements?
- [ ] Could this story create hardcoded values that Epic 4 needs to make configurable?
- [ ] Could this story create UI patterns that don't support language switching?

### Epic 4 Integration Readiness:

- [ ] Are text strings externalized for future translation?
- [ ] Are date/number formats abstracted for localization?
- [ ] Are user-facing messages structured for interpolation?

### Mitigation Strategies:

- [List specific actions to prevent future rework]
- [List architectural decisions that support future enhancement]
```

## Enhanced Story Template Requirements

### New Mandatory Section: "Cross-Cutting Concerns Analysis"

Add this section to the story template BEFORE "Dev Notes":

```yaml
- id: cross-cutting-analysis
  title: Cross-Cutting Concerns Analysis
  type: structured-analysis
  instruction: |
    MANDATORY: Complete the cross-cutting concerns analysis using the enhanced guidelines.
    This section ensures the story properly considers i18n, authentication, multi-tenancy,
    accessibility, and performance implications.
  elicit: true
  owner: scrum-master
  editors: [scrum-master]
  template: |
    ## Epic Dependency Analysis
    [Results of Epic 2/3/4 impact analysis]

    ## Architectural Cross-Cutting Concerns
    ### i18n Impact: [YES/NO with justification]
    ### Auth Integration: [Requirements and integration points]
    ### Multi-tenant Considerations: [RLS and scoping requirements]
    ### Accessibility Requirements: [WCAG 2.1 specific needs]
    ### Performance Considerations: [Scale and optimization needs]

    ## Story Integration Points
    ### Upstream Dependencies: [List with integration details]
    ### Downstream Impact: [Stories that will depend on this]
    ### Future Epic Preparation: [Technical debt prevention measures]
```

### Enhanced Dev Notes Section

Modify the existing dev-notes section to require cross-cutting concern integration:

```yaml
instruction: |
  Populate relevant information from architecture docs AND cross-cutting concerns analysis:
  - Include ALL findings from the Cross-Cutting Concerns Analysis above
  - Reference specific Epic 4 requirements that this story must accommodate
  - Detail i18n preparation requirements (string externalization, formatting abstractions)
  - Specify authentication integration patterns from existing stories
  - Document multi-tenant RLS requirements and library scoping patterns
  - List accessibility implementation requirements
  - Detail performance considerations and optimization requirements
  - CRITICAL: Every cross-cutting concern flagged in analysis must have implementation guidance
```

## Story Draft Validation Checklist

Add this to the existing story draft checklist (`.bmad-core/checklists/story-draft-checklist`):

```markdown
## Cross-Cutting Concerns Validation

- [ ] Cross-Cutting Concerns Analysis section is complete
- [ ] i18n impact assessment is present and justified
- [ ] Authentication integration is documented with specific patterns
- [ ] Multi-tenant considerations include specific RLS requirements
- [ ] Accessibility requirements reference WCAG 2.1 specific needs
- [ ] Performance considerations address 5K books/1K members scale
- [ ] All flagged concerns have corresponding implementation guidance in Dev Notes
- [ ] Future Epic preparation measures are documented
- [ ] Technical debt prevention strategies are specified
```

## SM Training & Process Enforcement

### Immediate Training Requirements

The SM must be trained on:

1. **Epic Interdependency Mapping**: Understanding how current MVP work affects Epic 4
2. **i18n Preparation Patterns**: Recognizing when strings need externalization
3. **Cross-Story Integration**: Identifying reusable patterns and components
4. **Future-Proofing Strategies**: Writing stories that minimize Epic 4 rework

### Process Enforcement Mechanisms

1. **Mandatory PO Review**: All stories require PO validation before "Approved" status
2. **Automated Checklist**: Story template enforces cross-cutting analysis completion
3. **Epic Cross-Reference**: Visual matrix showing story-to-epic relationships
4. **Retrospective Review**: Regular assessment of missed cross-cutting concerns

## Success Metrics

Track these metrics to measure process improvement:

- **Cross-Cutting Issue Discovery Rate**: Issues caught in story draft vs. development
- **Rework Reduction**: Stories requiring significant changes due to missed concerns
- **Epic 4 Preparation Readiness**: Technical debt metrics when Epic 4 begins
- **Story Quality Score**: Completeness of cross-cutting concern analysis

## Implementation Rollout

### Phase 1: Immediate (This Sprint)

- Update create-next-story.md with Step 4.5 requirements
- Create enhanced story template with Cross-Cutting Concerns Analysis section
- Update story draft checklist with validation requirements

### Phase 2: Next Sprint

- Train SM on enhanced process with real story examples
- Implement PO validation workflow for all story drafts
- Create Epic cross-reference matrix for visual dependency tracking

### Phase 3: Continuous Improvement

- Collect metrics on cross-cutting concern discovery rates
- Refine guidelines based on missed issues in retrospectives
- Automate cross-cutting concern flagging where possible

---

**Process Owner**: Product Owner (Sarah)  
**Enforcement**: Mandatory for all story creation starting immediately  
**Review Cycle**: Weekly retrospective assessment of cross-cutting concern coverage
