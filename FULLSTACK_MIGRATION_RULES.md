# 🚀 Fullstack Migration Rules & Guidelines

## 📋 PROJECT OVERVIEW
**Migration dari Next.js + Supabase ke Fullstack Architecture dengan VPS + Coolify**

### Current Stack → Target Stack
- ❌ **Current**: Next.js + Supabase (Serverless)
- ✅ **Target**: Frontend + Backend + PostgreSQL (Self-hosted)

---

## 🏗️ ARSITEKTUR TARGET

### Infrastructure
- **VPS**: Sudah tersedia (existing)
- **Deployment**: Coolify (container orchestration)
- **Repository**: GitHub integration (auto-deploy)
- **Database**: PostgreSQL via Coolify
- **Cost Strategy**: Maksimal gratis (kecuali VPS)

### Tech Stack
- **Frontend**: Next.js (SPA/Static) - UI/UX 100% dipertahankan
- **Backend**: Node.js + Express
- **Database**: PostgreSQL + Redis (optional caching)
- **Authentication**: JWT + Refresh Token
- **Real-time**: Socket.io atau Server-Sent Events
- **Version Control**: GitHub dengan branch strategy

---

## 📁 PROJECT STRUCTURE

```
project-root/
├── current-app/           # Original Next.js + Supabase (unchanged)
├── fullstack-dev/         # NEW: Prototype development
│   ├── frontend/          # Next.js SPA
│   ├── backend/           # Node.js API
│   ├── database/          # PostgreSQL schema & migrations
│   ├── docker-compose.yml # Development environment
│   └── .github/workflows/ # CI/CD untuk Coolify
├── docs/                  # Migration documentation
└── FULLSTACK_MIGRATION_RULES.md # This file
```

---

## 🎯 CRITICAL RULES & REQUIREMENTS

### ⚠️ MANDATORY RULES

1. **UI/UX PRESERVATION**
   - 🔒 **ZERO UI/UX changes allowed**
   - All components dari `src/components/` harus dipindah utuh
   - Design system & styling tetap 100% sama
   - User experience tidak boleh berubah

2. **SUBAGENT COLLABORATION**
   - 🤝 **WAJIB melibatkan subagent sesuai expertise**
   - UI-UX-Designer: Design consistency & component migration
   - Frontend-Dev: Next.js SPA implementation
   - Backend-Dev-Specialist: API development & database design
   - Fullstack-Dev: Integration & architecture coordination
   - DevOps-Engineer: Coolify deployment & GitHub Actions
   - QA-Engineer: Testing strategy & quality assurance

3. **DEVELOPMENT WORKFLOW**
   - 📂 **Prototype HARUS di folder terpisah**: `fullstack-dev/`
   - Original app tetap berjalan tanpa gangguan
   - Parallel development untuk zero-downtime migration
   - GitHub integration untuk version control

---

## 🔄 MIGRATION STRATEGY

### Phase 1: Prototype Setup
- [ ] Create `fullstack-dev/` folder structure
- [ ] Copy UI/UX components (UI-UX-Designer + Frontend-Dev)
- [ ] Setup backend API structure (Backend-Dev-Specialist)
- [ ] Design database schema (Backend-Dev-Specialist)
- [ ] Configure development environment (DevOps-Engineer)

### Phase 2: Development
- [ ] Implement authentication system (Backend-Dev-Specialist)
- [ ] Build API endpoints (Backend-Dev-Specialist + Fullstack-Dev)
- [ ] Frontend integration (Frontend-Dev)
- [ ] Real-time features implementation (Fullstack-Dev)
- [ ] Testing & QA (QA-Engineer)

### Phase 3: Deployment
- [ ] GitHub Actions setup (DevOps-Engineer)
- [ ] Coolify configuration (DevOps-Engineer)
- [ ] Database migration scripts (Backend-Dev-Specialist)
- [ ] Production deployment testing (QA-Engineer)

### Phase 4: Migration
- [ ] Data migration from Supabase (Backend-Dev-Specialist)
- [ ] DNS switching (DevOps-Engineer)
- [ ] Performance monitoring (DevOps-Engineer)
- [ ] Post-migration verification (QA-Engineer)

---

## 🛡️ QUALITY ASSURANCE

### Testing Requirements
- Unit tests untuk backend API
- Integration tests untuk database
- E2E tests untuk critical user flows
- Performance testing untuk VPS environment

### Rollback Strategy
- Original app tetap tersedia sebagai fallback
- Database backup sebelum migration
- DNS quick-switch capability
- Documentation untuk emergency rollback

---

## 📋 SUBAGENT RESPONSIBILITIES

### UI-UX-Designer
- Ensure design consistency during migration
- Component library documentation
- User experience verification

### Frontend-Dev
- Next.js SPA implementation
- Component migration & optimization
- Client-side routing setup

### Backend-Dev-Specialist
- API architecture & development
- Database schema design
- Authentication implementation
- Performance optimization

### Fullstack-Dev
- Integration between frontend & backend
- Architecture coordination
- End-to-end functionality

### DevOps-Engineer
- Coolify deployment configuration
- GitHub Actions CI/CD setup
- VPS optimization & monitoring
- Database backup automation

### QA-Engineer
- Testing strategy development
- Quality assurance across all phases
- Performance & security testing
- Migration verification

---

## 📝 NOTES & COMMITMENTS

- **Zero UI/UX changes**: User tidak boleh merasakan perbedaan
- **Cost optimization**: Maksimal gratis kecuali VPS
- **Production ready**: Architecture harus scalable & maintainable
- **Team collaboration**: Semua subagent WAJIB terlibat sesuai expertise
- **Documentation**: Semua perubahan harus terdokumentasi

---

**Created**: {current_date}  
**Status**: Active Migration Rules  
**Last Updated**: {current_date}

---

*"Migration yang sukses adalah yang tidak terasa oleh user"* 🎯