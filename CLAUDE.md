# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Structure

This is a web-based performance management system for a fintech company with ~400 employees. Built with Next.js 15, TypeScript, Prisma ORM, and SQLite database.

### Key Files
- `app/layout.tsx` - Root layout with LanguageProvider for multi-language support
- `app/review/[id]/page.tsx` - Main review interface with 3-phase evaluation system
- `contexts/LanguageContext.tsx` - React Context for managing Polish/English language switching
- `lib/translations.ts` - Complete translation system for Polish and English
- `prisma/schema.prisma` - Database schema with User, Review, Goal, Competency models
- `prisma/seed.ts` - Database seeding with test accounts (no pre-defined goals)

### Architecture
- **Authentication**: JWT with httpOnly cookies, role-based access control
- **Database**: Prisma ORM with SQLite, supports Employee/Supervisor/HR/Admin roles
- **UI Framework**: Next.js App Router with Tailwind CSS v3
- **Multi-language**: React Context with localStorage persistence
- **Review System**: 3-phase process (Self-Evaluation → Supervisor Evaluation → Final Meeting)

## Development Commands

```bash
# Start development server
npm run dev

# Database operations  
npx prisma db push          # Apply schema changes
npx prisma db seed          # Seed database with test data
npx prisma studio           # Open database GUI
npx prisma migrate reset    # Reset database completely

# Build and deployment
npm run build
npm start
```

## Test Accounts

```
Admin: admin@company.com / admin123
HR: hr@company.com / hr123  
Supervisor: jan.nowak@company.com / supervisor123
Employee: piotr.kowalczyk@company.com / employee123
```

## System Features

### Performance Review Process
1. **Self-Evaluation Phase**: Employee creates personal goals (max 7) and evaluates competencies
2. **Supervisor Evaluation Phase**: Supervisor reviews and scores employee's work
3. **Final Meeting Phase**: Final grades assigned and development plan created

### Core Competencies (5 types)
- DOSTARCZANIE (Delivery) - Achieving goals and tasks
- ROZWOJ (Development) - Continuous skill improvement  
- INNOWACYJNOSC (Innovation) - Creativity and new solutions
- ODWAGA (Courage) - Taking on challenges
- ODPORNOSC (Resilience) - Dealing with difficulties

### Grading Scale
- 1: Below expectations (Poniżej oczekiwań)
- 2: Developing (Rozwija się)  
- 3: Solid performer (Solidny wykonawca)
- 4: Above expectations (Powyżej oczekiwań)
- 5: Outstanding (Wybitny)

## Multi-Language Support

- **Languages**: Polish (default) and English
- **Implementation**: React Context with localStorage persistence
- **Translation Keys**: Structured in `lib/translations.ts`
- **Language Switcher**: Globe icon component in top navigation

## Database Schema

### Key Models
```prisma
User {
  id, email, password, firstName, lastName
  employeeId, department, position, role
  supervisorId (self-referencing)
}

Review {
  year, period, phase (enum)
  employeeId, supervisorId
  goals[], competencies[], developmentPlan
}

Goal {
  title, description (employee-defined)
  selfScore, selfComment
  supervisorScore, supervisorComment  
  finalScore
}
```

## Development Notes

- **Goals are employee-defined**: No pre-populated goals in seed file
- **Phase Management**: Reviews start in SELF_EVALUATION phase
- **Font Consistency**: Use text-sm for buttons to maintain consistent heights
- **API Routes**: RESTful structure under `/api/` directory
- **Security**: Input validation, SQL injection protection via Prisma
- **Responsive Design**: Mobile-first approach with Tailwind CSS

## Common Tasks

### Adding New Translation Keys
1. Add key to both `pl` and `en` objects in `lib/translations.ts`
2. Use via `const { t } = useLanguage()` hook
3. Access with `t.section.key` syntax

### Database Changes
1. Update `prisma/schema.prisma`
2. Run `npx prisma db push`
3. Update seed file if needed
4. Test with `npx prisma studio`

### Review System Extensions
- Goals: Max 7 per review, employee creates during self-evaluation
- Competencies: Fixed 5 types, scored 1-5 scale with comments
- Development Plan: Select 2 competencies for improvement

## Troubleshooting

- **Tailwind not working**: Use v3 syntax, avoid v4 features
- **Database issues**: Use `npx prisma migrate reset --force` to rebuild
- **Language switching**: Clear browser storage if translations don't update
- **Polish content appearing**: Check seed file doesn't create pre-defined goals
- **Prisma client errors after schema changes**: Run `npx prisma generate` then restart dev server
- **Admin panel button issues**: Check form validation and API error responses
- **Date formatting**: System uses European format (dd/mm/yyyy) via `toLocaleDateString('pl-PL')`

## Review Period Management

### Admin Workflow
1. **Create Period**: Set year, type (MID_YEAR/END_YEAR), start/end dates
2. **Open Period**: Automatically creates reviews for all active employees
3. **Close Period**: Reviews become read-only, period cannot be reopened
4. **Archive Period**: Reviews moved to archive section for historical reference

### Review Period Status Flow
```
PLANNED → OPEN → CLOSED → ARCHIVED
```

### API Endpoints
- `GET /api/admin/review-periods` - List all periods
- `POST /api/admin/review-periods` - Create new period
- `PATCH /api/admin/review-periods/[id]/open` - Open period
- `PATCH /api/admin/review-periods/[id]/close` - Close period
- `PATCH /api/admin/review-periods/[id]/archive` - Archive period

## Important Constraints

- NEVER create pre-defined goals in seed - goals are employee-defined
- Always use translation keys, never hardcode text
- Maintain role-based access control for review phases
- Follow existing code conventions and patterns