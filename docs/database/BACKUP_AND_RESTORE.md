# Database Backup, Disaster Recovery & Restore Procedures

> **Status:** Phase 13 Operational Verification (2026-10-21).  
> **Source of Truth:** Version-controlled migrations in `supabase/migrations/` and PostgreSQL 17 logical backup scripts.

---

## 1. Overview and Operational Responsibility

| Environment           | Mechanism                                                           | Frequency                                    | Storage Location                            | Responsible Owner                                         |
| --------------------- | ------------------------------------------------------------------- | -------------------------------------------- | ------------------------------------------- | --------------------------------------------------------- |
| **Local Development** | Docker container pg_dump & Supabase CLI                             | On-demand before destructive resets          | Local scratch directory / developer storage | Development Team                                          |
| **Staging / Preview** | Supabase managed daily backups + migration scripts                  | Daily / pre-deployment dry-run               | Supabase Cloud (AWS ap-south-1)             | Engineering Lead                                          |
| **Production**        | Supabase Point-in-Time Recovery (PITR) & automated physical backups | Continuous PITR (7–30 days) + daily snapshot | Encrypted Cloud Storage (AES-256)           | Client Organization (Account Holder) / Marvel's Techworks |

### 1.1 Recovery Objectives (RTO & RPO)

- **Recovery Point Objective (RPO):**
  - **With Supabase PITR (Recommended for Production):** $< 5$ minutes (continuous write-ahead log streaming allows recovery up to seconds before a disaster or incident).
  - **With Daily Automated Snapshots (Baseline):** $\le 24$ hours.
- **Recovery Time Objective (RTO):**
  - **Database Cluster Spin-up & Restore:** $< 30–60$ minutes for full PITR provisioning to a target instance and verification of public and private schemas.
  - **Production DNS / Vercel Repoint:** $< 10$ minutes (updating environment variables and deploying zero-downtime alias swap).
  - **Total RTO Target:** $< 70$ minutes.

### 1.2 Backup Encryption & Retention Specifications

- **At-Rest Encryption:**
  - Production database backups, daily snapshots, and continuous WAL segments are encrypted using **AES-256** (SSE-S3 / AWS KMS) managed within the Supabase Cloud infrastructure.
  - Manual logical dump files (`.dump`) exported for off-site disaster archives MUST be encrypted with AES-256 prior to storage:
    ```bash
    gpg --symmetric --cipher-algo AES256 azizurrahman_backup.dump
    ```
- **In-Transit Encryption:**
  - All replication, snapshot transfers, and client connections enforce TLS 1.3 / TLS 1.2 with Perfect Forward Secrecy (PFS). Unencrypted plaintext database connections are rejected.
- **Retention Schedule:**
  - **Continuous PITR Window:** 7 days (or 30 days depending on Supabase Pro/Team tier).
  - **Daily Physical Snapshots:** Retained for 7 to 30 rolling calendar days.
  - **Disaster Recovery Monthly Off-Site Archives:** Retained for 90 days in air-gapped, encrypted cold storage.

> [!IMPORTANT]
> The database schema is fully reproducible from `supabase/migrations/`. However, appointment records, visitor contact information, audit events, and idempotency states exist only in the database. Recovery of transactional booking data depends strictly on regular database backups.

---

## 2. Local Backup & Verification Procedure

### 2.1 Exporting Application Data (`public` & `private` schemas)

Run from the host environment:

```bash
docker exec -i supabase_db_azizurrahman pg_dump \
  -U postgres \
  -d postgres \
  -n public \
  -n private \
  -F c \
  -f /tmp/azizurrahman_backup.dump
```

Copy the backup dump file from Docker container to host if archiving:

```bash
docker cp supabase_db_azizurrahman:/tmp/azizurrahman_backup.dump ./backup_$(date +%Y%m%d_%H%M%S).dump
```

---

## 3. Safe Disposable Restore Test (Zero Risk to Production or Active Dev)

To verify the integrity of a backup without risking existing development or production data, restore into a temporary disposable database:

```bash
docker exec -i supabase_db_azizurrahman bash << 'EOF'
set -e

# 1. Ensure clean slate for disposable database
dropdb -U postgres --if-exists test_disposable_restore
createdb -U postgres test_disposable_restore

# 2. Initialize required extensions & Auth schema prerequisites
psql -U postgres -d test_disposable_restore << 'SQLEOF'
CREATE EXTENSION IF NOT EXISTS btree_gist;
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE SCHEMA IF NOT EXISTS auth;
CREATE TABLE IF NOT EXISTS auth.users (id uuid primary key);
CREATE OR REPLACE FUNCTION auth.uid() RETURNS uuid AS $$ SELECT null::uuid $$ LANGUAGE sql;
CREATE OR REPLACE FUNCTION auth.role() RETURNS text AS $$ SELECT 'anon'::text $$ LANGUAGE sql;
SQLEOF

# 3. Restore application dump into disposable database
pg_restore -U postgres -d test_disposable_restore --no-owner --no-privileges /tmp/azizurrahman_backup.dump

# 4. Verify data integrity & row counts
psql -U postgres -d test_disposable_restore -c "
  SELECT count(*) as services_count FROM public.services;
  SELECT count(*) as weekly_count FROM public.weekly_availability;
  SELECT count(*) as appt_count FROM public.appointments;
"

# 5. Clean up disposable test database
dropdb -U postgres test_disposable_restore
rm -f /tmp/azizurrahman_backup.dump
echo "Restore verification test passed successfully."
EOF
```

Expected Output:

- `services_count`: Matches active + inactive services count.
- `weekly_count`: Exactly 7 (Sunday through Saturday).
- `appt_count`: Matches recorded appointments.

---

## 4. Production Recovery & Point-in-Time Recovery (PITR)

### 4.1 Production Prerequisites

1. Supabase Pro or Enterprise plan with Point-In-Time Recovery (PITR) enabled.
2. Production credentials stored in an encrypted password manager accessible only by authorized administrators.
3. Access to Supabase Project Dashboard -> Database -> Backups.

### 4.2 Restoring from Dashboard (Point-in-Time)

1. In the Supabase Dashboard, navigate to **Database** -> **Backups**.
2. Select **Point in Time** recovery.
3. Select the timestamp immediately prior to the incident / corruption event.
4. Clone to a **new project** (recommended) or confirm rollback.
5. Update Vercel environment variables (`NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`) to point to the restored instance once verified.

### 4.3 Rollback Plan for Bad Migrations

1. Never edit an applied migration in production.
2. If a migration fails or introduces an unintended constraint, author a corrective forward migration (e.g. `202610..._revert_xyz.sql`).
3. Test the corrective migration on local and staging before pushing to production:
   ```bash
   npx supabase db push --dry-run
   npx supabase db push
   ```
